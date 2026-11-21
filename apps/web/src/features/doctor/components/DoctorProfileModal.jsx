"use client";
import React, { useState } from "react";
import styles from "./DoctorProfileModal.module.css";
import { useTranslations } from "@/lib/compat/intl";

export default function DoctorProfileModal({ doctor, open, onClose, onSave }) {
  const t = useTranslations("doctorProfile");
  const [form, setForm] = useState({ ...doctor });

  if (!open) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{t("modal.title")}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            {t("modal.fields.name")}:
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t("modal.fields.specialization")}:
            <input
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {t("modal.fields.email")}:
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              required
            />
          </label>
          <label>
            {t("modal.fields.phone")}:
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              type="tel"
              required
            />
          </label>
          <div className={styles.actions}>
            <button type="submit">{t("actions.save")}</button>
            <button type="button" onClick={onClose}>
              {t("actions.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
