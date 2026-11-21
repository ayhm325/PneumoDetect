export function formatActivityDescription(activity, locale) {
  const isEnglish = String(locale || "")
    .toLowerCase()
    .startsWith("en");

  const type = activity?.type || "";
  const description =
    typeof activity?.description === "string" ? activity.description : "";
  const meta =
    activity?.meta && typeof activity.meta === "object" ? activity.meta : {};

  const detailsFromMeta =
    meta?.fullName && meta?.email
      ? `${meta.fullName} (${meta.email})`
      : meta?.name && meta?.email
        ? `${meta.name} (${meta.email})`
        : meta?.fullName
          ? String(meta.fullName)
          : "";

  const stripPrefix = (text) => {
    const s = String(text || "").trim();
    const idx = s.indexOf(":");
    if (idx === -1) return s;
    return s.slice(idx + 1).trim();
  };

  const details = detailsFromMeta || stripPrefix(description) || description;

  switch (type) {
    case "login":
      return isEnglish ? `Login: ${details}` : `تسجيل دخول: ${details}`;
    case "register":
      return isEnglish
        ? `New user registered: ${details}`
        : `تسجيل مستخدم جديد: ${details}`;
    case "add_doctor":
      return isEnglish
        ? `Added doctor: ${details}`
        : `إضافة طبيب جديد: ${details}`;
    case "approve_doctor":
      return isEnglish
        ? `Approved doctor: ${details}`
        : `تمت الموافقة على طبيب: ${details}`;
    case "reject_or_delete_doctor":
      return isEnglish
        ? `Rejected/removed doctor: ${details}`
        : `تم رفض أو حذف طبيب: ${details}`;
    case "update_doctor":
      return isEnglish
        ? `Updated doctor: ${details}`
        : `تم تحديث طبيب: ${details}`;
    case "block_doctor":
      return isEnglish
        ? `Blocked doctor: ${details}`
        : `تم حظر طبيب: ${details}`;
    default: {
      // If stored description uses the other locale's prefix, normalize the prefix.
      if (isEnglish && /^\s*تسجيل\s+دخول\s*:/u.test(description)) {
        return `Login: ${details}`;
      }
      if (!isEnglish && /^\s*Login\s*:/i.test(description)) {
        return `تسجيل دخول: ${details}`;
      }
      return description;
    }
  }
}