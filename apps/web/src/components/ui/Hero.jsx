"use client";
import BackgroundWrapper from "./BackgroundWrapper";
import HoloButton from "./HoloButton";
import { useTranslations } from "@/lib/compat/intl";
import { useTheme } from "@/lib/compat/theme";

export default function Hero({ className, ...props }) {
  const t = useTranslations("holoDemo");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const heroLightBg = "#F0FAF4";

  const containerClass = ["mx-auto max-w-5xl px-6 py-24 text-center", className]
    .filter(Boolean)
    .join(" ");

  return (
    <BackgroundWrapper
      intensity="none"
      applyLightGradient={false}
      lightBgColor={!isDark ? heroLightBg : null}
    >
      <div className={containerClass} {...props}>
        <h1
          className="text-4xl md:text-6xl font-extrabold tracking-tight holo-sheen"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--color-secondary), var(--color-primary), var(--color-accent))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {t("hero.title")}
        </h1>
        <p className="mt-4 text-lg md:text-xl text-background/90">
          {t("hero.description")}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <HoloButton variant="primary">{t("hero.primaryCta")}</HoloButton>
          <HoloButton variant="outline">{t("hero.secondaryCta")}</HoloButton>
        </div>
      </div>
    </BackgroundWrapper>
  );
}