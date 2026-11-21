import Image from "@/lib/compat/Image";

export default function PatientProfile() {
  // بيانات وهمية لمريض
  const patient = {
    name: "Mohamed Salah",
    age: 34,
    history: [
      { date: "2025-11-30", result: "Pneumonia", confidence: "92%" },
      { date: "2025-10-15", result: "Normal", confidence: "99%" },
    ],
    lastXray: { url: "/window.svg", result: "Pneumonia", confidence: "92%" },
  };
  return (
    <aside className="w-full md:w-96 bg-(--ui-surface) rounded-xl shadow p-6 border border-(--ui-border)">
      <h3 className="text-lg font-bold mb-2 text-(--ui-foreground)">
        Patient Profile
      </h3>
      <div className="mb-2">Name: {patient.name}</div>
      <div className="mb-2">Age: {patient.age}</div>
      <div className="mb-2 font-semibold">Analysis History:</div>
      <ul className="mb-2 text-sm">
        {patient.history.map((h, i) => (
          <li key={i}>
            - {h.date}: {h.result} ({h.confidence})
          </li>
        ))}
      </ul>
      <div className="mb-2 font-semibold">Last X-Ray:</div>
      <Image
        src={patient.lastXray.url}
        alt="Last X-Ray"
        width={128}
        height={128}
        className="w-32 h-32 object-contain mb-2"
      />
      <div>
        Result: {patient.lastXray.result} ({patient.lastXray.confidence})
      </div>
      <button className="mt-4 w-full py-2 rounded btn-gradient font-semibold">
        Upload New X-Ray
      </button>
    </aside>
  );
}