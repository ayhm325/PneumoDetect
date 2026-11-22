import { BriefcaseMedicalIcon, UserPlusIcon } from "lucide-react";
import Button from "../ui/Button";
import { Table, THead, TRow, TH, TD } from "../ui/Table";
import Pagination from "../ui/Pagination";

import { useLocale, useTranslations } from "@/lib/compat/intl";

export default function DoctorsTable({
  doctors,
  onEdit,
  onDelete,
  onDetails,
  onAdd,
  onToggle,
  onApprove,
  onReject,
  page = 1,
  pageCount = 1,
  onPageChange,
}) {
  const t = useTranslations("doctorsTable");
  const ui = useTranslations("ui");
  const locale = useLocale();
  const isAr = locale === "ar";
  return (
    <div className="mt-8">
      <Table>
        <THead>
          <TRow className="bg-(--ui-surface-2) border-b border-(--ui-border)">
            <TH className="py-3 px-4 text-center">#</TH>
            <TH className="py-3 px-4 text-center">{t("name")}</TH>
            <TH className="py-3 px-4 text-center">{t("license")}</TH>
            <TH className="py-3 px-4 text-center">{t("phone")}</TH>
            <TH className="py-3 px-4 text-center">{t("email")}</TH>
            <TH className="py-3 px-4 text-center">{isAr ? "الحالة" : "Status"}</TH>
            <TH className="py-3 px-4 text-center">{t("actions")}</TH>
          </TRow>
        </THead>
        <tbody>
          {doctors.map((doctor, i) => {
            const name = doctor.user?.fullName || doctor.name;
            const email =
              doctor.user?.email || doctor.email || ui("placeholder");
            // Handle both possible shapes: top-level or inside doctor.user
            const licenseNumber =
              doctor.licenseNumber ||
              doctor.user?.licenseNumber ||
              ui("placeholder");
            const phone =
              doctor.phone || doctor.user?.phone || ui("placeholder");
            return (
              <TRow
                key={doctor.id || doctor.userId}
                className="hover:bg-(--ui-surface-2)/60 transition-colors"
              >
                <TD className="py-2 px-4 text-center font-bold">{i + 1}</TD>
                <TD className="py-2 px-4 text-center">
                  <span className="inline-flex items-center gap-2 justify-center">
                    <BriefcaseMedicalIcon className="text-(--ui-muted-2)" />
                    {name}
                  </span>
                </TD>
                <TD className="py-2 px-4 text-center">{licenseNumber}</TD>
                <TD className="py-2 px-4 text-center">{phone}</TD>
                <TD className="py-2 px-4 text-center">{email}</TD>
                <TD className="py-2 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doctor.status === "active"
                        ? "bg-[var(--pd-moss-soft)] text-[var(--pd-success)]"
                        : doctor.status === "pending"
                          ? "bg-[var(--pd-marigold-soft)] text-[var(--pd-marigold)]"
                          : "bg-[var(--pd-coral-soft)] text-[var(--pd-coral)]"
                    }`}
                  >
                    {doctor.status === "active"
                      ? isAr
                        ? "نشط"
                        : "Active"
                      : doctor.status === "pending"
                        ? isAr
                          ? "معلق"
                          : "Pending"
                        : isAr
                          ? "محظور"
                          : "Banned"}
                  </span>
                </TD>
                <TD className="py-2 px-4">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {doctor.status === "pending" &&
                    typeof onApprove === "function" &&
                    typeof onReject === "function" ? (
                      <>
                        <Button
                          variant="ghost"
                          className="px-3 py-2 text-[var(--pd-success)] font-semibold"
                          onClick={() => onApprove(doctor)}
                        >
                          {isAr ? "موافقة" : "Approve"}
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-3 py-2 text-(--ui-danger) font-bold"
                          onClick={() => onReject(doctor)}
                        >
                          {isAr ? "رفض" : "Reject"}
                        </Button>
                      </>
                    ) : (
                      <>
                        {typeof onEdit === "function" && (
                          <Button
                            variant="ghost"
                            className="px-3 py-2"
                            title={t("edit")}
                            onClick={() => onEdit(doctor)}
                          >
                            {t("edit")}
                          </Button>
                        )}
                        {typeof onToggle === "function" && (
                          <Button
                            variant="ghost"
                            className="px-3 py-2"
                            title={
                              doctor.status === "active"
                                ? t("disable")
                                : t("enable")
                            }
                            onClick={() => onToggle(doctor)}
                          >
                            {doctor.status === "active"
                              ? t("disable")
                              : t("enable")}
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="ghost"
                      className="px-3 py-2 text-(--ui-info)"
                      title={t("details")}
                      onClick={() => onDetails && onDetails(doctor)}
                    >
                      {t("details")}
                    </Button>
                  </div>
                </TD>
              </TRow>
            );
          })}
        </tbody>
      </Table>

      <div className="flex items-center justify-end mt-6">
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}