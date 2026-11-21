import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoginRequestSchema, type LoginRequest } from "@pneumodetect/contracts";
import { useAuth } from "@/stores/authStore";
import { ApiClientError } from "@/lib/apiClient";

interface AuthSplitCardProps {
  initialMode?: "login" | "register";
}

export function AuthSplitCard({ initialMode = "login" }: AuthSplitCardProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerNotice, setRegisterNotice] = useState<string | null>(null);

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

  const onRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterNotice(
      isAr
        ? "تم استلام طلب التسجيل. يتم تفعيل الحسابات الطبية عبر إدارة العيادة."
        : "Registration request received. Clinical accounts are activated by clinic administration.",
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[var(--ui-surface-2)] px-4 py-10">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-xl md:min-h-[540px]">
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

        <div className="relative z-10 grid md:min-h-[540px] md:grid-cols-2">
          {/* Left/Start Slot: Hero when login, Register Form when register */}
          <div className="flex flex-col justify-center p-8 sm:p-10">
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
                    ? "ابدأ رحلتك مع التشخيص الذكي لأشعة الصدر ومتابعة طبيبك مباشرة."
                    : "Begin your journey with AI-assisted chest X-ray screening and direct clinical care."}
                </p>
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="mt-7 rounded-xl border border-white/60 bg-white/10 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-[var(--color-primary-900)]"
                >
                  {isAr ? "إنشاء حساب" : "Sign Up"}
                </button>
              </div>
            ) : (
              <form onSubmit={onRegisterSubmit} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-[var(--ui-foreground)]">
                    {isAr ? "إنشاء حساب جديد" : "Create Account"}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--ui-muted)]">
                    {isAr
                      ? "أدخل بياناتك لطلب تفعيل حسابك الطبي"
                      : "Enter your details to request account activation"}
                  </p>
                </div>

                {registerNotice && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {registerNotice}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--ui-foreground)]">
                    {isAr ? "الاسم الكامل" : "Full name"}
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder={isAr ? "الاسم الكامل" : "Full name"}
                    className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3.5 py-2.5 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--ui-foreground)]">
                    {isAr ? "البريد الإلكتروني" : "Email address"}
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3.5 py-2.5 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--ui-foreground)]">
                    {isAr ? "كلمة المرور" : "Password"}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3.5 py-2.5 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[var(--color-primary-500)] py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--color-primary-900)]"
                >
                  {isAr ? "تسجيل حساب" : "Sign Up"}
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

          {/* Right/End Slot: Login Form when login, Hero when register */}
          <div className="flex flex-col justify-center p-8 sm:p-10">
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
                  <label className="mb-1 block text-xs font-semibold text-[var(--ui-foreground)]">
                    {isAr ? "البريد الإلكتروني" : "Email address"}
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    {...register("email")}
                    className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3.5 py-2.5 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--ui-foreground)]">
                    {isAr ? "كلمة المرور" : "Password"}
                  </label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3.5 py-2.5 text-sm text-[var(--ui-foreground)] outline-none transition focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20"
                  />
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
