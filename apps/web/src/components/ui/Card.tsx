import React from "react";
import clsx from "clsx";

type CardVariant = "default" | "elevated" | "outline" | "interactive";
type CardSize = "sm" | "md" | "lg";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
};

const variantClasses: Record<CardVariant, string> = {
  default:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-card,var(--shadow-soft))] transition-all duration-250",
  elevated:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-lift)] transition-all duration-250",
  outline:
    "border border-[var(--ui-border)] bg-transparent text-[var(--ui-foreground)] transition-all duration-250",
  interactive:
    "border border-[var(--ui-border)] bg-[var(--ui-surface-elevated)] text-[var(--ui-foreground)] shadow-[var(--shadow-card,var(--shadow-soft))] transition-all duration-250 hover:-translate-y-0.5 hover:border-[var(--ui-border-strong)] hover:shadow-[var(--shadow-lift)]",
};

const sizeClasses: Record<CardSize, string> = {
  sm: "rounded-[22px] p-5",
  md: "rounded-[22px] p-6",
  lg: "rounded-[22px] p-7 sm:p-8",
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
