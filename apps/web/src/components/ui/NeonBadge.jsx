// NeonBadge: pill badge with glow matching accent color.
export default function NeonBadge({
  children,
  colorVar = "var(--color-accent)",
  className = "",
  ...props
}) {
  const classes = [
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-background shadow-neon",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      style={{ background: colorVar }}
      aria-label="Neon badge"
      {...props}
    >
      {children}
    </span>
  );
}
