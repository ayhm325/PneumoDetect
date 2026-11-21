import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaBed, FaEye, FaEyeSlash, FaStethoscope } from "react-icons/fa";
import { LoginRequestSchema, type LoginRequest } from "@pneumodetect/contracts";
import { useAuth } from "@/stores/authStore";
import { apiRequest, ApiClientError } from "@/lib/apiClient";

interface AuthSplitCardProps {
  initialMode?: "login" | "register";
}

interface DoctorOption {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  specialty?: string;
}

export function AuthSplitCard({ initialMode = "login" }: AuthSplitCardProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration state
  const [userType, setUserType] = useState<"patient" | "doctor">("patient");
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const {
    data: doctorsData,
    isLoading: doctorsLoading,
  } = useQuery({
    queryKey: ["public", "doctors-list"],
    queryFn: () => apiRequest<{ doctors?: DoctorOption[] }>("/api/doctor/list"),
    enabled: isRegister && userType === "patient",
  });

  const doctors = doctorsData?.doctors || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  });

  const onLoginSubmit = async (values: LoginRequest) => {
    setLoginError(null);
    try {
      const user = await login(values.email, values.password);
      const target =
        user.role === "admin"
          ? "/admin/dashboard"
          : user.role === "doctor"
            ? "/doctor/dashboard"
            : "/patient/dashboard";
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setLoginError(err.message);
      } else {
        setLoginError(isAr ? "حدث خطأ أثناء تسجيل الدخول" : "Login failed");
      }
    }
  };

  const onRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (regPassword.length < 8) {
      setRegError(isAr ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters");
      return;
    }
    if (regPassword !== confirmPassword) {
      setRegError(isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
      return;
    }
    if (userType === "patient" && !doctorId) {
      setRegError(isAr ? "يرجى اختيار الطبيب المشرف" : "Please select a supervising doctor");
      return;
    }
    if (userType === "doctor" && (!licenseNumber.trim() || !phone.trim())) {
      setRegError(isAr ? "رقم الترخيص الطبي ورقم الهاتف مطلوبان للطبيب" : "License number and phone are required for doctors");
      return;
    }

    setRegSubmitting(true);
    try {
      if (userType === "doctor") {
        await apiRequest("/api/doctor", {
          method: "POST",
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: regEmail.trim(),
            password: regPassword,
            licenseNumber: licenseNumber.trim(),
            phone: phone.trim(),
          }),
        });
      } else {
        await apiRequest("/api/patient", {
          method: "POST",
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: regEmail.trim(),
            password: regPassword,
            phone: phone.trim() || undefined,
            doctorId,
          }),
        });
      }

      setRegSuccess(
        userType === "doctor"
          ? isAr
            ? "تم تسجيل حساب الطبيب بنجاح! الحساب قيد المراجعة والتفعيل من قبل الإدارة."
            : "Doctor account registered! Your account is pending admin approval."
          : isAr
            ? "تم إنشاء حساب المريض بنجاح! بانتظار التفعيل لتتمكن من تسجيل الدخول."
            : "Patient account created! Pending activation before sign in.",
      );
      setFullName("");
      setRegEmail("");
      setPhone("");
      setLicenseNumber("");
      setDoctorId("");
      setRegPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiClientError) {
        setRegError(err.message);
      } else {
        setRegError(isAr ? "فشل إنشاء الحساب" : "Registration failed");
      }
    } finally {
      setRegSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3.5 py-2.5 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[var(--ui-surface-2)] px-4 py-8">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-xl md:min-h-[640px]">
        {/* Animated sliding hero background on desktop */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 start-0 hidden w-1/2 bg-gradient-to-br from-[var(--color-primary-500)] via-indigo-600 to-[var(--color-secondary-500)] transition-transform duration-700 ease-in-out md:block ${
            isRegister
              ? isAr
                ? "-translate-x-full"
                : "translate-x-full"
              : "translate-x-0"
          }`}
        />

        <div className="relative z-10 grid md:min-h-[640px] md:grid-cols-2">
          {/* Slot 1: Hero when login, Register Form when register */}
          <div className="flex flex-col justify-center p-6 sm:p-10">
            {!isRegister ? (
              <div className="hidden flex-col items-start justify-center text-white md:flex">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                  PneumoDetect
                </span>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight">
                  {isAr ? "أهلاً بك في منصتنا الطبية" : "Hello there"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-indigo-50/90">
                  {isAr
                    ? "أنشئ حساب مريض أو طبيب للبدء في تحليل أشعة الصدر بالذكاء الاصطناعي والمتابعة الطبية."
                    : "Create a Patient or Doctor account to start AI chest X-ray screening and clinical follow-up."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="mt-7 rounded-xl border border-white/60 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-[var(--color-primary-900)]"
                >
                  {isAr ? "إنشاء حساب جديد" : "Sign Up"}
                </button>
              </div>
            ) : (
              <form onSubmit={onRegisterSubmit} className="space-y-3.5">
                <div>
                  <h2 className="text-2xl font-extrabold text-[var(--ui-foreground)]">
                    {isAr ? "إنشاء حساب جديد" : "Create Account"}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ui-muted)]">
                    {isAr ? "اختر نوع الحساب وأكمل بياناتك" : "Select your role and fill in your details"}
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--ui-surface-2)] p-1">
                  <button
                    type="button"
                    onClick={() => setUserType("patient")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                      userType === "patient"
                        ? "bg-[var(--color-primary-500)] text-white shadow-xs"
                        : "text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]"
                    }`}
                  >
                    <FaBed />
                    <span>{isAr ? "مريض" : "Patient"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("doctor")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition ${
                      userType === "doctor"
                        ? "bg-[var(--color-primary-500)] text-white shadow-xs"
                        : "text-[var(--ui-muted)] hover:text-[var(--ui-foreground)]"
                    }`}
                  >
                    <FaStethoscope />
                    <span>{isAr ? "طبيب" : "Doctor"}</span>
                  </button>
                </div>

                {regError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                    {regError}
                  </div>
                )}

                {regSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {regSuccess}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {isAr ? "الاسم الكامل" : "Full name"}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isAr ? "الاسم الثلاثي" : "Full name"}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {isAr ? "رقم الهاتف" : "Phone"}
                    </label>
                    <input
                      type="tel"
                      required={userType === "doctor"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07xxxxxxxx"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    {isAr ? "البريد الإلكتروني" : "Email address"}
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </div>

                {userType === "doctor" ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {isAr ? "رقم الترخيص الطبي" : "Medical License Number"}
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder={isAr ? "مثال: MED-12345" : "e.g. MED-12345"}
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {isAr ? "اختر الطبيب المشرف" : "Select Supervising Doctor"}
                    </label>
                    <select
                      required
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">
                        {doctorsLoading
                          ? isAr
                            ? "جاري تحميل الأطباء..."
                            : "Loading doctors..."
                          : doctors.length === 0
                            ? isAr
                              ? "لا يوجد أطباء متاحون حالياً"
                              : "No active doctors available"
                            : isAr
                              ? "— اختر طبيباً —"
                              : "— Select a doctor —"}
                      </option>
                      {doctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.fullName || doc.name || doc.email}
                          {doc.specialty ? ` (${doc.specialty})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {isAr ? "كلمة المرور" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputClass} pe-9`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((s) => !s)}
                        aria-label="Toggle password visibility"
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]"
                      >
                        {showRegPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      {isAr ? "تأكيد كلمة المرور" : "Confirm password"}
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="w-full rounded-xl bg-[var(--color-primary-500)] py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--color-primary-900)] disabled:opacity-60"
                >
                  {regSubmitting
                    ? isAr
                      ? "جاري إنشاء الحساب..."
                      : "Creating account..."
                    : isAr
                      ? "إنشاء الحساب"
                      : "Sign Up"}
                </button>

                <p className="text-center text-xs text-[var(--ui-muted)] md:hidden">
                  {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="font-bold text-[var(--color-primary-500)] hover:underline"
                  >
                    {isAr ? "تسجيل الدخول" : "Login"}
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Slot 2: Login Form when login, Hero when register */}
          <div className="flex flex-col justify-center p-6 sm:p-10">
            {isRegister ? (
              <div className="hidden flex-col items-start justify-center text-white md:flex">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                  PneumoDetect
                </span>
                <h2 className="mt-4 text-3xl font-extrabold leading-tight">
                  {isAr ? "مرحباً بعودتك" : "Welcome back"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-indigo-50/90">
                  {isAr
                    ? "سجّل دخولك لمتابعة أحدث نتائج الأشعة والمواعيد الطبية."
                    : "Login to review your latest X-ray analyses and appointments."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="mt-7 rounded-xl border border-white/60 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-[var(--color-primary-900)]"
                >
                  {isAr ? "تسجيل الدخول" : "Login"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-[var(--ui-foreground)]">
                    {isAr ? "تسجيل الدخول" : "Sign In"}
                  </h1>
                  <p className="mt-1 text-xs text-[var(--ui-muted)]">
                    {isAr
                      ? "ادخل إلى بوابة المريض أو الطبيب أو الإدارة"
                      : "Access your Patient, Doctor, or Admin portal"}
                  </p>
                </div>

                {loginError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    {isAr ? "البريد الإلكتروني" : "Email address"}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    className={inputClass}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    {isAr ? "كلمة المرور" : "Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register("password")}
                      className={`${inputClass} pe-9`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((s) => !s)}
                      aria-label="Toggle password visibility"
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--ui-muted)]"
                    >
                      {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-[var(--ui-muted)] hover:text-[var(--color-primary-500)] hover:underline"
                  >
                    {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[var(--color-primary-500)] py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--color-primary-900)] disabled:opacity-60"
                >
                  {isSubmitting
                    ? isAr
                      ? "جاري الدخول..."
                      : "Signing in..."
                    : isAr
                      ? "دخول"
                      : "Login"}
                </button>

                <p className="text-center text-xs text-[var(--ui-muted)] md:hidden">
                  {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="font-bold text-[var(--color-primary-500)] hover:underline"
                  >
                    {isAr ? "إنشاء حساب" : "Sign Up"}
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthSplitCard;
