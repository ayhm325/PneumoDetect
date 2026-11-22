"use client";
import { BriefcaseMedicalIcon, CalendarDaysIcon, CircleCheckIcon, CircleXIcon, ClockIcon, EyeIcon, EyeOffIcon, MailIcon, PhoneIcon, PlusIcon, SaveIcon, SearchIcon, UserCogIcon, UserRoundIcon, UsersIcon, XIcon } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
// Page is rendered inside the route-level AdminLayout; avoid double-wrapping
import { useToast, ToastContainer } from "@/components/ui/ToastProvider";
import { Button, GlideSelect } from "@/components/ui";
import { apiRequest } from "@/lib/apiClient";
import useLocale from "@/lib/compat/intl";
import { useTranslations } from "@/lib/compat/intl";

export default function UsersPage() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const locale = useLocale();
  const t = useTranslations("adminUsers");
  const isRTL = locale === "ar";

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const mapServerUser = useCallback(
    (u) => {
      const role = u.role || "admin";
      const phone =
        (u.doctor && u.doctor.phone) || (u.patient && u.patient.phone) || "";
      const status =
        u.isActive === false
          ? "banned"
          : role === "admin"
            ? "active"
            : role === "doctor"
              ? u.doctor?.status || "pending"
              : u.patient?.status || "active";
      const joinDate = u.patient?.joinDate
        ? new Date(u.patient.joinDate).toISOString().split("T")[0]
        : u.createdAt
          ? new Date(u.createdAt).toISOString().split("T")[0]
          : "";
      const lastLogin = u.updatedAt
        ? new Date(u.updatedAt).toISOString().replace("T", " ").substring(0, 16)
        : "";

      return {
        id: u.id,
        name: u.fullName || u.name || "",
        email: u.email || "",
        phone,
        role,
        status,
        isActive: Boolean(u.isActive),
        joinDate,
        lastLogin,
        avatar:
          role === "admin"
            ? t("avatars.admin")
            : role === "doctor"
              ? t("avatars.doctor")
              : t("avatars.patient"),
        specialty: u.doctor?.specialty,
        license: u.doctor?.licenseNumber,
        patientId: u.patient?.id,
        permissions: [],
      };
    },
    [t],
  );

  useEffect(() => {
    let mounted = true;
    async function loadUsers() {
      try {
        const data = await apiRequest("/api/admin/users");
        const list = Array.isArray(data) ? data : data?.users || [];
        const mapped = list.map(mapServerUser);
        if (mounted) setUsers(mapped);
      } catch (err) {
        showError(String(err?.message || t("errors.loadFailed")));
      }
    }

    loadUsers();
    return () => {
      mounted = false;
    };
  }, [locale, t, showError, mapServerUser]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });

  const [showPassword, setShowPassword] = useState(false);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        search === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.phone.includes(search);

      const matchesRole = filterRole === "all" || user.role === filterRole;
      const matchesStatus =
        filterStatus === "all" || user.status === filterStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  const stats = [
    {
      title: t("stats.totalUsers"),
      value: users.length,
      icon: UsersIcon,
    },
    {
      title: t("stats.admins"),
      value: users.filter((u) => u.role === "admin").length,
      icon: UserCogIcon,
    },
    {
      title: t("stats.doctors"),
      value: users.filter((u) => u.role === "doctor").length,
      icon: BriefcaseMedicalIcon,
    },
    {
      title: t("stats.patients"),
      value: users.filter((u) => u.role === "patient").length,
      icon: UserRoundIcon,
    },
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-(--ui-info-bg) text-(--ui-info) border-(--ui-info-border)";
      case "doctor":
        return "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)";
      case "patient":
        return "bg-(--ui-info-bg) text-(--ui-info) border-(--ui-info-border)";
      default:
        return "bg-(--ui-surface-2) text-(--ui-muted-2) border-(--ui-border)";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-(--ui-success-bg) text-(--ui-success) border-(--ui-success-border)";
      case "suspended":
        return "bg-(--ui-warning-bg) text-(--ui-warning) border-(--ui-warning-border)";
      case "banned":
        return "bg-(--ui-danger-bg) text-(--ui-danger) border-(--ui-danger-border)";
      default:
        return "bg-(--ui-surface-2) text-(--ui-muted-2) border-(--ui-border)";
    }
  };

  const handleAddUser = async () => {
    if (submitting) return;
    if (
      !formData.name?.trim() ||
      !formData.email?.trim() ||
      !formData.password?.trim()
    ) {
      showError(t("errors.createAdminFailed"));
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          status: "active",
        }),
      });

      const uiUser = mapServerUser({
        ...created,
        fullName: created?.fullName || formData.name.trim(),
        email: created?.email || formData.email.trim(),
        role: created?.role || "admin",
        isActive: created?.isActive !== undefined ? created.isActive : true,
      });

      setUsers((prev) => [uiUser, ...prev.filter((u) => u.id !== uiUser.id)]);
      setShowAddModal(false);
      setShowPassword(false);
      setFormData({ name: "", email: "", password: "", role: "admin" });
      showSuccess(t("messages.adminCreated"));
    } catch (err) {
      showError(err?.message || t("errors.createAdminFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailsModal = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleToggleUser = async () => {
    if (!selectedUser || submitting) return;
    setSubmitting(true);
    try {
      const targetIsActive = !selectedUser.isActive;
      const res = await apiRequest(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: targetIsActive }),
      });

      const serverUser = res?.user;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== selectedUser.id) return u;
          if (serverUser) {
            return mapServerUser(serverUser);
          }
          return {
            ...u,
            isActive: targetIsActive,
            status: targetIsActive ? "active" : "banned",
          };
        }),
      );
      setShowDeleteModal(false);
      setSelectedUser(null);
      showSuccess(
        targetIsActive ? t("toast.userAdded") : t("toast.userDeleted"),
      );
    } catch (err) {
      showError(err?.message || t("errors.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-(--ui-muted-2) mt-2">{t("subtitle")}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddModal(true)}>
              <PlusIcon />
              <span>{t("addButton")}</span>
            </Button>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="pd-panel pd-shape-asymmetric shadow-(--shadow-soft) p-6 border border-(--ui-border)"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 pd-shape-orbital brand-gradient shadow-(--shadow-soft)">
                  <stat.icon className="text-2xl text-[var(--pd-on-accent)]" />
                </div>
                <div>
                  <p className="text-(--ui-muted-2) text-sm">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="pd-panel pd-shape-layered shadow-(--shadow-soft) p-6 mb-8 border border-(--ui-border)">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-(--ui-muted-2)" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground focus:ring-2 focus:ring-(--ui-ring) focus:border-transparent"
              />
            </div>
            <GlideSelect
              fullWidth
              size="lg"
              value={filterRole}
              onChange={(val) => setFilterRole(val)}
              options={[
                { value: "all", label: t("filters.allRoles") },
                { value: "admin", label: t("roles.admin") },
                { value: "doctor", label: t("roles.doctor") },
                { value: "patient", label: t("roles.patient") },
              ]}
            />
            <GlideSelect
              fullWidth
              size="lg"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val)}
              options={[
                { value: "all", label: t("filters.allStatuses") },
                { value: "active", label: t("statuses.active") },
                { value: "banned", label: t("statuses.banned") },
              ]}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="pd-panel pd-shape-organic shadow-(--shadow-soft) border border-(--ui-border) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-(--ui-surface-2) border-b border-(--ui-border)">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                    {t("table.user")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                    {t("table.role")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                    {t("table.status")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                    {t("table.joinDate")}
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-foreground">
                    {t("table.lastLogin")}
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-foreground">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--ui-border)">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-(--ui-surface-2) transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{user.avatar}</div>
                        <div>
                          <p className="font-bold text-foreground">
                            {user.name}
                          </p>
                          <p className="text-sm text-(--ui-muted-2)">
                            {user.email}
                          </p>
                          <p className="text-sm text-(--ui-muted-2)">
                            {user.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}
                      >
                        {t(`roles.${user.role}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(user.status)}`}
                      >
                        {t(`statuses.${user.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-(--ui-muted-2)">
                      {user.joinDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-(--ui-muted-2)">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetailsModal(user)}
                          className="p-2 text-(--ui-info) hover:bg-(--ui-info-bg) rounded-lg transition-colors"
                          title={t("actions.viewDetails")}
                        >
                          <EyeIcon />
                        </button>
                        {/* Toggle Active/Banned */}
                        <button
                          onClick={() => openDeleteModal(user)}
                          className={`p-2 rounded-lg transition-colors ${user.isActive ? "text-(--ui-danger) hover:bg-(--ui-danger-bg)" : "text-(--ui-success) hover:bg-(--ui-success-bg)"}`}
                          title={
                            user.isActive
                              ? t("modal.confirmDisable")
                              : t("modal.confirmEnable")
                          }
                        >
                          {user.isActive ? (
                            <CircleXIcon />
                          ) : (
                            <CircleCheckIcon />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Admin Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
            <div className="pd-panel pd-shape-asymmetric shadow-(--shadow-lift) max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  {t("modal.addTitle")}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-(--ui-surface-2) rounded-lg"
                >
                  <XIcon className="text-(--ui-muted-2)" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {t("form.fullName")}
                  </label>
                  <input
                    type="text"
                    id="add-user-name"
                    name="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {t("form.email")}
                  </label>
                  <input
                    type="email"
                    id="add-user-email"
                    name="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-(--ui-muted-2) mb-2">
                    {t("form.password")}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="add-user-password"
                      name="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`w-full px-4 py-3 border border-(--ui-border) rounded-lg bg-(--ui-surface-2) text-foreground ${isRTL ? "pr-10" : "pl-10"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-(--ui-muted-2) p-1`}
                      title={
                        showPassword
                          ? t("actions.hidePassword")
                          : t("actions.showPassword")
                      }
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddUser}
                  disabled={submitting}
                  isLoading={submitting}
                  fullWidth
                >
                  <SaveIcon />
                  <span>{t("modal.add")}</span>
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  disabled={submitting}
                  onClick={() => setShowAddModal(false)}
                >
                  {t("modal.cancel")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedUser && (
          <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
            <div className="pd-panel pd-shape-layered shadow-(--shadow-lift) max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  {t("modal.detailsTitle")}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-(--ui-surface-2) rounded-lg"
                >
                  <XIcon className="text-(--ui-muted-2)" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 p-4 bg-(--ui-surface-2) border border-(--ui-border) rounded-lg">
                <div className="text-5xl">{selectedUser.avatar}</div>
                <div>
                  <h4 className="text-2xl font-bold text-foreground">
                    {selectedUser.name}
                  </h4>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${getRoleColor(selectedUser.role)}`}
                    >
                      {t(`roles.${selectedUser.role}`)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(selectedUser.status)}`}
                    >
                      {t(`statuses.${selectedUser.status}`)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-(--ui-surface-2) border border-(--ui-border) rounded-lg">
                  <div className="flex items-center gap-2 text-(--ui-muted-2) mb-1">
                    <MailIcon />
                    <span className="text-sm">{t("details.email")}</span>
                  </div>
                  <p className="font-medium text-foreground">
                    {selectedUser.email}
                  </p>
                </div>

                <div className="p-4 bg-(--ui-surface-2) border border-(--ui-border) rounded-lg">
                  <div className="flex items-center gap-2 text-(--ui-muted-2) mb-1">
                    <PhoneIcon />
                    <span className="text-sm">{t("details.phone")}</span>
                  </div>
                  <p className="font-medium text-foreground">
                    {selectedUser.phone}
                  </p>
                </div>

                <div className="p-4 bg-(--ui-surface-2) border border-(--ui-border) rounded-lg">
                  <div className="flex items-center gap-2 text-(--ui-muted-2) mb-1">
                    <CalendarDaysIcon />
                    <span className="text-sm">{t("details.joinDate")}</span>
                  </div>
                  <p className="font-medium text-foreground">
                    {selectedUser.joinDate}
                  </p>
                </div>

                <div className="p-4 bg-(--ui-surface-2) border border-(--ui-border) rounded-lg">
                  <div className="flex items-center gap-2 text-(--ui-muted-2) mb-1">
                    <ClockIcon />
                    <span className="text-sm">{t("details.lastLogin")}</span>
                  </div>
                  <p className="font-medium text-foreground">
                    {selectedUser.lastLogin}
                  </p>
                </div>
              </div>

              {selectedUser.role === "doctor" && (
                <div className="mt-4 p-4 bg-(--ui-info-bg) border border-(--ui-info-border) rounded-lg">
                  <h5 className="font-bold text-(--ui-info) mb-2">
                    {t("details.doctorInfo")}
                  </h5>
                  <p className="text-sm text-(--ui-muted-2)">
                    {t("details.specialty")}: {selectedUser.specialty}
                  </p>
                  <p className="text-sm text-(--ui-muted-2)">
                    {t("details.license")}: {selectedUser.license}
                  </p>
                </div>
              )}

              {selectedUser.role === "patient" && (
                <div className="mt-4 p-4 bg-(--ui-success-bg) border border-(--ui-success-border) rounded-lg">
                  <h5 className="font-bold text-(--ui-success) mb-2">
                    {t("details.patientInfo")}
                  </h5>
                  <p className="text-sm text-(--ui-muted-2)">
                    {t("details.patientId")}: {selectedUser.patientId}
                  </p>
                </div>
              )}

              {selectedUser.permissions && (
                <div className="mt-4 p-4 bg-(--ui-surface-2) border border-(--ui-border) rounded-lg">
                  <h5 className="font-bold text-foreground mb-2">
                    {t("details.permissions")}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-(--ui-surface) border border-(--ui-border) text-foreground rounded-full text-xs"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-(--color-neutral)/50 flex items-center justify-center z-50 p-4">
            <div className="pd-panel pd-shape-organic shadow-(--shadow-lift) max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {selectedUser.isActive
                    ? t("modal.toggleDisableTitle")
                    : t("modal.toggleEnableTitle")}
                </h3>
                <p className="text-(--ui-muted-2)">
                  {selectedUser.isActive
                    ? t("modal.toggleDisableMessage")
                    : t("modal.toggleEnableMessage")}{" "}
                  <span className="font-bold">{selectedUser.name}</span>?{" "}
                  {selectedUser.isActive
                    ? t("modal.toggleDisableWarning")
                    : t("modal.toggleEnableWarning")}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleToggleUser}
                  className={`flex-1 ${selectedUser.isActive ? "bg-(--ui-danger) text-[var(--pd-on-accent)] hover:opacity-90" : "bg-(--ui-success) text-[var(--pd-on-accent)] hover:opacity-90"} px-4 py-3 rounded-lg transition-colors font-medium`}
                >
                  {selectedUser.isActive
                    ? t("modal.confirmDisable")
                    : t("modal.confirmEnable")}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-(--ui-surface-2) hover:bg-(--ui-surface) text-foreground px-4 py-3 rounded-lg transition-colors border border-(--ui-border)"
                >
                  {t("modal.cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}