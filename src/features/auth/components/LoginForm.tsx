"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaEnvelope, FaEye, FaEyeSlash, FaHouse, FaLock, FaShield } from "react-icons/fa6";
import { useState } from "react";
import { useLocaleContext } from "../../../../app/hooks/useLocaleContext";
import { AuthPageShell } from "../../../components/shared/AuthPageShell";
import { Alert, Button, Card, Input } from "../../../components/ui";
import { useLoginForm } from "../hooks/useLoginForm";

const AnimatedBackground = dynamic(
  () => import("../../../../app/components/ui/AnimatedBackground"),
  { ssr: false },
);

function withLocalePath(locale: string, path: string) {
  const base = path.startsWith("/") ? path : `/${path}`;
  return base.startsWith("/en") || base.startsWith("/ar")
    ? base
    : `/${locale}${base === "/" ? "" : base}`;
}

export function LoginFormFeature() {
  const t = useTranslations("login");
  const { toggleLocale } = useLocaleContext();
  const { locale, isRtl, values, errors, isSubmitting, setField, submit } = useLoginForm();
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submit();
  }

  return (
    <AuthPageShell
      locale={locale}
      dir={isRtl ? "rtl" : "ltr"}
      background={<AnimatedBackground className="fixed inset-0" />}
    >
      <Card className="space-y-6 p-6 sm:p-8">
        <header className="space-y-4 text-center">
          <div className="ui-future-chip mx-auto flex h-14 w-14 items-center justify-center rounded-full">
            <FaShield className="text-xl text-[var(--color-primary-500)]" aria-hidden />
          </div>

          <div>
            <h1 className="brand-gradient-text text-2xl font-bold">{t("auth.login.title")}</h1>
            <p className="mt-1 text-sm text-[var(--ui-muted)]">{t("auth.login.subtitle")}</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Link
              href={withLocalePath(locale, "/")}
              title={t("ui.backHomeTitle")}
              aria-label={t("ui.backHomeTitle")}
              className="ui-future-chip inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--ui-foreground)]"
            >
              <FaHouse aria-hidden />
            </Link>
            <button
              type="button"
              onClick={toggleLocale}
              className="ui-future-chip inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-semibold uppercase text-[var(--ui-foreground)]"
              aria-label={t("ui.switchLanguageShort")}
            >
              {locale === "ar" ? "EN" : "AR"}
            </button>
          </div>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Input
            label={t("auth.login.emailLabel")}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setField("email", event.target.value)}
            placeholder={t("auth.login.emailPlaceholder")}
            startIcon={<FaEnvelope />}
            error={errors.email}
          />

          <Input
            label={t("auth.login.passwordLabel")}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => setField("password", event.target.value)}
            placeholder={t("auth.login.passwordPlaceholder")}
            startIcon={<FaLock />}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="inline-flex items-center justify-center text-[var(--ui-muted)]"
                aria-label={showPassword ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            }
            error={errors.password}
          />

          {errors.root ? <Alert variant="error">{errors.root}</Alert> : null}

          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? t("auth.login.loading") : t("auth.login.ctaPrimary")}
          </Button>
        </form>

        <footer className="space-y-2 text-center text-sm">
          <Link href={withLocalePath(locale, "/forgot-password")} className="text-[var(--color-primary-500)] hover:underline">
            {t("auth.login.forgot")}
          </Link>
          <p className="text-[var(--ui-muted)]">
            {t("auth.login.noAccount")}{" "}
            <Link href={withLocalePath(locale, "/signup")} className="font-semibold text-[var(--color-primary-500)] hover:underline">
              {t("auth.login.goSignup")}
            </Link>
          </p>
        </footer>
      </Card>
    </AuthPageShell>
  );
}
