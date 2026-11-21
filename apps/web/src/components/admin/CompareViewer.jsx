import Image from "@/lib/compat/Image";
import { useTranslations } from "@/lib/compat/intl";

export default function CompareViewer({ images }) {
  const t = useTranslations("compareViewer");
  const needTwoImages = t("needTwoImages");

  if (!images || images.length < 2)
    return (
      <div className="text-center text-(--ui-muted-foreground) py-4">
        {needTwoImages}
      </div>
    );
  return (
    <div className="flex gap-8 justify-center mt-4">
      {images.map((img, idx) => (
        <div key={idx} className="flex flex-col items-center gap-2">
          <div className="relative w-72 h-80">
            <Image
              src={img}
              alt={t("imageWithIndex", { index: idx + 1 })}
              fill
              sizes="(min-width: 1024px) 18rem, 60vw"
              className="object-contain rounded-xl border border-(--ui-border) bg-(--ui-surface-2)/40"
            />
          </div>
          <span className="text-sm text-(--ui-muted-foreground)">
            {t("imageWithIndex", { index: idx + 1 })}
          </span>
        </div>
      ))}
    </div>
  );
}
