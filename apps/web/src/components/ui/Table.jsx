export function Table({ children, className = "", ...props }) {
  const classes = ["pd-panel overflow-hidden", className].filter(Boolean).join(" ");

  return (
    <div className={classes} {...props}>
      <div className="pd-scroll-x">
        <table className="pd-table">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children, className = "", ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TRow({ children, className = "", ...props }) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}

export function TH({ children, className = "", ...props }) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  );
}

export function TD({ children, className = "", ...props }) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  );
}
