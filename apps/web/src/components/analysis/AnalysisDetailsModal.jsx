"use client";
import React from 'react';
import Image from "@/lib/compat/Image";
import AnalysisResultCard from './AnalysisResultCard';
import { useTranslations } from "@/lib/compat/intl";

export default function AnalysisDetailsModal({ record, onClose, saved = false, saveError = null }) {
  const t = useTranslations('patient');
  if (!record) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label={t('analysisDetails.title')}>
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg p-4 md:p-6 card-glass" dir="auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">{t('analysisDetails.title')}</h2>
          <button onClick={onClose} aria-label={t('analysisDetails.closeDetails')} className="text-gray-600 hover:text-gray-800 tooltip">
            ?
            <span className="tooltip-text">{t('analysisDetails.close')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="text-sm text-gray-600 mb-2">{t('analysisDetails.originalImage')}</div>
            {record.imageUrl || record.image_url ? (
              <a href={record.imageUrl ?? record.image_url} target="_blank" rel="noreferrer noopener" aria-label={t('analysisDetails.openOriginalImage')}>
                <Image
                  src={record.imageUrl ?? record.image_url}
                  alt={t('analysisDetails.originalImage')}
                  width={400}
                  height={240}
                  className="rounded-lg soft-shadow"
                  unoptimized
                />
              </a>
            ) : (
              <div className="h-40 bg-gray-100 rounded-lg" />
            )}

            {/* Removed saved/notSaved status as requested */}
          </div>

          <div className="md:col-span-2">
            <AnalysisResultCard result={record} saved={saved} saveError={saveError} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}
