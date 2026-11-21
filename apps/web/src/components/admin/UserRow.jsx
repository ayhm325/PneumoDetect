import RolesBadge from "./RolesBadge";
import { useTranslations } from "@/lib/compat/intl";

export default function UserRow({ user, onEdit, onDelete, onDetails }) {
  const t = useTranslations("adminUsers");
  return (
    <tr className="border-t border-(--ui-border) hover:bg-(--ui-surface-2)/60">
      <td className="py-2 px-4 text-center font-bold">{user.id}</td>
      <td className="py-2 px-4 text-center">{user.name}</td>
      <td className="py-2 px-4 text-center">{user.email}</td>
      <td className="py-2 px-4 text-center">
        <RolesBadge role={user.role} />
      </td>
      <td className="py-2 px-4 flex items-center justify-center gap-3">
        <button
          className="p-2 rounded-lg text-(--ui-info) hover:bg-(--ui-info-bg) transition-colors"
          title={t("actions.edit")}
          onClick={() => onEdit(user)}
        >
          {t("actions.edit")}
        </button>
        <button
          className="p-2 rounded-lg text-(--ui-danger) hover:bg-(--ui-danger-bg) transition-colors"
          title={t("actions.delete")}
          onClick={() => onDelete(user)}
        >
          {t("actions.delete")}
        </button>
        <button
          className="p-2 rounded-lg text-foreground hover:bg-(--ui-surface-2) transition-colors"
          title={t("actions.viewDetails")}
          onClick={() => onDetails(user)}
        >
          {t("actions.viewDetails")}
        </button>
      </td>
    </tr>
  );
}