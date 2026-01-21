// صفحة ملف المريض: تعرض وتسمح بتعديل بيانات المريض الشخصية والطبية
"use client";

// استيراد الأدوات اللازمة من React وNext.js والمكتبات المساعدة
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "../../../components/ui/ToastProvider";
import { useTranslations, useLocale } from "next-intl";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaEye,
  FaEyeSlash,
  FaIdCard,
  FaUserMd,
  FaLock,
  FaSave,
  FaTimes,
  FaEdit,
  FaShieldAlt,
  FaHeart,
  FaCalendar,
} from "react-icons/fa";
import UnifiedCard from "../../../components/ui/UnifiedCard";

// المكون الرئيسي للصفحة
export default function PatientProfilePage() {
  // متغيرات الترجمة واللغة
  const locale = useLocale(); // اللغة الحالية
  const t = useTranslations("profile"); // نصوص صفحة الملف الشخصي
  const patientT = useTranslations("patient"); // نصوص عامة للمريض
  const ui = useTranslations("ui"); // نصوص واجهة المستخدم العامة
  const placeholder = ui("placeholder"); // نص افتراضي للحقول الفارغة
  // أدوات عرض التنبيهات
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  // أدوات التوجيه
  const router = useRouter();
  const pathname = usePathname();

  // متغيرات الحالة:
  // - isEditing: هل المستخدم يعدل البيانات حالياً؟
  // - loading: هل الصفحة في وضع التحميل؟
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false); // عند تحميل البيانات لأول مرة

  // بيانات الملف الشخصي للمريض (تملأ من API)
  const [profileData, setProfileData] = useState({
    id: "", // معرف المريض
    userId: "", // معرف المستخدم المرتبط
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


  // عند تحميل الصفحة: جلب بيانات الملف الشخصي من API وتخزينها في state
  useEffect(() => {
    let mounted = true;
    setLoading(true); // تفعيل مؤشر التحميل
    Promise.resolve().then(async () => {
      try {
        // إرسال طلب لجلب بيانات المريض
        const res = await fetch("/api/patient/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        // تعبئة بيانات الملف الشخصي من الاستجابة
        const p = data.profile || {};
        setProfileData({
          id: p.id || "",
          userId: p.userId || "",
          fullName: p.fullName || "",
          email: p.email || "",
          doctorId: p.doctorId || "",
          doctorName: p.doctor?.fullName || "",
          phone: p.phone || "",
          gender: p.gender || "",
          birthDate: p.birthDate || "",
          bloodType: p.bloodType || "",
          joinDate: p.joinDate || p.createdAt || "",
          lastVisit: p.lastVisit || "",
          status: p.status || "",
          clinicalStatus:
            p.clinicalStatus || p.clinical_status || p.status || "",
          notes: p.notes || "",
          createdAt: p.createdAt || "",
          updatedAt: p.updatedAt || "",
        });
      } catch (err) {
        // في حال فشل الجلب، طباعة الخطأ
        console.error("Failed to load profile", err);
      } finally {
        // إيقاف مؤشر التحميل
        if (mounted) setLoading(false);
      }
    });
    // تنظيف عند إلغاء تحميل الصفحة
    return () => {
      mounted = false;
    };
  }, []);

  // دالة لتحديث قيمة أي حقل في بيانات الملف الشخصي عند التعديل
  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // دالة لحفظ التعديلات على بيانات الملف الشخصي (ترسلها إلى API)
  const handleSave = async () => {
    setLoading(true);
    try {
      // إرسال البيانات المعدلة إلى الخادم
      const res = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) {
        showError(t("toast.saveError"));
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProfileData((prev) => ({ ...prev, ...data.profile }));
      setIsEditing(false);
      showSuccess(t("toastSaveSuccess"));
    } catch (err) {
      showError(t("toast.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload to discard changes
    (async () => {
      try {
        const res = await fetch("/api/patient/profile");
        if (!res.ok) return;
        const data = await res.json();
        const p = data.profile || {};
        setProfileData({
          id: p.id || "",
          userId: p.userId || "",
          fullName: p.fullName || "",
          email: p.email || "",
          doctorId: p.doctorId || "",
          doctorName: p.doctor?.fullName || "",
          phone: p.phone || "",
          gender: p.gender || "",
          birthDate: p.birthDate || "",
          bloodType: p.bloodType || "",
          joinDate: p.joinDate || p.createdAt || "",
          lastVisit: p.lastVisit || "",
          status: p.status || "",
          clinicalStatus:
            p.clinicalStatus || p.clinical_status || p.status || "",
          notes: p.notes || "",
          createdAt: p.createdAt || "",
          updatedAt: p.updatedAt || "",
        });
      } catch {}
    })();
    showInfo(t("toastCancelEdit"));
  };

  if (loading && !profileData.id) {
    return (
      <div className="min-h-screen bg-(--ui-surface) flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-(--ui-ring)"></div>
      </div>
    );
  }

  return (
    <>

      <div className="min-h-screen bg-(--ui-surface) text-(--ui-foreground) font-sans selection:bg-(--ui-ring) selection:text-white relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-125 h-125 bg-(--ui-info)/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-100 h-100 bg-(--ui-success)/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto p-6 md:p-10 space-y-8">
          {/* Header */}
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
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 btn-gradient rounded-xl shadow-lg transition-all hover:-translate-y-1 font-medium"
                >
                  <FaEdit /> {t("btnEdit")}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-(--ui-surface) text-(--ui-muted-foreground) border border-(--ui-border) rounded-xl hover:bg-(--ui-surface-2)/60 transition-all font-medium"
                  >
                    <FaTimes /> {t("btnCancel")}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-(--ui-success) hover:bg-(--ui-success)/90 text-(--ui-success-foreground) rounded-xl shadow-lg transition-all hover:-translate-y-1 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaSave /> {loading ? t("saving") : t("btnSave")}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Card */}
          <UnifiedCard className="backdrop-blur-xl rounded-4xl p-8 shadow-(--shadow-soft) border border-(--ui-border)" glass>
            {/* Avatar & Identity */}
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 border-b border-(--ui-border) pb-8">
              <div className="relative shrink-0">
                <div className="w-32 h-32 rounded-full bg-(--ui-surface-2) flex items-center justify-center text-5xl text-(--ui-info) shadow-inner border-4 border-(--ui-border)">
                  <FaUser />
                </div>
                {profileData.status === "active" && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-(--ui-success) border-4 border-(--ui-surface) rounded-full"></div>
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
                      <FaEnvelope className="text-(--ui-info)" />{" "}
                      {t("field.email")}
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
                      <FaPhone className="text-(--ui-info)" />{" "}
                      {t("field.phone")}
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
                    <FaIdCard /> {t("field.patientNumber")}:{" "}
                    {profileData.id || placeholder}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaIdCard /> {t("userId")}:{" "}
                    {profileData.userId || placeholder}
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
                      profileData.birthDate
                        ? profileData.birthDate.slice(0, 10)
                        : ""
                    }
                    onChange={handleFieldChange}
                    className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground)"
                  />
                ) : (
                  <div className="text-(--ui-foreground) font-medium">
                    {profileData.birthDate
                      ? new Date(profileData.birthDate).toLocaleDateString(
                          locale,
                        )
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
                  <select
                    name="gender"
                    value={profileData.gender || ""}
                    onChange={handleFieldChange}
                    className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground) appearance-none"
                  >
                    <option value="">{placeholder}</option>
                    <option value="male">{t("field.gender.male")}</option>
                    <option value="female">{t("field.gender.female")}</option>
                  </select>
                ) : (
                  <div className="text-(--ui-foreground) font-medium">
                    {profileData.gender === "male" && t("field.gender.male")}
                    {profileData.gender === "female" &&
                      t("field.gender.female")}
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
                      <FaUserMd />
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
                      <FaCalendar />
                    </div>
                    <div>
                      <div className="text-xs text-(--ui-muted-foreground) uppercase font-bold">
                        {t("joinDate")}
                      </div>
                      <div className="text-sm font-bold text-(--ui-foreground)">
                        {new Date(profileData.joinDate).toLocaleDateString(
                          locale,
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {profileData.clinicalStatus && (
                  <div className="flex items-center gap-3 p-3 bg-(--ui-info-bg) rounded-xl border border-(--ui-info-border) w-full sm:w-auto max-w-full">
                    <div className="p-2 bg-(--ui-surface) border border-(--ui-border) rounded-lg text-(--ui-info) shadow-sm">
                      <FaHeart />
                    </div>
                    <div>
                      <div className="text-xs text-(--ui-muted-foreground) uppercase font-bold">
                        {t("status")}
                      </div>
                      <div className="text-sm font-bold text-(--ui-foreground)">
                        {patientT(
                          `clinicalStatuses.${profileData.clinicalStatus}`,
                        ) || profileData.clinicalStatus}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </UnifiedCard>

          {/* Doctor Change Request Card */}
          <UnifiedCard className="backdrop-blur-xl rounded-4xl p-8 shadow-(--shadow-soft) border border-(--ui-border) overflow-hidden relative" glass>
            <div className="absolute top-0 right-0 w-32 h-32 bg-(--ui-info)/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-(--ui-info)/10 text-(--ui-info) rounded-xl border border-(--ui-info-border)">
                  <FaUserMd size={20} />
                </div>
                <h2 className="text-xl font-bold text-(--ui-foreground)">
                  {t("doctorChange.title")}
                </h2>
              </div>
              <DoctorChangeRequestForm
                // showToast removed, use showSuccess/showError/showInfo directly where needed
                t={t}
                currentDoctorId={profileData.doctorId}
              />
            </div>
          </UnifiedCard>

          {/* Security Card */}
          <UnifiedCard className="backdrop-blur-xl rounded-4xl p-8 shadow-(--shadow-soft) border border-(--ui-border) overflow-hidden relative" glass>
            <div className="absolute top-0 left-0 w-32 h-32 bg-(--ui-danger)/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-(--ui-danger)/10 text-(--ui-danger) rounded-xl border border-(--ui-danger-border)">
                  <FaShieldAlt size={20} />
                </div>
                <h2 className="text-xl font-bold text-(--ui-foreground)">
                  {t("security.changePasswordTitle")}
                </h2>
              </div>
              <ChangePasswordForm
                // showToast removed, use showSuccess/showError/showInfo directly where needed
                t={t}
                router={router}
                pathname={pathname}
              />
            </div>
          </UnifiedCard>
        </div>
      </div>
    </>
  );
}

// --- Styled Sub-Components ---

function DoctorChangeRequestForm({ t, currentDoctorId }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/doctor/list");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (mounted) setDoctors(data.doctors || []);
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
    setSubmitting(true);
    const form = e.target;
    const requestedDoctorId = form.requestedDoctorId.value;
    const reason = form.reason.value;

    if (!requestedDoctorId) {
      showError(t("toast.doctorChangeSelect"));
      setSubmitting(false);
      return;
    }

    if (currentDoctorId && requestedDoctorId === currentDoctorId) {
      showError(t("toast.doctorChangeSameDoctor"));
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/doctor-change-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ requestedDoctorId, reason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const serverMsg = (err?.error || "").toString();
        const sameDoctor =
          serverMsg === "Requested doctor is the same as current doctor";
        const missingDoctor = serverMsg === "Missing requestedDoctorId";
        if (sameDoctor) {
          showError(t("toast.doctorChangeSameDoctor"));
        } else if (missingDoctor) {
          showError(t("toast.doctorChangeSelect"));
        } else {
          showError(serverMsg || t("toast.doctorChangeFail"));
        }
        setSubmitting(false);
        return;
      }
      showSuccess(t("toast.doctorChangeSent"));
      form.reset();
    } catch (err) {
      showError(t("toast.doctorChangeNetwork"));
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
        <select
          name="requestedDoctorId"
          className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground) appearance-none cursor-pointer"
          disabled={loading}
        >
          <option value="">
            {loading
              ? t("doctorChange.loading")
              : t("doctorChange.selectPlaceholder")}
          </option>
          {!loading && doctors.length === 0 && (
            <option disabled>{t("doctorChange.noDoctors")}</option>
          )}
          {doctors
            .filter((doc) => !currentDoctorId || doc.id !== currentDoctorId)
            .map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.fullName || doc.name || doc.email || doc.id}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-bold text-(--ui-muted-foreground) mb-2">
          {t("doctorChange.reasonLabel")}
        </label>
        <textarea
          name="reason"
          className="w-full px-4 py-3 bg-(--ui-surface) border border-(--ui-border) rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring) outline-none transition-all text-(--ui-foreground) resize-none"
          rows={3}
          placeholder={t("doctorChange.reasonPlaceholder")}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="btn-gradient flex items-center gap-2 px-6 py-3 text-white rounded-xl shadow-lg transition-all hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            t("doctorChange.sending")
          ) : (
            <span>{t("doctorChange.submit")}</span>
          )}
        </button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ showSuccess, showError, t, router, pathname }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const res = await fetch("/api/patient/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err?.error === "same_password") {
          showError(t("toastPasswordSameAsOld"));
        } else {
          showError(err?.error || t("toastPasswordChangeFail"));
        }
        setLoading(false);
        return;
      }
      showSuccess(t("toastPasswordChanged"));

      // Logout Logic
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        }).catch(() => {});
      } catch {}
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      const locale = pathname?.startsWith("/en") ? "en" : "ar";
      const basePrefix = locale === "en" ? "/en" : "/ar";
      router.replace(basePrefix);
    } catch (err) {
      showError(t("toastPasswordChangeNetwork"));
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
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-(--ui-danger) hover:bg-(--ui-danger)/90 text-(--ui-danger-foreground) rounded-xl shadow-lg transition-all hover:-translate-y-0.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaLock />{" "}
          {loading ? t("saving") : t("security.changePasswordButton")}
        </button>
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
          {show ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );
}
