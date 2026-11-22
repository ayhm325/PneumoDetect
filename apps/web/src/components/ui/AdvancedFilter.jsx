"use client";
import { useState } from "react";
import { FaSlidersH, FaTimes } from "react-icons/fa6";
import { useTranslations } from "@/lib/compat/intl";
import { GlideSelect } from "./GlideSelect";

const AdvancedFilter = ({
  fields = [],
  onApply = () => {},
  onReset = () => {},
}) => {
  const ui = useTranslations("ui");
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({});

  const handleChange = (fieldName, value) => {
    setFilters((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleApply = () => {
    onApply(filters);
    setShowFilter(false);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const activeFilters = Object.values(filters).filter(
    (v) => v !== "" && v !== null,
  ).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilter(!showFilter)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition ${
          showFilter || activeFilters > 0
            ? "bg-[var(--ui-info)] text-[var(--ui-info-foreground)]"
            : "bg-[var(--ui-surface-2)] text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)]/80"
        }`}
      >
        <FaSlidersH size={14} />
        {ui("filters.label")} {activeFilters > 0 && `(${activeFilters})`}
      </button>

      {showFilter && (
        <div className="absolute top-full right-0 mt-2 bg-[var(--ui-surface)] rounded-lg shadow-2xl p-6 z-50 w-80 border border-[var(--ui-border)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[var(--ui-foreground)]">
              {ui("filters.advancedTitle")}
            </h3>
            <button
              onClick={() => setShowFilter(false)}
              className="text-[var(--ui-muted-foreground)] hover:text-[var(--ui-foreground)]"
            >
              <FaTimes size={18} />
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="block text-sm font-medium text-[var(--ui-muted-foreground)]">
                  {field.label}
                </label>

                {field.type === "select" && (
                  <GlideSelect
                    fullWidth
                    value={filters[field.name] || ""}
                    onChange={(val) => handleChange(field.name, val)}
                    options={[
                      { value: "", label: ui("filters.all") },
                      ...(field.options?.map((opt) => ({
                        value: String(opt),
                        label: String(opt),
                      })) || []),
                    ]}
                  />
                )}

                {field.type === "date" && (
                  <input
                    type="date"
                    value={filters[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-[var(--ui-foreground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ui-ring)]"
                  />
                )}

                {field.type === "text" && (
                  <input
                    type="text"
                    placeholder={field.placeholder || ""}
                    value={filters[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-[var(--ui-foreground)] rounded-lg placeholder:opacity-70 placeholder:text-[var(--ui-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-ring)]"
                  />
                )}

                {field.type === "range" && (
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    value={filters[field.name] || field.min}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 btn-gradient rounded-lg transition"
            >
              {ui("filters.apply")}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-[var(--ui-surface-2)] hover:bg-[var(--ui-surface-2)]/80 text-[var(--ui-foreground)] rounded-lg transition"
            >
              {ui("filters.reset")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;