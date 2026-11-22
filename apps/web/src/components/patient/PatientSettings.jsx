"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "@/lib/compat/intl";
import { useLocaleContext } from "@/contexts/LocaleContext";
import { useTheme } from "@/lib/compat/theme";
import { useToast } from "@/components/ui/ToastProvider";
import { apiRequest } from "@/lib/apiClient";
import { Button, GlideSelect } from "@/components/ui";

export default function PatientSettings({ onSave }) {
  const t = useTranslations("patientSettings");
  const tTheme = useTranslations("theme");
  const { locale, setLocale } = useLocaleContext();
  const { theme, setTheme } = useTheme();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedLang, setSelectedLang] = useState(locale);
  const [selectedTheme, setSelectedTheme] = useState(theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedLang(locale);
  }, [locale]);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    apiRequest("/api/patient/profile")
      .then((res) => {
        if (mounted && res?.profile?.email) {
          setEmail(res.profile.email);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (email.trim()) {
        await apiRequest("/api/patient/profile", {
          method: "PUT",
          body: JSON.stringify({ email: email.trim() }),
        });
      }
      if (newPassword.trim()) {
        if (!oldPassword.trim()) {
          throw new Error(
            locale === "ar"
              ? "يرجى إدخال كلمة المرور الحالية لتغيير كلمة المرور"
              : "Current password is required to change password",
          );
        }
        await apiRequest("/api/patient/change-password", {
          method: "POST",
          body: JSON.stringify({
            oldPassword: oldPassword.trim(),
            newPassword: newPassword.trim(),
          }),
        });
        setOldPassword("");
        setNewPassword("");
      }
      if (selectedLang !== locale) {
        setLocale(selectedLang);
      }
      if (selectedTheme !== theme) {
        setTheme(selectedTheme);
      }
      showSuccess(
        locale === "ar"
          ? "تم حفظ الإعدادات بنجاح"
          : "Settings saved successfully",
      );
      onSave?.();
    } catch (err) {
      showError(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) shadow-sm">
      <header className="flex items-center justify-between border-b border-(--ui-border) p-4">
        <h2 className="text-lg font-semibold text-(--ui-foreground)">
          {t("title")}
        </h2>
      </header>
      <form className="space-y-4 p-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm text-(--ui-muted-foreground)">
              {t("fields.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-sm text-(--ui-foreground)"
            />
          </div>
          <div>
            <label className="text-sm text-(--ui-muted-foreground)">
              {locale === "ar" ? "كلمة المرور الحالية" : "Current Password"}
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-sm text-(--ui-foreground)"
            />
          </div>
          <div>
            <label className="text-sm text-(--ui-muted-foreground)">
              {t("fields.newPassword")}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 py-2 text-sm text-(--ui-foreground)"
            />
          </div>
          <div>
            <label className="text-sm text-(--ui-muted-foreground)">
              {t("fields.languageAppearance")}
            </label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <GlideSelect
                fullWidth
                value={selectedLang}
                onChange={(val) => setSelectedLang(val)}
                options={[
                  { value: "ar", label: t("language.arabic") },
                  { value: "en", label: t("language.english") },
                ]}
              />
              <GlideSelect
                fullWidth
                value={selectedTheme}
                onChange={(val) =>
                  setSelectedTheme(val === "dark" ? "dark" : "light")
                }
                options={[
                  { value: "light", label: tTheme("mode.light") },
                  { value: "dark", label: tTheme("mode.dark") },
                ]}
              />
            </div>
          </div>
        </div>
        <div className="pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={saving}
            isLoading={saving}
            fullWidth={false}
          >
            {t("actions.save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
