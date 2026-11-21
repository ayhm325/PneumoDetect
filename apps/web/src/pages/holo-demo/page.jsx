import Hero from "@/components/ui/Hero";
import UnifiedCard from "@/components/ui/UnifiedCard";
import HoloButton from "@/components/ui/HoloButton";
import ScanCard from "@/components/ui/ScanCard";
import NeonBadge from "@/components/ui/NeonBadge";
import { getTranslations } from "next-intl/server";

export default async function HoloDemoPage() {
  const t = await getTranslations("holoDemo");

  return (
    <main className="space-y-10">
      <Hero />
      <section className="mx-auto max-w-5xl px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <UnifiedCard
            title={t("glassCard.title")}
            badge={t("glassCard.badge")}
            glass
          >
            <p>{t("glassCard.description")}</p>
            <div className="mt-4 flex gap-3">
              <HoloButton>{t("glassCard.primaryCta")}</HoloButton>
              <HoloButton variant="outline">
                {t("glassCard.secondaryCta")}
              </HoloButton>
            </div>
          </UnifiedCard>
          <div className="space-y-4">
            <ScanCard
              title={t("scanCards.xrayShoulder.title")}
              status="ready"
              description={t("scanCards.xrayShoulder.description")}
            />
            <ScanCard
              title={t("scanCards.ctChest.title")}
              status="pending"
              description={t("scanCards.ctChest.description")}
            />
          </div>
        </div>
        <div className="mt-6">
          <NeonBadge>{t("accent")}</NeonBadge>
        </div>
      </section>
    </main>
  );
}