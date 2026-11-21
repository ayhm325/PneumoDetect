export default function PatientsList() {
  // بيانات مرضى وهمية
  const patients = [
    {
      id: 1,
      name: "Mohamed Salah",
      age: 34,
      lastAnalysis: "2025-11-30",
      status: "Stable",
    },
    {
      id: 2,
      name: "Sara Ali",
      age: 28,
      lastAnalysis: "2025-12-01",
      status: "Critical",
    },
    {
      id: 3,
      name: "Yousef Mansour",
      age: 41,
      lastAnalysis: "2025-11-28",
      status: "Recovering",
    },
  ];
  return (
    <section className="w-full bg-(--ui-surface) rounded-xl shadow p-4 mt-4 border border-(--ui-border)">
      <h2 className="text-xl font-bold mb-4 text-(--ui-foreground)">
        Patients
      </h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-(--ui-border) text-(--ui-muted-foreground)">
            <th className="py-2">Name</th>
            <th>Age</th>
            <th>Last Analysis</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr
              key={p.id}
              className="border-b border-(--ui-border) hover:bg-(--ui-surface-2)"
            >
              <td className="py-2 text-(--ui-foreground)">{p.name}</td>
              <td>{p.age}</td>
              <td>{p.lastAnalysis}</td>
              <td>{p.status}</td>
              <td>
                <button className="text-(--ui-info) hover:underline">
                  View Profile
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}