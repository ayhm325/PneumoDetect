export async function runPyModel(prepared, options = {}) {
  const pyUrl = process.env.PY_MODEL_URL || "http://127.0.0.1:8000/predict";
  const timeoutMs = Math.max(1000, Number(process.env.PY_MODEL_TIMEOUT_MS || 15000));

  const b64 = Buffer.isBuffer(prepared.buffer)
    ? prepared.buffer.toString("base64")
    : Buffer.from(prepared.buffer).toString("base64");

  const with_heatmap = Boolean(options.with_heatmap);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    const internalToken = (process.env.PY_MODEL_INTERNAL_TOKEN || "").trim();
    const headers = {
      "Content-Type": "application/json",
      ...(internalToken ? { "X-Internal-Model-Token": internalToken } : {}),
    };
    res = await fetch(pyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ image_base64: b64, with_heatmap }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      const timeoutErr = new Error(`Python model inference timed out after ${timeoutMs}ms`);
      timeoutErr.code = "inference_timeout";
      timeoutErr.statusCode = 504;
      throw timeoutErr;
    }
    const connErr = new Error("Python model server is unreachable");
    connErr.code = "model_unavailable";
    connErr.statusCode = 503;
    throw connErr;
  } finally {
    clearTimeout(timer);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.detail || `Python model server returned ${res.status}`;
    const err = new Error(detail);
    if (res.status === 400 || res.status === 413 || res.status === 422) {
      err.code = "invalid_image";
      err.statusCode = res.status === 413 ? 413 : 400;
    } else if (res.status === 503) {
      err.code = "model_unavailable";
      err.statusCode = 503;
    } else {
      err.code = "inference_error";
      err.statusCode = 502;
    }
    throw err;
  }

  return body;
}
