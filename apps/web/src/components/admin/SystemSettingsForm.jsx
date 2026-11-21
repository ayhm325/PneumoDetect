"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/compat/intl";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function SystemSettingsForm({ onSave }) {
  const t = useTranslations("adminSettings");
  const [systemName, setSystemName] = useState(t("defaults.systemName"));
  return (
    <form
      className="max-w-2xl mx-auto mt-10 card-glass rounded-3xl border border-(--ui-border) p-8 flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        onSave && onSave({ systemName });
      }}
    >
      <div className="flex flex-col gap-2">
        <label className="font-bold text-(--ui-muted)">
          {t("labels.systemName.label")}
        </label>
        <Input
          type="text"
          className="h-12 rounded-xl px-4"
          placeholder={t("defaults.systemName")}
          value={systemName}
          onChange={(e) => setSystemName(e.target.value)}
        />
      </div>
      <div className="mt-2">
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-xl py-4 text-lg"
        >
          {t("actions.save")}
        </Button>
      </div>
    </form>
  );
}