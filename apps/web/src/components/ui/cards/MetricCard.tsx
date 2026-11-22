import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";

import { PneumoCard } from "./PneumoCard";
import type { MetricCardProps } from "./types";

export function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
  layout = "editorial",
  trend,
  visual,
  className,
}: MetricCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <PneumoCard
      tone={tone}
      className={clsx("pd-metric", `pd-metric--${layout}`, className)}
    >
      <div className="pd-metric__header">
        <span className="pd-metric__label">{label}</span>

        {Icon && (
          <span className="pd-metric__icon">
            <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
          </span>
        )}
      </div>

      <motion.div
        className="pd-metric__value"
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.25 }}
      >
        {value}
      </motion.div>

      {layout === "visual" && (
        <div className="pd-metric__visual">
          {visual ?? (
            <svg
              width="58"
              height="26"
              viewBox="0 0 58 26"
              fill="none"
              aria-hidden="true"
              className="opacity-55"
            >
              <rect x="2" y="14" width="6" height="10" rx="3" fill="currentColor" opacity="0.45" />
              <rect x="13" y="9" width="6" height="15" rx="3" fill="currentColor" opacity="0.65" />
              <rect x="24" y="4" width="6" height="20" rx="3" fill="currentColor" opacity="0.9" />
              <rect x="35" y="11" width="6" height="13" rx="3" fill="currentColor" opacity="0.65" />
              <rect x="46" y="6" width="6" height="18" rx="3" fill="currentColor" opacity="0.8" />
            </svg>
          )}
        </div>
      )}

      {description && <p className="pd-metric__description">{description}</p>}

      {trend && (
        <span className={`pd-metric__trend pd-trend--${trend.direction}`}>
          {trend.label}
        </span>
      )}
    </PneumoCard>
  );
}
