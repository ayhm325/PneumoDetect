"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../../components/ui/ToastProvider";
import {
  FaCalendarAlt,
  FaVideo,
  FaMapMarkerAlt,
  FaClock,
  FaUserMd,
  FaPhone,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import { useTranslations, useLocale } from "next-intl";
import toLatin from "./toLatin";
import { formatArabicDate } from "../../../lib/arabicMonths";
import { Button, Card } from "../../../../src/components/ui";

export default function PatientAppointmentsPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("patient");
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  const basePrefix = locale === "en" ? "/en" : "/ar";

  const [showBookModal, setShowBookModal] = useState(false);

  /* ===================== DATA ===================== */
  const [appointments, setAppointments] = useState([]);

  // booking form state
  const [bookDoctorId, setBookDoctorId] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookType, setBookType] = useState("clinic");
  const [bookReason, setBookReason] = useState("");
  const [bookPhone, setBookPhone] = useState("");
  const [bookLocation, setBookLocation] = useState("");

  const loadAppointments = useCallback(async () => {
    try {
      const res = await fetch("/api/patient/appointments", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        setAppointments([]);
        return;
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.appointments || [];
      // Normalize API shape to the UI shape expected by this page
      const mapped = (list || []).map((a) => {
        const scheduled = a.scheduledAt ? new Date(a.scheduledAt) : null;
        let dateStr = "";
        if (scheduled) {
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
        const timeStr = scheduled
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
            a.phone ||
            "",
          reason: a.reason || "",
          status: a.status || "scheduled",
          raw: a,
        };
      });
      setAppointments(mapped);
    } catch (e) {
      setAppointments([]);
    }
  }, [locale]);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(async () => {
      if (!mounted) return;
      await loadAppointments();
    });
    return () => {
      mounted = false;
    };
  }, [loadAppointments]);

  async function createAppointment(e) {
    e.preventDefault();
    if (
      !bookDoctorId ||
      !bookDate ||
      !bookTime ||
      !bookReason ||
      !bookLocation
    ) {
      showError(t("appointments.toast.fillRequired"));
      return;
    }
    const scheduledAt = new Date(`${bookDate}T${bookTime}`);
    try {
      const res = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          doctorId: bookDoctorId,
          scheduledAt: scheduledAt.toISOString(),
          type: bookType,
          reason: bookReason,
          phone: bookPhone,
          location: bookLocation,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        showError(err || t("appointments.toast.error"));
        return;
      }
      showSuccess(t("appointments.toast.created"));
      setShowBookModal(false);
      setBookDoctorId("");
      setBookDate("");
      setBookTime("");
      setBookType("clinic");
      setBookReason("");
      setBookPhone("");
      setBookLocation("");
      await loadAppointments();
    } catch (err) {
      showError(t("appointments.toast.error"));
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
        return "bg-(--ui-success) text-white font-extrabold shadow ring-2 ring-(--ui-success)/60";
      case "pending":
        return "bg-(--ui-warning) text-white font-extrabold shadow ring-2 ring-(--ui-warning)/60";
      case "cancelled":
        return "bg-(--ui-danger) text-white font-extrabold shadow ring-2 ring-(--ui-danger)/60";
      default:
        return "bg-(--ui-surface-2) text-(--ui-foreground) font-bold ring-2 ring-(--ui-border)";
    }
  };

  /* ===================== ACTIONS ===================== */
  const confirmAppointment = async (id) => {
    try {
      const res = await fetch(`/api/patient/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "confirm" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || t("appointments.toast.error"));
        return;
      }
      showSuccess(t("appointments.toast.confirm"));
      await loadAppointments();
    } catch (e) {
      showError(t("appointments.toast.error"));
    }
  };

  // نافذة سبب الإلغاء
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelId, setCancelId] = useState(null);

  const openCancelModal = (id) => {
    setCancelId(id);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason) {
      showError(t("appointments.form.cancelReasonRequired"));
      return;
    }
    try {
      const res = await fetch(`/api/patient/appointments/${cancelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "cancel", patientReason: cancelReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || t("appointments.toast.error"));
        return;
      }
      showInfo(t("appointments.toast.cancel"));
      setShowCancelModal(false);
      setCancelId(null);
      setCancelReason("");
      await loadAppointments();
    } catch (e) {
      showError(t("appointments.toast.error"));
    }
  };

  const deleteAppointment = async (id) => {
    try {
      const res = await fetch(`/api/patient/appointments/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || t("appointments.toast.error"));
        return;
      }
      showInfo(t("appointments.toast.cancel"));
      await loadAppointments();
    } catch (e) {
      showError(t("appointments.toast.error"));
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <>


      <div className="min-h-screen bg-(--ui-surface) p-6 text-(--ui-foreground)">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("appointments.title")}</h1>
            <p className="text-(--ui-muted-foreground)">
              {t("appointments.subtitle")}
            </p>
          </div>
        </div>

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
              <Card
                key={a.id}
                variant="interactive"
                className="flex flex-col gap-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`px-4 py-1 rounded-full text-base font-bold tracking-wide ${statusClass(a.status)}`}
                  >
                    {t(`appointments.status.${a.status}`)}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-extrabold text-2xl text-(--ui-foreground)">
                      {a.doctorName}
                    </span>
                    <span className="text-sm text-(--ui-muted-foreground) font-medium">
                      {a.specialty}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 text-lg text-(--ui-foreground) items-center mb-2">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-(--ui-info) text-xl" />{" "}
                    <span className="font-bold">{toLatin(a.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-(--ui-warning) text-xl" />{" "}
                    <span className="font-bold">{toLatin(a.time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-(--ui-danger) text-xl" />
                    <span className="font-bold">
                      {a.type === "online"
                        ? t("appointments.type.online")
                        : a.location
                          ? a.location
                          : t("appointments.type.clinic")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-(--ui-info) text-xl" />{" "}
                    <span className="font-mono text-lg">
                      {toLatin(a.phone)}
                    </span>
                  </div>
                </div>
                {a.reason && (
                  <div className="text-base text-(--ui-foreground) mt-1">
                    <span className="font-bold">
                      {t("appointments.form.reason")}
                    </span>
                    : <span className="font-bold">{a.reason}</span>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  {a.status === "confirmed" || a.status === "completed" ? (
                    <span className="bg-(--ui-success) text-white font-extrabold shadow ring-2 ring-(--ui-success)/60 px-6 py-2 rounded-lg flex items-center gap-2 text-lg transition">
                      <FaCheckCircle /> {t("appointments.status.confirmed")}
                    </span>
                  ) : a.status === "cancelled" ? (
                    <span className="bg-(--ui-danger)/12 text-(--ui-danger-foreground) ring-1 ring-inset ring-(--ui-danger)/25 px-6 py-2 rounded-lg flex items-center gap-2 text-lg font-bold shadow-sm transition">
                      <FaTimesCircle /> {t("appointments.status.cancelled")}{" "}
                      {a.raw?.patientReason && (
                        <span className="ml-2 text-base font-normal">
                          - {a.raw.patientReason}
                        </span>
                      )}
                    </span>
                  ) : (
                    <>
                      <Button
                        onClick={() => confirmAppointment(a.id)}
                        fullWidth={false}
                        size="sm"
                        className="px-6"
                      >
                        <FaCheckCircle /> {t("appointments.actions.confirm")}
                      </Button>
                      <Button
                        onClick={() => openCancelModal(a.id)}
                        variant="danger"
                        fullWidth={false}
                        size="sm"
                        className="px-6"
                      >
                        <FaTimesCircle /> {t("appointments.actions.cancel")}
                      </Button>
                    </>
                  )}
                </div>
              </Card>
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
              <Card
                key={a.id}
                variant="interactive"
                className="flex flex-col gap-4 opacity-80"
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`px-4 py-1 rounded-full text-base font-bold tracking-wide ${statusClass(a.status)}`}
                  >
                    {t(`appointments.status.${a.status}`)}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="font-extrabold text-2xl text-(--ui-foreground)">
                      {a.doctorName}
                    </span>
                    <span className="text-sm text-(--ui-muted-foreground) font-medium">
                      {a.specialty}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 text-lg text-(--ui-foreground) items-center mb-2">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-(--ui-info) text-xl" />{" "}
                    <span className="font-bold">{toLatin(a.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-(--ui-warning) text-xl" />{" "}
                    <span className="font-bold">{toLatin(a.time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-(--ui-danger) text-xl" />
                    <span className="font-bold">
                      {a.type === "online"
                        ? t("appointments.type.online")
                        : a.location
                          ? a.location
                          : t("appointments.type.clinic")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-(--ui-info) text-xl" />{" "}
                    <span className="font-mono text-lg">
                      {toLatin(a.phone)}
                    </span>
                  </div>
                </div>
                {a.reason && (
                  <div className="text-base text-(--ui-foreground) mt-1">
                    <span className="font-bold">
                      {t("appointments.form.reason")}
                    </span>
                    : <span className="font-bold">{a.reason}</span>
                  </div>
                )}
                {a.status === "cancelled" && a.raw?.patientReason && (
                  <div className="text-base text-(--ui-danger) mt-1">
                    <span className="font-bold">
                      {t("appointments.form.cancelReasonLabel")}
                    </span>
                    : {a.raw.patientReason}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* نافذة سبب الإلغاء */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md text-(--ui-foreground)">
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
                variant="secondary"
                fullWidth={false}
                size="sm"
                className="px-4"
              >
                {t("appointments.form.cancel")}
              </Button>
              <Button
                type="submit"
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
        <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md text-(--ui-foreground)">
            <form onSubmit={createAppointment}>
            <h3 className="text-lg font-bold mb-4">{t("appointments.new")}</h3>

            <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
              {t("appointments.form.doctorId")}
            </label>
            <input
              value={bookDoctorId}
              onChange={(e) => setBookDoctorId(e.target.value)}
              className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
            />

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
                />
              </div>
            </div>

            <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
              {t("appointments.form.type")}
            </label>
            <select
              value={bookType}
              onChange={(e) => setBookType(e.target.value)}
              className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
            >
              <option value="clinic">{t("appointments.type.clinic")}</option>
              <option value="online">{t("appointments.type.online")}</option>
            </select>

            <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
              {t("appointments.form.reason")}
            </label>
            <input
              value={bookReason}
              onChange={(e) => setBookReason(e.target.value)}
              className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
              required
            />

            <label className="block mb-2 text-sm text-(--ui-muted-foreground)">
              {t("appointments.form.location")}
            </label>
            <input
              value={bookLocation}
              onChange={(e) => setBookLocation(e.target.value)}
              className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
              required
            />

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
                variant="secondary"
                fullWidth={false}
                size="sm"
                className="px-4"
              >
                {t("appointments.form.cancel")}
              </Button>
              <Button
                type="submit"
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
