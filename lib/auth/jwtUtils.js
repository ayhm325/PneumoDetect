// ===============================================
// lib/auth/jwtUtils.js
// دوال موحدة لاستخراج والتحقق من JWT من request
// ===============================================
import { getJwtSecret } from "./jwtSecret.js";
import { getJwtVerifyOptions } from "./jwtClaims.js";
import jwt from "jsonwebtoken";

/**
 * استخراج التوكن من request (كوكيز أو هيدر)
 */
export function extractToken(request) {
  let token = request.cookies?.get?.("token")?.value;
  if (!token) {
    const hdr = request.headers?.get?.("authorization") || request.headers?.get?.("Authorization");
    if (hdr && hdr.startsWith("Bearer ")) token = hdr.slice(7).trim();
  }
  return token || null;
}

/**
 * التحقق من JWT وإرجاع المستخدم أو null
 */
export function verifyJwtToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret(), getJwtVerifyOptions());
  } catch {
    return null;
  }
}

/**
 * استخراج المستخدم من request مباشرة
 */
export function getUserFromRequest(request) {
  const token = extractToken(request);
  return verifyJwtToken(token);
}

// ===============================================
// ملاحظات:
// - استخدم هذه الدوال في جميع API routes لتوحيد منطق استخراج JWT.
// ===============================================
