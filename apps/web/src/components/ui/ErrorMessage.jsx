"use client";
import React from "react";
import { useTranslations } from "@/lib/compat/intl";

export default function ErrorMessage({ message, className = "" }) {
  const t = useTranslations("ui");
  const errorText = message || t("errors.unexpected");
  return (
    <div className={`py-8 text-center text-(--ui-danger) ${className}`}>
      <p>{errorText}</p>
    </div>
  );
}
