import React, { useState } from "react";
import PasswordChangeForm from "./PasswordChangeForm";
import AvailabilitySettings from "./AvailabilitySettings";
import NotificationSettings from "./NotificationSettings";
import styles from "./DoctorSettingsModal.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function DoctorSettingsModal({ open, onClose, doctor, onSave }) {
  const t = useTranslations("doctorSettings");
  const [settings, setSettings] = useState({ ...doctor });

  if (!open) return null;

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{t("title")}</h2>
        <AvailabilitySettings
          value={settings.availability}
          onChange={(v) => handleChange("availability", v)}
        />
        <NotificationSettings
          value={settings.notifications}
          onChange={(v) => handleChange("notifications", v)}
        />
        <PasswordChangeForm onChange={(v) => handleChange("password", v)} />
        <div className={styles.actions}>
          <button onClick={handleSave}>{t("save_changes")}</button>
          <button onClick={onClose}>{t("cancel")}</button>
        </div>
      </div>
    </div>
  );
}