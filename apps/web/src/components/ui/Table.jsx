export function Table({ children, className = "", ...props }) {
  const classes = [
    "overflow-x-auto rounded-[14px] border border-[var(--ui-border)] bg-[var(--ui-table-bg)] shadow-[var(--shadow-soft)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      <table className="min-w-full border-collapse text-[13.5px]">
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className = "", ...props }) {
  const classes = [
    "bg-[var(--ui-table-header)] border-b border-[var(--ui-border)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <thead className={classes} {...props}>
      {children}
    </thead>
  );
}

export function TRow({ children, className = "", ...props }) {
  const classes = [
    "border-t border-[var(--ui-border)] transition-colors duration-150 hover:bg-[var(--ui-table-hover)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <tr className={classes} {...props}>
      {children}
    </tr>
  );
}

export function TH({ children, className = "", ...props }) {
  const classes = [
    "h-12 px-4 text-start text-[13px] font-semibold text-[var(--ui-foreground)] whitespace-nowrap",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <th className={classes} {...props}>
      {children}
    </th>
  );
}

export function TD({ children, className = "", ...props }) {
  const classes = [
    "h-[54px] px-4 text-start text-[13.5px] text-[var(--ui-foreground)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <td className={classes} {...props}>
      {children}
    </td>
  );
}