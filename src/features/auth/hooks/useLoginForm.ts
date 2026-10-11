"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { z } from "zod";
import { ApiClientError } from "../../../lib/api";
import { loginRequest } from "../api/auth.api";
import { loginSchema, type LoginInput } from "../validation/login.schema";

type LoginErrors = Partial<Record<keyof LoginInput, string>> & {
  root?: string;
};

function getLocalizedValidationMessage(locale: string, key: "email" | "password") {
  const isAr = locale === "ar";

  if (key === "email") {
    return isAr ? "يرجى إدخال بريد إلكتروني صحيح" : "Please enter a valid email";
  }

  return isAr ? "يرجى إدخال كلمة المرور" : "Please enter your password";
}

function mapApiErrorMessage(locale: string, message?: string) {
  const isAr = locale === "ar";

  if (!message) {
    return isAr ? "حدث خطأ غير متوقع. حاول مرة أخرى." : "Unexpected error. Please try again.";
  }

  if (message === "invalid_credentials") {
    return isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password";
  }

  if (message === "invalid_content_type" || message === "invalid_json") {
    return isAr ? "صيغة الطلب غير صحيحة" : "Invalid request format";
  }

  return message;
}

function getDashboardPath(locale: string, role: "admin" | "doctor" | "patient") {
  const basePath = locale === "ar" ? "/ar" : "/en";

  switch (role) {
    case "admin":
      return `${basePath}/admin/dashboard`;
    case "doctor":
      return `${basePath}/doctor/dashboard`;
    default:
      return `${basePath}/patient/dashboard`;
  }
}

export function useLoginForm() {
  const locale = useLocale();
  const [values, setValues] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRtl = useMemo(() => locale === "ar", [locale]);

  function setField<K extends keyof LoginInput>(key: K, value: LoginInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, root: undefined }));
  }

  async function submit() {
    setErrors({});

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: LoginErrors = {};
      const zodError = parsed.error as z.ZodError<LoginInput>;

      for (const issue of zodError.issues) {
        const field = issue.path[0] as keyof LoginInput | undefined;
        if (!field) continue;

        if (field === "email") {
          nextErrors.email = getLocalizedValidationMessage(locale, "email");
        } else if (field === "password") {
          nextErrors.password = getLocalizedValidationMessage(locale, "password");
        }
      }

      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginRequest(parsed.data);

      if (typeof window !== "undefined" && result.tokenForDev) {
        (window as Window & { __DEV_TOKEN?: string }).__DEV_TOKEN = result.tokenForDev;
      }

      const destination = getDashboardPath(locale, result.user.role);
      window.location.assign(destination);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors({
          root: mapApiErrorMessage(locale, error.payload?.error || error.message),
        });
      } else {
        setErrors({
          root:
            locale === "ar"
              ? "تعذر الاتصال بالخادم. حاول مرة أخرى."
              : "Unable to reach server. Please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    locale,
    isRtl,
    values,
    errors,
    isSubmitting,
    setField,
    submit,
  };
}
