"use client";

import { FaUserMd, FaUserEdit, FaUserTimes, FaUserPlus } from "react-icons/fa";
import { useEffect, useState } from "react";
import useLocale from "@/lib/compat/intl";
import { useTranslations } from "@/lib/compat/intl";

export default function DoctorsTable() {
  const { t } = useLocale();
  const tr = t.adminDoctors || {};
  const ui = useTranslations("ui");

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/admin/doctors")
      .then((res) => res.json())
      .then((data) => {
        setDoctors(data.doctors || []);
        setLoading(false);
      })
      .catch(() => {
        setError(tr.errors?.fetchDoctors);
        setLoading(false);
      });
  }, [tr.errors?.fetchDoctors]);

  const handleDelete = async (doctor) => {
    if (!window.confirm(tr.confirmDelete)) return;
    try {
      await fetch(`/api/admin/doctors/${doctor.userId || doctor.id}`, {
        method: "DELETE",
      });
      setDoctors((prev) =>
        prev.filter((d) => (d.userId || d.id) !== (doctor.userId || doctor.id)),
      );
    } catch {
      alert(tr.errors?.deleteDoctor);
    }
  };

  return (
    <div className="overflow-x-auto mt-8">
      {loading ? (
        <div className="py-8 text-center text-(--ui-muted-2)">{tr.loading}</div>
      ) : error ? (
        <div className="py-8 text-center text-(--ui-danger)">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="py-8 text-center text-(--ui-muted-2)">{tr.empty}</div>
      ) : (
        <>
          <table className="min-w-full rounded-2xl border border-(--ui-border) bg-(--ui-surface)">
            <thead>
              <tr className="bg-(--ui-surface-2)">
                <th className="py-3 px-4 text-start text-xs font-semibold text-(--ui-muted-2)">
                  {tr.columns?.index}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-(--ui-muted-2)">
                  {tr.columns?.name}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-(--ui-muted-2)">
                  {tr.columns?.license}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-(--ui-muted-2)">
                  {tr.columns?.phone}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-(--ui-muted-2)">
                  {tr.columns?.email}
                </th>
                <th className="py-3 px-4 text-start text-xs font-semibold text-(--ui-muted-2)">
                  {tr.columns?.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor, i) => (
                <tr
                  key={doctor.userId || doctor.id}
                  className="border-t border-(--ui-border) hover:bg-(--ui-surface-2)/60"
                >
                  <td className="py-3 px-4 text-start text-sm font-semibold text-foreground">
                    {i + 1}
                  </td>
                  <td className="py-3 px-4 text-start text-sm text-foreground flex items-center gap-2">
                    <FaUserMd className="text-(--ui-muted-2)" />
                    {doctor.user?.fullName ||
                      doctor.fullName ||
                      doctor.name ||
                      ui("placeholder")}
                  </td>
                  <td className="py-3 px-4 text-start text-sm text-foreground">
                    {doctor.licenseNumber || ui("placeholder")}
                  </td>
                  <td className="py-3 px-4 text-start text-sm text-foreground">
                    {doctor.phone || ui("placeholder")}
                  </td>
                  <td className="py-3 px-4 text-start text-sm text-(--ui-muted-2)">
                    {doctor.user?.email || doctor.email || ui("placeholder")}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        className="rounded-xl border border-(--ui-border) bg-(--ui-surface-2) p-2 text-foreground hover:opacity-90"
                        title={tr.buttons?.edit}
                      >
                        <FaUserEdit />
                      </button>
                      <button
                        className="rounded-xl border border-(--ui-danger-border) bg-(--ui-danger) p-2 text-white hover:opacity-90"
                        title={tr.buttons?.delete}
                        onClick={() => handleDelete(doctor)}
                      >
                        <FaUserTimes />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn-gradient mt-6 flex items-center gap-2 rounded-xl px-6 py-3 font-semibold">
            <FaUserPlus /> {tr.buttons?.add}
          </button>
        </>
      )}
    </div>
  );
}