"use client";

import AnalysisStatusBadge from "./AnalysisStatusBadge";
import Button from "../ui/Button";
import { Table, THead, TRow, TH, TD } from "../ui/Table";
import Pagination from "../ui/Pagination";
import { useTranslations } from "@/lib/compat/intl";

export default function AnalysesTable({
  analyses,
  onView,
  onDetails,
  onCompare,
  page = 1,
  pageCount = 1,
  onPageChange,
}) {
  const t = useTranslations("adminAnalyses");

  return (
    <div className="mt-8">
      <Table>
        <THead>
          <TRow className="bg-(--ui-surface-2)">
            <TH>{t("table.index")}</TH>
            <TH>{t("table.patient")}</TH>
            <TH>{t("table.date")}</TH>
            <TH>{t("table.status")}</TH>
            <TH>{t("table.actions")}</TH>
          </TRow>
        </THead>
        <tbody>
          {analyses.map((analysis, i) => (
            <TRow key={analysis.id} className="hover:bg-(--ui-surface-2)/60">
              <TD className="text-center font-bold">{i + 1}</TD>
              <TD className="text-center">{analysis.patientName}</TD>
              <TD className="text-center">{analysis.date}</TD>
              <TD className="text-center">
                <AnalysisStatusBadge status={analysis.status} />
              </TD>
              <TD>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    className="px-3 py-2 text-(--ui-info)"
                    title={t("actions.view")}
                    onClick={() => onView(analysis)}
                  >
                    {t("actions.view")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-2"
                    title={t("actions.details")}
                    onClick={() => onDetails(analysis)}
                  >
                    {t("actions.details")}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-2 text-(--ui-success)"
                    title={t("actions.compare")}
                    onClick={() => onCompare(analysis)}
                  >
                    {t("actions.compare")}
                  </Button>
                </div>
              </TD>
            </TRow>
          ))}
        </tbody>
      </Table>
      <div className="flex items-center justify-end mt-6">
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}