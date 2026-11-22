import { BedDoubleIcon, EyeIcon, EyeOffIcon, StethoscopeIcon } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoginRequestSchema, type LoginRequest } from "@pneumodetect/contracts";
import { useAuth } from "@/stores/authStore";
import { apiRequest, ApiClientError } from "@/lib/apiClient";
import { formatAuthError } from "@/lib/authErrorMap";
import { Button, GlideSelect } from "@/components/ui";

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

  const { data: doctorsData, isLoading: doctorsLoading } = useQuery({
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
      setLoginError(formatAuthError(err, isAr));
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

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[var(--pd-canvas)] px-4 py-8">
      <div className="pd-card pd-card--cream relative w-full max-w-5xl overflow-hidden !p-0 shadow-[var(--pd-shadow-float)] md:min-h-[640px]">
        {/* Sliding editorial panel on desktop */}
        <div
          aria-hidden="true"
          className={`pd-card pd-card--olive pointer-events-none absolute inset-y-0 start-0 hidden w-1/2 overflow-hidden !rounded-none !border-0 !border-e !border-[var(--pd-line)] !p-0 transition-transform duration-700 ease-out md:block ${
            isRegister
              ? isAr
                ? "-translate-x-full"
                : "translate-x-full"
              : "translate-x-0"
          }`}
        >
          <div className="pd-grid-bg absolute inset-0 opacity-60" />
          <div className="absolute -top-24 -end-24 h-72 w-72 rounded-full bg-[var(--pd-acid-soft)] blur-3xl" />
          <div className="absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-[var(--pd-orchid-soft)] blur-3xl" />
        </div>

        <div className="relative z-10 grid md:min-h-[640px] md:grid-cols-2">
          {/* Slot 1: Editorial invite when login, Register Form when register */}
          <div className="flex flex-col justify-center p-6 sm:p-10">
            {!isRegister ? (
              <div className="hidden flex-col items-start justify-center text-[#faf0e1] md:flex">
                <div className="flex items-center gap-2.5">
                  <span className="pd-orb pd-orb--sm pd-orb--acid">
                    <StethoscopeIcon size={16} strokeWidth={1.7} />
                  </span>
                  <span className="pd-eyebrow text-[#faf0e1]">PneumoDetect</span>
                </div>
                <h2 className="mt-6 text-[length:var(--text-3xl)] font-semibold leading-tight tracking-[var(--tracking-heading)] text-[#faf0e1]">
                  {isAr ? "أهلاً بك في منصتنا الطبية" : "Clinical imaging, refined."}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#faf0e1]/90">
                  {isAr
                    ? "أنشئ حساب مريض أو طبيب للبدء في تحليل أشعة الصدر بالذكاء الاصطناعي والمتابعة الطبية."
                    : "Create a Patient or Doctor account to start AI chest X-ray screening and clinical follow-up."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="pd-feature__action mt-7"
                >
                  {isAr ? "إنشاء حساب جديد" : "Sign Up"}
                </button>
              </div>
            ) : (
              <form onSubmit={onRegisterSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <span className="pd-eyebrow pd-eyebrow--orchid">
                    {isAr ? "حساب جديد" : "Onboarding"}
                  </span>
                  <h2 className="text-[length:var(--text-2xl)] font-semibold tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]">
                    {isAr ? "إنشاء حساب جديد" : "Create Account"}
                  </h2>
                  <p className="text-xs text-[var(--pd-text-muted)]">
                    {isAr ? "اختر نوع الحساب وأكمل بياناتك" : "Select your role and fill in your details"}
                  </p>
                </div>

                {/* Role Switcher */}
                <div className="pd-segmented grid w-full grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setUserType("patient")}
                    className={`pd-chip justify-center !border-0 ${
                      userType === "patient" ? "pd-chip--active" : ""
                    }`}
                  >
                    <BedDoubleIcon size={15} strokeWidth={1.7} />
                    <span>{isAr ? "مريض" : "Patient"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("doctor")}
                    className={`pd-chip justify-center !border-0 ${
                      userType === "doctor" ? "pd-chip--active" : ""
                    }`}
                  >
                    <StethoscopeIcon size={15} strokeWidth={1.7} />
                    <span>{isAr ? "طبيب" : "Doctor"}</span>
                  </button>
                </div>

                {regError && (
                  <div className="rounded-[var(--shape-leaf)] border border-[color-mix(in_srgb,var(--pd-coral)_38%,transparent)] bg-[var(--pd-coral-soft)] px-3.5 py-2.5 text-xs font-medium text-[var(--pd-coral)]">
                    {regError}
                  </div>
                )}

                {regSuccess && (
                  <div className="rounded-[var(--shape-leaf)] border border-[color-mix(in_srgb,var(--pd-success)_38%,transparent)] bg-[var(--pd-moss-soft)] px-3.5 py-2.5 text-xs font-medium text-[var(--pd-success)]">
                    {regSuccess}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="pd-label">{isAr ? "الاسم الكامل" : "Full name"}</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isAr ? "الاسم الثلاثي" : "Full name"}
                      className="pd-field"
                    />
                  </div>
                  <div>
                    <label className="pd-label">{isAr ? "رقم الهاتف" : "Phone"}</label>
                    <input
                      type="tel"
                      required={userType === "doctor"}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07xxxxxxxx"
                      className="pd-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="pd-label">{isAr ? "البريد الإلكتروني" : "Email address"}</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pd-field"
                  />
                </div>

                {userType === "doctor" ? (
                  <div>
                    <label className="pd-label">
                      {isAr ? "رقم الترخيص الطبي" : "Medical License Number"}
                    </label>
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder={isAr ? "مثال: MED-12345" : "e.g. MED-12345"}
                      className="pd-field"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="pd-label">
                      {isAr ? "اختر الطبيب المشرف" : "Select Supervising Doctor"}
                    </label>
                    <GlideSelect
                      fullWidth
                      size="lg"
                      value={doctorId}
                      onChange={(val) => setDoctorId(val)}
                      options={[
                        {
                          value: "",
                          label: doctorsLoading
                            ? isAr
                              ? "جاري تحميل الأطباء..."
                              : "Loading doctors..."
                            : doctors.length === 0
                              ? isAr
                                ? "لا يوجد أطباء متاحون حالياً"
                                : "No active doctors available"
                              : isAr
                                ? "— اختر طبيباً —"
                                : "— Select a doctor —",
                        },
                        ...doctors.map((doc) => ({
                          value: String(doc.id),
                          label: `${doc.fullName || doc.name || doc.email}${
                            doc.specialty ? ` (${doc.specialty})` : ""
                          }`,
                        })),
                      ]}
                    />
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="pd-label">{isAr ? "كلمة المرور" : "Password"}</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pd-field pe-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((s) => !s)}
                        aria-label="Toggle password visibility"
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--pd-text-muted)] hover:text-[var(--pd-acid)]"
                      >
                        {showRegPassword ? <EyeOffIcon size={16} strokeWidth={1.7} /> : <EyeIcon size={16} strokeWidth={1.7} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="pd-label">
                      {isAr ? "تأكيد كلمة المرور" : "Confirm password"}
                    </label>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pd-field"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isLoading={regSubmitting}
                  loadingText={isAr ? "جاري إنشاء الحساب..." : "Creating account..."}
                >
                  {isAr ? "إنشاء الحساب" : "Sign Up"}
                </Button>

                <p className="text-center text-xs text-[var(--pd-text-muted)] md:hidden">
                  {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="font-semibold text-[var(--pd-acid)] hover:underline"
                  >
                    {isAr ? "تسجيل الدخول" : "Login"}
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Slot 2: Login Form when login, Editorial invite when register */}
          <div className="flex flex-col justify-center p-6 sm:p-10">
            {isRegister ? (
              <div className="hidden flex-col items-start justify-center md:flex">
                <div className="flex items-center gap-2.5">
                  <span className="pd-orb pd-orb--sm pd-orb--acid">
                    <StethoscopeIcon size={16} strokeWidth={1.7} />
                  </span>
                  <span className="pd-eyebrow">PneumoDetect</span>
                </div>
                <h2 className="mt-6 text-[length:var(--text-3xl)] font-semibold leading-tight tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]">
                  {isAr ? "مرحباً بعودتك" : "Welcome back"}
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--pd-text-secondary)]">
                  {isAr
                    ? "سجّل دخولك لمتابعة أحدث نتائج الأشعة والمواعيد الطبية."
                    : "Login to review your latest X-ray analyses and appointments."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="pd-btn pd-btn--outline mt-7"
                >
                  {isAr ? "تسجيل الدخول" : "Login"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <span className="pd-eyebrow">{isAr ? "الدخول الآمن" : "Portal Access"}</span>
                  <h1 className="text-[length:var(--text-2xl)] font-semibold tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]">
                    {isAr ? "تسجيل الدخول" : "Sign In"}
                  </h1>
                  <p className="text-xs text-[var(--pd-text-muted)]">
                    {isAr
                      ? "ادخل إلى بوابة المريض أو الطبيب أو الإدارة"
                      : "Access your Patient, Doctor, or Admin portal"}
                  </p>
                </div>

                {loginError && (
                  <div className="rounded-[var(--shape-leaf)] border border-[color-mix(in_srgb,var(--pd-coral)_38%,transparent)] bg-[var(--pd-coral-soft)] px-3.5 py-2.5 text-xs font-medium text-[var(--pd-coral)]">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="pd-label">{isAr ? "البريد الإلكتروني" : "Email address"}</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    className="pd-field"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-[var(--pd-coral)]">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="pd-label">{isAr ? "كلمة المرور" : "Password"}</label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...register("password")}
                      className="pd-field pe-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((s) => !s)}
                      aria-label="Toggle password visibility"
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-[var(--pd-text-muted)] hover:text-[var(--pd-acid)]"
                    >
                      {showLoginPassword ? <EyeOffIcon size={16} strokeWidth={1.7} /> : <EyeIcon size={16} strokeWidth={1.7} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-[var(--pd-coral)]">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-[var(--pd-text-muted)] transition-colors hover:text-[var(--pd-acid)] hover:underline"
                  >
                    {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
                  </Link>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isSubmitting}
                  loadingText={isAr ? "جاري الدخول..." : "Signing in..."}
                >
                  {isAr ? "دخول" : "Login"}
                </Button>

                <p className="text-center text-xs text-[var(--pd-text-muted)] md:hidden">
                  {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="font-semibold text-[var(--pd-acid)] hover:underline"
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
