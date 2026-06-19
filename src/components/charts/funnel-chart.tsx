"use client";

import { cn, formatNumber, formatPercent } from "@/lib/utils";

export interface FunnelStage {
  label: string;
  count: number;
  color?: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  compact?: boolean;
  /**
   * Si se pasa `total`, el componente funciona en modo DISTRIBUCIÓN:
   * cada barra muestra count/total (los porcentajes suman 100%).
   * Si no se pasa, funciona como embudo de conversión (% vs la primera etapa).
   */
  total?: number;
}

export function FunnelChart({ stages, compact = false, total }: FunnelChartProps) {
  if (stages.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">Sin datos para mostrar.</div>
    );
  }

  const isDistribution = typeof total === "number";
  const base = isDistribution ? total || 1 : stages[0].count || 1;

  return (
    <div className={cn("space-y-2", compact ? "text-xs" : "text-sm")}>
      {stages.map((stage, i) => {
        const pct = stage.count / base; // % vs total (distribución) o vs top (embudo)
        const prev = i > 0 ? stages[i - 1].count : null;
        const pctPrev = prev && prev > 0 ? stage.count / prev : null;
        const width = Math.min(100, Math.max(pct * 100, stage.count > 0 ? 4 : 0));
        const color = stage.color ?? defaultStageColor(i);

        return (
          <div key={stage.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{stage.label}</span>
              <span className="text-muted-foreground">
                {formatNumber(stage.count)}
                {/* En modo embudo mostramos conversión vs etapa anterior */}
                {!isDistribution && pctPrev !== null && (
                  <span className="ml-2 text-xs">
                    ({formatPercent(Math.min(1, pctPrev))} vs anterior)
                  </span>
                )}
              </span>
            </div>
            <div className="relative h-7 overflow-hidden rounded-md bg-secondary/40">
              <div
                className="h-full rounded-md transition-all"
                style={{
                  width: `${width}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}80)`,
                }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold text-foreground/90">
                {formatPercent(Math.min(1, pct))}
              </span>
            </div>
          </div>
        );
      })}
      {isDistribution && (
        <p className="pt-1 text-xs text-muted-foreground">
          Cada lead cuenta en un solo estado · los porcentajes suman 100%
        </p>
      )}
    </div>
  );
}

function defaultStageColor(i: number): string {
  const palette = [
    "#a855f7",
    "#8b5cf6",
    "#6366f1",
    "#3b82f6",
    "#06b6d4",
    "#14b8a6",
    "#22c55e",
    "#84cc16",
    "#eab308",
    "#f59e0b",
    "#f97316",
    "#ef4444",
  ];
  return palette[i % palette.length];
}
