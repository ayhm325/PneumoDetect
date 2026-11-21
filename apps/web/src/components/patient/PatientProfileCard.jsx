"use client";

import Image from "@/lib/compat/Image";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientProfileCard({
  fullName,
  age,
  gender,
  patientId,
  healthStatus,
  avatarUrl,
}) {
  const t = useTranslations("patient");
  const ui = useTranslations("ui");
  const placeholder = ui("placeholder");

  const normalizedGender =
    typeof gender === "string" ? gender.toLowerCase() : "";
  const displayGender =
    normalizedGender === "male"
      ? t("profile.field.gender.male")
      : normalizedGender === "female"
        ? t("profile.field.gender.female")
        : gender || placeholder;

  return (
    <section className="card-glass rounded-xl border border-(--ui-border) backdrop-blur-sm shadow-sm p-4 md:p-6">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-(--ui-border) bg-(--ui-surface-2)/40">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName || t("profile.avatarAlt")}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-(--ui-muted-foreground)">
              ??
            </div>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="text-sm text-(--ui-muted-foreground)">
              {t("profile.field.fullName")}
            </div>
            <div className="text-base font-semibold text-(--ui-foreground)">
              {fullName || placeholder}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm text-(--ui-muted-foreground)">
                {t("profile.field.age")}
              </div>
              <div className="text-base font-medium text-(--ui-foreground)">
                {age ?? placeholder}
              </div>
            </div>
            <div>
              <div className="text-sm text-(--ui-muted-foreground)">
                {t("profile.field.genderLabel")}
              </div>
              <div className="text-base font-medium text-(--ui-foreground)">
                {displayGender}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-(--ui-muted-foreground)">
              {t("profile.field.patientNumber")}
            </div>
            <div className="font-mono text-base font-medium text-(--ui-foreground)">
              {patientId || placeholder}
            </div>
          </div>

          <div>
            <div className="text-sm text-(--ui-muted-foreground)">
              {t("profile.field.healthStatus")}
            </div>
            <HealthStatusBadge status={healthStatus} t={t} />
          </div>
        </div>
      </div>
    </section>
  );
}

function HealthStatusBadge({ status, t }) {
  const map = {
    stable: {
      label: t("profile.healthStatus.stable"),
      className:
        "bg-(--ui-success)/12 text-(--ui-success-foreground) ring-(--ui-success)/25",
    },
    attention: {
      label: t("profile.healthStatus.attention"),
      className:
        "bg-(--ui-warning)/12 text-(--ui-warning-foreground) ring-(--ui-warning)/25",
    },
    critical: {
      label: t("profile.healthStatus.critical"),
      className:
        "bg-(--ui-danger)/12 text-(--ui-danger-foreground) ring-(--ui-danger)/25",
    },
  };
  const fallback = {
    label: t("profile.healthStatus.unknown"),
    className:
      "bg-(--ui-surface-2)/60 text-(--ui-muted-foreground) ring-(--ui-border)",
  };
  const { label, className } = map[status] || fallback;

  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  );
}
