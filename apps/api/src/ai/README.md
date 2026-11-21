AI folder (Phase 1)

Structure reserved for AI layer. Files are placeholders in Phase 1 — no logic included.

Folders:

- inference/
- contracts/
- utils/

Follow-up phases will implement code inside these files.
AI folder — purpose and structure

This folder implements a "mock" AI layer that can be swapped later with a real model without changing the API or DB flows.

Structure (literal):

/ai
│
├── inference/
│ ├── index.js # model switcher (mock <-> real)
│ ├── mockModel.js # fake model: input -> prediction, confidence, heatmap, explanation, model_version
│ └── inference.service.js# orchestrator: prepares image, calls model, validates contract
│
├── contracts/
│ └── analysisResponse.contract.js # immutable response shape + validator
│
├── utils/
│ └── imagePreprocessor.js # validate/prepare image (resize/normalize placeholder)
│
└── README.md

How to use (example):

// in your API controller
const { analyzeImage } = require('../ai/inference/inference.service');

// suppose you have `buffer` and `mimeType` from upload
const result = await analyzeImage({ buffer, mimeType });
// result matches contracts/analysisResponse.contract.js

Notes

- The mock model never performs DB or API calls.
- Keep the contract stable: front-end and DB depend on it.
- To switch models, set `AI_USE_MOCK=false` and provide a real model implementation at `ai/inference/*` that exports `infer(preparedImage)`.
