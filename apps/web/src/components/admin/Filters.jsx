export default function Filters({ filters, onChange }) {
  return (
    <div className="flex gap-4 my-2">
      {filters.map((filter, idx) => (
        <select
          key={idx}
          value={filter.value}
          onChange={(e) => onChange(idx, e.target.value)}
          className="h-10 rounded-md border border-(--ui-border) bg-(--ui-surface) px-3 text-sm text-(--ui-foreground) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--ui-ring)"
        >
          {filter.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
