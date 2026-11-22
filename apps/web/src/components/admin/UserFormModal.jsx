"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";
import { GlideSelect } from "@/components/ui";

export default function UserFormModal({ open, onClose, onSave, user }) {
  const t = useTranslations("adminUsers");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "admin");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-neutral)/50 p-4 backdrop-blur-sm">
      <form
        className="card-glass p-8 rounded-2xl shadow-(--shadow-lift) min-w-100 max-w-125 w-full flex flex-col gap-5 border border-(--ui-border)"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ name, email, role });
        }}
      >
        <h3 className="font-bold text-2xl mb-2 brand-gradient-text">
          {user ? t("modal.editTitle") : t("modal.addTitle")}
        </h3>
        <input
          type="text"
          className="border border-(--ui-border) rounded-xl px-4 py-3 bg-(--ui-surface-2) text-foreground focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent transition-all outline-none"
          placeholder={t("form.fullName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          className="border border-(--ui-border) rounded-xl px-4 py-3 bg-(--ui-surface-2) text-foreground focus:ring-4 focus:ring-(--ui-ring)/20 focus:border-transparent transition-all outline-none"
          placeholder={t("form.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <GlideSelect
          fullWidth
          size="lg"
          value={role}
          onChange={(val) => setRole(val)}
          options={[{ value: "admin", label: t("roles.admin") }]}
        />
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 btn-gradient font-semibold rounded-xl transition-transform"
          >
            {user ? t("modal.saveChanges") : t("modal.add")}
          </button>
          <button
            type="button"
            className="flex-1 px-6 py-3 bg-(--ui-surface-2) hover:bg-(--ui-surface) text-foreground border border-(--ui-border) font-semibold rounded-xl transition-colors"
            onClick={onClose}
          >
            {t("modal.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}