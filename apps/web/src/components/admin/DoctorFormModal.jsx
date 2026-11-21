import React, { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";

function DoctorFormModal({ doctor, open, onSave, onClose }) {
  const t = useTranslations("doctorFormModal");
  const [name, setName] = useState(doctor?.name || "");
  const [email, setEmail] = useState(doctor?.email || "");
  const [specialty, setSpecialty] = useState(doctor?.specialty || "radiology");
  const [licenseNumber, setLicenseNumber] = useState(
    doctor?.licenseNumber || "",
  );
  const [phone, setPhone] = useState(doctor?.phone || "");
  const [status, setStatus] = useState(doctor?.status || "pending");

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-neutral)/50 p-4 backdrop-blur-sm">
      <form
        className="card-glass p-8 rounded-2xl shadow-(--shadow-lift) min-w-100 max-w-125 w-full flex flex-col gap-5 border border-(--ui-border)"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, email, specialty, licenseNumber, phone, status });
        }}
      >
        <h3 className="font-bold text-2xl mb-2 brand-gradient-text">
          {doctor ? t("edit") : t("add")}
        </h3>
        <input
          type="text"
          className="border border-(--ui-border) rounded-xl px-4 py-3 bg-(--ui-surface-2) text-foreground focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent transition-all outline-none"
          placeholder={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          className="border border-(--ui-border) rounded-xl px-4 py-3 bg-(--ui-surface-2) text-foreground focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent transition-all outline-none"
          placeholder={t("email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          className="border border-(--ui-border) rounded-xl px-4 py-3 bg-(--ui-surface-2) text-foreground focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent transition-all outline-none"
          placeholder={t("license")}
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          required
        />
        <input
          type="tel"
          className="border border-(--ui-border) rounded-xl px-4 py-3 bg-(--ui-surface-2) text-foreground focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent transition-all outline-none"
          placeholder={t("phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <select
          className="border border-(--ui-border) rounded-xl px-4 py-3 bg-(--ui-surface-2) text-foreground focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent transition-all outline-none"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="radiology">{t("specialties.radiology")}</option>
          <option value="pulmonology">{t("specialties.pulmonology")}</option>
          <option value="orthopedics">{t("specialties.orthopedics")}</option>
        </select>
        <select
          className="border border-(--ui-border) rounded-xl px-4 py-3 bg-(--ui-surface-2) text-foreground focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent transition-all outline-none"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">{t("statusLabels.pending")}</option>
          <option value="verified">{t("statusLabels.verified")}</option>
          <option value="rejected">{t("statusLabels.rejected")}</option>
        </select>
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 btn-gradient font-semibold rounded-xl transition-transform"
          >
            {t("save")}
          </button>
          <button
            type="button"
            className="flex-1 px-6 py-3 bg-(--ui-surface-2) hover:bg-(--ui-surface) text-foreground border border-(--ui-border) font-semibold rounded-xl transition-colors"
            onClick={onClose}
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default DoctorFormModal;
