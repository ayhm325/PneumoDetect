import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function SignupPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">
          {isAr ? "إنشاء حساب جديد" : "Create Account"}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {isAr
            ? "يتم تفعيل حسابات المرضى والأطباء عبر إدارة العيادة لضمان التحقق الطبي."
            : "Patient and doctor accounts are provisioned and activated by clinic administration."}
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          {isAr ? "العودة لتسجيل الدخول" : "Back to Login"}
        </Link>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">
          {isAr ? "استعادة كلمة المرور" : "Reset Password"}
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          {isAr
            ? "تواصل مع مسؤول النظام لإعادة تعيين كلمة المرور أو قم بتغييرها من إعدادات حسابك بعد الدخول."
            : "Contact your clinic administrator to reset your password, or update it from your profile settings after signing in."}
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          {isAr ? "العودة لتسجيل الدخول" : "Back to Login"}
        </Link>
      </div>
    </div>
  );
}
