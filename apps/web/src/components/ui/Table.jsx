export function Table({ children, className = "", ...props }) {
  const classes = ["overflow-x-auto", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      <table className="min-w-full rounded-lg bg-(--color-background) border border-(--ui-border)">
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className = "", ...props }) {
  const classes = ["bg-[var(--ui-surface)]", className]
    .filter(Boolean)
    .join(" ");
  return (
    <thead className={classes} {...props}>
      {children}
    </thead>
  );
}

export function TRow({ children, className = "", ...props }) {
  const classes = ["border-t border-[var(--ui-border)]", className]
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
    "py-3 px-4 text-[var(--color-text)] text-start font-bold",
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
  const classes = ["py-2 px-4 text-start", className].filter(Boolean).join(" ");

  return (
    <td className={classes} {...props}>
      {children}
    </td>
  );
}
