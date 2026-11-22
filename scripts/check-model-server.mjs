// Check Python model server readiness (/health/ready)
import http from "http";

const HOST = process.env.PY_MODEL_HOST || "127.0.0.1";
const PORT = Number(process.env.PY_MODEL_PORT || 8000);
const PATH = "/health/ready";

const req = http.request(
  {
    hostname: HOST,
    port: PORT,
    path: PATH,
    method: "GET",
    timeout: 4000,
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => {
      body += chunk;
    });
    res.on("end", () => {
      try {
        const parsed = JSON.parse(body || "{}");
        if (res.statusCode === 200 && parsed.ready === true && parsed.model_loaded === true) {
          console.log(
            `Model server is ready (${parsed.architecture || "DenseNet121"} ${parsed.model_version || ""})`,
          );
          process.exit(0);
        }
        console.error(
          `Model server not ready (status ${res.statusCode}): ${parsed.error || body}`,
        );
        process.exit(1);
      } catch {
        console.error(`Invalid readiness response (status ${res.statusCode}): ${body}`);
        process.exit(1);
      }
    });
  },
);

req.on("error", (err) => {
  console.error("Model server is not running:", err.message);
  process.exit(1);
});

req.on("timeout", () => {
  console.error("Model server readiness check timed out.");
  req.destroy();
  process.exit(1);
});

req.end();
