// Arabic month names for Gregorian calendar
const ARABIC_MONTHS = [
  "كانون الثاني", // January
  "شباط", // February
  "آذار", // March
  "نيسان", // April
  "أيار", // May
  "حزيران", // June
  "تموز", // July
  "آب", // August
  "أيلول", // September
  "تشرين الأول", // October
  "تشرين الثاني", // November
  "كانون الأول", // December
];

export function formatArabicDate(date) {
  if (!(date instanceof Date)) return "";
  const day = date.getDate();
  const year = date.getFullYear();
  const month = ARABIC_MONTHS[date.getMonth()];
  // Example: الأربعاء، ١ كانون الثاني ٢٠٢٦
  const weekday = date.toLocaleDateString("ar-JO", { weekday: "long" });
  return `${weekday}، ${day} ${month} ${year}`;
}

export default ARABIC_MONTHS;