"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserPlus,
  FaCheck,
  FaStethoscope,
  FaBed,
  FaEye,
  FaEyeSlash,
  FaPhone,
  FaHouse,
} from "react-icons/fa6";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useLocaleContext } from "../hooks/useLocaleContext";
import {
  glassContainer,
  iconBubble,
  inputBase,
  inputBasePassword,
  btnPrimary,
  backHomeBtn,
  authText,
  authIcon,
} from "./authStyles";
import AnimatedBackground from "./ui/AnimatedBackground";

// Helper to prefix locale to path
const withLocale = (locale, path) => {
  if (!path.startsWith("/")) path = "/" + path;
  return locale === "ar" || locale === "en"
    ? `/${locale}${path === "/" ? "" : path}`
    : path;
};

export default function SignUpForm() {
  const locale = useLocale();
  const t = useTranslations("signup");
  const { toggleLocale } = useLocaleContext();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "doctor",
    doctorId: "",
    licenseNumber: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");
  const [doctorPickerOpen, setDoctorPickerOpen] = useState(false);
  const doctorPickerRef = useRef(null);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => String(d.id) === String(form.doctorId)),
    [doctors, form.doctorId],
  );

  useEffect(() => {
    if (!doctorPickerOpen) return;
    const onMouseDown = (e) => {
      if (
        doctorPickerRef.current &&
        !doctorPickerRef.current.contains(e.target)
      )
        setDoctorPickerOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [doctorPickerOpen]);

  useEffect(() => {
    if (form.userType !== "patient") return;
    const fetchDoctors = async () => {
      setDoctorsLoading(true);
      setDoctorsError("");
      try {
        const apiPath = `/api/doctor/list${process.env.NEXT_PUBLIC_DEBUG_INCLUDE_PENDING === "true" ? "?includePending=true" : ""}`;
        const res = await fetch(apiPath);
        const data = await res.json();
        if (data.doctors) {
          setDoctors(
            data.doctors.map((doc) => ({
              id: doc.id,
              name: doc.fullName || doc.name || doc.email || doc.id,
              specialty: doc.specialty || "",
              email: doc.email || "",
            })),
          );
        } else setDoctors([]);
      } catch {
        setDoctorsError(t("signup.errors.loadDoctorsFailed"));
      }
      setDoctorsLoading(false);
    };
    fetchDoctors();
  }, [form.userType, locale, t]);

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    symbol: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.password),
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };
  const handleUserTypeChange = (type) => {
    setForm({ ...form, userType: type, doctorId: "" });
    setDoctorPickerOpen(false);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.confirmPassword
    )
      return setError(t("signup.errors.required"));
    if (
      form.userType === "doctor" &&
      (!form.licenseNumber.trim() || !form.phone.trim())
    )
      return setError(t("signup.errors.doctorLicensePhoneRequired"));
    if (form.userType === "patient" && !form.doctorId)
      return setError(t("signup.errors.doctorMissing"));
    if (!Object.values(passwordChecks).every(Boolean))
      return setError(t("signup.errors.weakPassword"));
    if (form.password !== form.confirmPassword)
      return setError(t("signup.errors.mismatch"));

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const apiUrl =
        form.userType === "doctor"
          ? "/api/doctor"
          : withLocale(locale, "/api/patient");
      const payload =
        form.userType === "doctor"
          ? {
              email: form.email,
              password: form.password,
              fullName: form.name,
              licenseNumber: form.licenseNumber,
              phone: form.phone,
            }
          : {
              email: form.email,
              password: form.password,
              fullName: form.name,
              role: form.userType,
              doctorId: form.doctorId,
            };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        const code = data?.errorCode;
        if (code === "EMAIL_ALREADY_USED")
          return setError(t("signup.errors.emailAlreadyUsed"));
        if (code === "PHONE_ALREADY_USED")
          return setError(t("signup.errors.phoneAlreadyUsed"));
        if (code === "LICENSE_ALREADY_USED")
          return setError(t("signup.errors.licenseAlreadyUsed"));
        return setError(data.error || t("signup.errors.registrationFailed"));
      }

      setSuccess(t("signup.success"));
      setTimeout(() => {
        window.location.href = withLocale(locale, "/login");
      }, 2000);
    } catch {
      setLoading(false);
      setError(t("signup.errors.serverConnection"));
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      dir={dir}
      lang={locale}
    >
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className={glassContainer}
          aria-live="polite"
        >
          <div className="mb-8 flex items-center justify-between gap-2">
            <div className="flex flex-col items-center gap-4 flex-1">
              <div className="inline-block p-4 rounded-full">
                <FaUserPlus className={`text-4xl ${authIcon}`} />
              </div>
              <div className="text-center">
                <h2 className={`text-3xl font-bold ${authText} mb-1`}>
                  {t("signup.title")}
                </h2>
                <p className={`${authText} text-base`}>
                  {t("signup.subtitle")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={withLocale(locale, "/")} className={backHomeBtn}>
                <FaHouse className={`text-xl ${authIcon}`} />
              </Link>
              <button
                type="button"
                onClick={toggleLocale}
                className={backHomeBtn}
                aria-label={t("ui.switchLanguageShort")}
              >
                <span className={`uppercase text-sm font-semibold ${authIcon}`}>
                  {locale === "ar" ? "EN" : "AR"}
                </span>
              </button>
            </div>
          </div>

          {/* Social login removed per request */}

          <div className="mb-8 text-center">
            <label className={`block text-sm font-semibold ${authText} mb-4`}>
              {t("signup.roleLabel")}
            </label>
            <div className="flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => handleUserTypeChange("doctor")}
                className={`group flex items-center justify-center p-0 rounded-full transition-all duration-300 w-16 h-16 ${form.userType === "doctor" ? "ring-4 ring-[var(--ui-ring)] scale-110 shadow-[var(--shadow-glow)]" : "ring-2 ring-[var(--ui-border-strong)] hover:ring-[var(--ui-ring)]/70 hover:scale-105"}`}
                title={t("signup.doctorRole")}
              >
                <FaStethoscope className={`text-3xl ${authIcon}`} />
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange("patient")}
                className={`group flex items-center justify-center p-0 rounded-full transition-all duration-300 w-16 h-16 ${form.userType === "patient" ? "ring-4 ring-[var(--ui-ring)] scale-110 shadow-[var(--shadow-glow)]" : "ring-2 ring-[var(--ui-border-strong)] hover:ring-[var(--ui-ring)]/70 hover:scale-105"}`}
                title={t("signup.patientRole")}
              >
                <FaBed className={`text-3xl ${authIcon}`} />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className={`block text-sm font-semibold ${authText} mb-3`}>
                {t("signup.nameLabel")} *
              </label>
              <div className="relative">
                <span className={iconBubble}>
                  <FaUser className={`text-lg ${authIcon}`} />
                </span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder={t("signup.namePlaceholder")}
                  className={inputBase}
                />
              </div>
            </div>

            {form.userType === "doctor" && (
              <>
                <div>
                  <label
                    className={`block text-sm font-semibold ${authText} mb-3`}
                  >
                    {t("signup.licenseNumberLabel")} *
                  </label>
                  <div className="relative">
                    <span className={iconBubble}>
                      <FaStethoscope className={`text-lg ${authIcon}`} />
                    </span>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={form.licenseNumber}
                      onChange={handleChange}
                      required
                      placeholder={t("signup.licenseNumberPlaceholder")}
                      className={inputBase}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-sm font-semibold ${authText} mb-3`}
                  >
                    {t("signup.phoneLabel")} *
                  </label>
                  <div className="relative">
                    <span className={iconBubble}>
                      <FaPhone className={`text-lg ${authIcon}`} />
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder={t("signup.phonePlaceholder")}
                      className={inputBase}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className={`block text-sm font-semibold ${authText} mb-3`}>
                {t("signup.emailLabel")} *
              </label>
              <div className="relative">
                <span className={iconBubble}>
                  <FaEnvelope className={`text-lg ${authIcon}`} />
                </span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder={t("signup.emailPlaceholder")}
                  className={inputBase}
                />
              </div>
            </div>

            {form.userType === "patient" && (
              <div>
                <label
                  className={`block text-sm font-semibold ${authText} mb-3`}
                >
                  {t("signup.doctorPickerLabel")} *
                </label>
                {doctorsLoading ? (
                  <div className={`p-3 text-center ${authText}`}>
                    {t("signup.doctorsLoading")}
                  </div>
                ) : doctorsError ? (
                  <div
                    className={`ui-future-chip p-3 flex items-center justify-center gap-2 ${authText} border border-[var(--ui-warning-border)] rounded-md bg-[var(--ui-warning-bg)]`}
                  >
                    <span className="text-[var(--ui-warning)]" aria-hidden="true">
                      ⚠️
                    </span>
                    {doctorsError}
                  </div>
                ) : (
                  <div ref={doctorPickerRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setDoctorPickerOpen(!doctorPickerOpen)}
                      className={`ui-future-panel w-full px-4 py-4 border border-[var(--ui-border)] rounded-xl ${authText} flex items-center justify-between hover:border-[var(--ui-border-strong)] transition`}
                    >
                      <span>
                        {selectedDoctor
                          ? `${selectedDoctor.name}${selectedDoctor.specialty ? ` - ${selectedDoctor.specialty}` : ""}`
                          : t("signup.doctorPlaceholder")}
                      </span>
                      <span className={`${authText}`}>
                        {doctorPickerOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {doctorPickerOpen && (
                      <div className="ui-future-panel absolute z-50 w-full mt-2 max-h-64 overflow-auto border border-[var(--ui-border)] rounded-xl bg-[var(--ui-surface)]/95 backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() => {
                            setForm({ ...form, doctorId: "" });
                            setDoctorPickerOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left ${authText} hover:bg-[var(--ui-surface-2)]`}
                        >
                          {t("signup.doctorPlaceholder")}
                        </button>
                        {doctors.map((doc) => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, doctorId: doc.id });
                              setDoctorPickerOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left ${authText} hover:bg-[var(--ui-surface-2)]`}
                          >
                            {doc.name}
                            {doc.specialty ? ` - ${doc.specialty}` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className={`block text-sm font-semibold ${authText} mb-3`}>
                {t("signup.passwordLabel")} *
              </label>
              <div className="relative">
                <span className={iconBubble}>
                  <FaLock className={`text-lg ${authIcon}`} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder={t("signup.passwordPlaceholder")}
                  className={inputBasePassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${authIcon}`}
                >
                  {showPassword ? (
                    <FaEyeSlash className="text-xl" />
                  ) : (
                    <FaEye className="text-xl" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold ${authText} mb-3`}>
                {t("signup.confirmPasswordLabel")} *
              </label>
              <div className="relative">
                <span className={iconBubble}>
                  <FaLock className={`text-lg ${authIcon}`} />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder={t("signup.confirmPasswordPlaceholder")}
                  className={inputBasePassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${authIcon}`}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="text-xl" />
                  ) : (
                    <FaEye className="text-xl" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--ui-border)] pt-6 space-y-6 mt-6">
            {error && (
              <div
                role="alert"
                className={`ui-future-chip p-3 flex items-center justify-center gap-3 ${authText} border border-[var(--ui-danger-border)] rounded-xl bg-[var(--ui-danger-bg)]`}
              >
                <span className="text-[var(--ui-danger)]" aria-hidden="true">
                  ⚠️
                </span>
                {error}
              </div>
            )}
            {success && (
              <div
                role="status"
                className={`ui-future-chip p-3 flex items-center justify-center gap-3 ${authText} border border-[var(--ui-success-border)] rounded-xl bg-[var(--ui-success-bg)]`}
              >
                <FaCheck className={`${authIcon}`} />
                {success}
              </div>
            )}
            <button
              type="submit"
              disabled={
                loading || !Object.values(passwordChecks).every(Boolean)
              }
              className={btnPrimary}
            >
              {loading ? (
                <span>{t("signup.loading")}</span>
              ) : (
                <>
                  <FaUserPlus className="text-white" />
                  {t("signup.submit")}
                </>
              )}
            </button>

            <div className={`text-center ${authText} text-base mt-2`}>
              {t("signup.haveAccount")}{" "}
              <Link
                href={withLocale(locale, "/login")}
                className={`underline ${authText} hover:text-[var(--color-primary-500)]`}
              >
                {t("signup.loginCta")}
              </Link>
            </div>

            <div className={`text-center ${authText} text-sm mt-4`}>
              {t("signup.termsAgreement")}{" "}
              <Link
                href={withLocale(locale, "/privacy")}
                className={`underline ${authText} hover:text-[var(--color-primary-500)]`}
              >
                {t("signup.privacyPolicy")}
              </Link>{" "}
              {t("signup.and")}{" "}
              <Link
                href={withLocale(locale, "/terms")}
                className={`underline ${authText} hover:text-[var(--color-primary-500)]`}
              >
                {t("signup.termsConditions")}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
