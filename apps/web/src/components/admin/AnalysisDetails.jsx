import { useTranslations } from "@/lib/compat/intl";

export default function AnalysisDetails({ analysis, onClose }) {
  const t = useTranslations("analysisDetails");
  const tCommon = useTranslations("adminCommon");

  if (!analysis) return null;
  return (
    <div className="card-glass rounded-2xl p-8 border border-(--ui-border) max-w-md mx-auto mt-8">
      <h3 className="font-bold text-xl mb-4 text-(--ui-foreground)">
        {t("title")}
      </h3>
      <div className="mb-2 text-(--ui-foreground)">
        <span className="font-bold">{t("patientNameLabel")}</span>{" "}
        {analysis.patientName}
      </div>
      <div className="mb-2 text-(--ui-foreground)">
        <span className="font-bold">{t("dateLabel")}</span> {analysis.date}
      </div>
      <div className="mb-2 text-(--ui-foreground)">
        <span className="font-bold">{t("statusLabel")}</span> {analysis.status}
      </div>
      <button
        className="btn-gradient mt-6 px-6 py-2 rounded-full font-bold"
        onClick={onClose}
      >
        {tCommon("close")}
      </button>
    </div>
  );
}
