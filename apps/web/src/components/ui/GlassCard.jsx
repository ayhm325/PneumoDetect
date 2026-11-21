// GlassCard: glassmorphism card with optional neon badge.
export default function GlassCard({
  title,
  children,
  neonBadge,
  className = "",
  ...props
}) {
  const classes = ["relative rounded-xl card-glass p-6", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={classes}
      role={title ? "region" : undefined}
      aria-label={title || undefined}
      {...props}
    >
      {neonBadge && (
        <span className="absolute -top-3 -left-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md btn-gradient">
          {neonBadge}
        </span>
      )}
      {title && (
        <h3 className="text-xl font-bold text-(--ui-foreground) mb-3">
          {title}
        </h3>
      )}
      <div className="text-(--ui-muted-foreground)">{children}</div>
    </section>
  );
}
