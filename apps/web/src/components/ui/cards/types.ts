import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type CardTone = "red" | "cream" | "sage" | "olive";

export type MetricLayout = "editorial" | "visual" | "compact";

export interface BaseCardProps {
  children: ReactNode;
  tone: CardTone;
  className?: string;
  hover?: boolean;
}

export interface MetricCardProps {
  id?: string;
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  tone: CardTone;
  layout?: MetricLayout;
  trend?: {
    label: string;
    direction: "up" | "down" | "neutral";
  };
  visual?: ReactNode;
  className?: string;
}

export interface FeatureCardProps {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  icon?: LucideIcon;
  tone: CardTone;
  onAction?: () => void;
  children?: ReactNode;
  className?: string;
}

export interface MedicalMediaCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  date?: string;
  status: string;
  actionLabel?: string;
  tone: CardTone;
  onOpen: () => void;
  className?: string;
}

export interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  tone: CardTone;
  onClick: () => void;
  disabled?: boolean;
  emphasis?: "primary" | "secondary";
  className?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  tone?: CardTone;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  tone: CardTone;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}
