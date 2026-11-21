import { z } from "zod";

export const UploadInitRequestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive().optional(),
});
export type UploadInitRequest = z.infer<typeof UploadInitRequestSchema>;

export const UploadCompleteRequestSchema = z.object({
  key: z.string().min(1),
  fileName: z.string().optional(),
  contentType: z.string().optional(),
});
export type UploadCompleteRequest = z.infer<typeof UploadCompleteRequestSchema>;
