import { GlideSelect } from "@/components/ui";

export default function Filters({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-4 my-2">
      {filters.map((filter, idx) => (
        <GlideSelect
          key={idx}
          value={filter.value}
          onChange={(val) => onChange(idx, val)}
          options={filter.options.map((opt) => ({
            value: String(opt),
            label: String(opt),
          }))}
        />
      ))}
    </div>
  );
}