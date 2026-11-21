// HoloButton: button with holographic gradient, focus ring, hover/active states.
export default function HoloButton({
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-transform duration-150";
  const motion = "hover:scale-102 active:scale-98";
  const primary = "btn-gradient text-white shadow-md";
  const ghost =
    "bg-transparent text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)]";
  const outline =
    "bg-transparent border border-[var(--ui-border)] text-[var(--ui-foreground)] hover:bg-[var(--ui-surface-2)]";

  const variantClass =
    variant === "primary" ? primary : variant === "ghost" ? ghost : outline;
  const classes = [base, motion, variantClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...props} className={classes}>
      {children}
    </button>
  );
}
