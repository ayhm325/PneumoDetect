import { NextResponse } from "next/server";
import { getJwtSecret } from "./lib/auth/jwtSecret.js";
const DEBUG_PROXY = process.env.DEBUG_PROXY === "1";

function base64urlDecodeToString(b64url) {
  // Replace URL-safe chars
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  // Pad with '='
  while (b64.length % 4) b64 += "=";
  const bytes = Buffer.from(b64, "base64");
  return bytes.toString("utf8");
}

function base64urlToUint8Array(b64url) {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = Buffer.from(b64, "base64");
  return new Uint8Array(binary);
}

async function verifyHMAC256(token, secret) {
  if (!token) throw new Error("No token");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [headerB64, payloadB64, sigB64] = parts;
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = base64urlToUint8Array(sigB64);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify("HMAC", key, sig, data);
  if (!valid) throw new Error("Invalid signature");
  const payloadJson = JSON.parse(base64urlDecodeToString(payloadB64));
  return payloadJson;
}

function validateJwtClaims(payload) {
  const now = Math.floor(Date.now() / 1000);
  if (payload && typeof payload.nbf === "number" && payload.nbf > now) {
    throw new Error("Token not active");
  }
  if (payload && typeof payload.exp === "number" && payload.exp <= now) {
    throw new Error("Token expired");
  }

  const issuer = process.env.JWT_ISSUER;
  if (issuer && payload?.iss !== issuer) {
    throw new Error("Invalid issuer");
  }

  const audience = process.env.JWT_AUDIENCE;
  if (audience) {
    const aud = payload?.aud;
    const ok = Array.isArray(aud) ? aud.includes(audience) : aud === audience;
    if (!ok) throw new Error("Invalid audience");
  }
}

const locales = ["en", "ar"];
const protectedRoutes = [
  { path: /^\/admin/, roles: ["admin"] },
  { path: /^\/doctor/, roles: ["doctor"] },
  { path: /^\/patient/, roles: ["patient"] },
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Exclude Next.js internals, static files, and public assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  // Rewrite localized API requests like `/en/api/admin/...` -> `/api/admin/...`
  const localeApiMatch = pathname.match(
    /^\/[a-z]{2}\/api\/(admin|doctor|patient)(\/.*|$)/,
  );
  if (localeApiMatch) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/[a-z]{2}\/api/, "/api");
    return NextResponse.rewrite(url);
  }

  // Detect API route
  const isApi = pathname.startsWith("/api");

  // Handle API routes separately: normalize cleanPath by stripping '/api'
  // so '/api/admin/...' becomes '/admin/...', allowing the same RBAC checks below.
  if (isApi) {
    const cleanPath = pathname.replace(/^\/api/, "") || "/";
    // allow empty api root to continue
    // Proceed to protected route lookup using cleanPath
    // Prevent access to empty API root
    if (cleanPath === "/") return NextResponse.next();
    // Attach cleaned path to a local var used below via re-assignment
    request.nextUrl.pathname = pathname; // keep original
    // set variable in scope for later use
    var _cleanPath = cleanPath;
    // Only check protected routes (will look at _cleanPath)
    const routeApi = protectedRoutes.find((r) => r.path.test(_cleanPath));
    if (!routeApi) return NextResponse.next();
    // extract token and run RBAC logic below using _cleanPath
    // (fall through to the main auth logic and use _cleanPath where needed)
  }

  // Locale-based routing for UI routes
  const segments = pathname.split("/");
  const locale = segments[1];
  if (!locales.includes(locale)) {
    // For UI routes, redirect to default locale
    return NextResponse.redirect(new URL(`/en${pathname}`, request.url));
  }

  // Remove locale for RBAC check
  const cleanSegments = segments.slice(2);
  const cleanPath = "/" + cleanSegments.join("/");

  // Prevent access to empty locale root (e.g. /ar)
  if (!isApi && (cleanSegments.length === 0 || cleanSegments[0] === "")) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  // Only check protected routes (use normalized path for API)
  const effectiveCleanPath = isApi ? _cleanPath : cleanPath;
  const route = protectedRoutes.find((r) => r.path.test(effectiveCleanPath));
  if (!route) return NextResponse.next();

  // Get JWT from cookie
  const token = request.cookies.get("token")?.value;
  try {
    if (DEBUG_PROXY) {
      // Debug: log token presence for troubleshooting
      console.log(
        "[proxy] path=",
        pathname,
        "cleanPath=",
        effectiveCleanPath,
        "token=",
        Boolean(token),
      );
    }
  } catch (e) {}
  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }
  // Check revoked tokens using shared helper when possible
  try {
    const { isTokenRevoked } = await import("./lib/auth/revocation.js");
    const revoked = await isTokenRevoked(token, request.url);
    if (revoked) {
      if (isApi)
        return NextResponse.json({ error: "token_revoked" }, { status: 401 });
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  } catch (e) {
    console.error("[proxy] is-revoked check error", e && e.message);
    if (isApi)
      return NextResponse.json(
        { error: "revocation_check_unavailable" },
        { status: 401 },
      );
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  // Security: Lightweight gate for authentication. Distinguishes API vs UI routes.
  // API returns JSON 401/403, UI uses redirects. No inline RBAC.
  let user;
  try {
    const secret = getJwtSecret();
    user = await verifyHMAC256(token, secret);
    validateJwtClaims(user);
    try {
      if (DEBUG_PROXY)
        console.log("[proxy] jwt.verify success, role=", user?.role);
    } catch (e) {}
  } catch (err) {
    try {
      if (DEBUG_PROXY)
        console.log("[proxy] jwt.verify error:", err && err.message);
    } catch (e) {}
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  if (!isApi) {
    if (!route.roles.includes(user.role)) {
      return NextResponse.redirect(
        new URL(`/${locale}/unauthorized`, request.url),
      );
    }
    if (user.isActive === false || user.isDeleted === true) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }
  if (isApi && !route.roles.includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/:locale/admin/:path*",
    "/:locale/doctor/:path*",
    "/:locale/patient/:path*",
    "/admin/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/api/admin/:path*",
    "/api/doctor/:path*",
    "/api/patient/:path*",
    "/:locale/api/admin/:path*",
    "/:locale/api/doctor/:path*",
    "/:locale/api/patient/:path*",
  ],
};
