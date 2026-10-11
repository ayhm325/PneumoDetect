"use client";

import DoctorLayout from "../DoctorLayout";
import { useToast } from "../../../components/ui/ToastProvider";
import { useState, useEffect } from "react";
import {
  FaUser,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaSave,
  FaUserMd,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useTranslations } from "next-intl";
import useLocale from "../../../hooks/useLocale";
import { Button, Card } from "../../../../src/components/ui";

export default function DoctorSettingsPage() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  // Use single namespace `doctorSettings` and access nested keys via `t(key)`
  const t = useTranslations("doctorSettings");
  const { locale } = useLocale();

  // بيانات الطبيب الحقيقية
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    licenseNumber: "",
  });
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    fetch("/api/doctor/me")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.profile) {
          setProfile({
            name: data.profile.name || "",
            email: data.profile.email || "",
            phone: data.profile.phone || "",
            bio: data.profile.bio || "",
            licenseNumber: data.profile.licenseNumber || "",
          });
          setUserEmail(data.profile.email || "");
        }
      });
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
  const handleSaveProfile = () => {
    showSuccess(t("profile.toast.saved"));
  };

  // تغيير كلمة المرور
  const handleChangePassword = () => {
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

    fetch("/api/doctor/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        currentPassword,
        newPassword,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          showSuccess(t("security.toast.changedSuccess"));
          setSecurity({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

          setTimeout(async () => {
            try {
              const token =
                typeof window !== "undefined"
                  ? localStorage.getItem("token")
                  : null;
              await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
                headers: token
                  ? {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    }
                  : { "Content-Type": "application/json" },
                body: token ? JSON.stringify({ token }) : undefined,
              }).catch(() => {});
            } finally {
              if (typeof window !== "undefined") {
                localStorage.clear();
                sessionStorage.clear();
              }
              window.location.href = locale === "en" ? "/en" : "/ar";
            }
          }, 1200);
        } else {
          if (data?.error === "same_password") {
            showError(t("security.toast.sameAsOld"));
          } else {
            showError(data?.message || data?.error || t("security.toast.changeFailed"));
          }
        }
      })
      .catch(() => {
        showError(t("security.toast.changeFailed"));
      });
  };

  return (
    <DoctorLayout>

      <div className="min-h-screen bg-(--ui-surface-2) text-(--ui-foreground) p-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-10">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-(--ui-foreground) flex items-center gap-3">
              <FaUserMd className="text-(--ui-info)" />
              {t("title")}
            </h1>
            <p className="mt-2 text-(--ui-muted-foreground)">{t("subtitle")}</p>
          </div>

          {/* Profile Settings */}
          <Card size="lg">
            <div className="mb-6 flex items-center gap-3">
              <FaUserMd className="text-2xl text-(--ui-info)" />
              <h2 className="text-2xl font-bold text-(--ui-foreground)">
                {t("profile.header")}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-(--ui-muted-foreground)">
                  <FaUser className="inline ml-2" /> {t("profile.name")}
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
                  <FaEnvelope className="inline ml-2" /> {t("profile.email")}
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
                  <FaPhone className="inline ml-2" /> {t("profile.phone")}
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

              <div className="md:col-span-2">
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
                  {t("profile.bio")}
                </label>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-3 text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              fullWidth={false}
              size="sm"
              className="mt-6 flex items-center gap-2 px-6"
            >
              <FaSave />
              {t("profile.save")}
            </Button>
          </Card>

          {/* Security Settings */}
          <Card size="lg">
            <div className="mb-6 flex items-center gap-3">
              <FaLock className="text-2xl text-(--ui-info)" />
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
                    {showPassword.current ? <FaEyeSlash /> : <FaEye />}
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
                    {showPassword.new ? <FaEyeSlash /> : <FaEye />}
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
                    {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleChangePassword}
              fullWidth={false}
              size="sm"
              className="mt-6 flex items-center gap-2 px-6"
            >
              <FaLock />
              {t("change_password")}
            </Button>
          </Card>
        </div>
      </div>
    </DoctorLayout>
  );
}
