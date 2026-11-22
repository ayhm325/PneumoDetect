"use client";

import { BriefcaseMedicalIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon, PhoneIcon, SaveIcon, UserIcon } from "lucide-react";
import DoctorLayout from "../DoctorLayout";
import { useToast } from "@/components/ui/ToastProvider";
import { useState, useEffect } from "react";
import { useTranslations } from "@/lib/compat/intl";
import useLocale from "@/lib/compat/intl";
import { apiRequest } from "@/lib/apiClient";
import { Button, Card } from "@/components/ui";

export default function DoctorSettingsPage() {
  const { showSuccess, showError } = useToast();
  const t = useTranslations("doctorSettings");
  const locale = useLocale();

  // بيانات الطبيب الحقيقية
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    clinic: "",
    licenseNumber: "",
  });
  const [userEmail, setUserEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    apiRequest("/api/doctor/me")
      .then((data) => {
        if (!mounted) return;
        if (data && data.profile) {
          setProfile({
            name: data.profile.name || "",
            email: data.profile.email || "",
            phone: data.profile.phone || "",
            clinic: data.profile.clinic || "",
            licenseNumber: data.profile.licenseNumber || "",
          });
          setUserEmail(data.profile.email || "");
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // إعدادات الأمان
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // حفظ الملف الشخصي
  const handleSaveProfile = async () => {
    if (savingProfile) return;
    setSavingProfile(true);
    try {
      const data = await apiRequest("/api/doctor/me", {
        method: "PUT",
        body: JSON.stringify({
          fullName: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
          licenseNumber: profile.licenseNumber.trim(),
          clinic: profile.clinic ? profile.clinic.trim() : null,
        }),
      });
      if (data?.profile) {
        setProfile({
          name: data.profile.name || "",
          email: data.profile.email || "",
          phone: data.profile.phone || "",
          clinic: data.profile.clinic || "",
          licenseNumber: data.profile.licenseNumber || "",
        });
        setUserEmail(data.profile.email || "");
      }
      showSuccess(t("profile.toast.saved"));
    } catch (err) {
      showError(err?.message || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // تغيير كلمة المرور
  const handleChangePassword = async () => {
    if (savingPassword) return;
    const { currentPassword, newPassword, confirmPassword } = security;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showError(t("security.toast.fillFields"));
      return;
    }

    if (currentPassword === newPassword) {
      showError(t("security.toast.sameAsOld"));
      return;
    }

    if (newPassword !== confirmPassword) {
      showError(t("security.toast.mismatch"));
      return;
    }

    if (newPassword.length < 8) {
      showError(t("security_min_length"));
      return;
    }

    setSavingPassword(true);
    try {
      const data = await apiRequest("/api/doctor/change-password", {
        method: "POST",
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword,
        }),
      });

      if (data?.success !== false) {
        showSuccess(t("security.toast.changedSuccess"));
        setSecurity({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setTimeout(async () => {
          try {
            await apiRequest("/api/auth/logout", { method: "POST" }).catch(
              () => {},
            );
          } finally {
            if (typeof window !== "undefined") {
              localStorage.clear();
              sessionStorage.clear();
            }
            window.location.href = locale === "en" ? "/en" : "/ar";
          }
        }, 1200);
      } else {
        showError(data?.message || data?.error || t("security.toast.changeFailed"));
      }
    } catch (err) {
      if (err?.code === "same_password" || err?.message === "same_password") {
        showError(t("security.toast.sameAsOld"));
      } else {
        showError(err?.message || t("security.toast.changeFailed"));
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DoctorLayout>
      <div className="min-h-screen bg-(--ui-surface-2) text-(--ui-foreground) p-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-10">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-(--ui-foreground) flex items-center gap-3">
              <BriefcaseMedicalIcon className="text-(--ui-info)" />
              {t("title")}
            </h1>
            <p className="mt-2 text-(--ui-muted-foreground)">{t("subtitle")}</p>
          </div>

          {/* Profile Settings */}
          <Card variant="feature" size="lg">
            <div className="mb-6 flex items-center gap-3">
              <BriefcaseMedicalIcon className="text-2xl text-(--ui-info)" />
              <h2 className="text-2xl font-bold text-(--ui-foreground)">
                {t("profile.header")}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  <UserIcon className="inline ml-2" /> {t("profile.name")}
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  <MailIcon className="inline ml-2" /> {t("profile.email")}
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                  className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  <PhoneIcon className="inline ml-2" /> {t("profile.phone")}
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  {t("profile.license")}
                </label>
                <input
                  type="text"
                  value={profile.licenseNumber}
                  onChange={(e) =>
                    setProfile({ ...profile, licenseNumber: e.target.value })
                  }
                  className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  {locale === "ar" ? "اسم أو عنوان العيادة" : "Clinic Name / Address"}
                </label>
                <input
                  type="text"
                  value={profile.clinic}
                  onChange={(e) =>
                    setProfile({ ...profile, clinic: e.target.value })
                  }
                  className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              isLoading={savingProfile}
              fullWidth={false}
              size="sm"
              className="mt-6 flex items-center gap-2 px-6"
            >
              <SaveIcon />
              {t("profile.save")}
            </Button>
          </Card>

          {/* Security Settings */}
          <Card variant="clinical" size="lg">
            <div className="mb-6 flex items-center gap-3">
              <LockIcon className="text-2xl text-(--ui-info)" />
              <h2 className="text-2xl font-bold text-(--ui-foreground)">
                {t("change_password")}
              </h2>
            </div>

            <div className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  {t("current_password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    value={security.currentPassword}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 pr-12 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        current: !showPassword.current,
                      })
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ui-muted-foreground) hover:text-(--ui-foreground)"
                  >
                    {showPassword.current ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  {t("new_password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={security.newPassword}
                    onChange={(e) =>
                      setSecurity({ ...security, newPassword: e.target.value })
                    }
                    className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 pr-12 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        new: !showPassword.new,
                      })
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ui-muted-foreground) hover:text-(--ui-foreground)"
                  >
                    {showPassword.new ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-(--ui-muted-foreground)">
                  {t("security_min_length")}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  {t("confirm_password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={security.confirmPassword}
                    onChange={(e) =>
                      setSecurity({
                        ...security,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 pr-12 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        confirm: !showPassword.confirm,
                      })
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-(--ui-muted-foreground) hover:text-(--ui-foreground)"
                  >
                    {showPassword.confirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              isLoading={savingPassword}
              fullWidth={false}
              size="sm"
              className="mt-6 flex items-center gap-2 px-6"
            >
              <LockIcon />
              {t("change_password")}
            </Button>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  );
}
