import { useTranslations } from "@/lib/compat/intl";

function DoctorDetailsCard({ doctor, onApprove, onReject, onClose }) {
  const t = useTranslations("doctorDetails");
  const ui = useTranslations("ui");
  if (!doctor) return null;
  // Normalize status to lower-case for translation keys
  const statusKey = (doctor.status || "").toLowerCase();
  const statusLabel = [
    "pending",
    "verified",
    "rejected",
    "active",
    "suspended",
    "banned",
  ].includes(statusKey)
    ? t(`statusLabels.${statusKey}`)
    : doctor.status;
  // Fallbacks for name/email if not present
  const displayName =
    doctor.name ||
    doctor.fullName ||
    (doctor.user && (doctor.user.name || doctor.user.fullName)) ||
    ui("placeholder");
  const displayEmail =
    doctor.email || (doctor.user && doctor.user.email) || ui("placeholder");
  return (
    <div className="card-glass p-8 border border-(--ui-border) max-w-md mx-auto mt-8">
      <h3 className="font-bold text-xl mb-4 text-foreground">{t("details")}</h3>
      <div className="mb-2">
        <span className="font-bold">{t("name")}:</span> {displayName}
      </div>
      <div className="mb-2">
        <span className="font-bold">{t("email")}:</span> {displayEmail}
      </div>
      <div className="mb-2">
        <span className="font-bold">{t("license")}:</span>{" "}
        {doctor.licenseNumber}
      </div>
      <div className="mb-2">
        <span className="font-bold">{t("phone")}:</span> {doctor.phone}
      </div>
      <div className="mb-2">
        <span className="font-bold">{t("status")}:</span> {statusLabel}
      </div>
      {statusKey === "pending" && (
        <div className="flex gap-3 mt-6">
          <button
            className="flex-1 px-6 py-2 rounded-full bg-(--ui-success) text-white border border-(--ui-success-border) font-bold"
            onClick={() => onApprove?.(doctor)}
          >
            {t("approve")}
          </button>
          <button
            className="flex-1 px-6 py-2 rounded-full bg-(--ui-danger) text-white border border-(--ui-danger-border) font-bold"
            onClick={() => onReject?.(doctor)}
          >
            {t("reject")}
          </button>
        </div>
      )}
      <button
        className="mt-6 px-6 py-2 rounded-full bg-(--ui-surface-2) hover:bg-(--ui-surface) text-foreground border border-(--ui-border) font-bold w-full transition-colors"
        onClick={onClose}
      >
        {t("close")}
      </button>
    </div>
  );
}

export default DoctorDetailsCard;
