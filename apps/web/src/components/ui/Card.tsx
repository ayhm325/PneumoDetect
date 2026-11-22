import React from "react";
import clsx from "clsx";
import { Surface, type SurfaceShape } from "./Surface";

export type CardVariant =
  | "default"
  | "elevated"
  | "outline"
  | "interactive"
  | "medical"
  | "highlighted"
  | "empty"
  | "loading"
  | "editorial"
  | "feature"
  | "metric"
  | "media"
  | "clinical"
  | "timeline"
  | "utility";

export type CardSize = "sm" | "md" | "lg" | "none";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  size?: CardSize;
  shape?: SurfaceShape;
};

const VARIANT_TO_SHAPE: Record<CardVariant, SurfaceShape> = {
  default: "asymmetric",
  elevated: "layered",
  outline: "organic",
  interactive: "asymmetric",
  medical: "arch",
  highlighted: "layered",
  empty: "organic",
  loading: "asymmetric",
  editorial: "editorial",
  feature: "asymmetric",
  metric: "slanted",
  media: "arch",
  clinical: "layered",
  timeline: "editorial",
  utility: "organic",
};

const sizeClasses: Record<CardSize, string> = {
  none: "p-0",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({ className, variant = "default", size = "md", shape, ...props }: CardProps) {
  const resolvedShape = shape ?? VARIANT_TO_SHAPE[variant];
  const tone =
    variant === "elevated"
      ? "moss"
      : variant === "medical" || variant === "clinical"
        ? "sage"
        : variant === "highlighted"
          ? "crimson"
          : variant === "utility"
            ? "parchment"
            : "default";

  return (
    <Surface
      shape={resolvedShape}
      tone={tone}
      interactive={variant === "interactive"}
      className={clsx(
        resolvedShape === "editorial" ? size !== "none" && "pt-5 pb-2" : sizeClasses[size],
        variant === "outline" && "!bg-transparent",
        variant === "empty" && "!bg-transparent border-dashed border-[var(--pd-border-strong)] text-center text-[var(--pd-text-muted)]",
        variant === "loading" && "pd-skeleton",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("flex flex-col gap-1.5 pb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx(
        "text-[length:var(--text-lg)] font-semibold leading-snug tracking-[var(--tracking-heading)] text-[var(--pd-text-primary)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx("text-sm leading-relaxed text-[var(--pd-text-muted)]", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("mt-2 flex items-center gap-3 border-t border-[var(--pd-border)] pt-4", className)}
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
    <article
      className={clsx(
        "pd-card bg-[var(--pd-neutral-surface)] text-[var(--pd-cream)] border-[var(--pd-line)] flex flex-col gap-5 sm:flex-row",
        featured && "pd-card--olive",
        className,
      )}
      {...props}
    >
      {(image || mediaNode) && (
        <div
          className={clsx(
            "shrink-0 overflow-hidden",
            isAvatar
              ? "h-16 w-16 rounded-full border border-[var(--pd-line-strong)] bg-[var(--pd-neutral-raised)] flex items-center justify-center"
              : "h-44 w-full sm:h-auto sm:w-44 rounded-2xl bg-[var(--pd-ink-deep)] flex items-center justify-center",
          )}
        >
          {hasPhoto && image ? (
            <img
              src={image}
              alt={typeof imageAlt === "string" ? imageAlt : ""}
              loading="lazy"
              className={isAvatar ? "h-full w-full object-cover" : "h-full w-full object-contain"}
            />
          ) : (
            <span className="text-[var(--pd-cream)]/75">{mediaNode}</span>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1 flex flex-col justify-between gap-3">
        <div>
          {(title || badge) && (
            <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
              {title && <h2 className="text-lg font-semibold leading-snug">{title}</h2>}
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
          )}
          {subtitle && <h3 className="text-sm opacity-80">{subtitle}</h3>}
          {description && <div className="mt-2 text-xs leading-relaxed opacity-80">{description}</div>}
          {children}
        </div>
        {actions && <div className="mt-2 flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--pd-line)]">{actions}</div>}
      </div>
    </article>
  );
}

export default Card;
