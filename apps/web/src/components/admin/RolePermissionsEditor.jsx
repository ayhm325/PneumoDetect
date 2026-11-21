"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function RolePermissionsEditor() {
  const t = useTranslations("adminSettings");

  const roles = ["admin", "doctor", "patient"];
  const permissions = ["read", "write", "edit", "delete"];

  const defaultPerms = {
    admin: permissions,
    doctor: ["read", "write", "edit"],
    patient: ["read"],
  };

  const [selectedRole, setSelectedRole] = useState("admin");
  const [rolePerms, setRolePerms] = useState(defaultPerms);

  const togglePerm = (perm) => {
    setRolePerms((prev) => {
      const perms = prev[selectedRole];
      return {
        ...prev,
        [selectedRole]: perms.includes(perm)
          ? perms.filter((p) => p !== perm)
          : [...perms, perm],
      };
    });
  };

  return (
    <div className="card-glass rounded-2xl p-8 border border-(--ui-border) max-w-xl mx-auto mt-8">
      <h3 className="font-bold text-xl mb-4 text-(--ui-foreground)">
        {t("rolePermissionsEditor.title")}
      </h3>
      <select
        className="mb-4 w-full px-4 py-2 rounded-xl border border-(--ui-border) bg-(--ui-surface) text-(--ui-foreground) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring)"
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {t(`rolePermissionsEditor.roles.${role}`)}
          </option>
        ))}
      </select>
      <div className="flex gap-4 flex-wrap">
        {permissions.map((perm) => (
          <label
            key={perm}
            className="flex items-center gap-2 text-(--ui-foreground)"
          >
            <input
              type="checkbox"
              checked={rolePerms[selectedRole].includes(perm)}
              onChange={() => togglePerm(perm)}
            />
            {t(`rolePermissionsEditor.permissions.${perm}`)}
          </label>
        ))}
      </div>
    </div>
  );
}
