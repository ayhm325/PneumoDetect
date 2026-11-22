"use client";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { useSearchParams } from "@/lib/compat/navigation";
// Page is rendered inside the route-level AdminLayout; avoid double-wrapping
import DoctorDetailsCard from "@/components/admin/DoctorDetailsCard";
import DoctorsTable from "@/components/admin/DoctorsTable";
import { useToast } from "@/components/ui/ToastProvider";
import { Button, GlideSelect } from "@/components/ui";
import { FaMagnifyingGlass, FaPlus, FaX, FaFloppyDisk, FaEye, FaEyeSlash } from "react-icons/fa6";

function DoctorsPage() {
  // توحيد منطق الحالة للطبيب بناءً على الحقل الرسمي فقط
  const getDoctorStatus = (doctor) => {
    // الحالة الرسمية الوحيدة هي doctor.status
    // القيم: pending | active | banned
    return doctor.status || "pending";
  };
  // Add Doctor logic
  const handleAddDoctor = async () => {
    // Basic validation
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
    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          password: formData.password.trim(),
          status: formData.status.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const createdDoctor = data?.doctor || data;
        if (createdDoctor && (createdDoctor.id || createdDoctor.userId)) {
          const normalized = createdDoctor.user
            ? createdDoctor
            : {
                ...createdDoctor,
                id: createdDoctor.userId || createdDoctor.id,
                user: {
                  id: createdDoctor.userId || createdDoctor.id,
                  fullName: formData.name.trim(),
                  email: formData.email.trim(),
                },
              };
          setDoctors((prev) => [normalized, ...prev]);
        }
        showSuccess(tDoctors("toast.doctorAdded"));
        setShowAddModal(false);
        setShowPassword(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          licenseNumber: "",
          password: "",
          status: "active",
          specialty: "general",
          experience: "",
        });
      } else {
        const errorData = await res.json();
        showError(errorData?.message || errorData?.error || tDoctors("toast.addFailed"));
      }
    } catch (e) {
      showError(e?.message || tDoctors("toast.addFailed"));
    }
  };
  const searchParams = useSearchParams();
  const { showSuccess, showError, showInfo } = useToast();
  const tDoctors = useTranslations("DoctorsManagement");
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);

  // State
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    password: "",
    specialty: "general",
    experience: "",
    status: "active",
  });

  // جلب جميع الأطباء
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  // جلب الطلبات المعلقة فقط
  const [pendingDoctors, setPendingDoctors] = useState([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [doctorsRes, patientsRes, usersRes] = await Promise.all([
          fetch("/api/admin/doctors"),
          fetch("/api/admin/patients"),
          fetch("/api/admin/users"),
        ]);

        const doctorsData = await doctorsRes.json().catch(() => ({}));
        // حذف جلب المرضى والمدراء لأنهم غير مستخدمين

        if (!mounted) return;

        const allDoctors = Array.isArray(doctorsData)
          ? doctorsData
          : Array.isArray(doctorsData?.doctors)
            ? doctorsData.doctors
            : [];
        setDoctors(allDoctors);
        setPendingDoctors(
          allDoctors.filter((d) => getDoctorStatus(d) === "pending"),
        );
        setLoading(false);
      } catch {
        if (!mounted) return;
        setDoctors([]);
        setPendingDoctors([]);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Export removed: UI export button hidden per request.

  const openEditModal = (doctor) => {
    // Always set id to userId (or fallback to id)
    setSelectedDoctor({ ...doctor, id: doctor.userId || doctor.id });
    setFormData({
      name:
        doctor.name ||
        doctor.fullName ||
        (doctor.user && (doctor.user.fullName || doctor.user.name)) ||
        "",
      email: doctor.email || (doctor.user && doctor.user.email) || "",
      phone: doctor.phone || (doctor.user && doctor.user.phone) || "",
      specialty: doctor.specialty || "general",
      experience: doctor.experience || "",
      status: doctor.status || "active",
      licenseNumber:
        doctor.licenseNumber ||
        (doctor.user && doctor.user.licenseNumber) ||
        "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (doctor) => {
    setSelectedDoctor({ ...doctor, status: getDoctorStatus(doctor) });
    setShowDetailsModal(true);
  };

  // فلترة الأطباء حسب البحث والفلاتر
  let filteredDoctors = [];
  if (!loading && Array.isArray(doctors)) {
    filteredDoctors = doctors.filter((doctor) => {
      const matchSearch =
        doctor.name?.toLowerCase().includes(search.toLowerCase()) ||
        doctor.email?.toLowerCase().includes(search.toLowerCase()) ||
        doctor.phone?.toLowerCase().includes(search.toLowerCase()) ||
        doctor.licenseNumber?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "all" || getDoctorStatus(doctor) === filterStatus;
      return matchSearch && matchStatus;
    });
  }

  // منطق عرض الطلبات المعلقة فقط
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const displayedDoctors = Array.isArray(
    showPendingOnly ? pendingDoctors : filteredDoctors,
  )
    ? showPendingOnly
      ? pendingDoctors
      : filteredDoctors
    : [];
  // ... باقي الكود و JSX ...

  // Approve/Reject handlers
  // موافقة/رفض الطبيب عبر API
  const handleApproveDoctor = async (doctor) => {
    const userId = doctor.userId || doctor.id;
    const res = await fetch("/api/admin/doctors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, status: "active" }),
    });
    if (res.ok) {
      const updatedDoctors = doctors.map((d) =>
        d.id === doctor.id
          ? {
              ...d,
              status: "active",
              isActive: true,
              user: d.user ? { ...d.user, isActive: true } : d.user,
            }
          : d,
      );
      setDoctors(updatedDoctors);
      // أعد تصفية قائمة المعلقين بناءً على الحالة الجديدة
      setPendingDoctors(
        updatedDoctors.filter((d) => getDoctorStatus(d) === "pending"),
      );
      setShowDetailsModal(false);
      setSelectedDoctor(null);
      showSuccess(tDoctors("toast.doctorVerified"));
    } else {
      showError(tDoctors("toast.activationFailed"));
    }
  };
  const handleRejectDoctor = async (doctor) => {
    const userId = doctor.userId || doctor.id;
    const res = await fetch("/api/admin/doctors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, status: "banned" }),
    });
    if (res.ok) {
      const updatedDoctors = doctors.map((d) =>
        d.id === doctor.id ? { ...d, status: "banned" } : d,
      );
      setDoctors(updatedDoctors);
      setPendingDoctors(
        updatedDoctors.filter((d) => getDoctorStatus(d) === "pending"),
      );
      setShowDetailsModal(false);
      setSelectedDoctor(null);
      showInfo(tDoctors("toast.doctorRejected"));
    } else {
      showError(tDoctors("toast.rejectFailed"));
    }
  };

  // حذف الطبيب عبر API
  const handleDeleteDoctor = async () => {
    if (!selectedDoctor) return;
    try {
      // يمكنك تعديل هذا المسار حسب API الحذف لديك
      const res = await fetch(`/api/admin/doctors/${selectedDoctor.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setDoctors(doctors.filter((d) => d.id !== selectedDoctor.id));
        showSuccess(tDoctors("toast.doctorDeleted"));
        setShowDeleteModal(false);
      } else {
        showError(tDoctors("toast.deleteFailed"));
      }
    } catch (e) {
      showError(tDoctors("toast.deleteFailed"));
    }
  };

  // تعتيم/تفعيل الطبيب (بديل للحذف/تعديل في الواجهة)
  const handleToggleDoctor = async (doctor) => {
    if (!doctor) return;
    const userId = doctor.userId || doctor.id;
    const currentStatus = getDoctorStatus(doctor) || "active";
    const targetStatus = currentStatus === "active" ? "banned" : "active";
    try {
      const res = await fetch("/api/admin/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, status: targetStatus }),
      });
      if (res.ok) {
        const updatedDoctors = doctors.map((d) =>
          d.id === doctor.id
            ? {
                ...d,
                status: targetStatus,
                isActive: targetStatus === "active",
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
      } else {
        showError(tDoctors("toast.updateFailed"));
      }
    } catch (e) {
      showError(tDoctors("toast.updateFailed"));
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
            <Button onClick={() => setShowAddModal(true)}>
              <FaPlus />
              <span>{tDoctors("addButton")}</span>
            </Button>
          </div>
        </div>

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
                { value: "suspended", label: tDoctors("statuses.suspended") },
                { value: "banned", label: tDoctors("statuses.banned") },
              ]}
            />
          </div>
        </div>

        {/* Doctors Table (with verification actions) */}
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

        {displayedDoctors.length === 0 && (
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
                      aria-label={showPassword ? (locale === "ar" ? "إخفاء كلمة المرور" : "Hide password") : (locale === "ar" ? "إظهار كلمة المرور" : "Show password")}
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
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors border ${formData.status === "active" ? "bg-(--ui-success) text-white border-(--ui-success-border)" : "bg-(--ui-surface-2) text-foreground border-(--ui-border) hover:bg-(--ui-surface)"}`}
                      onClick={() =>
                        setFormData({ ...formData, status: "active" })
                      }
                    >
                      {tDoctors("statuses.active")}
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors border ${formData.status === "banned" ? "bg-(--ui-danger) text-white border-(--ui-danger-border)" : "bg-(--ui-surface-2) text-foreground border-(--ui-border) hover:bg-(--ui-surface)"}`}
                      onClick={() =>
                        setFormData({ ...formData, status: "banned" })
                      }
                    >
                      {tDoctors("statuses.banned")}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleAddDoctor} fullWidth>
                  <FaFloppyDisk />
                  <span>{tDoctors("buttons.save")}</span>
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
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
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors border ${formData.status === "active" ? "bg-(--ui-success) text-white border-(--ui-success-border)" : "bg-(--ui-surface-2) text-foreground border-(--ui-border) hover:bg-(--ui-surface)"}`}
                      onClick={() =>
                        setFormData({ ...formData, status: "active" })
                      }
                    >
                      {tDoctors("statuses.active")}
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-4 py-3 rounded-lg font-bold transition-colors border ${formData.status === "banned" ? "bg-(--ui-danger) text-white border-(--ui-danger-border)" : "bg-(--ui-surface-2) text-foreground border-(--ui-border) hover:bg-(--ui-surface)"}`}
                      onClick={() =>
                        setFormData({ ...formData, status: "banned" })
                      }
                    >
                      {tDoctors("statuses.banned")}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={handleEditDoctor} fullWidth>
                  <FaFloppyDisk />
                  <span>{tDoctors("buttons.saveChanges")}</span>
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowEditModal(false)}
                >
                  {tDoctors("buttons.cancel")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal (bilingual, with approve/reject) */}
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDoctor && (
          <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
            <div className="card-glass rounded-xl shadow-(--shadow-lift) max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {tDoctors("confirmDelete.title")}
                </h3>
                <p className="text-(--ui-muted-2)">
                  {tDoctors("confirmDelete.description", {
                    name: selectedDoctor.name,
                  })}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteDoctor}
                  className="flex-1 bg-(--ui-danger) hover:opacity-90 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  {tDoctors("confirmDelete.yes")}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-(--ui-surface-2) hover:bg-(--ui-surface) text-foreground px-4 py-3 rounded-lg transition-colors border border-(--ui-border)"
                >
                  {tDoctors("confirmDelete.no")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
export default DoctorsPage;