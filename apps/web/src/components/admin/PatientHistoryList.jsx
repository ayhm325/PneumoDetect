"use client";

import { useTranslations } from "@/lib/compat/intl";

export default function PatientHistoryList({ history }) {
  const tPatients = useTranslations("adminPatients");
  const noHistory = tPatients("history.noHistory");
  const title = tPatients("history.title");
  if (!history || history.length === 0)
    return (
      <div className="text-center text-(--ui-muted-2) py-4">{noHistory}</div>
    );
  return (
    <div className="card-glass p-6 border border-(--ui-border) mt-8">
      <h3 className="font-bold text-lg mb-4 text-foreground">{title}</h3>
      <ul className="space-y-3">
        {history.map((item, idx) => (
          <li key={idx} className="flex justify-between text-foreground">
            <span>{item.event}</span>
            <span className="text-xs text-(--ui-muted-2)">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
