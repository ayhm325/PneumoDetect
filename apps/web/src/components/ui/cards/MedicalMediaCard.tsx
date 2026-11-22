import { useState } from "react";
import { ArrowUpRight, ImageOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PneumoCard } from "./PneumoCard";
import type { MedicalMediaCardProps } from "./types";

export function MedicalMediaCard({
  imageSrc,
  imageAlt,
  title,
  date,
  status,
  actionLabel,
  tone,
  onOpen,
  className,
}: MedicalMediaCardProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const [failed, setFailed] = useState(false);

  const label = actionLabel || (isAr ? "عرض التحليل" : "View analysis");

  return (
    <PneumoCard
      tone={tone}
      className={className ? `pd-medical-media ${className}` : "pd-medical-media"}
      hover={false}
    >
      <div className="pd-medical-media__image">
        {failed || !imageSrc ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-[var(--pd-cream)]/60">
            <ImageOff size={24} strokeWidth={1.7} aria-hidden="true" />
            <span className="text-xs">
              {isAr ? "تعذر تحميل صورة الأشعة" : "Unable to load radiograph"}
            </span>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
      </div>

      <div className="pd-medical-media__body">
        <div>
          {date && <span className="pd-medical-media__date">{date}</span>}
          <h3>{title}</h3>
          <p className="pd-medical-media__status">{status}</p>
        </div>

        <button type="button" className="pd-medical-media__action" onClick={onOpen}>
          <span>{label}</span>
          <ArrowUpRight size={17} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>
    </PneumoCard>
  );
}
