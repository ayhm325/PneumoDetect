import * as svc from "../services/analysisResult.service.js";

console.log("service module keys:", Object.keys(svc));

try {
  const getAnalysisHistory =
    svc.getAnalysisHistory ??
    svc.default?.getAnalysisHistory ??
    svc.default ??
    null;
  if (!getAnalysisHistory) {
    console.error("No getAnalysisHistory exported from service module");
    process.exit(1);
  }
  const results = await getAnalysisHistory(
    "7e5dc12f-4c87-4e2f-a4cd-66c412e77f1a",
  );
  console.log(
    "Results length:",
    Array.isArray(results) ? results.length : typeof results,
  );
  console.log(results);
} catch (e) {
  console.error("Service call error", e);
  process.exit(1);
}
