import React from "react";
import clsx from "clsx";

export type CardVariant =
  | "default"
  | "elevated"
  | "outline"
  | "interactive"
  | "medical"
  | "highlighted"
  | "empty"
  | "loading";

export type CardSize = "sm" | "md" | "lg" | "none";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-card,var(--shadow-soft))] transition-all duration-200",
  elevated:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-lift)] transition-all duration-200",
  outline:
    "border border-[var(--ui-border)] bg-transparent text-[var(--ui-foreground)] transition-all duration-200",
  interactive:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-card,var(--shadow-soft))] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] hover:shadow-[var(--shadow-lift)]",
  medical:
    "border border-[var(--ui-info-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-glow)] transition-all duration-200",
  highlighted:
    "border-2 border-[var(--color-primary-500)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-lift)] transition-all duration-200",
  empty:
    "border-2 border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-2)]/40 text-[var(--ui-muted-foreground)] text-center transition-all duration-200",
  loading:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-soft)] animate-pulse",
};

const sizeClasses: Record<CardSize, string> = {
  none: "p-0 rounded-[20px]",
  sm: "rounded-[20px] p-4 sm:p-5",
  md: "rounded-[22px] p-5 sm:p-6",
  lg: "rounded-[24px] p-6 sm:p-8",
};

export function Card({
  className,
  variant = "default",
  size = "md",
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("flex flex-col space-y-1.5 pb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx(
        "font-bold text-lg sm:text-xl leading-tight tracking-tight text-[var(--ui-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={clsx("text-sm text-[var(--ui-muted-foreground)] leading-normal", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "flex items-center pt-4 border-t border-[var(--ui-border)]",
        className,
      )}
      {...props}
    />
  );
}

export type ProfileMediaCardProps = Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  image?: string | null;
  imageAlt?: string;
  mediaNode?: React.ReactNode;
  isAvatar?: boolean;
  featured?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
};

export function ProfileMediaCard({
  image,
  imageAlt = "",
  mediaNode,
  isAvatar = false,
  featured = false,
  title,
  subtitle,
  description,
  badge,
  actions,
  children,
  className,
  ...props
}: ProfileMediaCardProps) {
  const hasPhoto = Boolean(image);
  return (
    <div
      className={clsx(
        "profile-card",
        featured && "profile-card--featured",
        className,
      )}
      {...props}
    >
      {(image || mediaNode) && (
        <div
          className={clsx(
            "profile-card-image",
            hasPhoto ? "profile-card-image--photo" : "profile-card-image--icon",
            isAvatar && "profile-card-image--avatar",
          )}
        >
          {image ? (
            <img
              src={image}
              alt={typeof imageAlt === "string" ? imageAlt : ""}
              className="h-full w-full object-cover"
            />
          ) : (
            mediaNode
          )}
        </div>
      )}

      <div className="profile-card-content">
        {(title || badge) && (
          <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
            {title && <h2 className="profile-card-title">{title}</h2>}
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
        )}
        {subtitle && <h3 className="profile-card-subtitle">{subtitle}</h3>}
        {description && <div className="profile-card-description">{description}</div>}
        {children}
        {actions && <div className="profile-card-buttons">{actions}</div>}
      </div>
    </div>
  );
}

export default Card;
