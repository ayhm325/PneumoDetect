"use client";

import { BriefcaseMedicalIcon, CalendarIcon, EyeIcon, EyeOffIcon, HeartIcon, IdCardIcon, LockIcon, MailIcon, PenLineIcon, PhoneIcon, SaveIcon, ShieldCheckIcon, UserIcon, XIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "@/lib/compat/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations, useLocale } from "@/lib/compat/intl";
import UnifiedCard from "@/components/ui/UnifiedCard";
import { Button, GlideSelect } from "@/components/ui";
import { apiRequest } from "@/lib/apiClient";

export default function PatientProfilePage() {
  const locale = useLocale();
  const t = useTranslations("profile");
  const patientT = useTranslations("patient");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");
  const { showSuccess, showError, showInfo } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    id: "",
    userId: "",
    fullName: "",
    email: "",
    doctorId: "",
    doctorName: "",
    phone: "",
    gender: "",
    birthDate: "",
    bloodType: "",
    joinDate: "",
    lastVisit: "",
    status: "",
    clinicalStatus: "",
    notes: "",
    createdAt: "",
    updatedAt: "",
  });

  const applyServerProfile = useCallback((p = {}) => {
    setProfileData((prev) => ({
      id: p.id ?? prev.id ?? "",
      userId: p.userId ?? prev.userId ?? "",
      fullName: p.fullName ?? "",
      email: p.email ?? "",
      doctorId: p.doctorId ?? prev.doctorId ?? "",
      doctorName: p.doctor?.fullName ?? prev.doctorName ?? "",
      phone: p.phone ?? "",
      gender: p.gender ?? "",
      birthDate: p.birthDate ? String(p.birthDate).slice(0, 10) : "",
      bloodType: p.bloodType ?? "",
      joinDate: p.joinDate || p.createdAt || prev.joinDate || "",
      lastVisit: p.lastVisit ?? prev.lastVisit ?? "",
      status: p.status ?? prev.status ?? "",
      clinicalStatus:
        p.clinicalStatus ||
        p.clinical_status ||
        prev.clinicalStatus ||
        p.status ||
        "",
      notes: p.notes ?? "",
      createdAt: p.createdAt ?? prev.createdAt ?? "",
      updatedAt: p.updatedAt ?? prev.updatedAt ?? "",
    }));
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest("/api/patient/profile");
      applyServerProfile(data?.profile || {});
    } catch (err) {
      setError(err?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [applyServerProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle input change
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Save profile
  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const payload = {
        fullName: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        birthDate: profileData.birthDate || "",
        gender: profileData.gender || "",
        bloodType: profileData.bloodType || "",
        notes: profileData.notes || "",
      };
      const data = await apiRequest("/api/patient/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (data?.profile) {
        applyServerProfile(data.profile);
      }
      setIsEditing(false);
      showSuccess(t("toastSaveSuccess"));
    } catch (err) {
      showError(err?.message || t("toast.saveError"));
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleCancel = async () => {
    setIsEditing(false);
    await loadProfile();
    showInfo(t("toastCancelEdit"));
  };

  if (loading && !profileData.id) {
    return (
      <div className="min-h-screen bg-(--ui-surface) flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--ui-ring)" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) font-sans selection:bg-(--ui-ring) selection:text-[var(--pd-on-accent)] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-125 h-125 bg-(--ui-info)/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-100 h-100 bg-(--ui-success)/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto p-6 md:p-10 space-y-8">
        {/* Header */}
        <HeaderSection
          t={t}
          isEditing={isEditing}
          loading={loading}
          setIsEditing={setIsEditing}
          handleCancel={handleCancel}
          handleSave={handleSave}
        />

        {error && (
          <div className="rounded-xl border border-(--ui-danger-border) bg-(--ui-danger-bg) p-4 text-(--ui-danger) flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={loadProfile}>
              {locale === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}

        {/* Profile Card */}
        <UnifiedCard
          className="backdrop-blur-xl rounded-4xl p-8 shadow-(--shadow-soft) border border-(--ui-border)"
          glass
        >
          <ProfileCard
            t={t}
            patientT={patientT}
            locale={locale}
            placeholder={placeholder}
            isEditing={isEditing}
            profileData={profileData}
            setProfileData={setProfileData}
            handleFieldChange={handleFieldChange}
          />
        </UnifiedCard>

        {/* Doctor Change Request Card */}
        <UnifiedCard
          className="backdrop-blur-xl rounded-4xl p-8 shadow-(--shadow-soft) border border-(--ui-border) overflow-hidden relative"
          glass
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-(--ui-info)/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-(--ui-info)/10 text-(--ui-info) rounded-xl border border-(--ui-info-border)">
                <BriefcaseMedicalIcon size={20} />
              </div>
              <h2 className="text-xl font-bold text-(--ui-foreground)">
                {t("doctorChange.title")}
              </h2>
            </div>
            <DoctorChangeRequestForm
              t={t}
              currentDoctorId={profileData.doctorId}
            />
          </div>
        </UnifiedCard>

        {/* Security Card */}
        <UnifiedCard
          className="backdrop-blur-xl rounded-4xl p-8 shadow-(--shadow-soft) border border-(--ui-border) overflow-hidden relative"
          glass
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-(--ui-danger)/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-(--ui-danger)/10 text-(--ui-danger) rounded-xl border border-(--ui-danger-border)">
                <ShieldCheckIcon size={20} />
              </div>
              <h2 className="text-xl font-bold text-(--ui-foreground)">
                {t("security.changePasswordTitle")}
              </h2>
            </div>
            <ChangePasswordForm t={t} router={router} pathname={pathname} />
          </div>
        </UnifiedCard>
      </div>
    </div>
  );
}

function HeaderSection({
  t,
  isEditing,
  loading,
  setIsEditing,
  handleCancel,
  handleSave,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight brand-gradient-text">
          {t("pageTitle")}
        </h1>
        <p className="text-(--ui-muted-foreground) text-lg mt-2">
          {t("pageSubtitle")}
        </p>
      </div>
      <div className="flex gap-3">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <PenLineIcon /> {t("btnEdit")}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={loading}
            >
              <XIcon /> {t("btnCancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              isLoading={loading}
              loadingText={t("saving")}
            >
              <SaveIcon /> {t("btnSave")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileCard({
  t,
  patientT,
  locale,
  placeholder,
  isEditing,
  profileData,
  setProfileData,
  handleFieldChange,
}) {
  return (
    <>
      {/* Avatar & Identity */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 border-b border-(--ui-border) pb-8">
        <div className="relative shrink-0">
          <div className="profile-card-image profile-card-image--avatar w-36 h-40 rounded-[24px] bg-(--ui-surface-2) flex items-center justify-center text-5xl text-(--ui-info) shadow-(--shadow-card-media) border border-(--ui-border)">
            <UserIcon />
          </div>
          {profileData.status === "active" && (
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-(--ui-success) border-4 border-(--ui-surface) rounded-full" />
          )}
        </div>
        <div className="flex-1 w-full space-y-4">
          {/* Name */}
          <div className="group">
            <label className="text-xs font-bold text-(--ui-muted-foreground) uppercase tracking-wider mb-1 block">
              {t("field.fullName")}
            </label>
            {isEditing ? (
              <input
                name="fullName"
                value={profileData.fullName}
                onChange={handleFieldChange}
                className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all font-bold text-lg text-(--ui-foreground)"
              />
            ) : (
              <div className="text-2xl font-bold text-(--ui-foreground)">
                {profileData.fullName || placeholder}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="group min-w-0">
              <label className="text-xs font-bold text-(--ui-muted-foreground) uppercase tracking-wider mb-1 flex items-center gap-2">
                <MailIcon className="text-(--ui-info)" /> {t("field.email")}
              </label>
              {isEditing ? (
                <input
                  name="email"
                  value={profileData.email}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground)"
                />
              ) : (
                <div
                  dir="ltr"
                  className="min-w-0 text-(--ui-muted-foreground) bg-(--ui-surface-2)/40 border border-(--ui-border) p-3 rounded-xl truncate"
                >
                  {profileData.email || placeholder}
                </div>
              )}
            </div>
            {/* Phone */}
            <div className="group min-w-0">
              <label className="text-xs font-bold text-(--ui-muted-foreground) uppercase tracking-wider mb-1 flex items-center gap-2">
                <PhoneIcon className="text-(--ui-info)" /> {t("field.phone")}
              </label>
              {isEditing ? (
                <input
                  name="phone"
                  value={profileData.phone}
                  onChange={handleFieldChange}
                  className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground)"
                />
              ) : (
                <div
                  dir="ltr"
                  className="min-w-0 text-(--ui-muted-foreground) bg-(--ui-surface-2)/40 border border-(--ui-border) p-3 rounded-xl truncate"
                >
                  {profileData.phone || placeholder}
                </div>
              )}
            </div>
          </div>
          {/* IDs */}
          <div className="flex flex-wrap gap-4 text-xs font-mono text-(--ui-muted-foreground) pt-2">
            <div className="flex items-center gap-2">
              <IdCardIcon /> {t("field.patientNumber")}:{" "}
              {profileData.id || placeholder}
            </div>
            <div className="flex items-center gap-2">
              <IdCardIcon /> {t("userId")}: {profileData.userId || placeholder}
            </div>
          </div>
        </div>
      </div>
      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Birth Date */}
        <div>
          <label className="text-xs font-bold text-(--ui-muted-foreground) uppercase tracking-wider mb-2 block">
            {t("field.birthDate")}
          </label>
          {isEditing ? (
            <input
              type="date"
              name="birthDate"
              value={
                profileData.birthDate ? profileData.birthDate.slice(0, 10) : ""
              }
              onChange={handleFieldChange}
              className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground)"
            />
          ) : (
            <div className="text-(--ui-foreground) font-medium">
              {profileData.birthDate
                ? new Date(profileData.birthDate).toLocaleDateString(locale)
                : placeholder}
            </div>
          )}
        </div>
        {/* Gender */}
        <div>
          <label className="text-xs font-bold text-(--ui-muted-foreground) uppercase tracking-wider mb-2 block">
            {t("field.genderLabel")}
          </label>
          {isEditing ? (
            <GlideSelect
              fullWidth
              size="lg"
              name="gender"
              value={profileData.gender || ""}
              onChange={(val) =>
                setProfileData((prev) => ({ ...prev, gender: val }))
              }
              options={[
                { value: "", label: placeholder },
                { value: "male", label: t("field.gender.male") },
                { value: "female", label: t("field.gender.female") },
              ]}
            />
          ) : (
            <div className="text-(--ui-foreground) font-medium">
              {profileData.gender === "male" && t("field.gender.male")}
              {profileData.gender === "female" && t("field.gender.female")}
              {!profileData.gender && placeholder}
            </div>
          )}
        </div>
        {/* Blood Type */}
        <div>
          <label className="text-xs font-bold text-(--ui-muted-foreground) uppercase tracking-wider mb-2 flex items-center gap-2">
            {t("field.bloodType")}
          </label>
          {isEditing ? (
            <input
              name="bloodType"
              value={profileData.bloodType}
              onChange={handleFieldChange}
              className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground)"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-(--ui-danger)/10 text-(--ui-danger) flex items-center justify-center font-bold border border-(--ui-danger)/20">
                {profileData.bloodType || placeholder}
              </span>
            </div>
          )}
        </div>
        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-(--ui-muted-foreground) uppercase tracking-wider mb-2 block">
            {t("field.notes")}
          </label>
          {isEditing ? (
            <input
              name="notes"
              value={profileData.notes}
              onChange={handleFieldChange}
              className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground)"
            />
          ) : (
            <div className="text-(--ui-foreground) text-sm font-medium">
              {profileData.notes || placeholder}
            </div>
          )}
        </div>
      </div>
      {/* Doctor & Stats Row */}
      {(profileData.doctorName || profileData.joinDate) && (
        <div className="mt-8 pt-6 border-t border-(--ui-border) flex flex-wrap gap-4">
          {profileData.doctorName && (
            <div className="flex items-center gap-3 p-3 bg-(--ui-info-bg) rounded-xl border border-(--ui-info-border) w-full sm:w-auto max-w-full">
              <div className="p-2 bg-(--ui-surface) border border-(--ui-border) rounded-lg text-(--ui-info) shadow-sm">
                <BriefcaseMedicalIcon />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-(--ui-muted-foreground) uppercase font-bold">
                  {t("currentDoctor")}
                </div>
                <div className="text-sm font-bold text-(--ui-foreground) whitespace-normal wrap-break-word">
                  {profileData.doctorName}
                </div>
              </div>
            </div>
          )}
          {profileData.joinDate && (
            <div className="flex items-center gap-3 p-3 bg-(--ui-success-bg) rounded-xl border border-(--ui-success-border) w-full sm:w-auto max-w-full">
              <div className="p-2 bg-(--ui-surface) border border-(--ui-border) rounded-lg text-(--ui-success) shadow-sm">
                <CalendarIcon />
              </div>
              <div>
                <div className="text-xs text-(--ui-muted-foreground) uppercase font-bold">
                  {t("joinDate")}
                </div>
                <div className="text-sm font-bold text-(--ui-foreground)">
                  {new Date(profileData.joinDate).toLocaleDateString(locale)}
                </div>
              </div>
            </div>
          )}
          {profileData.clinicalStatus && (
            <div className="flex items-center gap-3 p-3 bg-(--ui-info-bg) rounded-xl border border-(--ui-info-border) w-full sm:w-auto max-w-full">
              <div className="p-2 bg-(--ui-surface) border border-(--ui-border) rounded-lg text-(--ui-info) shadow-sm">
                <HeartIcon />
              </div>
              <div>
                <div className="text-xs text-(--ui-muted-foreground) uppercase font-bold">
                  {t("status")}
                </div>
                <div className="text-sm font-bold text-(--ui-foreground)">
                  {patientT(`clinicalStatuses.${profileData.clinicalStatus}`) ||
                    profileData.clinicalStatus}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function DoctorChangeRequestForm({ t, currentDoctorId }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requestedDoctorId, setRequestedDoctorId] = useState("");
  const [reason, setReason] = useState("");
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiRequest("/api/doctor/list");
        if (mounted) setDoctors(data?.doctors || []);
      } catch {
        if (mounted) setDoctors([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!requestedDoctorId) {
      showError(t("toast.doctorChangeSelect"));
      return;
    }
    if (currentDoctorId && requestedDoctorId === currentDoctorId) {
      showError(t("toast.doctorChangeSameDoctor"));
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/api/doctor-change-requests", {
        method: "POST",
        body: JSON.stringify({ requestedDoctorId, reason }),
      });
      showSuccess(t("toast.doctorChangeSent"));
      setRequestedDoctorId("");
      setReason("");
    } catch (err) {
      const serverMsg = (err?.message || "").toString();
      if (serverMsg === "Requested doctor is the same as current doctor") {
        showError(t("toast.doctorChangeSameDoctor"));
      } else if (serverMsg === "Missing requestedDoctorId") {
        showError(t("toast.doctorChangeSelect"));
      } else {
        showError(serverMsg || t("toast.doctorChangeFail"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-(--ui-muted-foreground) mb-2">
          {t("doctorChange.selectLabel")}
        </label>
        <GlideSelect
          fullWidth
          size="lg"
          name="requestedDoctorId"
          value={requestedDoctorId}
          onChange={(val) => setRequestedDoctorId(val)}
          disabled={loading}
          placeholder={
            loading
              ? t("doctorChange.loading")
              : t("doctorChange.selectPlaceholder")
          }
          options={[
            {
              value: "",
              label: loading
                ? t("doctorChange.loading")
                : t("doctorChange.selectPlaceholder"),
            },
            ...doctors
              .filter((doc) => !currentDoctorId || doc.id !== currentDoctorId)
              .map((doc) => ({
                value: String(doc.id),
                label: doc.fullName || doc.name || doc.email || doc.id,
              })),
          ]}
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-(--ui-muted-foreground) mb-2">
          {t("doctorChange.reasonLabel")}
        </label>
        <textarea
          name="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground) resize-none"
          rows={3}
          placeholder={t("doctorChange.reasonPlaceholder")}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting}
          isLoading={submitting}
          loadingText={t("doctorChange.sending")}
        >
          <span>{t("doctorChange.submit")}</span>
        </Button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ t, router, pathname }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (
      String(oldPassword || "").trim() &&
      String(newPassword || "").trim() &&
      String(oldPassword || "").trim() === String(newPassword || "").trim()
    ) {
      showError(t("toastPasswordSameAsOld"));
      return;
    }
    if (newPassword.length < 8) {
      showError(t("toastPasswordLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      showError(t("toastPasswordMismatch"));
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/api/patient/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      showSuccess(t("toastPasswordChanged"));
      await apiRequest("/api/auth/logout", { method: "POST" }).catch(() => {});
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      const locale = pathname?.startsWith("/en") ? "en" : "ar";
      const basePrefix = locale === "en" ? "/en" : "/ar";
      router.replace(basePrefix);
    } catch (err) {
      if (err?.code === "same_password" || err?.message === "same_password") {
        showError(t("toastPasswordSameAsOld"));
      } else {
        showError(err?.message || t("toastPasswordChangeFail"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInputGroup
        label={t("field.oldPassword")}
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        show={showOld}
        onToggleShow={() => setShowOld((v) => !v)}
        name="oldPassword"
        autoComplete="current-password"
      />
      <PasswordInputGroup
        label={t("security.newPasswordLabel")}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        show={showNew}
        onToggleShow={() => setShowNew((v) => !v)}
        name="newPassword"
        autoComplete="new-password"
      />
      <PasswordInputGroup
        label={t("security.confirmPasswordLabel")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        show={showConfirm}
        onToggleShow={() => setShowConfirm((v) => !v)}
        name="confirmPassword"
        autoComplete="new-password"
      />
      <div className="pt-2 flex justify-end">
        <Button
          type="submit"
          variant="danger"
          disabled={loading}
          isLoading={loading}
          loadingText={t("saving")}
        >
          <LockIcon /> {t("security.changePasswordButton")}
        </Button>
      </div>
    </form>
  );
}

function PasswordInputGroup({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  type = "password",
  name,
  autoComplete,
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-(--ui-muted-foreground) mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : type}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full px-4 py-3 pr-10 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground)"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-(--ui-muted-foreground) hover:text-(--ui-foreground) transition-colors"
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
