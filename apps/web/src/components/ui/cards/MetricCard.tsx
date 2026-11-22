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

      {layout === "visual" && visual && (
        <div className="pd-metric__visual">{visual}</div>
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
