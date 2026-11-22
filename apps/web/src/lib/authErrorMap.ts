export function formatAuthError(error: unknown, isAr: boolean): string {
  if (!error) {
    return isAr ? "حدث خطأ أثناء تسجيل الدخول" : "Login failed";
  }

  const rawMessage =
    typeof error === "string"
      ? error
      : (error as { message?: string }).message || "";
  const code = (error as { code?: string }).code || "";
  const status = (error as { status?: number }).status;

  if (
    rawMessage === "invalid_credentials" ||
    code === "unauthenticated" ||
    rawMessage.toLowerCase().includes("invalid credentials")
  ) {
    return isAr
      ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      : "Invalid email or password";
  }

  if (
    rawMessage.includes("حسابك قيد المراجعة") ||
    rawMessage.includes("pending approval")
  ) {
    return isAr
      ? "حسابك قيد المراجعة من قبل الإدارة"
      : "Your account is pending admin approval";
  }

  if (
    rawMessage.includes("الحساب غير مفعل") ||
    rawMessage.includes("Account is inactive")
  ) {
    return isAr
      ? "الحساب غير مفعل، يرجى التواصل مع الإدارة"
      : "Account is inactive, please contact administration";
  }

  if (
    rawMessage.includes("تم رفض طلبك") ||
    rawMessage.includes("banned")
  ) {
    return isAr
      ? "تم رفض الحساب من قبل الإدارة"
      : "Account application was rejected";
  }

  if (
    rawMessage.includes("تم تجاوز الحد الأقصى") ||
    status === 429
  ) {
    return rawMessage;
  }

  if (
    rawMessage === "Failed to load user" ||
    rawMessage === "فشل في تحميل المستخدم" ||
    code === "repository_error" ||
    status === 500
  ) {
    return isAr
      ? "تعذر الاتصال بخادم البيانات، يرجى المحاولة بعد قليل"
      : "Database connection failed, please try again shortly";
  }

  return rawMessage || (isAr ? "حدث خطأ أثناء تسجيل الدخول" : "Login failed");
}
