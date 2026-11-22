"use client";
import { CircleCheckIcon, HouseIcon, MailIcon, ShieldIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import Link from "@/lib/compat/Link";
import { useLocale, useTranslations } from "@/lib/compat/intl";
import { useLocaleContext } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui";

export default function ForgotPasswordForm() {
  const locale = useLocale();
  const t = useTranslations("forgotpasswordform");
  const { toggleLocale } = useLocaleContext();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const [form, setForm] = useState({ email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const withLocale = (path) => {
    const base = path.startsWith("/") ? path : `/${path}`;
    if (base.startsWith("/en") || base.startsWith("/ar")) return base;
    return `/${locale}${base === "/" ? "" : base}`;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError(t("errors.invalidEmail"));
        setLoading(false);
        return;
      }

      setError(
        locale === "ar"
          ? "خدمة استعادة كلمة المرور عبر البريد الإلكتروني غير مفعلة حالياً. يرجى مراجعة إدارة النظام."
          : "Automated password recovery via email is currently not configured. Please contact system administration.",
      );
      setLoading(false);
    }, 500);
  };

  return (
    <div
      className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[var(--pd-canvas)] p-4"
      dir={dir}
      lang={locale}
    >
      <div className="relative z-10 mx-auto w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="pd-panel pd-panel--feature p-7 sm:p-9 shadow-[var(--pd-shadow-float)]"
          aria-live="polite"
        >
          <div className="mb-7 flex flex-col items-center gap-3.5 text-center">
            <div className="pd-orb pd-orb--lg pd-orb--orchid" aria-hidden>
              <ShieldIcon size={24} strokeWidth={1.7} />
            </div>
            <div>
              <h2 className="text-[length:var(--text-2xl)] font-semibold tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]">
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-[var(--pd-text-secondary)]">{t("subtitle")}</p>
            </div>

            <div className="mt-1 flex items-center gap-2">
              <Link
                href={withLocale("/")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
                title={t("ui.backHomeTitle")}
                aria-label={t("ui.backHomeTitle")}
              >
                <HouseIcon size={16} strokeWidth={1.7} />
              </Link>
              <button
                type="button"
                onClick={toggleLocale}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--pd-line)] bg-[var(--pd-canvas-raised)] px-3 text-xs font-medium uppercase text-[var(--pd-text-secondary)] transition-colors hover:border-[var(--pd-line-strong)] hover:text-[var(--pd-text-primary)]"
                aria-label={t("ui.switchLanguageShort")}
              >
                {locale === "ar" ? "EN" : "AR"}
              </button>
            </div>
          </div>

          {success && (
            <div className="mt-2 flex items-start gap-3 rounded-[var(--shape-leaf)] border border-[color-mix(in_srgb,var(--pd-success)_36%,transparent)] bg-[var(--pd-moss-soft)] p-3.5 text-[var(--pd-success)]">
              <CircleCheckIcon size={18} strokeWidth={1.7} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{t("successMessage")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setForm({ email: "" });
                  }}
                  className="mt-1 text-xs font-medium underline"
                >
                  {t("tryAnother")}
                </button>
              </div>
            </div>
          )}

          {!success && (
            <>
              <div>
                <label className="pd-label">{t("emailLabel")}</label>
                <div className="relative">
                  <span className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[var(--pd-text-muted)]">
                    <MailIcon size={16} strokeWidth={1.7} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder={t("emailPlaceholder")}
                    value={form.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="pd-field ps-10"
                  />
                </div>
              </div>

              {error && (
                <div
                  className="mt-4 flex items-start gap-2.5 rounded-[var(--shape-leaf)] border border-[color-mix(in_srgb,var(--pd-coral)_38%,transparent)] bg-[var(--pd-coral-soft)] p-3.5 text-xs font-medium text-[var(--pd-coral)]"
                  role="alert"
                >
                  <TriangleAlertIcon size={16} strokeWidth={1.7} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                fullWidth
                isLoading={loading}
                loadingText={t("loading")}
                className="mt-6"
              >
                {t("submit")}
              </Button>
            </>
          )}

          <div className="mt-6 flex flex-col gap-2.5 text-center text-sm">
            <Link href={withLocale("/login")} className="font-medium text-[var(--pd-acid)] hover:underline">
              {t("backToLogin")}
            </Link>
            <div className="text-[var(--pd-text-muted)]">
              {t("noAccount")}{" "}
              <Link href={withLocale("/signup")} className="font-medium text-[var(--pd-orchid)] hover:underline">
                {t("signup")}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
