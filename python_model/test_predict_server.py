import asyncio
import base64
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
import os
import sys
import unittest
from unittest.mock import patch
from fastapi import HTTPException
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F

# Prevent eager checkpoint loading at module import time
os.environ["SKIP_MODEL_LOAD_ON_IMPORT"] = "1"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import predict_server


def make_test_xray_base64(width: int = 128, height: int = 128, fmt: str = "PNG") -> str:
    img = Image.new("L", (width, height), color=120)
    buf = BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode("ascii")


class TinyDenseNetFixture(nn.Module):
    """Lightweight deterministic CNN fixture with .features and .classifier matching DenseNet121 interface."""

    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 8, kernel_size=3, stride=2, padding=1),
            nn.ReLU(inplace=False),
            nn.AdaptiveAvgPool2d((7, 7)),
        )
        self.classifier = nn.Linear(8, 2)
        with torch.no_grad():
            self.features[0].weight.fill_(0.05)
            self.features[0].bias.fill_(0.01)
            self.classifier.weight[0].fill_(0.2)
            self.classifier.weight[1].fill_(0.5)
            self.classifier.bias[0] = -0.1
            self.classifier.bias[1] = 0.4

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        feats = self.features(x)
        out = F.relu(feats, inplace=False)
        out = F.adaptive_avg_pool2d(out, (1, 1))
        out = torch.flatten(out, 1)
        return self.classifier(out)


