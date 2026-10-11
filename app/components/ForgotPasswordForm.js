"use client";
import { useState } from "react";
import { FaEnvelope, FaShield, FaHouse } from "react-icons/fa6";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useLocaleContext } from "../hooks/useLocaleContext";
import {
  glassContainer,
  iconBubble,
  inputBase,
  btnPrimary,
  backHomeBtn,
  authText,
  authIcon,
} from "./authStyles";
import AnimatedBackground from "./ui/AnimatedBackground";

export default function ForgotPasswordForm() {
  const locale = useLocale();
  const t = useTranslations("forgotpasswordform");
  const { toggleLocale } = useLocaleContext();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const [form, setForm] = useState({ email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add withLocale helper for localized routing
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

    // Simulate sending reset email
    setTimeout(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError(t("errors.invalidEmail"));
        setLoading(false);
        return;
      }

      // Simulate email sent
      setSuccess(true);
      setForm({ email: "" });
      setLoading(false);
    }, 1200);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      dir={dir}
      lang={locale}
    >
      <AnimatedBackground className="fixed inset-0" />

      <div className="relative z-10 w-full max-w-md flex items-center justify-center min-h-[80vh] mx-auto">
        <form
          onSubmit={handleSubmit}
          className={glassContainer}
          aria-live="polite"
        >
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="inline-block p-4 rounded-full" aria-hidden>
              <FaShield className={`text-4xl ${authIcon}`} />
            </div>
            <div className="text-center">
              <h2 className={`text-3xl font-bold ${authText} mb-1`}>
                {t("title")}
              </h2>
              <p className={`${authText} text-base`}>{t("subtitle")}</p>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Link
                href={withLocale("/")}
                className={backHomeBtn}
                title={t("ui.backHomeTitle")}
                aria-label={t("ui.backHomeTitle")}
              >
                <FaHouse className={`text-xl ${authIcon}`} />
              </Link>
              <button
                type="button"
                onClick={toggleLocale}
                className={`${backHomeBtn} ${authIcon}`}
                aria-label={t("ui.switchLanguageShort")}
              >
                <span className={`uppercase text-sm font-semibold ${authIcon}`}>
                  {locale === "ar" ? "EN" : "AR"}
                </span>
              </button>
            </div>
          </div>

          {success && (
            <div
              className={`ui-future-chip p-3 flex items-start gap-3 mt-2 ${authText} border border-[var(--ui-success-border)] rounded-xl bg-[var(--ui-success-bg)]`}
            >
              <span className="text-xl">✅</span>
              <div>
                <p className="font-semibold">{t("successMessage")}</p>
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setForm({ email: "" });
                  }}
                  className="text-sm font-medium hover:underline"
                >
                  {t("tryAnother")}
                </button>
              </div>
            </div>
          )}

          {!success && (
            <>
              <div>
                <label
                  className={`block text-sm font-semibold ${authText} mb-3`}
                >
                  {t("emailLabel")}
                </label>
                <div className="relative">
                  <span className={iconBubble}>
                    <FaEnvelope className={`text-lg ${authIcon}`} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    placeholder={t("emailPlaceholder")}
                    value={form.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={inputBase}
                  />
                </div>
              </div>

              {error && (
                <div
                  className={`ui-future-chip p-3 flex items-center gap-3 mt-4 ${authText} border border-[var(--ui-danger-border)] rounded-xl bg-[var(--ui-danger-bg)]`}
                  role="alert"
                >
                  <span className="text-xl">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`${btnPrimary} mt-6`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${authIcon}`}
                    />
                    {t("loading")}
                  </span>
                ) : (
                  <span className="text-white">{t("submit")}</span>
                )}
              </button>
            </>
          )}

          <div className="flex flex-col gap-3 text-center text-sm mt-6">
            <Link
              href={withLocale("/login")}
              className={`${authIcon} font-semibold hover:text-[var(--color-primary-900)]`}
            >
              {t("backToLogin")}
            </Link>
            <div className={`${authIcon}`}>
              {t("noAccount")}{" "}
              <Link
                href={withLocale("/signup")}
                className={`${authIcon} font-semibold hover:text-[var(--color-primary-900)]`}
              >
                {t("signup")}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
