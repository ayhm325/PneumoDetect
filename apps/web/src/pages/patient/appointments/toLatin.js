// تحويل الأرقام العربية والهندية إلى أرقام لاتينية (0123456789)
export default function toLatin(str) {
  if (!str) return "";
  return String(str).replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const code = d.charCodeAt(0);
    // أرقام عربية
    if (code >= 0x0660 && code <= 0x0669) return code - 0x0660;
    // أرقام هندية
    if (code >= 0x06f0 && code <= 0x06f9) return code - 0x06f0;
    return d;
  });
}