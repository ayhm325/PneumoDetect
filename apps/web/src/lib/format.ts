/** Shared formatting helpers for user/peer identities. */
export function getInitials(nameOrEmail?: string | null, fallback = "U"): string {
  const raw = String(nameOrEmail || "").trim();
  if (!raw) return fallback;
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase();
}
