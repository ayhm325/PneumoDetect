"use client";

import { BriefcaseMedicalIcon, CalendarDaysIcon, CircleCheckIcon, CircleXIcon, ClockIcon, MapPinIcon, PhoneIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { useTranslations, useLocale } from "@/lib/compat/intl";
import toLatin from "./toLatin";
import { formatArabicDate } from "@/lib/arabicMonths";
import { apiRequest } from "@/lib/apiClient";
import { Button, Card, GlideSelect, ProfileMediaCard } from "@/components/ui";

export default function PatientAppointmentsPage() {
  const locale = useLocale();
  const t = useTranslations("patient");
  const { showSuccess, showError, showInfo } = useToast();

  const [showBookModal, setShowBookModal] = useState(false);

  /* ===================== DATA ===================== */
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // booking form state
  const [bookDoctorId, setBookDoctorId] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookType, setBookType] = useState("clinic");
  const [bookReason, setBookReason] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [bookLocation, setBookLocation] = useState("");
  const [submittingBook, setSubmittingBook] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadDoctorsAndProfile = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const [docsRes, profileRes] = await Promise.all([
        apiRequest("/api/doctor/list").catch(() => null),
        apiRequest("/api/patient/profile").catch(() => null),
      ]);
      const docsList = Array.isArray(docsRes?.doctors) ? docsRes.doctors : [];
      setDoctors(docsList);
      const p = profileRes?.profile;
      if (p) {
        if (p.doctorId) setBookDoctorId((prev) => prev || String(p.doctorId));
        if (p.phone) setBookPhone((prev) => prev || String(p.phone));
      }
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiRequest("/api/patient/appointments");
      const list = Array.isArray(json) ? json : json?.appointments || [];
      const mapped = (list || []).map((a) => {
        const scheduled = a.scheduledAt ? new Date(a.scheduledAt) : null;
        let dateStr = "";
        if (scheduled && !Number.isNaN(scheduled.getTime())) {
          if (locale === "ar") {
            dateStr = formatArabicDate(scheduled);
          } else {
            dateStr = scheduled.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
          }
        }
        const timeStr =
          scheduled && !Number.isNaN(scheduled.getTime())
            ? scheduled.toLocaleTimeString(locale === "en" ? "en-US" : "ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
        return {
          id: a.id,
          doctorName:
            typeof a.doctor === "string"
              ? a.doctor
              : a.doctor?.name ||
                a.doctorName ||
                a.doctor?.user?.fullName ||
                "",
          specialty: a.specialty || a.doctor?.specialty || "",
          date: dateStr,
          time: timeStr,
          type: a.type || a.raw?.type || "clinic",
          location: a.location || "",
          phone:
            (typeof a.doctor === "object" && a.doctor
              ? a.doctor.phone || (a.doctor.user && a.doctor.user.phone)
              : null) ||
            a.patient?.phone ||
            a.phone ||
            "",
          reason: a.reason || "",
          patientReason: a.patientReason || "",
          status: a.status || "scheduled",
          raw: a,
        };
      });
      setAppointments(mapped);
    } catch (err) {
      setError(err?.message || t("appointments.toast.error"));
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    loadAppointments();
    loadDoctorsAndProfile();
  }, [loadAppointments, loadDoctorsAndProfile]);

  async function createAppointment(e) {
    e.preventDefault();
    if (submittingBook) return;
    if (
      !bookDoctorId ||
      !bookDate ||
      !bookTime ||
      !bookReason.trim() ||
      (bookType === "clinic" && !bookLocation.trim())
    ) {
      showError(t("appointments.toast.fillRequired"));
      return;
    }
    const scheduledAt = new Date(`${bookDate}T${bookTime}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      showError(t("appointments.toast.error"));
      return;
    }
    setSubmittingBook(true);
    try {
      await apiRequest("/api/patient/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: bookDoctorId,
          scheduledAt: scheduledAt.toISOString(),
          type: bookType,
          reason: bookReason.trim(),
          phone: bookPhone.trim() || undefined,
          location:
            bookType === "online"
              ? bookLocation.trim() || "عن بعد"
              : bookLocation.trim(),
        }),
      });
      showSuccess(t("appointments.toast.created"));
      setShowBookModal(false);
      setBookDate("");
      setBookTime("");
      setBookType("clinic");
      setBookReason("");
      setBookLocation("");
      await loadAppointments();
    } catch (err) {
      showError(err?.message || t("appointments.toast.error"));
    } finally {
      setSubmittingBook(false);
    }
  }

  /* ===================== GROUPING ===================== */
  const upcoming = appointments.filter(
    (a) =>
      new Date(a.raw?.scheduledAt || a.date) >= new Date() &&
      a.status !== "cancelled",
  );

  const past = appointments.filter(
    (a) =>
      new Date(a.raw?.scheduledAt || a.date) < new Date() ||
      a.status === "cancelled",
  );

  const statusClass = (status) => {
    switch (status) {
      case "confirmed":
      case "completed":
        return "bg-(--ui-success) text-[var(--pd-on-accent)] font-extrabold shadow ring-2 ring-(--ui-success)/60";
      case "scheduled":
      case "pending":
        return "bg-(--ui-warning) text-[var(--pd-on-accent)] font-extrabold shadow ring-2 ring-(--ui-warning)/60";
      case "cancelled":
        return "bg-(--ui-danger) text-[var(--pd-on-accent)] font-extrabold shadow ring-2 ring-(--ui-danger)/60";
      default:
        return "bg-(--ui-surface-2) text-(--ui-foreground) font-bold ring-2 ring-(--ui-border)";
    }
  };

  /* ===================== ACTIONS ===================== */
  const confirmAppointment = async (id) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await apiRequest(`/api/patient/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "confirm" }),
      });
      showSuccess(t("appointments.toast.confirm"));
      await loadAppointments();
    } catch (err) {
      showError(err?.message || t("appointments.toast.error"));
    } finally {
      setActionLoadingId(null);
    }
  };

  // نافذة سبب الإلغاء
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelId, setCancelId] = useState(null);
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const openCancelModal = (id) => {
    setCancelId(id);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (submittingCancel) return;
    if (!cancelReason.trim()) {
      showError(t("appointments.form.cancelReasonRequired"));
      return;
    }
    setSubmittingCancel(true);
    try {
      await apiRequest(`/api/patient/appointments/${cancelId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action: "cancel",
          patientReason: cancelReason.trim(),
        }),
      });
      showInfo(t("appointments.toast.cancel"));
      setShowCancelModal(false);
      setCancelId(null);
      setCancelReason("");
      await loadAppointments();
    } catch (err) {
      showError(err?.message || t("appointments.toast.error"));
    } finally {
      setSubmittingCancel(false);
    }
  };

  const deleteAppointment = async (id) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await apiRequest(`/api/patient/appointments/${id}`, {
        method: "DELETE",
      });
      showInfo(t("appointments.toast.cancel"));
      await loadAppointments();
    } catch (err) {
      showError(err?.message || t("appointments.toast.error"));
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen bg-(--ui-surface) p-6 text-(--ui-foreground)">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("appointments.title")}</h1>
            <p className="text-(--ui-muted-foreground)">
              {t("appointments.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => setShowBookModal(true)}
            size="sm"
            className="flex items-center gap-2 px-4"
          >
            <PlusIcon /> {t("appointments.new")}
          </Button>
        </div>

        {error && (
          <Card variant="feature" className="mb-6 border-(--ui-danger-border) bg-(--ui-danger-bg) p-4 text-(--ui-danger)">
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <Button size="sm" variant="secondary" onClick={loadAppointments}>
                {locale === "ar" ? "إعادة المحاولة" : "Retry"}
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <Card variant="clinical" className="p-8 text-center text-(--ui-muted-foreground)">
            {locale === "ar" ? "جاري تحميل المواعيد..." : "Loading appointments..."}
          </Card>
        ) : (
          <>
            {/* Upcoming */}
            <h2 className="text-2xl font-bold mb-4">
              {t("appointments.upcoming")}
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-(--ui-muted-foreground)">
                {t("appointments.noUpcoming")}
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {upcoming.map((a) => (
                  <ProfileMediaCard
                    key={a.id}
                    isAvatar
                    mediaNode={<BriefcaseMedicalIcon className="text-xl" />}
                    title={a.doctorName}
                    subtitle={a.specialty}
                    badge={
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${statusClass(a.status)}`}
                      >
                        {t(`appointments.status.${a.status}`)}
                      </span>
                    }
                    actions={
                      a.status === "confirmed" || a.status === "completed" ? (
                        <span className="bg-(--ui-success-bg) text-(--ui-success) border border-(--ui-success-border) font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs">
                          <CircleCheckIcon /> {t("appointments.status.confirmed")}
                        </span>
                      ) : a.status === "cancelled" ? (
                        <span className="bg-(--ui-danger-bg) text-(--ui-danger) border border-(--ui-danger-border) px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold">
                          <CircleXIcon /> {t("appointments.status.cancelled")}{" "}
                          {(a.patientReason || a.raw?.patientReason) && (
                            <span className="ms-1 font-normal">
                              - {a.patientReason || a.raw.patientReason}
                            </span>
                          )}
                        </span>
                      ) : (
                        <>
                          <Button
                            onClick={() => confirmAppointment(a.id)}
                            disabled={actionLoadingId === a.id}
                            isLoading={actionLoadingId === a.id}
                            fullWidth={false}
                            size="sm"
                            className="px-5"
                          >
                            <CircleCheckIcon /> {t("appointments.actions.confirm")}
                          </Button>
                          <Button
                            onClick={() => openCancelModal(a.id)}
                            disabled={actionLoadingId === a.id}
                            variant="danger"
                            fullWidth={false}
                            size="sm"
                            className="px-5"
                          >
                            <CircleXIcon /> {t("appointments.actions.cancel")}
                          </Button>
                        </>
                      )
                    }
                  >
                    <div className="flex flex-wrap gap-4 text-xs text-(--ui-foreground) items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="text-(--ui-info)" />
                        <span className="font-semibold">{toLatin(a.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="text-(--ui-warning)" />
                        <span className="font-semibold">{toLatin(a.time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="text-(--ui-danger)" />
                        <span className="font-medium">
                          {a.type === "online"
                            ? t("appointments.type.online")
                            : a.location
                              ? a.location
                              : t("appointments.type.clinic")}
                        </span>
                      </div>
                      {a.phone && (
                        <div className="flex items-center gap-1.5">
                          <PhoneIcon className="text-(--ui-info)" />
                          <span className="font-mono">{toLatin(a.phone)}</span>
                        </div>
                      )}
                    </div>
                    {a.reason && (
                      <div className="text-xs text-(--ui-foreground) mt-1">
                        <span className="font-semibold text-(--ui-muted-foreground)">
                          {t("appointments.form.reason")}:
                        </span>{" "}
                        <span className="font-medium">{a.reason}</span>
                      </div>
                    )}
                  </ProfileMediaCard>
                ))}
              </div>
            )}

            {/* Past/Cancelled */}
            <h2 className="text-2xl font-bold mt-10 mb-4">
              {t("appointments.pastOrCancelled")}
            </h2>
            {past.length === 0 ? (
              <p className="text-(--ui-muted-foreground)">
                {t("appointments.noPastOrCancelled")}
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {past.map((a) => (
                  <ProfileMediaCard
                    key={a.id}
                    isAvatar
                    mediaNode={<BriefcaseMedicalIcon className="text-xl" />}
                    title={a.doctorName}
                    subtitle={a.specialty}
                    className="opacity-85"
                    badge={
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${statusClass(a.status)}`}
                      >
                        {t(`appointments.status.${a.status}`)}
                      </span>
                    }
                    actions={
                      <Button
                        onClick={() => deleteAppointment(a.id)}
                        disabled={actionLoadingId === a.id}
                        variant="ghost"
                        size="sm"
                        className="text-(--ui-danger)"
                      >
                        <Trash2Icon />
                      </Button>
                    }
                  >
                    <div className="flex flex-wrap gap-4 text-xs text-(--ui-foreground) items-center mb-2">
                      <div className="flex items-center gap-1.5">
                        <CalendarDaysIcon className="text-(--ui-info)" />
                        <span className="font-semibold">{toLatin(a.date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="text-(--ui-warning)" />
                        <span className="font-semibold">{toLatin(a.time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="text-(--ui-danger)" />
                        <span className="font-medium">
                          {a.type === "online"
                            ? t("appointments.type.online")
                            : a.location
                              ? a.location
                              : t("appointments.type.clinic")}
                        </span>
                      </div>
                      {a.phone && (
                        <div className="flex items-center gap-1.5">
                          <PhoneIcon className="text-(--ui-info)" />
                          <span className="font-mono">{toLatin(a.phone)}</span>
                        </div>
                      )}
                    </div>
                    {a.reason && (
                      <div className="text-xs text-(--ui-foreground) mt-1">
                        <span className="font-semibold text-(--ui-muted-foreground)">
                          {t("appointments.form.reason")}:
                        </span>{" "}
                        <span className="font-medium">{a.reason}</span>
                      </div>
                    )}
                    {a.status === "cancelled" &&
                      (a.patientReason || a.raw?.patientReason) && (
                        <div className="text-xs text-(--ui-danger) mt-1">
                          <span className="font-semibold">
                            {t("appointments.form.cancelReasonLabel")}:
                          </span>{" "}
                          {a.patientReason || a.raw.patientReason}
                        </div>
                      )}
                  </ProfileMediaCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* نافذة سبب الإلغاء */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
          <Card variant="utility" className="w-full max-w-md text-(--ui-foreground)">
            <form onSubmit={handleCancelSubmit}>
              <h3 className="text-lg font-bold mb-4">
                {t("appointments.form.cancelReasonTitle")}
              </h3>
              <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
                {t("appointments.form.cancelReasonLabel")}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                required
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  disabled={submittingCancel}
                  variant="secondary"
                  fullWidth={false}
                  size="sm"
                  className="px-4"
                >
                  {t("appointments.form.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCancel}
                  isLoading={submittingCancel}
                  variant="danger"
                  fullWidth={false}
                  size="sm"
                  className="px-4"
                >
                  {t("appointments.form.submit")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showBookModal && (
        <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
          <Card variant="editorial" className="w-full max-w-md text-(--ui-foreground)">
            <form onSubmit={createAppointment}>
              <h3 className="text-lg font-bold mb-4">{t("appointments.new")}</h3>

              <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
                {t("appointments.form.doctorId")}
              </label>
              <div className="mb-3">
                <GlideSelect
                  fullWidth
                  value={bookDoctorId}
                  onChange={(val) => setBookDoctorId(val)}
                  disabled={doctorsLoading}
                  placeholder={
                    doctorsLoading
                      ? locale === "ar"
                        ? "جاري تحميل الأطباء..."
                        : "Loading doctors..."
                      : locale === "ar"
                        ? "اختر الطبيب"
                        : "Select doctor"
                  }
                  options={[
                    {
                      value: "",
                      label:
                        locale === "ar" ? "— اختر طبيباً —" : "— Select doctor —",
                    },
                    ...doctors.map((d) => ({
                      value: String(d.id),
                      label: d.fullName || d.name || d.email || d.id,
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
                    {t("appointments.form.date")}
                  </label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
                    {t("appointments.form.time")}
                  </label>
                  <input
                    type="time"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                    required
                  />
                </div>
              </div>

              <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
                {t("appointments.form.type")}
              </label>
              <div className="mb-3">
                <GlideSelect
                  fullWidth
                  value={bookType}
                  onChange={(val) => setBookType(val)}
                  options={[
                    { value: "clinic", label: t("appointments.type.clinic") },
                    { value: "online", label: t("appointments.type.online") },
                  ]}
                />
              </div>

              <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
                {t("appointments.form.reason")}
              </label>
              <input
                value={bookReason}
                onChange={(e) => setBookReason(e.target.value)}
                className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                required
              />

              {bookType === "clinic" && (
                <>
                  <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
                    {t("appointments.form.location")}
                  </label>
                  <input
                    value={bookLocation}
                    onChange={(e) => setBookLocation(e.target.value)}
                    className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                    required
                  />
                </>
              )}

              <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
                {t("appointments.form.phone")}
              </label>
              <input
                value={bookPhone}
                onChange={(e) => setBookPhone(e.target.value)}
                className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  disabled={submittingBook}
                  variant="secondary"
                  fullWidth={false}
                  size="sm"
                  className="px-4"
                >
                  {t("appointments.form.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submittingBook}
                  isLoading={submittingBook}
                  fullWidth={false}
                  size="sm"
                  className="px-4"
                >
                  {t("appointments.form.submit")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
