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
      <svg
        aria-hidden="true"
        viewBox="0 0 160 160"
        fill="none"
        className="pointer-events-none absolute -end-6 -bottom-6 h-40 w-40 opacity-[0.07]"
      >
        <circle cx="80" cy="80" r="68" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="80" cy="80" r="44" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="80" cy="80" r="18" stroke="currentColor" strokeWidth="1.2" />
      </svg>

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
