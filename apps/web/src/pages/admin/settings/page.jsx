"use client";

import { BriefcaseMedicalIcon, CheckIcon, ClockIcon, EarthIcon, LockIcon, SaveIcon, SettingsIcon, UserCogIcon, UsersIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useTranslations } from "@/lib/compat/intl";
import useLocale from "@/lib/compat/intl";
import { useToast } from "@/components/ui/ToastProvider";
import { Button, GlideSelect } from "@/components/ui";
import { apiRequest } from "@/lib/apiClient";

// --- مكون Toggle Switch مخصص ---
const ToggleSwitch = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between w-full">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        value=""
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-(--ui-surface-2) peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-(--ui-ring) rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:border-(--ui-border) after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:brand-gradient shadow-inner border border-(--ui-border)"></div>
    </label>
  </div>
);

// --- الصفحة الرئيسية ---
export default function SettingsPage() {
  const { showError, showSuccess } = useToast();
  const locale = useLocale();
  const t = useTranslations("adminSettings");
  const isRTL = locale === "ar";

  // الحالة الأولية للإعدادات
  const [settings, setSettings] = useState({
    systemName: t("defaults.systemName"),
    defaultLanguage: "ar",
    registrationEnabled: true,
    allowPatientChangeDoctor: true,
    maxDoctorChangeRequests: 3,
    appointmentInterval: 15,
    sessionDuration: 120,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // عند فتح الصفحة، نحمل القيم المخزنة من الخادم
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const body = await apiRequest("/api/admin/settings");
        if (!mounted) return;
        if (body?.settings) {
          setSettings((prev) => ({ ...prev, ...body.settings }));
        }
      } catch (e) {
        if (!mounted) return;
        if (e?.status !== 404) {
          showError(e?.message || t("messages.saveFailed"));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showError, t]);

  // التعامل مع تغيير الحقول
  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // حفظ الإعدادات
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const body = await apiRequest("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      if (body?.settings) {
        setSettings((prev) => ({ ...prev, ...body.settings }));
      }
      showSuccess(t("messages.success"));
    } catch (e) {
      showError(e?.message || t("messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  // Build appointment options by mapping known values to localized labels.
  // Avoid calling `t('system.config.appointmentOptions')` directly because next-intl
  // treats nested objects as non-string messages and will error. Locale files
  // provide a mapping like { "15": "15m", ... } so we call t for each key.
  const appointmentValueKeys = [15, 30, 45, 60];
  const appointmentOptions = appointmentValueKeys.map((v) => ({
    value: v,
    label: t(`system.config.appointmentOptions.${v}`),
  }));

  return (
    <>
      <div
        className={`min-h-screen w-full p-4 md:p-8 bg-background ${isRTL ? "rtl" : "ltr"}`}
      >
        {/* حاوية المحتوى */}
        <div className="w-full max-w-7xl mx-auto space-y-8">
          {/* رأس الصفحة */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pd-panel pd-shape-asymmetric p-6 pd-shape-organic border border-(--ui-border) shadow-(--shadow-soft)">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 pd-shape-orbital brand-gradient flex items-center justify-center text-[var(--pd-on-accent)] shadow-(--shadow-soft)">
                <SettingsIcon size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {t("header.title")}
                </h1>
                <p className="text-(--ui-muted-2) text-sm mt-0.5">
                  {t("header.subtitle")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-(--ui-muted-2) px-3 py-1 bg-(--ui-surface-2) rounded-full border border-(--ui-border)">
                {t("ui.version")}
              </span>
            </div>
          </header>

          {/* شبكة الإعدادات */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. الإعدادات العامة */}
            <section className="pd-panel pd-shape-layered shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-[var(--pd-on-accent)] rounded-lg shadow-(--shadow-soft)">
                  <EarthIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t("sections.general")}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-1.5">
                    {t("labels.systemName.label")}
                  </label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={(e) => handleChange("systemName", e.target.value)}
                    className="w-full px-4 py-2.5 bg-(--ui-surface-2) border border-(--ui-border) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--ui-ring) focus:border-transparent transition-all text-sm text-foreground"
                  />
                  <p className="text-xs text-(--ui-muted-2) mt-1">
                    {t("labels.systemName.description")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-1.5">
                    {t("labels.defaultLanguage.label")}
                  </label>
                  <GlideSelect
                    fullWidth
                    size="lg"
                    value={String(settings.defaultLanguage)}
                    onChange={(val) => handleChange("defaultLanguage", val)}
                    options={["ar", "en"].map((lang) => ({
                      value: lang,
                      label: t(`system.config.languageOptions.${lang}`),
                    }))}
                  />
                </div>
              </div>
            </section>

            {/* 2. الوصول والتسجيل */}
            <section className="pd-panel pd-shape-organic shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-[var(--pd-on-accent)] rounded-lg shadow-(--shadow-soft)">
                  <UsersIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t("sections.access")}
                </h3>
              </div>

              <div className="space-y-6 pt-2">
                <ToggleSwitch
                  label={t("labels.registrationEnabled.label")}
                  checked={settings.registrationEnabled}
                  onChange={(e) =>
                    handleChange("registrationEnabled", e.target.checked)
                  }
                />
                <p className="text-xs text-(--ui-muted-2) leading-relaxed -mt-4">
                  {t("labels.registrationEnabled.description")}
                </p>
              </div>
            </section>

            {/* 3. الإعدادات الطبية */}
            <section className="pd-panel pd-shape-asymmetric shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-[var(--pd-on-accent)] rounded-lg shadow-(--shadow-soft)">
                  <BriefcaseMedicalIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t("sections.medical")}
                </h3>
              </div>

              <div className="space-y-5">
                <ToggleSwitch
                  label={t("labels.allowPatientChangeDoctor.label")}
                  checked={settings.allowPatientChangeDoctor}
                  onChange={(e) =>
                    handleChange("allowPatientChangeDoctor", e.target.checked)
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-(--ui-muted-2) uppercase tracking-wider mb-1 block">
                      {t("labels.maxDoctorChangeRequests.label")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.maxDoctorChangeRequests}
                      onChange={(e) =>
                        handleChange(
                          "maxDoctorChangeRequests",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 bg-(--ui-surface-2) border border-(--ui-border) rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-(--ui-ring) focus:border-transparent transition-all text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-(--ui-muted-2) uppercase tracking-wider mb-1 block">
                      {t("labels.appointmentInterval.label")}
                    </label>
                    <GlideSelect
                      fullWidth
                      value={String(settings.appointmentInterval)}
                      onChange={(val) =>
                        handleChange("appointmentInterval", parseInt(val, 10))
                      }
                      options={appointmentOptions.map((opt) => ({
                        value: String(opt.value),
                        label: opt.label,
                      }))}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* 4. صلاحيات الأدوار المعتمدة (RBAC) */}
            <section className="pd-panel pd-shape-layered shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-[var(--pd-on-accent)] rounded-lg shadow-(--shadow-soft)">
                  <UserCogIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t("labels.rolePermissions.label")}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {["admin", "doctor", "patient"].map((role) => (
                  <div
                    key={role}
                    className="flex items-center justify-between p-3 rounded-xl bg-(--ui-surface) border border-(--ui-border) shadow-(--shadow-soft)"
                  >
                    <span className="font-medium capitalize text-sm text-foreground">
                      {role}
                    </span>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center bg-(--ui-success) text-[var(--pd-on-accent)] border border-(--ui-success-border)">
                      <CheckIcon size={10} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. الأمان */}
            <section className="pd-panel pd-shape-organic shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5 md:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-[var(--pd-on-accent)] rounded-lg shadow-(--shadow-soft)">
                  <LockIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t("sections.security")}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <ClockIcon size={14} className="text-(--ui-muted-2)" />
                      {t("labels.sessionDuration.label")}
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={settings.sessionDuration}
                        onChange={(e) =>
                          handleChange(
                            "sessionDuration",
                            parseInt(e.target.value, 10),
                          )
                        }
                        className="w-full h-2 bg-(--ui-surface-2) rounded-lg appearance-none cursor-pointer accent-(--ui-ring)"
                      />
                      <span className="text-sm font-bold text-(--ui-info) bg-(--ui-info-bg) border border-(--ui-info-border) px-2 py-1 rounded min-w-14 text-center">
                        {settings.sessionDuration}
                        {t("units.minutes")}
                      </span>
                    </div>
                    <p className="text-xs text-(--ui-muted-2) mt-2">
                      {t("labels.sessionDuration.description")}
                    </p>
                  </div>
                </div>

                {/* رسم توضيحي بسيط للأمان */}
                <div className="hidden md:flex justify-center bg-(--ui-surface-2) rounded-xl p-6 border border-(--ui-border)">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-(--ui-surface) rounded-full shadow-(--shadow-soft) border border-(--ui-border) flex items-center justify-center mx-auto text-(--ui-info) text-2xl">
                      <LockIcon />
                    </div>
                    <p className="text-xs text-(--ui-muted-2) max-w-50 mx-auto">
                      {t("security.hipaaNotice")}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* زر الحفظ الثابت في الأسفل */}
          <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="pd-panel pd-shape-asymmetric p-2 rounded-2xl shadow-(--shadow-lift) border border-(--ui-border) pointer-events-auto flex items-center gap-4">
              <div className="hidden sm:block text-xs text-(--ui-muted-2) px-2 border-r border-(--ui-border)">
                {t("ui.unsavedChanges")}
              </div>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || loading}
                isLoading={saving}
              >
                <SaveIcon /> {t("actions.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}