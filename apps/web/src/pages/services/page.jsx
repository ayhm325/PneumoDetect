import React from "react";
import { CpuIcon, FileHeartIcon, ScanLineIcon, ShieldCheckIcon, StethoscopeIcon } from "lucide-react";
import Link from "@/lib/compat/Link";
import { useTranslations } from "@/lib/compat/intl";
import { ContentPageLayout } from "@/components/layouts/ContentPageLayout";
import { Surface } from "@/components/ui";

const SERVICE_ICONS = [ScanLineIcon, CpuIcon, StethoscopeIcon, ShieldCheckIcon, FileHeartIcon];
const SERVICE_SHAPES = ["arch", "slanted", "layered", "asymmetric"];

export default function ServicesPage() {
  const t = useTranslations("services");
  const rawList = t.raw("list");
  const services = Array.isArray(rawList) ? rawList : [];

  return (
    <div className="mx-auto max-w-6xl py-6 sm:py-12">
      <ContentPageLayout title={t("title")} subtitle={t("description")}>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10">
          {services.map((service, idx) => {
            const Icon = SERVICE_ICONS[idx % SERVICE_ICONS.length];
            const shape = SERVICE_SHAPES[idx % SERVICE_SHAPES.length];
            const isOdd = idx % 2 === 1;

            return (
              <Surface
                key={idx}
                shape={shape}
                tone={idx === 0 ? "copper" : idx === 2 ? "sage" : "default"}
                interactive
                className={`flex flex-col justify-between gap-6 p-7 sm:p-9 ${
                  shape === "arch" ? "pt-12 text-center items-center" : "items-start"
                } ${isOdd ? "md:mt-8" : ""}`}
              >
                <div
                  className={`flex w-full items-center ${
                    shape === "arch" ? "flex-col gap-3" : "justify-between gap-4"
                  }`}
                >
                  <div className="pd-orb pd-orb--lg pd-shape-orbital pd-orb--copper ring-4 ring-[var(--pd-copper-soft)]">
                    <Icon size={24} strokeWidth={1.6} />
                  </div>
                  <span className="pd-tabular text-xs font-medium tracking-[0.18em] text-[var(--pd-text-muted)]">
                    0{idx + 1}
                  </span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-medium tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)] sm:text-[1.35rem]">
                    {service.name}
                  </h2>
                  <p className="text-[15px] leading-relaxed text-[var(--pd-text-secondary)]">
                    {service.desc}
                  </p>
                </div>
              </Surface>
            );
          })}
        </div>

        <div className="flex justify-center pt-10">
          <Link href="/" className="pd-btn pd-btn--primary pd-btn--lg">
            {t("backHome")}
          </Link>
        </div>
      </ContentPageLayout>
    </div>
  );
}
