import { ArrowUpRight } from "lucide-react";

import { PneumoCard } from "./PneumoCard";
import type { FeatureCardProps } from "./types";

export function FeatureCard({
  eyebrow,
  title,
  description,
  actionLabel,
  icon: Icon,
  tone,
  onAction,
  children,
  className,
}: FeatureCardProps) {
  return (
    <PneumoCard tone={tone} className={className ? `pd-feature ${className}` : "pd-feature"}>
      <div className="pd-feature__top">
        {eyebrow ? <span className="pd-feature__eyebrow">{eyebrow}</span> : <span />}

        {Icon && <Icon size={24} strokeWidth={1.7} aria-hidden="true" />}
      </div>

      <div className="pd-feature__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {children}

      {actionLabel && onAction && (
        <button type="button" className="pd-feature__action" onClick={onAction}>
          <span>{actionLabel}</span>
          <ArrowUpRight size={17} strokeWidth={1.7} aria-hidden="true" />
        </button>
      )}
    </PneumoCard>
  );
}
