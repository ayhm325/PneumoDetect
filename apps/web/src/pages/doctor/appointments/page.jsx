"use client";

import DoctorLayout from "../DoctorLayout";
import { useToast } from "@/components/ui/ToastProvider";
import { useCallback, useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaPlus,
  FaFilter,
  FaSearch,
  FaPhone,
  FaVideo,
  FaMapMarkerAlt,
  FaTrash,
} from "react-icons/fa";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { apiRequest } from "@/lib/apiClient";
import { Button, Card, GlideSelect, ProfileMediaCard, StatCard } from "@/components/ui";

export default function DoctorAppointmentsPage() {
  const { showSuccess, showError, showInfo } = useToast();
  const locale = useLocale();
  const t = useTranslations("doctorAppointments");
  const ui = useTranslations("ui");

  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // booking form state for doctor creating appointments
  const [bookPatientId, setBookPatientId] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookType, setBookType] = useState("clinic");
  const [bookReason, setBookReason] = useState("");

  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const data = await apiRequest("/api/doctor/patients");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.patients)
          ? data.patients
          : [];
      const mapped = list.map((p) => ({
        id: p.id,
        fullName: p.fullName || p.user?.fullName || p.email,
        phone: p.phone || "",
      }));
      setPatients(mapped);
    } catch {
      setPatients([]);
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest("/api/doctor/appointments");
      const list = Array.isArray(data) ? data : data?.appointments || [];
      const mapped = list.map((a) => ({
        id: a.id,
        patientName: a.patient?.name || ui("placeholder"),
        date: a.scheduledAt,
        time: a.scheduledAt
          ? new Date(a.scheduledAt).toLocaleTimeString(
              locale === "en" ? "en-US" : "ar-SY",
              {
                hour: "2-digit",
                minute: "2-digit",
                numberingSystem: "latn",
              },
            )
          : ui("placeholder"),
        type: a.type || "clinic",
        status: a.status || "scheduled",
        phone: a.patient?.phone || a.doctor?.phone || ui("placeholder"),
        reason: a.reason || ui("placeholder"),
        patientReason: a.patientReason || "",
        location:
          a.type === "online"
            ? a.location || t("types.online")
            : a.location || t("types.clinic"),
      }));
      setAppointments(mapped);
    } catch (err) {
      setError(err?.message || t("errors.fetchAppointmentsFailed"));
    } finally {
      setLoading(false);
    }
  }, [locale, t, ui]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  async function createAppointment(e) {
    e.preventDefault();
    if (submittingCreate) return;
    if (!bookPatientId || !bookDate || !bookTime) {
      showError(t("toast.fillRequired"));
      return;
    }
    const scheduledAt = new Date(`${bookDate}T${bookTime}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      showError(t("toast.error"));
      return;
    }
    setSubmittingCreate(true);
    try {
      await apiRequest("/api/doctor/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId: bookPatientId,
          scheduledAt: scheduledAt.toISOString(),
          type: bookType,
          reason: bookReason,
        }),
      });
      showSuccess(t("toast.created"));
      setShowAddModal(false);
      setBookPatientId("");
      setBookDate("");
      setBookTime("");
      setBookType("clinic");
      setBookReason("");
      await fetchAppointments();
    } catch (err) {
      showError(err?.message || t("toast.error"));
    } finally {
      setSubmittingCreate(false);
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
      if (filter === "confirmed") {
        return apt.status === "confirmed" || apt.status === "completed";
      }
      if (filter === "pending" || filter === "scheduled") {
        return (
          apt.status === "pending" ||
          apt.status === "scheduled" ||
          !apt.status
        );
      }
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

  const handleConfirm = async (id) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await apiRequest(`/api/doctor/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "confirm" }),
      });
      showSuccess(t("toast.confirm"));
      await fetchAppointments();
    } catch (err) {
      showError(err?.message || t("toast.error"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await apiRequest(`/api/doctor/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "cancel" }),
      });
      showInfo(t("toast.cancel"));
      await fetchAppointments();
    } catch (err) {
      showError(err?.message || t("toast.error"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (actionLoadingId) return;
    setActionLoadingId(id);
    try {
      await apiRequest(`/api/doctor/appointments/${id}`, {
        method: "DELETE",
      });
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      showSuccess(t("toast.delete"));
    } catch (err) {
      showError(err?.message || t("toast.error"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    let label,
      color,
      extra = "";
    if (status === "confirmed" || status === "completed") {
      label = t("statuses.confirmed");
      color = "bg-(--ui-success) text-white border-(--ui-success-border)";
      extra = "shadow-lg font-bold px-4 py-1 text-base";
    } else if (status === "pending" || status === "scheduled") {
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
    if (status === "pending" || status === "scheduled")
      return <FaHourglassHalf className="text-(--ui-warning)" />;
    return <FaTimesCircle className="text-(--ui-danger)" />;
  };

  if (loading) {
    return (
      <DoctorLayout>
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
        <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
          <div className="text-lg text-(--ui-danger)">
            {t("error")} {error}
          </div>
          <Button size="sm" onClick={fetchAppointments}>
            {locale === "ar" ? "إعادة المحاولة" : "Retry"}
          </Button>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
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
              onClick={() => setShowAddModal(true)}
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
            <StatCard
              label={t("stats.total")}
              value={stats.total}
              icon={<FaCalendarAlt />}
              tone="info"
            />
            <StatCard
              label={t("stats.confirmed")}
              value={stats.confirmed}
              icon={<FaCheckCircle />}
              tone="success"
            />
            <StatCard
              label={t("stats.pending")}
              value={stats.pending}
              icon={<FaHourglassHalf />}
              tone="warning"
            />
            <StatCard
              label={t("stats.cancelled")}
              value={stats.cancelled}
              icon={<FaTimesCircle />}
              tone="danger"
            />
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
                <GlideSelect
                  value={filter}
                  onChange={(val) => setFilter(val)}
                  options={[
                    { value: "all", label: t("filters.all") },
                    { value: "confirmed", label: t("filters.confirmed") },
                    { value: "pending", label: t("filters.pending") },
                    { value: "cancelled", label: t("filters.cancelled") },
                  ]}
                />
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
              filteredAppointments.map((apt) => {
                const isScheduled =
                  apt.status === "pending" || apt.status === "scheduled";
                const isBusy = actionLoadingId === apt.id;
                return (
                  <ProfileMediaCard
                    key={apt.id}
                    isAvatar
                    mediaNode={getStatusIcon(apt.status)}
                    title={apt.patientName}
                    subtitle={
                      apt.date
                        ? new Date(apt.date).toLocaleString(
                            locale === "en" ? "en-US" : "ar-SY",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              numberingSystem: "latn",
                            },
                          )
                        : ""
                    }
                    badge={getStatusBadge(apt.status)}
                    actions={
                      <>
                        {isScheduled && (
                          <Button
                            onClick={() => handleConfirm(apt.id)}
                            disabled={isBusy}
                            isLoading={isBusy}
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
                            disabled={isBusy}
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
                          disabled={isBusy}
                          variant="danger"
                          fullWidth={false}
                          size="sm"
                          className="flex items-center gap-2 px-4"
                        >
                          <FaTrash />
                          {t("actions.delete")}
                        </Button>
                      </>
                    }
                  >
                    <div className="flex flex-wrap gap-4 text-xs text-(--ui-muted-foreground) mb-2">
                      <div className="flex items-center gap-1.5">
                        {apt.type === "online" ? (
                          <FaVideo className="text-(--ui-success)" />
                        ) : (
                          <FaMapMarkerAlt className="text-(--ui-danger)" />
                        )}
                        <span>{apt.location}</span>
                      </div>
                      {apt.phone && (
                        <div className="flex items-center gap-1.5">
                          <FaPhone className="text-(--ui-info)" />
                          <span dir="ltr">
                            {apt.phone.toLocaleString("en-US")}
                          </span>
                        </div>
                      )}
                    </div>
                    {apt.reason && (
                      <p className="text-xs text-(--ui-foreground)">
                        <span className="font-semibold text-(--ui-muted-foreground)">
                          {t("reasonLabel")}
                        </span>{" "}
                        {apt.reason}
                      </p>
                    )}
                    {apt.status === "cancelled" && apt.patientReason && (
                      <p className="text-xs text-(--ui-danger) mt-1">
                        <span className="font-semibold">
                          {t("cancelReasonLabel")}
                        </span>{" "}
                        {apt.patientReason}
                      </p>
                    )}
                  </ProfileMediaCard>
                );
              })
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
              <div className="mb-3">
                <GlideSelect
                  fullWidth
                  value={bookPatientId}
                  onChange={(val) => setBookPatientId(val)}
                  placeholder={
                    patientsLoading
                      ? t("form.loadingPatients")
                      : t("form.selectPatientPlaceholder")
                  }
                  options={[
                    {
                      value: "",
                      label: patientsLoading
                        ? t("form.loadingPatients")
                        : t("form.selectPatientPlaceholder"),
                    },
                    ...patients
                      .filter((p) =>
                        patientSearch
                          ? p.fullName
                              .toLowerCase()
                              .includes(patientSearch.toLowerCase())
                          : true,
                      )
                      .map((p) => ({
                        value: String(p.id),
                        label: `${p.fullName}${p.phone ? ` - ${p.phone}` : ""}`,
                      })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block mb-2 text-sm">{t("date")}</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm">{t("time")}</label>
                  <input
                    type="time"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
                    required
                  />
                </div>
              </div>

              <label className="block mb-2 text-sm">{t("form.typeLabel")}</label>
              <div className="mb-3">
                <GlideSelect
                  fullWidth
                  value={bookType}
                  onChange={(val) => setBookType(val)}
                  options={[
                    { value: "clinic", label: t("types.clinic") },
                    { value: "online", label: t("types.online") },
                  ]}
                />
              </div>

              <label className="block mb-2 text-sm">{t("reasonLabel")}</label>
              <input
                value={bookReason}
                onChange={(e) => setBookReason(e.target.value)}
                className="w-full p-2 border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) rounded mb-3 focus:outline-none focus:ring-2 focus:ring-(--ui-ring)"
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submittingCreate}
                  variant="secondary"
                  fullWidth={false}
                  size="sm"
                  className="px-4"
                >
                  {t("actions.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCreate}
                  isLoading={submittingCreate}
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
