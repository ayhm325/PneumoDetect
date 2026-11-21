"use client";

import Image from "@/lib/compat/Image";
import { useTranslations } from "@/lib/compat/intl";

function isValidImageUrl(url) {
  // ???? ???? ?? http ?? /
  return (
    typeof url === "string" && (url.startsWith("http") || url.startsWith("/"))
  );
}

export default function AnalysisViewer({ imageUrl }) {
  const t = useTranslations("analysisViewer");
  const noImageText = t("noImage");
  const imageLabel = t("imageLabel");

  if (!imageUrl)
    return (
      <div className="text-center text-(--ui-muted-foreground) py-4">
        {noImageText}
      </div>
    );
  if (!isValidImageUrl(imageUrl)) {
    // ??? ??? ??? ?? ?? ???? ???? ????
    return <div className="text-center text-6xl py-12">{imageUrl}</div>;
  }
  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <div className="relative w-full max-w-3xl h-96">
        <Image
          src={imageUrl}
          alt={imageLabel}
          fill
          sizes="(min-width: 1024px) 768px, 90vw"
          className="object-contain rounded-xl border border-(--ui-border) bg-(--ui-surface-2)/40"
        />
      </div>
      <span className="text-sm text-(--ui-muted-foreground)">{imageLabel}</span>
    </div>
  );
}
