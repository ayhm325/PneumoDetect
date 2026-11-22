import { PneumoCard } from "./PneumoCard";
import type { ChartCardProps } from "./types";

export function ChartCard({
  title,
  subtitle,
  tone,
  headerAction,
  children,
  className,
}: ChartCardProps) {
  return (
    <PneumoCard
      tone={tone}
      hover={false}
      className={className ? `pd-chart-card ${className}` : "pd-chart-card"}
    >
      <div className="pd-chart-card__header">
        <div>
          <h3 className="pd-chart-card__title">{title}</h3>
          {subtitle && <p className="pd-chart-card__subtitle">{subtitle}</p>}
        </div>
        {headerAction}
      </div>

      <div className="pd-chart-card__canvas">{children}</div>
    </PneumoCard>
  );
}