class CheckpointIndependentPredictServerTests(unittest.TestCase):
    def setUp(self):
        self.fixture_model = TinyDenseNetFixture().to(predict_server.DEVICE).eval()
        predict_server.set_model_for_testing(
            self.fixture_model,
            version="fixture_densenet#12345678",
            sha256="1234567890abcdef",
        )

    def tearDown(self):
        os.environ.pop("PY_MODEL_INTERNAL_TOKEN", None)

    def test_no_public_static_files_mount_on_fastapi(self):
        route_paths = [getattr(r, "path", "") for r in predict_server.app.routes]
        for path in route_paths:
            self.assertFalse(
                path.startswith("/static"),
                f"FastAPI must not expose /static directly (found {path})",
            )

    def test_health_ready_false_when_model_unloaded(self):
        predict_server.set_model_for_testing(None, load_error="Simulated missing checkpoint")
        res = asyncio.run(predict_server.health_ready())
        self.assertEqual(res.status_code, 503)
        payload = json.loads(res.body.decode("utf-8"))
        self.assertFalse(payload["ready"])
        self.assertFalse(payload["model_loaded"])
        self.assertIn("Simulated missing checkpoint", payload["error"])

    def test_health_ready_true_with_loaded_model_and_contract_metadata(self):
        body = asyncio.run(predict_server.health_ready())
        self.assertTrue(body["ready"])
        self.assertTrue(body["model_loaded"])
        self.assertEqual(body["architecture"], "DenseNet121")
        self.assertEqual(body["model_version"], "fixture_densenet#12345678")
        self.assertFalse(body["training_contract_verified"])
        self.assertFalse(body["clinical_calibration_verified"])

    def test_image_decoding_and_validation(self):
        # Valid PNG, JPEG, WEBP
        for fmt in ("PNG", "JPEG", "WEBP"):
            b64 = make_test_xray_base64(64, 64, fmt=fmt)
            img = predict_server.decode_and_validate_image(b64)
            self.assertEqual(img.mode, "L")
            self.assertEqual(img.size, (64, 64))

        # Invalid base64
        with self.assertRaises(HTTPException) as ctx_b64:
            predict_server.decode_and_validate_image("!!!not_base64!!!")
        self.assertEqual(ctx_b64.exception.status_code, 400)

        # Corrupted non-image bytes
        bad_bytes = base64.b64encode(b"not an image file").decode("ascii")
        with self.assertRaises(HTTPException) as ctx_corrupt:
            predict_server.decode_and_validate_image(bad_bytes)
        self.assertEqual(ctx_corrupt.exception.status_code, 400)

        # Tiny image (<32x32)
        tiny_b64 = make_test_xray_base64(16, 16)
        with self.assertRaises(HTTPException) as ctx_tiny:
            predict_server.decode_and_validate_image(tiny_b64)
        self.assertEqual(ctx_tiny.exception.status_code, 400)

        # Oversized payload
        with patch.object(predict_server, "MAX_IMAGE_BYTES", 64):
            large_b64 = make_test_xray_base64(128, 128)
            with self.assertRaises(HTTPException) as ctx_large:
                predict_server.decode_and_validate_image(large_b64)
            self.assertEqual(ctx_large.exception.status_code, 413)

    def test_preprocessing_shape_and_channels(self):
        b64 = make_test_xray_base64(100, 80)
        img = predict_server.decode_and_validate_image(b64)
        tensor = predict_server.prep_transform(img)
        self.assertEqual(tuple(tensor.shape), (3, 224, 224))

    def test_concurrent_gradcam_and_grad_cleanup_with_fixture(self):
        b64 = make_test_xray_base64(128, 128)

        def call_once():
            return predict_server.run_sync_inference(b64, with_heatmap=True)

        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _: call_once(), range(4)))

        self.assertEqual(len(results), 4)
        preds = {r["prediction"] for r in results}
        self.assertEqual(len(preds), 1)
        for r in results:
            self.assertEqual(r["prediction"], "PNEUMONIA")
            self.assertAlmostEqual(
                r["probabilities"]["NORMAL"] + r["probabilities"]["PNEUMONIA"],
                1.0,
                places=5,
            )
            self.assertTrue(r["heatmap_url"].startswith("/static/heatmaps/gradcam_"))
            fname = os.path.basename(r["heatmap_url"])
            fpath = os.path.join(predict_server.HEATMAP_DIR, fname)
            self.assertTrue(os.path.exists(fpath))
            os.remove(fpath)

        for param in predict_server.MODEL.parameters():
            self.assertIsNone(param.grad)

    def test_gradcam_failure_fallback_does_not_fail_prediction(self):
        b64 = make_test_xray_base64(128, 128)
        with patch.object(
            predict_server,
            "generate_gradcam_overlay",
            side_effect=RuntimeError("Simulated Grad-CAM error"),
        ):
            res = predict_server.run_sync_inference(b64, with_heatmap=True)
            self.assertEqual(res["prediction"], "PNEUMONIA")
            self.assertIsNone(res["heatmap_url"])
            self.assertIn("unavailable", res["explanation"])

    def test_internal_service_token_authentication(self):
        os.environ["PY_MODEL_INTERNAL_TOKEN"] = "secret-internal-token-123"
        b64 = make_test_xray_base64(64, 64)
        req = predict_server.PredictRequest(image_base64=b64, with_heatmap=False)

        with self.assertRaises(HTTPException) as ctx_missing:
            asyncio.run(predict_server.predict(req, x_internal_model_token=None))
        self.assertEqual(ctx_missing.exception.status_code, 403)

        with self.assertRaises(HTTPException) as ctx_wrong:
            asyncio.run(predict_server.predict(req, x_internal_model_token="wrong-token"))
        self.assertEqual(ctx_wrong.exception.status_code, 403)

        ok_res = asyncio.run(
            predict_server.predict(req, x_internal_model_token="secret-internal-token-123")
        )
        self.assertEqual(ok_res["prediction"], "PNEUMONIA")


@unittest.skipUnless(
    predict_server.resolve_model_path() is not None,
    "Real DenseNet121 checkpoint file not present on disk",
)
class RealCheckpointSmokeTests(unittest.TestCase):
    def test_real_checkpoint_loads_and_runs_gradcam(self):
        loaded = predict_server.init_model(force=True)
        self.assertTrue(loaded)
        self.assertIsNotNone(predict_server.MODEL)
        self.assertTrue(predict_server.MODEL_VERSION.startswith("best_densenet121_xray.pth#"))

        b64 = make_test_xray_base64(128, 128)
        res = predict_server.run_sync_inference(b64, with_heatmap=True)
        self.assertIn(res["prediction"], {"NORMAL", "PNEUMONIA"})
        self.assertTrue(res["heatmap_url"].startswith("/static/heatmaps/gradcam_"))
        fname = os.path.basename(res["heatmap_url"])
        fpath = os.path.join(predict_server.HEATMAP_DIR, fname)
        self.assertTrue(os.path.exists(fpath))
        os.remove(fpath)


if __name__ == "__main__":
    unittest.main()
