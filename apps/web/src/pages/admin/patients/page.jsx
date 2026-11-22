"use client";
import { BriefcaseMedicalIcon, CalendarIcon, CircleCheckIcon, EyeIcon, EyeOffIcon, HeartIcon, MailIcon, PlusIcon, SaveIcon, SearchIcon, TestTubeIcon, UsersIcon, XIcon } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/ui/ToastProvider";
import { Button, GlideSelect } from "@/components/ui";
import { apiRequest } from "@/lib/apiClient";
import useLocale from "@/lib/compat/intl";
import { useTranslations } from "@/lib/compat/intl";

const CURRENT_YEAR = new Date().getUTCFullYear();

export default function PatientsPage() {
  const { showToast } = useToast();
  const tPatients = useTranslations("PatientsManagement");
  const ui = useTranslations("ui");
  const locale = useLocale();
  const placeholder = ui("placeholder");
  const isRTL = !!(locale && typeof locale === "object"
    ? locale.isRTL
    : locale === "ar");

  // State
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "male",
    doctorId: "",
    status: "active",
    bloodType: "",
    birthDate: "",
    notes: "",
  };
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [doctorsList, setDoctorsList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Data Fetching
  const fetcher = (url) => apiRequest(url);
  const {
    data: patients = [],
    error,
    isLoading,
    mutate,
  } = useSWR("/api/admin/patients", fetcher);

  // Helpers
  const formatDate = React.useCallback(
    (d) => {
      if (!d) return "";
      try {
        return new Date(d).toLocaleString(locale === "en" ? "en-US" : "ar-SA", {
          dateStyle: "medium",
          timeStyle: "short",
        });
      } catch {
        return String(d);
      }
    },
    [locale],
  );

  const safeT = (key, fallback = "") => {
    try {
      const v = tPatients(key);
      return typeof v === "string" && v.length ? v : fallback;
    } catch (e) {
      return fallback;
    }
  };

  // Normalize patients via memoization to avoid state updates inside effects
  const normalizedPatients = React.useMemo(() => {
    if (!patients || !Array.isArray(patients)) return [];
    const computeAgeFrom = (birthDate) => {
      if (!birthDate) return null;
      try {
        const bd = new Date(birthDate);
        return Math.abs(CURRENT_YEAR - bd.getUTCFullYear());
      } catch {
        return null;
      }
    };
    return patients.map((p) => {
      const user = p.user || {};
      const doctorUser = p.doctor?.user || p.doctor || null;
      return {
        id: p.id || null,
        userId: p.userId || user.id || null,
        name: user.fullName || p.fullName || "",
        email: user.email || p.email || "",
        phone: p.phone || user.phone || "",
        gender: p.gender || "",
        age: p.age ?? computeAgeFrom(p.birthDate || p.birthdate) ?? null,
        birthDate: p.birthDate || p.birthdate || null,
        medicalId: p.medicalId || p.patientId || null,
        avatar: p.avatar || null,
        status: p.status || null,
        appointmentsCount: p._count?.appointments ?? 0,
        reportsCount: p._count?.medicalRecords ?? 0,
        lastVisit: p.lastVisit
          ? formatDate(p.lastVisit)
          : p.updatedAt
            ? formatDate(p.updatedAt)
            : "",
        joinDate: p.joinDate
          ? formatDate(p.joinDate)
          : p.createdAt
            ? formatDate(p.createdAt)
            : "",
        bloodType: p.bloodType || "",
        notes: p.notes || "",
        doctorId:
          p.doctor?.userId ||
          p.doctor?.id ||
          p.doctorId ||
          (doctorUser ? doctorUser.id || doctorUser.userId : null),
        doctorName: doctorUser
          ? doctorUser.fullName || doctorUser.name
          : p.doctorName || "",
      };
    });
  }, [patients, formatDate]);

  // Fetch Doctors
  React.useEffect(() => {
    let mounted = true;
    apiRequest("/api/admin/doctors")
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.doctors || [];
        if (mounted) setDoctorsList(list);
      })
      .catch(() => {
        if (mounted) setDoctorsList([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (error)
    return (
      <div className="p-10 text-center text-(--ui-danger) font-medium">
        {tPatients("errorFetching")}
      </div>
    );
  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center text-(--ui-info) animate-pulse text-xl font-bold">
        {tPatients("loading")}
      </div>
    );

  // Stats Configuration
  const stats = [
    {
      title: tPatients("stats.totalPatients"),
      value: normalizedPatients.length,
      icon: UsersIcon,
    },
    {
      title: tPatients("stats.activePatients"),
      value: normalizedPatients.filter((p) => p.status === "active").length,
      icon: HeartIcon,
    },
    {
      title: tPatients("stats.todayVisits"),
      value: normalizedPatients.reduce(
        (sum, p) => sum + (p.appointmentsCount || 0),
        0,
      ),
      icon: CalendarIcon,
    },
    {
      title: tPatients("stats.totalReports"),
      value: normalizedPatients.reduce(
        (sum, p) => sum + (p.reportsCount || 0),
        0,
      ),
      icon: TestTubeIcon,
    },
  ];

  // Mappings
  const gendersMap = {
    male: tPatients("genders.male"),
    female: tPatients("genders.female"),
  };
  const statusesMap = {
    active: tPatients("statuses.active"),
    pending: tPatients("statuses.pending"),
    banned: tPatients("statuses.banned"),
    suspended: tPatients("statuses.banned"),
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "active":
        return "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)";
      case "pending":
        return "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)";
      case "banned":
      case "suspended":
        return "bg-(--ui-danger-bg) text-(--ui-danger) border-(--ui-danger-border)";
      default:
        return "bg-(--ui-surface-2) text-(--ui-muted-2) border-(--ui-border)";
    }
  };

  // Handlers
  const handleAddPatient = async () => {
    if (submitting) return;
    const trimmedPassword = (formData.password || "").trim();
    if (
      !formData.name?.trim() ||
      !formData.email?.trim() ||
      !formData.phone?.trim() ||
      !trimmedPassword
    ) {
      showToast(tPatients("toast.fillFields"), "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: trimmedPassword,
        gender: formData.gender,
        doctorId: formData.doctorId || undefined,
        status:
          formData.status === "banned" || formData.status === "suspended"
            ? "suspended"
            : "active",
        bloodType: formData.bloodType || undefined,
        birthDate: formData.birthDate || undefined,
        notes: formData.notes || undefined,
      };
      await apiRequest("/api/admin/patients", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await mutate();
      setFormData({ ...emptyForm });
      setShowPassword(false);
      setShowAddModal(false);
      showToast(tPatients("toast.patientAdded"), "success");
    } catch (e) {
      showToast(e?.message || "Failed to add patient", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPatient = async () => {
    if (submitting) return;
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.phone?.trim()) {
      showToast(tPatients("toast.fillFields"), "error");
      return;
    }
    if (!selectedPatient?.id) {
      showToast(tPatients("toast.patientUpdated"), "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender,
        doctorId: formData.doctorId ?? "",
        status:
          formData.status === "banned" || formData.status === "suspended"
            ? "suspended"
            : formData.status || undefined,
        bloodType: formData.bloodType || "",
        birthDate: formData.birthDate || "",
        notes: formData.notes || "",
      };
      const targetId = selectedPatient.id;
      await apiRequest(`/api/admin/patients/${targetId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await mutate();
      setFormData({ ...emptyForm });
      setShowEditModal(false);
      showToast(tPatients("toast.patientUpdated"), "success");
    } catch (e) {
      showToast(e?.message || "Failed to update patient", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePatient = () => {
    (async () => {
      try {
        const targetId = selectedPatient?.id;
        if (!targetId) {
          setShowDeleteModal(false);
          return;
        }
        setDeleting(true);
        setDeleteError(null);
        const currentStatus = selectedPatient?.status || "active";
        const targetStatus =
          currentStatus === "active" ? "suspended" : "active";
        await apiRequest(`/api/admin/patients/${targetId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: targetStatus }),
        });
        await mutate();
        setShowDeleteModal(false);
        setDeleteError(null);
        setDeleting(false);
        showToast(
          targetStatus === "suspended"
            ? tPatients("toast.patientDisabled")
            : tPatients("toast.patientEnabled"),
          "success",
        );
      } catch (e) {
        const message = e?.message || tPatients("toast.patientDeleted");
        setDeleteError(message);
        setDeleting(false);
      }
    })();
  };

  const openEditModal = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name || "",
      email: patient.email || "",
      phone: patient.phone || "",
      password: "",
      gender: patient.gender || "male",
      doctorId: patient.doctorId || "",
      status: patient.status === "banned" ? "suspended" : patient.status || "active",
      bloodType: patient.bloodType || "",
      birthDate: patient.birthDate
        ? new Date(patient.birthDate).toISOString().split("T")[0]
        : "",
      notes: patient.notes || "",
    });
    setShowEditModal(true);
  };
  const openDeleteModal = (patient) => {
    setSelectedPatient(patient);
    setShowDeleteModal(true);
  };

  const filteredPatients = normalizedPatients.filter((patient) => {
    const lowerSearch = (search || "").toString().trim().toLowerCase();
    const matchSearch =
      lowerSearch === "" ||
      (patient.name || "").toLowerCase().includes(lowerSearch) ||
      (patient.email || "").toLowerCase().includes(lowerSearch) ||
      (patient.phone || "").toLowerCase().includes(lowerSearch) ||
      (patient.medicalId || "").toLowerCase().includes(lowerSearch);
    const matchGender =
      filterGender === "all" || (patient.gender || "male") === filterGender;
    const matchStatus =
      filterStatus === "all" || (patient.status || "pending") === filterStatus;
    return matchSearch && matchGender && matchStatus;
  });

  return (
    <>

      {/* Premium Background with Gradient Mesh */}
      <div className="min-h-screen bg-background text-foreground font-sans overflow-hidden relative">
        {/* Decorative Background Blurs */}
        <div className="absolute top-[-10%] right-[-5%] w-125 h-125 bg-(--ui-info-bg) opacity-60 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-100 h-100 bg-(--ui-danger-bg) opacity-60 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-10 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-[fadeIn_0.6s_ease-out]">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight brand-gradient-text mb-2">
                {tPatients("headerTitle")}
              </h1>
              <p className="text-(--ui-muted-2) text-lg font-medium">
                {tPatients("headerSubtitle")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setShowPassword(false);
                  setFormData({ ...emptyForm });
                  setShowAddModal(true);
                }}
                size="lg"
              >
                <PlusIcon size={16} />
                <span className="hidden sm:inline">
                  {tPatients("addButton")}
                </span>
              </Button>
            </div>
          </div>

          {/* Glass Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group relative pd-panel pd-shape-asymmetric border border-(--ui-border) rounded-4xl p-6 shadow-(--shadow-soft) hover:shadow-(--shadow-lift) transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                <div className="relative z-10 flex flex-col h-full">
                  <div className={`flex items-center justify-between mb-4`}>
                    <div className="w-14 h-14 pd-shape-orbital brand-gradient flex items-center justify-center text-[var(--pd-on-accent)] shadow-(--shadow-soft) group-hover:scale-110 transition-transform duration-500">
                      <stat.icon className="text-xl" />
                    </div>
                    <div className="text-xs font-bold text-(--ui-muted-2) uppercase tracking-widest">
                      {tPatients("statLabel")}
                    </div>
                  </div>
                  <h3 className="text-(--ui-muted-2) font-medium mb-1">
                    {stat.title}
                  </h3>
                  <p className="text-4xl font-extrabold text-foreground tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Toolbar - Glass */}
          <div className="sticky top-6 z-40 pd-panel pd-shape-layered border border-(--ui-border) rounded-3xl p-4 shadow-(--shadow-soft) flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-100 group">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-(--ui-muted-2) group-focus-within:text-(--ui-info) transition-colors">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder={tPatients("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent text-foreground placeholder:text-(--ui-muted-2) transition-all outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <GlideSelect
                size="lg"
                value={filterGender ?? "all"}
                onChange={(val) => setFilterGender(val)}
                options={[
                  { value: "all", label: tPatients("filters.genderAll") },
                  { value: "male", label: gendersMap.male },
                  { value: "female", label: gendersMap.female },
                ]}
              />
              <GlideSelect
                size="lg"
                value={filterStatus ?? "all"}
                onChange={(val) => setFilterStatus(val)}
                options={[
                  { value: "all", label: tPatients("filters.statusAll") },
                  { value: "active", label: statusesMap.active },
                  { value: "suspended", label: statusesMap.suspended },
                ]}
              />
            </div>
          </div>

          {/* Patient Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-20">
            {filteredPatients.map((patient, idx) => (
              <div
                key={patient.id || idx}
                className="group relative pd-panel pd-shape-organic border border-(--ui-border) rounded-4xl p-8 shadow-(--shadow-soft) hover:shadow-(--shadow-lift) transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              >
                <div className="relative z-10 flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-4xl bg-(--ui-surface-2) flex items-center justify-center text-4xl shadow-inner border border-(--ui-border)">
                        {patient.avatar ||
                          (patient.gender === "male" ? "👨‍⚕️" : "👩‍⚕️")}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-(--ui-surface) rounded-full flex items-center justify-center shadow-(--shadow-soft) border border-(--ui-border)">
                        <span
                          className={`text-lg ${patient.gender === "male" ? "text-(--ui-info)" : "text-(--ui-warning)"}`}
                        >
                          {patient.gender === "male" ? "♂" : "♀"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(patient.status)} backdrop-blur-md`}
                    >
                      {statusesMap[patient.status] || patient.status}
                    </span>
                  </div>

                  {/* Identity */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-1 group-hover:text-(--ui-info) transition-colors">
                      {patient.name}
                    </h3>
                    <div className="flex items-center gap-2 text-(--ui-muted-2) text-sm font-medium">
                      <MailIcon className="text-(--ui-muted-2)" />{" "}
                      {patient.email}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-(--ui-surface-2) border border-(--ui-border) flex flex-col gap-1 hover:bg-(--ui-surface) transition-colors">
                      <span className="text-xs text-(--ui-muted-2) font-semibold uppercase">
                        {tPatients("labels.phone")}
                      </span>
                      <span className="text-sm font-bold text-foreground truncate">
                        {patient.phone || placeholder}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-(--ui-surface-2) border border-(--ui-border) flex flex-col gap-1 hover:bg-(--ui-surface) transition-colors">
                      <span className="text-xs text-(--ui-muted-2) font-semibold uppercase">
                        {tPatients("labels.age")}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {patient.age ?? placeholder} {tPatients("ageUnit")}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-(--ui-danger-bg) border border-(--ui-danger-border) flex flex-col gap-1">
                      <span className="text-xs text-(--ui-danger) font-semibold uppercase flex items-center gap-1">
                        <HeartIcon /> {tPatients("labels.blood")}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {patient.bloodType || placeholder}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-(--ui-info-bg) border border-(--ui-info-border) flex flex-col gap-1">
                      <span className="text-xs text-(--ui-info) font-semibold uppercase flex items-center gap-1">
                        <BriefcaseMedicalIcon /> {tPatients("labels.doctor")}
                      </span>
                      <span
                        className="text-sm font-bold text-foreground truncate"
                        title={patient.doctorName}
                      >
                        {patient.doctorName || placeholder}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {(patient.allergies?.length > 0 ||
                    patient.chronicDiseases?.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {patient.allergies?.slice(0, 2).map((a, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-bold bg-(--ui-danger-bg) text-(--ui-danger) border border-(--ui-danger-border)"
                        >
                          {a}
                        </span>
                      ))}
                      {patient.chronicDiseases?.slice(0, 2).map((d, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-bold bg-(--ui-warning-bg) text-(--ui-warning) border border-(--ui-warning-border)"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto pt-6 border-t border-(--ui-border) flex gap-4">
                    <button
                      onClick={() => openEditModal(patient)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-(--ui-info-bg) text-(--ui-info) border border-(--ui-info-border) hover:opacity-90 transition-all duration-300 font-medium text-sm"
                    >
                      {locale === "ar" ? "تعديل" : "Edit"}
                    </button>
                    <button
                      onClick={() => openDeleteModal(patient)}
                      className="flex-1 group/btn flex items-center justify-center gap-2 py-3 rounded-2xl bg-(--ui-surface-2) text-foreground border border-(--ui-border) hover:bg-(--ui-surface) transition-all duration-300 font-medium text-sm"
                    >
                      {patient.status === "active" ||
                      patient.status === undefined ? (
                        <>
                          <XIcon
                            className="group-hover/btn:scale-110 transition-transform"
                            size={14}
                          />
                          {tPatients("actions.disable")}
                        </>
                      ) : (
                        <>
                          <CircleCheckIcon
                            className="group-hover/btn:scale-110 transition-transform"
                            size={14}
                          />
                          {tPatients("actions.enable")}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-24 pd-panel pd-shape-asymmetric rounded-4xl border border-dashed border-(--ui-border)">
              <div className="inline-block p-6 rounded-full bg-(--ui-surface-2) mb-6 text-(--ui-muted-2) animate-bounce border border-(--ui-border)">
                <UsersIcon size={48} />
              </div>
              <p className="text-xl font-medium text-(--ui-muted-2)">
                {tPatients("table.noMatches")}
              </p>
            </div>
          )}
        </div>

        {/* ================= Premium Modals ================= */}
        {(showAddModal || showEditModal || showDeleteModal) && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-(--color-neutral)/50 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => {
                setShowPassword(false);
                setShowAddModal(false);
                setShowEditModal(false);
                setShowDeleteModal(false);
              }}
            ></div>

            {/* Modal Content */}
            {(showAddModal || showEditModal) && (
              <div className="relative pd-panel pd-shape-layered rounded-4xl shadow-(--shadow-lift) w-full max-w-lg overflow-hidden animate-[slideUp_0.3s_ease-out] border border-(--ui-border)">
                <div className="bg-(--ui-surface) px-8 py-6 border-b border-(--ui-border) flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-foreground">
                    {showAddModal
                      ? tPatients("modals.addTitle")
                      : tPatients("modals.editTitle")}
                  </h3>
                  <button
                    onClick={() => {
                      setShowPassword(false);
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                    className="w-10 h-10 rounded-full bg-(--ui-surface-2) border border-(--ui-border) flex items-center justify-center hover:bg-(--ui-danger-bg) hover:text-(--ui-danger) transition-colors"
                  >
                    <XIcon />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                        {tPatients("modals.fullName")}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent outline-none transition-all text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                        {tPatients("modals.email")}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl focus:ring-4 focus:ring-(--ui-ring)/20 outline-none transition-all text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                      {tPatients("modals.phone")}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl focus:ring-4 focus:ring-(--ui-ring)/20 outline-none transition-all text-foreground"
                    />
                  </div>

                  {showAddModal && (
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                        {tPatients("modals.password")}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          required
                          autoComplete="new-password"
                          className={`w-full px-4 py-3 bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl focus:ring-4 focus:ring-(--ui-ring)/20 outline-none transition-all text-foreground ${isRTL ? "pr-10" : "pl-10"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 text-(--ui-muted-2) p-1`}
                          title={
                            showPassword
                              ? tPatients("actions.hidePassword")
                              : tPatients("actions.showPassword")
                          }
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                        {tPatients("modals.gender")}
                      </label>
                      <GlideSelect
                        fullWidth
                        size="lg"
                        value={formData.gender}
                        onChange={(val) =>
                          setFormData({ ...formData, gender: val })
                        }
                        options={[
                          { value: "male", label: gendersMap.male },
                          { value: "female", label: gendersMap.female },
                        ]}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                        {tPatients("modals.bloodType")}
                      </label>
                      <input
                        type="text"
                        value={formData.bloodType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bloodType: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl focus:ring-4 focus:ring-(--ui-ring)/20 outline-none transition-all text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                      {tPatients("modals.doctor")}
                    </label>
                    <GlideSelect
                      fullWidth
                      size="lg"
                      value={formData.doctorId ?? ""}
                      onChange={(val) =>
                        setFormData({ ...formData, doctorId: val })
                      }
                      options={[
                        {
                          value: "",
                          label: tPatients("selectDoctorPlaceholder"),
                        },
                        ...doctorsList.map((d) => ({
                          value: String(d.id),
                          label:
                            (d.user && d.user.fullName) ||
                            d.fullName ||
                            d.email,
                        })),
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                        {safeT("modals.birthDate")}
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birthDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-(--ui-surface-2) border border-(--ui-border) rounded-2xl focus:ring-4 focus:ring-(--ui-ring)/20 outline-none transition-all text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-(--ui-muted-2) uppercase tracking-wider">
                        {safeT("modals.status")}
                      </label>
                      <GlideSelect
                        fullWidth
                        size="lg"
                        value={formData.status}
                        onChange={(val) =>
                          setFormData({ ...formData, status: val })
                        }
                        options={[
                          { value: "active", label: statusesMap.active },
                          { value: "suspended", label: statusesMap.suspended },
                        ]}
                      />
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-(--ui-surface) border-t border-(--ui-border) flex gap-4">
                  <Button
                    onClick={
                      showAddModal ? handleAddPatient : handleEditPatient
                    }
                    disabled={submitting}
                    isLoading={submitting}
                    fullWidth
                    size="lg"
                  >
                    <SaveIcon />{" "}
                    {showAddModal
                      ? tPatients("buttons.save")
                      : tPatients("buttons.saveChanges")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    disabled={submitting}
                    onClick={() => {
                      setShowPassword(false);
                      setShowAddModal(false);
                      setShowEditModal(false);
                    }}
                  >
                    {tPatients("buttons.cancel")}
                  </Button>
                </div>
              </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedPatient && (
              <div className="relative pd-panel pd-shape-organic rounded-4xl shadow-(--shadow-lift) w-full max-w-sm p-8 text-center animate-[zoomIn_0.2s_ease-out] border border-(--ui-border)">
                <div className="w-20 h-20 bg-(--ui-danger-bg) text-(--ui-danger) border border-(--ui-danger-border) rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
                  ⚠️
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {selectedPatient.status === "active" ||
                  selectedPatient.status === undefined
                    ? tPatients("confirmToggle.disableTitle")
                    : tPatients("confirmToggle.enableTitle")}
                </h3>
                <p className="text-(--ui-muted-2) mb-4 text-sm leading-relaxed">
                  {selectedPatient.status === "active" ||
                  selectedPatient.status === undefined
                    ? tPatients("confirmToggle.disableMessage")
                    : tPatients("confirmToggle.enableMessage")}{" "}
                  {selectedPatient.status === "active" ||
                  selectedPatient.status === undefined
                    ? tPatients("confirmToggle.disableWarning")
                    : tPatients("confirmToggle.enableWarning")}
                </p>
                {deleteError && (
                  <p
                    className="text-(--ui-danger) mb-6 text-sm leading-relaxed font-medium"
                    role="alert"
                  >
                    {deleteError}
                  </p>
                )}
                <div className="flex gap-4">
                  <button
                    onClick={handleDeletePatient}
                    disabled={deleting}
                    className={`flex-1 ${deleting ? "opacity-60 cursor-wait" : selectedPatient.status === "active" || selectedPatient.status === undefined ? "bg-(--ui-danger) hover:opacity-90" : "bg-(--ui-success) hover:opacity-90"} text-[var(--pd-on-accent)] py-3.5 rounded-2xl font-bold shadow-(--shadow-lift) transition-all active:scale-95`}
                  >
                    {deleting
                      ? safeT("confirmToggle.processing", "…")
                      : selectedPatient.status === "active" ||
                          selectedPatient.status === undefined
                        ? tPatients("confirmToggle.confirmDisable")
                        : tPatients("confirmToggle.confirmEnable")}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-(--ui-surface-2) hover:bg-(--ui-surface) text-foreground border border-(--ui-border) py-3.5 rounded-2xl font-bold transition-all active:scale-95"
                  >
                    {tPatients("confirmDelete.no")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}