"use client";
import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import DoctorDetailsCard from "@/components/admin/DoctorDetailsCard";
import DoctorsTable from "@/components/admin/DoctorsTable";
import { useToast } from "@/components/ui/ToastProvider";
import { Button, GlideSelect } from "@/components/ui";
import { apiRequest } from "@/lib/apiClient";
import {
  FaMagnifyingGlass,
  FaPlus,
  FaX,
  FaFloppyDisk,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa6";

function DoctorsPage() {
  const { showSuccess, showError, showInfo } = useToast();
  const tDoctors = useTranslations("DoctorsManagement");
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);

  const getDoctorStatus = (doctor) => {
    const raw = doctor?.status || "pending";
    if (raw === "suspended") return "banned";
    return raw;
  };

  // State
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    clinic: "",
    password: "",
    status: "active",
  };
  const [formData, setFormData] = useState({ ...emptyForm });

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const doctorsData = await apiRequest("/api/admin/doctors");
      const allDoctors = Array.isArray(doctorsData)
        ? doctorsData
        : Array.isArray(doctorsData?.doctors)
          ? doctorsData.doctors
          : [];
      setDoctors(allDoctors);
      setPendingDoctors(
        allDoctors.filter((d) => getDoctorStatus(d) === "pending"),
      );
    } catch (err) {
      setError(err?.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  // Add Doctor logic
  const handleAddDoctor = async () => {
    if (submitting) return;
    if (
      !formData.name?.trim() ||
      !formData.email?.trim() ||
      !formData.phone?.trim() ||
      !formData.licenseNumber?.trim() ||
      !formData.password?.trim() ||
      !formData.status?.trim()
    ) {
      showError(tDoctors("toast.fillFields"));
      return;
    }
    setSubmitting(true);
    try {
      const data = await apiRequest("/api/admin/doctors", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          password: formData.password.trim(),
          status: formData.status.trim(),
        }),
      });
      const createdDoctor = data?.doctor || data;
      if (createdDoctor && (createdDoctor.id || createdDoctor.userId)) {
        const normalized = createdDoctor.user
          ? {
              ...createdDoctor,
              id: createdDoctor.userId || createdDoctor.id,
            }
          : {
              ...createdDoctor,
              id: createdDoctor.userId || createdDoctor.id,
              user: {
                id: createdDoctor.userId || createdDoctor.id,
                fullName: formData.name.trim(),
                email: formData.email.trim(),
                isActive: (createdDoctor.status || formData.status) === "active",
              },
            };
        const nextList = [normalized, ...doctors];
        setDoctors(nextList);
        setPendingDoctors(
          nextList.filter((d) => getDoctorStatus(d) === "pending"),
        );
      } else {
        await loadDoctors();
      }
      showSuccess(tDoctors("toast.doctorAdded"));
      setShowAddModal(false);
      setShowPassword(false);
      setFormData({ ...emptyForm });
    } catch (e) {
      showError(e?.message || tDoctors("toast.addFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Doctor logic
  const handleEditDoctor = async () => {
    if (submitting || !selectedDoctor) return;
    const userId = selectedDoctor.userId || selectedDoctor.id;
    if (
      !userId ||
      !formData.name?.trim() ||
      !formData.email?.trim() ||
      !formData.phone?.trim() ||
      !formData.licenseNumber?.trim()
    ) {
      showError(tDoctors("toast.fillFields"));
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(`/api/admin/doctors/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          clinic: formData.clinic ? formData.clinic.trim() : null,
          status: formData.status || "active",
        }),
      });
      await loadDoctors();
      setShowEditModal(false);
      setSelectedDoctor(null);
      showSuccess(
        locale === "ar"
          ? "تم حفظ تعديلات الطبيب بنجاح"
          : "Doctor details updated successfully",
      );
    } catch (e) {
      showError(e?.message || tDoctors("toast.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (doctor) => {
    setSelectedDoctor({ ...doctor, id: doctor.userId || doctor.id });
    setFormData({
      name:
        doctor.name ||
        doctor.fullName ||
        (doctor.user && (doctor.user.fullName || doctor.user.name)) ||
        "",
      email: doctor.email || (doctor.user && doctor.user.email) || "",
      phone: doctor.phone || (doctor.user && doctor.user.phone) || "",
      clinic: doctor.clinic || "",
      status: getDoctorStatus(doctor),
      licenseNumber:
        doctor.licenseNumber ||
        (doctor.user && doctor.user.licenseNumber) ||
        "",
      password: "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (doctor) => {
    setSelectedDoctor({ ...doctor, id: doctor.userId || doctor.id });
    setShowDeleteModal(true);
  };

  const openDetailsModal = (doctor) => {
    setSelectedDoctor({ ...doctor, status: getDoctorStatus(doctor) });
    setShowDetailsModal(true);
  };

  let filteredDoctors = [];
  if (!loading && Array.isArray(doctors)) {
    filteredDoctors = doctors.filter((doctor) => {
      const name = doctor.user?.fullName || doctor.name || "";
      const email = doctor.user?.email || doctor.email || "";
      const phone = doctor.phone || "";
      const license = doctor.licenseNumber || "";
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q) ||
        license.toLowerCase().includes(q);
      const docStatus = getDoctorStatus(doctor);
      const matchStatus =
        filterStatus === "all" || docStatus === filterStatus;
      return matchSearch && matchStatus;
    });
  }

  const [showPendingOnly] = useState(false);
  const displayedDoctors = Array.isArray(
    showPendingOnly ? pendingDoctors : filteredDoctors,
  )
    ? showPendingOnly
      ? pendingDoctors
      : filteredDoctors
    : [];

  const handleApproveDoctor = async (doctor) => {
    const userId = doctor.userId || doctor.id;
    try {
      await apiRequest("/api/admin/doctors", {
        method: "PATCH",
        body: JSON.stringify({ id: userId, status: "active" }),
      });
      const updatedDoctors = doctors.map((d) =>
        (d.userId || d.id) === userId
          ? {
              ...d,
              status: "active",
              isActive: true,
              user: d.user ? { ...d.user, isActive: true } : d.user,
            }
          : d,
      );
      setDoctors(updatedDoctors);
      setPendingDoctors(
        updatedDoctors.filter((d) => getDoctorStatus(d) === "pending"),
      );
      setShowDetailsModal(false);
      setSelectedDoctor(null);
      showSuccess(tDoctors("toast.doctorVerified"));
    } catch (e) {
      showError(e?.message || tDoctors("toast.activationFailed"));
    }
  };

  const handleRejectDoctor = async (doctor) => {
    const userId = doctor.userId || doctor.id;
    try {
      await apiRequest("/api/admin/doctors", {
        method: "PATCH",
        body: JSON.stringify({ id: userId, status: "banned" }),
      });
      const updatedDoctors = doctors.map((d) =>
        (d.userId || d.id) === userId ? { ...d, status: "banned" } : d,
      );
      setDoctors(updatedDoctors);
      setPendingDoctors(
        updatedDoctors.filter((d) => getDoctorStatus(d) === "pending"),
      );
      setShowDetailsModal(false);
      setSelectedDoctor(null);
      showInfo(tDoctors("toast.doctorRejected"));
    } catch (e) {
      showError(e?.message || tDoctors("toast.rejectFailed"));
    }
  };

  // Block / Deactivate doctor via API (preserves medical records & history)
  const handleDeleteDoctor = async () => {
    if (!selectedDoctor || submitting) return;
    const userId = selectedDoctor.userId || selectedDoctor.id;
    setSubmitting(true);
    try {
      await apiRequest(`/api/admin/doctors/${userId}`, {
        method: "DELETE",
      });
      const updatedDoctors = doctors.map((d) =>
        (d.userId || d.id) === userId
          ? {
              ...d,
              status: "banned",
              isActive: false,
              user: d.user ? { ...d.user, isActive: false } : d.user,
            }
          : d,
      );
      setDoctors(updatedDoctors);
      setPendingDoctors(
        updatedDoctors.filter((d) => getDoctorStatus(d) === "pending"),
      );
      showSuccess(tDoctors("toast.doctorSuspended"));
      setShowDeleteModal(false);
      setSelectedDoctor(null);
    } catch (e) {
      showError(e?.message || tDoctors("toast.deleteFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDoctor = async (doctor) => {
    if (!doctor) return;
    const userId = doctor.userId || doctor.id;
    const currentStatus = getDoctorStatus(doctor) || "active";
    const targetStatus = currentStatus === "active" ? "banned" : "active";
    try {
      await apiRequest("/api/admin/doctors", {
        method: "PATCH",
        body: JSON.stringify({ id: userId, status: targetStatus }),
      });
      const updatedDoctors = doctors.map((d) =>
        (d.userId || d.id) === userId
          ? {
              ...d,
              status: targetStatus,
              isActive: targetStatus === "active",
              user: d.user
                ? { ...d.user, isActive: targetStatus === "active" }
                : d.user,
            }
          : d,
      );
      setDoctors(updatedDoctors);
      setPendingDoctors(
        updatedDoctors.filter((d) => getDoctorStatus(d) === "pending"),
      );
      showSuccess(
        targetStatus === "active"
          ? tDoctors("toast.doctorActivated")
          : tDoctors("toast.doctorSuspended"),
      );
    } catch (e) {
      showError(e?.message || tDoctors("toast.updateFailed"));
    }
  };

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {tDoctors("headerTitle")}
            </h1>
            <p className="text-(--ui-muted-2) mt-2">
              {tDoctors("headerSubtitle")}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                setFormData({ ...emptyForm });
                setShowAddModal(true);
              }}
            >
              <FaPlus />
              <span>{tDoctors("addButton")}</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-(--ui-danger-border) bg-(--ui-danger-bg) p-4 text-(--ui-danger) flex items-center justify-between">
            <span>{error}</span>
            <Button size="sm" variant="secondary" onClick={loadDoctors}>
              {locale === "ar" ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="card-glass rounded-xl shadow-(--shadow-soft) p-6 mb-8 border border-(--ui-border)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaMagnifyingGlass className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--ui-muted-2)" />
              <input
                type="text"
                placeholder={tDoctors("filters.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground focus:ring-2 focus:ring-(--ui-ring) focus:border-transparent"
              />
            </div>

            <GlideSelect
              fullWidth
              size="lg"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: "all", label: tDoctors("filters.statusAll") },
                { value: "active", label: tDoctors("statuses.active") },
                {
                  value: "pending",
                  label: locale === "ar" ? "قيد المراجعة" : "Pending",
                },
                { value: "banned", label: tDoctors("statuses.banned") },
              ]}
            />
          </div>
        </div>

        {/* Doctors Table */}
        <DoctorsTable
          doctors={
            Array.isArray(displayedDoctors)
              ? displayedDoctors.map((d) => ({
                  ...d,
                  status: getDoctorStatus(d),
                }))
              : []
          }
          onEdit={openEditModal}
          onDelete={openDeleteModal}
          onDetails={openDetailsModal}
          onAdd={() => setShowAddModal(true)}
          onApprove={handleApproveDoctor}
          onReject={handleRejectDoctor}
          onToggle={handleToggleDoctor}
        />

        {!loading && displayedDoctors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-(--ui-muted-2)">
              {showPendingOnly
                ? tDoctors("noPendingRequests")
                : tDoctors("table.noMatches")}
            </p>
          </div>
        )}

        {/* Add Doctor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
            <div className="card-glass rounded-xl shadow-(--shadow-lift) max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  {tDoctors("modals.addTitle")}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-(--ui-surface-2) rounded-lg"
                >
                  <FaX className="text-(--ui-muted-2)" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.fullName")}
                  </label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.email")}
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.licenseNumber")}
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {locale === "ar" ? "كلمة المرور" : "Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      autoComplete="new-password"
                      className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground pe-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? locale === "ar"
                            ? "إخفاء كلمة المرور"
                            : "Hide password"
                          : locale === "ar"
                            ? "إظهار كلمة المرور"
                            : "Show password"
                      }
                      className="absolute inset-y-0 end-3 flex items-center text-(--ui-muted-2) hover:text-foreground"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.status")}
                  </label>
                  <GlideSelect
                    fullWidth
                    size="lg"
                    value={formData.status}
                    onChange={(val) =>
                      setFormData({ ...formData, status: val })
                    }
                    options={[
                      { value: "active", label: tDoctors("statuses.active") },
                      {
                        value: "pending",
                        label: locale === "ar" ? "قيد المراجعة" : "Pending",
                      },
                      { value: "banned", label: tDoctors("statuses.banned") },
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddDoctor}
                  disabled={submitting}
                  isLoading={submitting}
                  fullWidth
                >
                  <FaFloppyDisk />
                  <span>{tDoctors("buttons.save")}</span>
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={submitting}
                  onClick={() => setShowAddModal(false)}
                >
                  {tDoctors("buttons.cancel")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Doctor Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
            <div className="card-glass rounded-xl shadow-(--shadow-lift) max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  {tDoctors("modals.editTitle")}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-(--ui-surface-2) rounded-lg"
                >
                  <FaX className="text-(--ui-muted-2)" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.fullName")}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.email")}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.licenseNumber")}
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.phone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {tDoctors("modals.status")}
                  </label>
                  <GlideSelect
                    fullWidth
                    size="lg"
                    value={formData.status}
                    onChange={(val) =>
                      setFormData({ ...formData, status: val })
                    }
                    options={[
                      { value: "active", label: tDoctors("statuses.active") },
                      {
                        value: "pending",
                        label: locale === "ar" ? "قيد المراجعة" : "Pending",
                      },
                      { value: "banned", label: tDoctors("statuses.banned") },
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleEditDoctor}
                  disabled={submitting}
                  isLoading={submitting}
                  fullWidth
                >
                  <FaFloppyDisk />
                  <span>{tDoctors("buttons.saveChanges")}</span>
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={submitting}
                  onClick={() => setShowEditModal(false)}
                >
                  {tDoctors("buttons.cancel")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedDoctor && (
          <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
            <DoctorDetailsCard
              doctor={selectedDoctor}
              onClose={() => setShowDetailsModal(false)}
              onApprove={handleApproveDoctor}
              onReject={handleRejectDoctor}
            />
          </div>
        )}

        {/* Block/Suspend Confirmation Modal */}
        {showDeleteModal && selectedDoctor && (
          <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
            <div className="card-glass rounded-xl shadow-(--shadow-lift) max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {locale === "ar"
                    ? "تأكيد حظر وتعطيل حساب الطبيب"
                    : "Confirm Blocking Doctor Account"}
                </h3>
                <p className="text-(--ui-muted-2)">
                  {tDoctors("confirmDelete.description", {
                    name:
                      selectedDoctor.user?.fullName ||
                      selectedDoctor.name ||
                      "",
                  })}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteDoctor}
                  disabled={submitting}
                  isLoading={submitting}
                  variant="danger"
                  fullWidth
                >
                  {tDoctors("confirmDelete.yes")}
                </Button>
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={submitting}
                  variant="secondary"
                  fullWidth
                >
                  {tDoctors("confirmDelete.no")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
export default DoctorsPage;
