import asyncio
import base64
import hashlib
import os
import threading
import time
import uuid
from io import BytesIO

import anyio
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn.functional as F
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel, Field
from torchvision import models, transforms

# Decompression bomb protection (max 25MP)
Image.MAX_IMAGE_PIXELS = 25_000_000

MAX_IMAGE_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
MAX_BASE64_LEN = int(MAX_IMAGE_BYTES * 1.4) + 1024
MAX_CONCURRENT_INFERENCES = max(1, int(os.getenv("MAX_CONCURRENT_INFERENCES", "2")))
INFERENCE_SEMAPHORE = asyncio.Semaphore(MAX_CONCURRENT_INFERENCES)
GRADCAM_LOCK = threading.Lock()
LABELS = {0: "NORMAL", 1: "PNEUMONIA"}


class PredictRequest(BaseModel):
    image_base64: str = Field(..., min_length=1, max_length=MAX_BASE64_LEN)
    with_heatmap: bool = False


app = FastAPI(title="PneumoDetect AI Inference Service")

allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:4000,http://127.0.0.1:4000,http://localhost:5173,http://127.0.0.1:5173",
)
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FALLBACK_PATHS = [
    os.getenv("MODEL_PATH", ""),
    os.path.join(BASE_DIR, "..", "ai", "models", "best_densenet121_xray.pth"),
    os.path.join(BASE_DIR, "..", "apps", "ai", "models", "best_densenet121_xray.pth"),
    os.path.join(BASE_DIR, "..", "backend", "best_densenet121_xray.pth"),
    os.path.join(BASE_DIR, "..", "best_densenet121_xray.pth"),
]

MODEL_PATH = None
for candidate in FALLBACK_PATHS:
    if not candidate:
        continue
    norm = os.path.normpath(candidate)
    if os.path.exists(norm):
        MODEL_PATH = norm
        break

STATIC_DIR = os.path.join(BASE_DIR, "static")
HEATMAP_DIR = os.path.join(STATIC_DIR, "heatmaps")
os.makedirs(HEATMAP_DIR, exist_ok=True)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL = None
MODEL_VERSION = "unavailable"
MODEL_SHA256 = None
MODEL_LOAD_ERROR = None


