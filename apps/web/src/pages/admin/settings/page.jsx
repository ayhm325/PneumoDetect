"use client";

import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaCheck,
  FaGlobeAmericas,
  FaUserMd,
  FaUserShield,
  FaClock,
  FaLock,
} from "react-icons/fa";
import { FiSettings, FiUsers } from "react-icons/fi";
import { useTranslations } from "@/lib/compat/intl";
import useLocale from "@/lib/compat/intl";
import { useToast } from "@/components/ui/ToastProvider";

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
    allowPatientChangeDoctor: false,
    maxDoctorChangeRequests: 3,
    appointmentInterval: 15,
    rolePermissions: {
      doctor: true,
      patient: true,
    },
    sessionDuration: 30,
    enableTwoFactor: false,
  });

  // عند فتح الصفحة، نحمل القيم المخزنة من الخادم
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showError(err?.error || t("messages.saveFailed"));
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (body?.settings) {
          setSettings((prev) => ({ ...prev, ...body.settings }));
        }
      } catch (e) {
        if (!mounted) return;
        showError(e?.message || t("messages.saveFailed"));
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

  // التعامل مع التغييرات المتداخلة (مثل الصلاحيات)
  const handleNestedChange = (parent, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  // حفظ الإعدادات
  const handleSave = () => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showError(err?.error || t("messages.saveFailed"));
          return;
        }
        const body = await res.json();
        showSuccess(t("messages.success"));
      } catch (e) {
        showError(e.message || t("messages.saveFailed"));
      }
    })();
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
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 card-glass p-6 rounded-2xl border border-(--ui-border) shadow-(--shadow-soft)">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl brand-gradient flex items-center justify-center text-white shadow-(--shadow-soft)">
                <FiSettings size={24} />
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
            <section className="card-glass rounded-2xl shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-white rounded-lg shadow-(--shadow-soft)">
                  <FaGlobeAmericas className="w-5 h-5" />
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
                  <div className="relative">
                    <select
                      value={settings.defaultLanguage}
                      onChange={(e) =>
                        handleChange("defaultLanguage", e.target.value)
                      }
                      className="w-full appearance-none px-4 py-2.5 bg-(--ui-surface-2) border border-(--ui-border) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--ui-ring) focus:border-transparent transition-all text-sm text-foreground cursor-pointer"
                    >
                      {["ar", "en"].map((lang) => (
                        <option key={lang} value={lang}>
                          {t(`system.config.languageOptions.${lang}`)}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-(--ui-muted-2)">
                      <FaGlobeAmericas size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. الوصول والتسجيل */}
            <section className="card-glass rounded-2xl shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-white rounded-lg shadow-(--shadow-soft)">
                  <FiUsers className="w-5 h-5" />
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
            <section className="card-glass rounded-2xl shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-white rounded-lg shadow-(--shadow-soft)">
                  <FaUserMd className="w-5 h-5" />
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
                    <select
                      value={settings.appointmentInterval}
                      onChange={(e) =>
                        handleChange(
                          "appointmentInterval",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-full px-3 py-2 bg-(--ui-surface-2) border border-(--ui-border) rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-(--ui-ring) focus:border-transparent transition-all cursor-pointer text-foreground"
                    >
                      {appointmentOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. صلاحيات الأدوار */}
            <section className="card-glass rounded-2xl shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-white rounded-lg shadow-(--shadow-soft)">
                  <FaUserShield className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t("labels.rolePermissions.label")}
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                {Object.keys(settings.rolePermissions)
                  .filter((r) => r !== "admin")
                  .map((role) => (
                    <button
                      key={role}
                      onClick={() =>
                        handleNestedChange(
                          "rolePermissions",
                          role,
                          !settings.rolePermissions[role],
                        )
                      }
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                        settings.rolePermissions[role]
                          ? "bg-(--ui-surface) border border-(--ui-border) shadow-(--shadow-soft)"
                          : "bg-(--ui-surface-2) border border-(--ui-border) opacity-60 hover:opacity-100"
                      }`}
                    >
                      <span
                        className={`font-medium capitalize text-sm ${settings.rolePermissions[role] ? "text-foreground" : "text-(--ui-muted-2)"}`}
                      >
                        {role}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border ${settings.rolePermissions[role] ? "bg-(--ui-success) text-white border-(--ui-success-border)" : "bg-(--ui-surface) text-(--ui-muted-2) border-(--ui-border)"}`}
                      >
                        {settings.rolePermissions[role] ? (
                          <FaCheck size={10} />
                        ) : (
                          ""
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </section>

            {/* 5. الأمان */}
            <section className="card-glass rounded-2xl shadow-(--shadow-soft) border border-(--ui-border) p-6 hover:shadow-(--shadow-lift) transition-shadow duration-300 flex flex-col gap-5 md:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 border-b border-(--ui-border) pb-4">
                <div className="p-2 brand-gradient text-white rounded-lg shadow-(--shadow-soft)">
                  <FaLock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">
                  {t("sections.security")}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <FaClock size={14} className="text-(--ui-muted-2)" />
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
                            parseInt(e.target.value),
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

                  <div className="pt-2">
                    <ToggleSwitch
                      label={
                        <span className="flex items-center gap-2">
                          {t("labels.enableTwoFactor.label")}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-(--ui-info-bg) text-(--ui-info) border border-(--ui-info-border) tracking-wide">
                            {t("ui.secureBadge")}
                          </span>
                        </span>
                      }
                      checked={settings.enableTwoFactor}
                      onChange={(e) =>
                        handleChange("enableTwoFactor", e.target.checked)
                      }
                    />
                  </div>
                </div>

                {/* رسم توضيحي بسيط للأمان */}
                <div className="hidden md:flex justify-center bg-(--ui-surface-2) rounded-xl p-6 border border-(--ui-border)">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-(--ui-surface) rounded-full shadow-(--shadow-soft) border border-(--ui-border) flex items-center justify-center mx-auto text-(--ui-info) text-2xl">
                      <FaLock />
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
            <div className="card-glass p-2 rounded-2xl shadow-(--shadow-lift) border border-(--ui-border) pointer-events-auto flex items-center gap-4">
              <div className="hidden sm:block text-xs text-(--ui-muted-2) px-2 border-r border-(--ui-border)">
                {t("ui.unsavedChanges")}
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 btn-gradient text-white px-6 py-2.5 rounded-xl transition-all active:scale-95 font-medium text-sm"
              >
                <FaSave /> {t("actions.save")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}