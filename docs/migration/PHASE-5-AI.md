# Phase 5 — AI Integration (`apps/ai`)

- **Model**: DenseNet121 (`best_densenet121_xray.pth`) served via FastAPI + Uvicorn on `http://0.0.0.0:8000`.
- **Boundary**: `React Client -> Express API (/api/analysis/analyze, /api/predict) -> Python FastAPI (/predict) -> DenseNet121`.
- **Reliability**: Explicit inference timeouts, file-type & size validation (`MAX_UPLOAD_BYTES`), health probe via `GET /api/health` (`dependencies.ai: "ok"`), and static heatmap serving at `/static/heatmaps`.
