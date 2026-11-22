import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoginRequestSchema, type LoginRequest } from "@pneumodetect/contracts";
import { useAuth } from "@/stores/authStore";
import { ApiClientError } from "@/lib/apiClient";
import { formatAuthError } from "@/lib/authErrorMap";

export function LoginPage() {
  const { t, i18n } = useTranslation("login");
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
  });

  const onSubmit = async (values: LoginRequest) => {
    setServerError(null);
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
      setServerError(formatAuthError(err, isAr));
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          {t("title", isAr ? "تسجيل الدخول" : "Sign In")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("subtitle", isAr ? "ادخل إلى حسابك في PneumoDetect" : "Access your PneumoDetect portal")}
        </p>

        {serverError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("email", isAr ? "البريد الإلكتروني" : "Email")}
            </label>
            <input
              type="email"
              {...register("email")}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="name@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("password", isAr ? "كلمة المرور" : "Password")}
            </label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {isSubmitting
              ? isAr
                ? "جاري الدخول..."
                : "Signing in..."
              : t("submit", isAr ? "دخول" : "Sign In")}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <Link to="/forgot-password" className="hover:underline">
            {isAr ? "نسيت كلمة المرور؟" : "Forgot password?"}
          </Link>
          <Link to="/signup" className="font-semibold text-sky-600 hover:underline">
            {isAr ? "إنشاء حساب" : "Create account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
