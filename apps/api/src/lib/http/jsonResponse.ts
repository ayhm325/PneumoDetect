import type { Response } from "express";

export function sendJsonNoStore(res: Response, body: unknown, status = 200) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}
