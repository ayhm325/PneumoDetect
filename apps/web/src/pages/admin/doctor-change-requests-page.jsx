"use client";

import { BriefcaseMedicalIcon, CheckIcon, UserIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";
import {
  useDoctorChangeRequests,
  approveDoctorChangeRequest,
  rejectDoctorChangeRequest,
} from "./doctor-change-requests";

export default function DoctorChangeRequestsPage() {
  const [refresh, setRefresh] = useState(0);
  const t = useTranslations("doctorChangeRequests");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  const requests = useDoctorChangeRequests(refresh);
  const [actionLoading, setActionLoading] = useState(null);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await approveDoctorChangeRequest(id);
    } catch (e) {
      alert(t("errors.approveFailed", { message: e?.message || "" }));
    }
    setActionLoading(null);
    setRefresh((v) => v + 1);
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await rejectDoctorChangeRequest(id);
    } catch (e) {
      alert(t("errors.rejectFailed", { message: e?.message || "" }));
    }
    setActionLoading(null);
    setRefresh((v) => v + 1);
  };

  return (
    <>
      <div className="px-4 py-6 md:px-8">
        <div className="pd-panel pd-shape-asymmetric p-6 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-6">
            {t("title")}
          </h1>

          {requests.length === 0 ? (
            <div className="pd-shape-organic border border-(--ui-border) bg-(--ui-surface) p-8 text-center">
              <BriefcaseMedicalIcon
                size={48}
                className="mx-auto mb-4 text-(--ui-muted-2)"
              />
              <p className="text-(--ui-muted-2) text-lg">{t("noRequests")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-w-3xl pd-shape-organic border border-(--ui-border)">
              <table className="w-full bg-(--ui-surface)">
                <thead>
                  <tr className="bg-(--ui-surface-2) text-(--ui-muted-2)">
                    <th className="p-3 text-start text-xs font-semibold">
                      {t("table.patient")}
                    </th>
                    <th className="p-3 text-start text-xs font-semibold">
                      {t("table.currentDoctor")}
                    </th>
                    <th className="p-3 text-start text-xs font-semibold">
                      {t("table.requestedDoctor")}
                    </th>
                    <th className="p-3 text-start text-xs font-semibold">
                      {t("table.reason")}
                    </th>
                    <th className="p-3 text-start text-xs font-semibold">
                      {t("table.status")}
                    </th>
                    <th className="p-3 text-start text-xs font-semibold">
                      {t("table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-t border-(--ui-border) hover:bg-(--ui-surface-2)/60"
                    >
                      <td className="p-3 text-sm text-foreground">
                        {req.patientName || placeholder}
                      </td>
                      <td className="p-3 text-sm text-foreground">
                        {req.currentDoctorName || placeholder}
                      </td>
                      <td className="p-3 text-sm text-foreground">
                        {req.requestedDoctorName || placeholder}
                      </td>
                      <td className="p-3 text-sm text-(--ui-muted-2)">
                        {req.reason || placeholder}
                      </td>
                      <td className="p-3 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${
                            req.status === "pending"
                              ? "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)"
                              : req.status === "approved"
                                ? "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)"
                                : "bg-(--ui-danger-bg) text-(--ui-danger) border-(--ui-danger-border)"
                          }`}
                        >
                          {req.status === "pending"
                            ? t("pending")
                            : req.status === "approved"
                              ? t("approved")
                              : t("rejected")}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        {req.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="rounded-xl border border-(--ui-success-border) bg-(--ui-success) px-3 py-2 text-xs font-semibold text-[var(--pd-on-accent)] hover:opacity-90 disabled:opacity-50"
                              disabled={actionLoading === req.id}
                            >
                              {t("approve")}
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="rounded-xl border border-(--ui-danger-border) bg-(--ui-danger) px-3 py-2 text-xs font-semibold text-[var(--pd-on-accent)] hover:opacity-90 disabled:opacity-50"
                              disabled={actionLoading === req.id}
                            >
                              {t("reject")}
                            </button>
                          </div>
                        ) : (
                          <span className="text-(--ui-muted-2)">
                            {placeholder}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}