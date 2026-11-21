"use client";
import FileUpload from "../ui/FileUpload";
import { useTranslations } from "@/lib/compat/intl";

export default function AnalysisUploader({ onUpload }) {
  const t = useTranslations("adminAnalyses");
  return (
    <FileUpload
      onUpload={onUpload}
      accept="image/*"
      label={t("buttons.upload")}
      className="flex flex-col items-center gap-4 mt-4"
    />
  );
}
