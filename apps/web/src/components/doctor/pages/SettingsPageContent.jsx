"use client";
import React, { useState } from "react";
import DoctorSettingsModal from "../../../[locale]/doctor/components/DoctorSettingsModal";
import ErrorBoundary from "../../../[locale]/doctor/components/ErrorBoundary";
import SkeletonLoader from "../../../[locale]/doctor/components/SkeletonLoader";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { useTranslations } from "@/lib/compat/intl";

export default function SettingsPageContent() {
  const t = useTranslations("doctorSettings");
  const ui = useTranslations("ui");

  const initialDoctor = {
    availability: {
      days: t("demo.availabilityDays"),
      start: "08:00",
      end: "16:00",
    },
    notifications: { email: true, sms: false, inApp: true },
    password: "",
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [doctor, setDoctor] = useState(initialDoctor);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSave = (settings) => {
    setLoading(true);
    setTimeout(() => {
      setDoctor(settings);
      setLoading(false);
    }, 1200);
  };

  const handleSensitiveAction = () => {
    setShowConfirm(true);
  };

  return (
    <ErrorBoundary fallbackMessage={ui("errors.unexpected")}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-(--ui-foreground)">
          {t("title")}
        </h1>
        <button
          className="px-4 py-2 btn-gradient rounded"
          onClick={() => setModalOpen(true)}
        >
          {t("demo.openModal")}
        </button>
        <button
          className="px-4 py-2 rounded bg-(--ui-danger) text-(--ui-danger-foreground) hover:opacity-90"
          onClick={handleSensitiveAction}
        >
          {t("demo.sensitiveAction")}
        </button>
        {loading && <SkeletonLoader height={32} count={2} />}
        <DoctorSettingsModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          doctor={doctor}
          onSave={handleSave}
        />
        <ConfirmDialog
          open={showConfirm}
          message={t("demo.confirmSensitiveActionMessage")}
          onConfirm={() => {
            setShowConfirm(false); /* تنفيذ الإجراء */
          }}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </ErrorBoundary>
  );
}