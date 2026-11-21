"use client";

import Image from "@/lib/compat/Image";
import { useTranslations } from "@/lib/compat/intl";

function isImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  const imageExt = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i;
  if (imageExt.test(url)) return true;
  if (url.startsWith("/uploads") || url.includes("s3.amazonaws.com"))
    return true;
  return false;
}

export default function ChatMessage({ message, isDoctor }) {
  const t = useTranslations("adminChat");
  const fileUrl = message.fileUrl || message.file?.url || null;
  const mime = message.mimeType || message.file?.type || null;
  const maybeImage =
    (fileUrl && mime && mime.startsWith("image/")) ||
    isImageUrl(message.text) ||
    (fileUrl && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(fileUrl));
  const imageUrl = fileUrl || (maybeImage && message.text);

  return (
    <div className={`flex ${isDoctor ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-xs rounded-2xl border border-(--ui-border) px-4 py-2 ${
          isDoctor
            ? "bg-(--ui-surface-2) text-foreground"
            : "bg-(--ui-surface) text-foreground"
        }`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={t("attachment")}
            width={400}
            height={300}
            className="max-w-full h-auto rounded"
            unoptimized
          />
        ) : (
          message.text
        )}
        <div className="mt-1 text-xs text-(--ui-muted-2)">{message.time}</div>
      </div>
    </div>
  );
}