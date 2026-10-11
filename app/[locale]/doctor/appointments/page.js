"use client";

import DoctorLayout from "../DoctorLayout";
import { useToast } from "../../../components/ui/ToastProvider";
import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaPlus,
  FaFilter,
  FaSearch,
  FaPhone,
  FaVideo,
  FaMapMarkerAlt,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import { formatDateTimeForLocale } from "../../../../lib/notifications";
import { useLocale, useTranslations } from "next-intl";
import { Button, Card } from "../../../../src/components/ui";

export default function DoctorAppointmentsPage() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();
  const locale = useLocale();
  const t = useTranslations("doctorAppointments");
  const ui = useTranslations("ui");

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // list or calendar
  const [showAddModal, setShowAddModal] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // booking form state for doctor creating appointments
  const [bookPatientId, setBookPatientId] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookType, setBookType] = useState("clinic");
  const [bookReason, setBookReason] = useState("");

  useEffect(() => {
    // use reusable loader
    fetchAppointments();
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, locale]);

  async function fetchPatients() {
    setPatientsLoading(true);
    try {
      const res = await fetch("/api/doctor/patients");
      if (!res.ok) throw new Error(t("errors.fetchPatientsFailed"));
      const data = await res.json();
      // patients returned as array of patient records
      const mapped = (data || []).map((p) => ({
        id: p.id,
        fullName: p.fullName || p.user?.fullName || p.email,
        phone: p.phone || "",
      }));
      setPatients(mapped);
    } catch (err) {
      // ignore silently
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch("/api/doctor/appointments");
      if (!res.ok) throw new Error(t("errors.fetchAppointmentsFailed"));
      const data = await res.json();
      const mapped = (data.appointments || []).map((a) => ({
        id: a.id,
        patientName: a.patient?.name || ui("placeholder"),
        date: a.scheduledAt,
        // Modified: Use "ar-SY" for Arabic text (AM/PM -> ص/م) and numberingSystem: 'latn' for English numbers
        time: a.scheduledAt
          ? new Date(a.scheduledAt).toLocaleTimeString("ar-SY", {
              hour: "2-digit",
              minute: "2-digit",
              numberingSystem: "latn",
            })
          : ui("placeholder"),
        type: a.type || "clinic",
        status: a.status || "pending",
        phone: a.doctor?.phone || a.patient?.phone || ui("placeholder"),
        reason: a.reason || ui("placeholder"),
        patientReason: a.patientReason || "",
        location:
          a.type === "online"
            ? a.location || t("types.online")
            : a.location || t("types.clinic"),
      }));
      setAppointments(mapped);
      setLoading(false);
    } catch (err) {
      setError(err?.message || t("errors.fetchAppointmentsFailed"));
      setLoading(false);
    }
  }

  async function createAppointment(e) {
    e.preventDefault();
    if (!bookPatientId || !bookDate || !bookTime) {
      showError(t("toast.fillRequired"));
      return;
    }
    const scheduledAt = new Date(`${bookDate}T${bookTime}`);
    try {
      const res = await fetch("/api/doctor/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          patientId: bookPatientId,
          scheduledAt: scheduledAt.toISOString(),
          type: bookType,
          reason: bookReason,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || t("toast.error"));
        return;
      }
      showSuccess(t("toast.created"));
      setShowAddModal(false);
      setBookPatientId("");
      setBookDate("");
      setBookTime("");
      setBookType("clinic");
      setBookReason("");
      await fetchAppointments();
    } catch (err) {
      showError(t("toast.error"));
    }
  }

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(
      (a) => a.status === "confirmed" || a.status === "completed",
    ).length,
    pending: appointments.filter(
      (a) => a.status === "pending" || a.status === "scheduled" || !a.status,
    ).length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const filteredAppointments = appointments
    .filter((apt) => {
      if (filter === "all") return true;
      if (filter === "confirmed")
        return apt.status === "confirmed" || apt.status === "completed";
      return apt.status === filter;
    })
    .filter((apt) => {
      if (!searchQuery) return true;
      return (
        (apt.patientName || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (apt.reason || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  const handleConfirm = (id) => {
    setAppointments(
      appointments.map((apt) =>
        apt.id === id ? { ...apt, status: "confirmed" } : apt,
      ),
    );
    showSuccess(t("toast.confirm"));
  };

  const handleCancel = (id) => {
    setAppointments(
      appointments.map((apt) =>
        apt.id === id ? { ...apt, status: "cancelled" } : apt,
      ),
    );
    showInfo(t("toast.cancel"));
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/doctor/appointments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.error || t("toast.error"));
        return;
      }
      setAppointments(appointments.filter((apt) => apt.id !== id));
      showSuccess(t("toast.delete"));
    } catch (err) {
      showError(t("toast.error"));
    }
  };

  const getStatusBadge = (status) => {
    let label,
      color,
      extra = "";
    if (status === "confirmed" || status === "completed") {
      label = t("statuses.confirmed");
      color = "bg-(--ui-success) text-white border-(--ui-success-border)";
      extra = "shadow-lg animate-pulse font-bold px-4 py-1 text-base";
    } else if (status === "pending") {
      label = t("statuses.pending");
      color =
        "bg-(--ui-warning) text-(--ui-warning-foreground) border-(--ui-warning-border)";
      extra = "shadow-lg font-bold px-4 py-1 text-base";
    } else if (status === "cancelled") {
      label = t("statuses.cancelled");
      color =
        "bg-(--ui-danger) text-(--ui-danger-foreground) border-(--ui-danger-border)";
      extra = "shadow-lg font-bold px-4 py-1 text-base";
    } else {
      label = t("statuses.pending");
      color =
        "bg-(--ui-surface-2)/60 text-(--ui-muted-foreground) border-(--ui-border)";
      extra = "font-bold px-4 py-1 text-base";
    }
    return (
      <span className={`rounded-full border ${color} ${extra}`}>{label}</span>
    );
  };

  const getStatusIcon = (status) => {
    if (status === "confirmed" || status === "completed")
      return <FaCheckCircle className="text-(--ui-success)" />;
    if (status === "pending")
      return <FaHourglassHalf className="text-(--ui-warning)" />;
    return <FaTimesCircle className="text-(--ui-danger)" />;
  };

  if (loading) {
    return (
      <DoctorLayout>
        {/* ToastContainer removed: ToastProvider handles container globally */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-(--ui-muted-foreground)">
            {t("loading")}
          </div>
        </div>
      </DoctorLayout>
    );
  }

  if (error) {
    return (
      <DoctorLayout>
        {/* ToastContainer removed: ToastProvider handles container globally */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-(--ui-danger)">
            {t("error")} {error}
          </div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      {/* ToastContainer removed: ToastProvider handles container globally */}
      <div className="min-h-screen bg-(--ui-surface-2) p-6 text-(--ui-foreground)">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-(--ui-foreground) flex items-center gap-3">
                <FaCalendarAlt className="text-(--ui-info)" />
                {t("title")}
              </h1>
              <p className="mt-2 text-(--ui-muted-foreground)">
                {t("subtitle")}
              </p>
            </div>

            <Button
              onClick={() => {
                setShowAddModal(true);
                showInfo(t("toast.addSoon"));
              }}
              fullWidth={false}
              size="sm"
              className="flex items-center gap-2 px-4"
            >
              <FaPlus />
              {t("addButton")}
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.total")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-foreground)">
                    {stats.total}
                  </p>
                </div>
                <FaCalendarAlt className="text-3xl text-(--ui-info)" />
              </div>
            </Card>

            <Card size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.confirmed")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-success)">
                    {stats.confirmed}
                  </p>
                </div>
                <FaCheckCircle className="text-3xl text-(--ui-success)" />
              </div>
            </Card>

            <Card size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.pending")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-warning)">
                    {stats.pending}
                  </p>
                </div>
                <FaHourglassHalf className="text-3xl text-(--ui-warning)" />
              </div>
            </Card>

            <Card size="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-(--ui-muted-foreground)">
                    {t("stats.cancelled")}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-(--ui-danger)">
                    {stats.cancelled}
                  </p>
                </div>
                <FaTimesCircle className="text-3xl text-(--ui-danger)" />
              </div>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-62.5">
                <div className="relative">
                  <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-(--ui-muted-foreground)" />
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-(--ui-border) bg-(--ui-surface) py-2 pr-10 pl-4 text-sm text-(--ui-foreground) placeholder:text-(--ui-muted-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <FaFilter className="text-(--ui-muted-foreground)" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-lg border border-(--ui-border) bg-(--ui-surface) px-4 py-2 text-sm font-medium text-(--ui-foreground) focus:border-(--ui-ring) focus:outline-none focus:ring-2 focus:ring-(--ui-ring)/20"
                >
                  <option value="all">{t("filters.all")}</option>
                  <option value="confirmed">{t("filters.confirmed")}</option>
                  <option value="pending">{t("filters.pending")}</option>
                  <option value="cancelled">{t("filters.cancelled")}</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Appointments List */}
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <Card className="p-12 text-center">
                <FaCalendarAlt className="mx-auto mb-4 text-5xl text-(--ui-muted-foreground)" />
                <p className="text-lg text-(--ui-muted-foreground)">
                  {t("emptyState")}
                </p>
              </Card>
            ) : (
              filteredAppointments.map((apt) => (
                <Card
                  key={apt.id}
                  variant="interactive"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          apt.status === "confirmed"
                            ? "bg-(--ui-success-bg)"
                            : apt.status === "pending"
                              ? "bg-(--ui-warning-bg)"
                              : "bg-(--ui-danger-bg)"
                        }`}
                      >
                        {getStatusIcon(apt.status)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-(--ui-foreground)">
                            {apt.patientName}
                          </h3>
                          {getStatusBadge(apt.status)}
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-(--ui-muted-foreground)">
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-(--ui-info)" />
                            {/* Modified: Use direct toLocaleString with "ar-SY" for Arabic text and "latn" for English numbers */}
                            {apt.date
                              ? new Date(apt.date).toLocaleString("ar-SY", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  numberingSystem: "latn",
                                })
                              : ""}
                          </div>
                          <div className="flex items-center gap-2">
                            {apt.type === "online" ? (
                              <FaVideo className="text-(--ui-success)" />
                            ) : (
                              <FaMapMarkerAlt className="text-(--ui-danger)" />
                            )}
                            {apt.location}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-(--ui-muted-foreground)">
                          <FaPhone className="text-(--ui-info)" />
                          {apt.phone && apt.phone.toLocaleString("en-US")}
                        </div>

                        <p className="text-sm text-(--ui-foreground)">
                          <span className="font-bold">{t("reasonLabel")}</span>{" "}
                          {apt.reason}
                        </p>
                        {apt.status === "cancelled" && apt.patientReason && (
                          <p className="text-sm text-(--ui-danger) mt-1">
                            <span className="font-bold">
                              {t("cancelReasonLabel")}
                            </span>{" "}
                            {apt.patientReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex gap-2">
                      {apt.status === "pending" && (
                        <Button
                          onClick={() => handleConfirm(apt.id)}
                          fullWidth={false}
                          size="sm"
                          className="flex items-center gap-2 px-4"
                        >
                          <FaCheckCircle />
                          {t("actions.confirm")}
                        </Button>
                      )}
                      {apt.status !== "cancelled" && (
                        <Button
                          onClick={() => handleCancel(apt.id)}
                          variant="secondary"
                          fullWidth={false}
                          size="sm"
                          className="flex items-center gap-2 px-4"
                        >
                          <FaTimesCircle />
                          {t("actions.cancel")}
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDelete(apt.id)}
                        variant="danger"
                        fullWidth={false}
                        size="sm"
                        className="flex items-center gap-2 px-4"
                      >
                        <FaTrash />
                        {t("actions.delete")}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md text-(--ui-foreground)">
            <form onSubmit={createAppointment}>
            <h3 className="text-lg font-bold mb-4">{t("addButton")}</h3>

            <label className="block mb-2 text-sm">{t("patient")}</label>
            <input
              placeholder={t("searchPlaceholder")}
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-2 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
            />
            <select
              value={bookPatientId}
              onChange={(e) => setBookPatientId(e.target.value)}
              className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
            >
              <option value="">
                {patientsLoading
                  ? t("form.loadingPatients")
                  : t("form.selectPatientPlaceholder")}
              </option>
              {patients
                .filter((p) =>
                  patientSearch
                    ? p.fullName
                        .toLowerCase()
                        .includes(patientSearch.toLowerCase())
                    : true,
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} {p.phone ? ` - ${p.phone}` : ""}
                  </option>
                ))}
            </select>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block mb-2 text-sm">{t("date")}</label>
                <input
                  type="date"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">{t("time")}</label>
                <input
                  type="time"
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                />
              </div>
            </div>

            <label className="block mb-2 text-sm">{t("form.typeLabel")}</label>
            <select
              value={bookType}
              onChange={(e) => setBookType(e.target.value)}
              className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
            >
              <option value="clinic">{t("types.clinic")}</option>
              <option value="online">{t("types.online")}</option>
            </select>

            <label className="block mb-2 text-sm">{t("reasonLabel")}</label>
            <input
              value={bookReason}
              onChange={(e) => setBookReason(e.target.value)}
              className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
            />

            {/* phone removed from booking form */}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                onClick={() => setShowAddModal(false)}
                variant="secondary"
                fullWidth={false}
                size="sm"
                className="px-4"
              >
                {t("actions.cancel")}
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
    </DoctorLayout>
  );
}
