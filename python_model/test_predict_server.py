import asyncio
import base64
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import os
import sys
import unittest
from fastapi import HTTPException
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import predict_server


def make_test_xray_base64(width: int = 128, height: int = 128) -> str:
    img = Image.new("L", (width, height), color=120)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


class PredictServerTests(unittest.TestCase):
    def test_health_ready(self):
        body = asyncio.run(predict_server.health_ready())
        self.assertTrue(body["ready"])
        self.assertEqual(body["architecture"], "DenseNet121")
        self.assertIn("NORMAL", body["labels"].values())
        self.assertIn("PNEUMONIA", body["labels"].values())

    def test_rejects_small_image(self):
        tiny_b64 = make_test_xray_base64(16, 16)
        with self.assertRaises(HTTPException) as ctx:
            predict_server.decode_and_validate_image(tiny_b64)
        self.assertEqual(ctx.exception.status_code, 400)

    def test_concurrent_gradcam_and_grad_cleanup(self):
        b64 = make_test_xray_base64(128, 128)

        def call_once():
            return predict_server.run_sync_inference(b64, with_heatmap=True)

        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(lambda _: call_once(), range(4)))

        self.assertEqual(len(results), 4)
        preds = {r["prediction"] for r in results}
        self.assertEqual(len(preds), 1)
        for r in results:
            self.assertIn(r["prediction"], {"NORMAL", "PNEUMONIA"})
            self.assertTrue(r["heatmap_url"].startswith("/static/heatmaps/gradcam_"))
            fname = os.path.basename(r["heatmap_url"])
            fpath = os.path.join(predict_server.HEATMAP_DIR, fname)
            self.assertTrue(os.path.exists(fpath))
            os.remove(fpath)

        for param in predict_server.MODEL.parameters():
            self.assertIsNone(param.grad)


if __name__ == "__main__":
    unittest.main()
