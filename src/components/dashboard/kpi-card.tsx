import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

export type KpiTone = "purple" | "green" | "red" | "yellow" | "blue";

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  delta?: {
    value: number;
    label?: string;
    inverse?: boolean;
  };
  icon?: LucideIcon;
  tone?: KpiTone;
}

const toneGradients: Record<KpiTone, string> = {
  purple: "kpi-gradient-purple",
  green: "kpi-gradient-green",
  red: "kpi-gradient-red",
  yellow: "kpi-gradient-yellow",
  blue: "kpi-gradient-blue",
};

export function KpiCard({
  label,
  value,
  subtitle,
  delta,
  icon: Icon,
  tone = "purple",
}: KpiCardProps) {
  const deltaPositive = delta ? (delta.inverse ? delta.value < 0 : delta.value > 0) : false;
  const deltaColor = delta
    ? deltaPositive
      ? "text-success"
      : "text-destructive"
    : "";

  return (
    <Card className={cn("relative overflow-hidden p-5", toneGradients[tone])}>
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {(delta || subtitle) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta && (
            <span className={cn("flex items-center gap-1 font-medium", deltaColor)}>
              {deltaPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {delta.value > 0 ? "+" : ""}
              {delta.value.toFixed(1)}%
            </span>
          )}
          {subtitle && (
            <span className="text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
}
