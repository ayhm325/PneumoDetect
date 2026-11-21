export default function ResultPanel() {
  // بيانات نتيجة وهمية
  const result = {
    diagnosis: "Pneumonia",
    confidence: "92%",
    time: "3.2s",
  };
  return (
    <section className="w-full bg-(--ui-surface) border border-(--ui-border) rounded-xl shadow p-6 mt-4">
      <h3 className="text-lg font-bold mb-4 text-(--ui-foreground)">Result</h3>
      <div className="mb-2">
        Diagnosis: <span className="font-semibold">{result.diagnosis}</span>
      </div>
      <div className="mb-2">Confidence: {result.confidence}</div>
      <div className="mb-2">Time: {result.time}</div>
      <button className="mt-2 w-full py-2 rounded bg-(--ui-info) text-(--ui-info-foreground) font-semibold hover:bg-(--ui-info)/90 transition">
        Save
      </button>
    </section>
  );
}