def compute_sha256_prefix(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def load_verified_model(path: str):
    model = models.densenet121(weights=None)
    model.classifier = torch.nn.Linear(model.classifier.in_features, 2)
    try:
        state = torch.load(path, map_location=DEVICE, weights_only=True)
    except TypeError:
        state = torch.load(path, map_location=DEVICE)

    if not isinstance(state, dict):
        raise ValueError("Checkpoint is not a valid state_dict mapping")
    weight = state.get("classifier.weight")
    if weight is None or tuple(weight.shape) != (2, 1024):
        raise ValueError(f"Unexpected classifier.weight shape: {getattr(weight, 'shape', None)}")

    model.load_state_dict(state)
    model.to(DEVICE)
    model.eval()
    return model


if MODEL_PATH is None:
    MODEL_LOAD_ERROR = "DenseNet121 checkpoint file not found"
    print("ERROR:", MODEL_LOAD_ERROR)
else:
    try:
        print(f"Python model server loading DenseNet121 from {MODEL_PATH} on {DEVICE}")
        MODEL = load_verified_model(MODEL_PATH)
        MODEL_SHA256 = compute_sha256_prefix(MODEL_PATH)
        MODEL_VERSION = f"{os.path.basename(MODEL_PATH)}#{MODEL_SHA256[:8]}"
        print(f"Model loaded successfully: {MODEL_VERSION}")
    except Exception as exc:
        MODEL = None
        MODEL_LOAD_ERROR = f"Failed to load checkpoint: {exc}"
        print("ERROR:", MODEL_LOAD_ERROR)


prep_transform = transforms.Compose(
    [
        transforms.Resize((224, 224)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225],
        ),
    ]
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/health/live")
async def health_live():
    return {"status": "alive", "service": "pneumodetect-ai"}


@app.get("/health/ready")
async def health_ready():
    if MODEL is None:
        return JSONResponse(
            status_code=503,
            content={
                "ready": False,
                "model_loaded": False,
                "error": MODEL_LOAD_ERROR or "Model unavailable",
            },
        )
    return {
        "ready": True,
        "model_loaded": True,
        "architecture": "DenseNet121",
        "model_version": MODEL_VERSION,
        "model_sha256": MODEL_SHA256,
        "device": str(DEVICE),
        "input_size": [224, 224],
        "channels": 3,
        "labels": LABELS,
        "modality": "chest_xray",
    }


def decode_and_validate_image(image_base64: str) -> Image.Image:
    try:
        raw = base64.b64decode(image_base64, validate=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image payload")

    if not raw:
        raise HTTPException(status_code=400, detail="Empty image payload")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds maximum allowed size")

    try:
        verify_buf = BytesIO(raw)
        with Image.open(verify_buf) as probe:
            probe.verify()

        img_buf = BytesIO(raw)
        img = Image.open(img_buf)
        img = ImageOps.exif_transpose(img)
        w, h = img.size
        if w < 32 or h < 32:
            raise HTTPException(status_code=400, detail="Image dimensions too small (min 32x32)")
        return img.convert("L")
    except HTTPException:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError):
        raise HTTPException(status_code=400, detail="Unsupported or corrupted image file")


def generate_gradcam_overlay(tensor: torch.Tensor, orig_gray: Image.Image, target_class: int) -> str:
    """Compute genuine Grad-CAM from DenseNet121 final convolutional features."""
    grad_tensor = tensor.detach().clone().requires_grad_(True)

    with GRADCAM_LOCK:
        try:
            MODEL.zero_grad(set_to_none=True)
            with torch.enable_grad():
                features = MODEL.features(grad_tensor)
                features.retain_grad()
                out = F.relu(features, inplace=False)
                out = F.adaptive_avg_pool2d(out, (1, 1))
                out = torch.flatten(out, 1)
                logits = MODEL.classifier(out)
                score = logits[0, target_class]
                score.backward()

            if features.grad is None:
                raise RuntimeError("Grad-CAM gradients unavailable")

            grads = features.grad.detach().clone()
            acts = features.detach().clone()
        finally:
            MODEL.zero_grad(set_to_none=True)

    weights = grads.mean(dim=(2, 3), keepdim=True)
    cam = F.relu((weights * acts).sum(dim=1, keepdim=True))
    cam_np = cam.squeeze().cpu().numpy()

    cam_min, cam_max = float(cam_np.min()), float(cam_np.max())
    if cam_max - cam_min > 1e-8:
        cam_norm = (cam_np - cam_min) / (cam_max - cam_min)
    else:
        cam_norm = np.zeros_like(cam_np, dtype=np.float32)

    orig_w, orig_h = orig_gray.size
    cam_resized = np.array(
        Image.fromarray((cam_norm * 255).astype(np.uint8)).resize((orig_w, orig_h), Image.BILINEAR)
    ).astype(np.float32) / 255.0

    cmap = plt.get_cmap("jet")
    heatmap_rgba = cmap(cam_resized)
    heatmap_rgb = (heatmap_rgba[:, :, :3] * 255).astype(np.uint8)
    heatmap_img = Image.fromarray(heatmap_rgb).convert("RGBA")

    base_rgba = orig_gray.convert("RGB").convert("RGBA")
    blended = Image.blend(base_rgba, heatmap_img, alpha=0.45)

    fname = f"gradcam_{uuid.uuid4().hex}.png"
    out_path = os.path.join(HEATMAP_DIR, fname)
    blended.save(out_path, format="PNG")

    base_url = os.getenv("PUBLIC_HEATMAP_BASE_URL", "/static/heatmaps").rstrip("/")
    return f"{base_url}/{fname}"


def run_sync_inference(image_base64: str, with_heatmap: bool):
    img = decode_and_validate_image(image_base64)
    tensor = prep_transform(img).unsqueeze(0).to(DEVICE)

    start = time.time()
    with torch.no_grad():
        logits = MODEL(tensor)
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        pred_idx = int(probs.argmax())
        pred_label = LABELS.get(pred_idx, "Unknown")
    end = time.time()

    result = {
        "prediction": pred_label,
        "probabilities": {LABELS[i]: float(probs[i]) for i in range(len(probs))},
        "model_version": MODEL_VERSION,
        "heatmap_url": None,
        "explanation": "DenseNet121 chest X-ray screening output. Preliminary AI aid; physician review required.",
        "inference_time_ms": int((end - start) * 1000),
    }

    if with_heatmap:
        try:
            result["heatmap_url"] = generate_gradcam_overlay(tensor, img, pred_idx)
            result["explanation"] = (
                "Grad-CAM class activation overlay (DenseNet121 features) — "
                "AI visual aid only, not a definitive medical explanation."
            )
        except Exception as exc:
            print("Grad-CAM generation failed:", exc)
            result["heatmap_url"] = None
            result["explanation"] = (
                "Prediction completed; Grad-CAM visualization unavailable."
            )

    return result


@app.post("/predict")
async def predict(req: PredictRequest):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    async with INFERENCE_SEMAPHORE:
        return await anyio.to_thread.run_sync(
            run_sync_inference, req.image_base64, req.with_heatmap
        )


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("PY_MODEL_HOST", "127.0.0.1")
    port = int(os.getenv("PY_MODEL_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
