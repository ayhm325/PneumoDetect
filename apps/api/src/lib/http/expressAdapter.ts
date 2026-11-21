import type { Request as ExpressRequest } from "express";

/**
 * Adapts an Express Request into a Web Request-compatible object for existing
 * domain services (e.g., sessionService, authRequestService) without changing
 * their internal token extraction logic.
 */
export function toServiceRequest(req: ExpressRequest): Request & {
  cookies: { get(name: string): { value?: string } | undefined };
} {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  const expressCookies = (req.cookies || {}) as Record<string, string | undefined>;
  const cookieAdapter = {
    get(name: string) {
      const val = expressCookies[name];
      return val !== undefined ? { value: val } : undefined;
    },
  };

  const fullUrl = `${req.protocol}://${req.get("host") || "localhost"}${req.originalUrl}`;

  return {
    headers,
    url: fullUrl,
    method: req.method,
    cookies: cookieAdapter,
  } as unknown as Request & {
    cookies: { get(name: string): { value?: string } | undefined };
  };
}
