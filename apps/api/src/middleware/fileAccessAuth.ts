import crypto from "crypto";
import path from "path";
import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.js";
import { prisma } from "../db/prisma.js";
import { getUploadSigningSecret } from "../services/analysis/analysisService.js";

export function getSafeFileName(reqPath: string): string | null {
  try {
    const raw = typeof reqPath === "string" ? reqPath : "";
    const trimmed = raw.startsWith("/") ? raw.slice(1) : raw;
    if (!trimmed) return null;
    const decoded = decodeURIComponent(trimmed);
    if (
      !decoded ||
      decoded === "." ||
      decoded === ".." ||
      decoded.includes("/") ||
      decoded.includes("\\") ||
      decoded.includes("..") ||
      decoded.includes("\0")
    ) {
      return null;
    }
    const base = path.basename(decoded);
    if (!base || base !== decoded || base === "." || base === "..") {
      return null;
    }
    return base;
  } catch {
    return null;
  }
}

export function verifySignedQuery(
  req: AuthenticatedRequest,
  fileName: string,
): { present: boolean; valid: boolean; reason?: string } {
  const hasExp = req.query.exp !== undefined;
  const hasSig = req.query.sig !== undefined;

  if (!hasExp && !hasSig) {
    return { present: false, valid: true };
  }

  if (!hasExp || !hasSig || typeof req.query.exp !== "string" || typeof req.query.sig !== "string") {
    return { present: true, valid: false, reason: "Incomplete signed URL parameters" };
  }

  const exp = req.query.exp.trim();
  const sig = req.query.sig.trim();
  if (!exp || !sig) {
    return { present: true, valid: false, reason: "Incomplete signed URL parameters" };
  }

  if (!/^\d+$/.test(exp)) {
    return { present: true, valid: false, reason: "Invalid signed URL expiration" };
  }

  const expMs = Number(exp);
  if (!Number.isSafeInteger(expMs) || expMs < Date.now()) {
    return { present: true, valid: false, reason: "Signed URL expired" };
  }

  const expected = crypto
    .createHmac("sha256", getUploadSigningSecret())
    .update(`${fileName}:${exp}`)
    .digest("hex");
  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { present: true, valid: false, reason: "Invalid signed URL signature" };
  }

  return { present: true, valid: true };
}

export async function authorizeUploadAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authUser = req.auth?.user;
    if (!authUser?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const fileName = getSafeFileName(req.path);
    if (!fileName) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    const signed = verifySignedQuery(req, fileName);
    if (signed.present && !signed.valid) {
      return res.status(403).json({ error: signed.reason || "Invalid signed URL" });
    }

    if (String(authUser.role || "").toLowerCase() === "admin") {
      return next();
    }

    const prefix = `/uploads/${fileName}`;

    // Check AnalysisResult ownership (patient userId, uploader, or assigned doctor)
    const analysisMatch = await prisma.analysisResult.findFirst({
      where: {
        OR: [
          { imageUrl: prefix },
          { imageUrl: { startsWith: `${prefix}?` } },
        ],
      },
      select: {
        userId: true,
        patientId: true,
        uploadedByUserId: true,
        medicalRecord: {
          select: {
            doctorId: true,
            patient: { select: { userId: true, doctorId: true } },
          },
        },
      },
    });

    if (analysisMatch) {
      const allowed =
        analysisMatch.userId === authUser.id ||
        analysisMatch.uploadedByUserId === authUser.id ||
        analysisMatch.medicalRecord?.doctorId === authUser.id ||
        analysisMatch.medicalRecord?.patient?.userId === authUser.id ||
        analysisMatch.medicalRecord?.patient?.doctorId === authUser.id;
      if (!allowed) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return next();
    }

    // Check MedicalRecord ownership
    const medicalMatch = await prisma.medicalRecord.findFirst({
      where: {
        OR: [
          { imageUrl: prefix },
          { imageUrl: { startsWith: `${prefix}?` } },
        ],
      },
      select: {
        doctorId: true,
        patient: { select: { userId: true, doctorId: true } },
      },
    });

    if (medicalMatch) {
      const allowed =
        medicalMatch.doctorId === authUser.id ||
        medicalMatch.patient?.userId === authUser.id ||
        medicalMatch.patient?.doctorId === authUser.id;
      if (!allowed) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return next();
    }

    // Check Chat message attachment ownership
    const chatMatch = await prisma.message.findFirst({
      where: {
        OR: [
          { fileUrl: prefix },
          { fileUrl: { startsWith: `${prefix}?` } },
        ],
      },
      select: {
        chat: {
          select: {
            doctorId: true,
            patient: { select: { userId: true } },
          },
        },
      },
    });

    if (chatMatch) {
      const allowed =
        chatMatch.chat?.doctorId === authUser.id ||
        chatMatch.chat?.patient?.userId === authUser.id;
      if (!allowed) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return next();
    }

    return res.status(403).json({ error: "Forbidden" });
  } catch (error) {
    next(error);
  }
}

export async function authorizeHeatmapAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authUser = req.auth?.user;
    if (!authUser?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const fileName = getSafeFileName(req.path);
    if (!fileName) {
      return res.status(400).json({ error: "Invalid file path" });
    }

    if (String(authUser.role || "").toLowerCase() === "admin") {
      return next();
    }

    const analysisMatch = await prisma.analysisResult.findFirst({
      where: {
        OR: [
          { heatmapUrl: `/static/heatmaps/${fileName}` },
          { heatmapUrl: { endsWith: `/static/heatmaps/${fileName}` } },
        ],
      },
      select: {
        userId: true,
        uploadedByUserId: true,
        medicalRecord: {
          select: {
            doctorId: true,
            patient: { select: { userId: true, doctorId: true } },
          },
        },
      },
    });

    if (!analysisMatch) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const allowed =
      analysisMatch.userId === authUser.id ||
      analysisMatch.uploadedByUserId === authUser.id ||
      analysisMatch.medicalRecord?.doctorId === authUser.id ||
      analysisMatch.medicalRecord?.patient?.userId === authUser.id ||
      analysisMatch.medicalRecord?.patient?.doctorId === authUser.id;

    if (!allowed) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  } catch (error) {
    next(error);
  }
}
