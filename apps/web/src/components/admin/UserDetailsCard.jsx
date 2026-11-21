import RolesBadge from "./RolesBadge";
import Button from "../ui/Button";
import { useTranslations } from "@/lib/compat/intl";

export default function UserDetailsCard({ user, onClose }) {
  const tUsers = useTranslations("adminUsers");
  const tCommon = useTranslations("adminCommon");
  if (!user) return null;
  return (
    <div className="card-glass rounded-2xl p-8 border border-(--ui-border) max-w-md mx-auto mt-8">
      <h3 className="font-bold text-xl mb-4 brand-gradient-text">
        {tUsers("modal.detailsTitle")}
      </h3>
      <div className="mb-2">
        <span className="font-bold">{tUsers("details.name")}</span> {user.name}
      </div>
      <div className="mb-2">
        <span className="font-bold">{tUsers("details.email")}</span>{" "}
        {user.email}
      </div>
      <div className="mb-2">
        <span className="font-bold">{tUsers("details.role")}</span>{" "}
        <RolesBadge role={user.role} />
      </div>
      <div className="mt-6">
        <Button variant="primary" className="rounded-xl" onClick={onClose}>
          {tCommon("close")}
        </Button>
      </div>
    </div>
  );
}
