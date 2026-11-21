import React, { useState } from "react";
import styles from "./PasswordChangeForm.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function PasswordChangeForm({ onChange }) {
  const t = useTranslations("doctorSettings");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword) {
      onChange(newPassword);
      setOldPassword("");
      setNewPassword("");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3>{t("change_password")}</h3>
      <input
        type="password"
        placeholder={t("current_password")}
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder={t("new_password")}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <button type="submit">{t("passwordChange.submit")}</button>
    </form>
  );
}
