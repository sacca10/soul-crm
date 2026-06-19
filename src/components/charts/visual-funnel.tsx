"use client";

import { formatNumber, formatPercent } from "@/lib/utils";

export interface VisualFunnelStage {
  label: string;
  count: number;
  color?: string;
}

interface VisualFunnelProps {
  stages: VisualFunnelStage[];
  height?: number;
}

const PALETTE = [
  "#a855f7",
  "#8b5cf6",
  "#7c3aed",
  "#6366f1",
  "#3b82f6",
  "#0ea5e9",
  "#06b6d4",
  "#14b8a6",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#f97316",
  "#ef4444",
];

/**
 * Renders a literal funnel shape: stacked trapezoids that taper from wide
 * at the top to narrow at the bottom. Width of each segment scales with its
 * count relative to the top stage.
 */
export function VisualFunnel({ stages, height = 480 }: VisualFunnelProps) {
  if (stages.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Sin datos.
      </div>
    );
  }

  const VIEW_WIDTH = 800;
  const PAD_X = 40;
  const MAX_WIDTH = VIEW_WIDTH - PAD_X * 2;
  const MIN_WIDTH = 80;
  const GAP = 8;
  const segH = (height - GAP * (stages.length - 1)) / stages.length;
  const top = stages[0].count || 1;

  // Compute each segment's top and bottom widths so the shape narrows smoothly.
  // Width es proporcional a ratio (count / topCount). Capeamos a 1 (100%) porque
  // un embudo no puede ensancharse — si los datos lo hacen, el % visual queda
  // al máximo y el count real se sigue mostrando.
  const widths = stages.map((s) => {
    const ratio = Math.min(1, s.count / top);
    return Math.max(MIN_WIDTH, MAX_WIDTH * ratio);
  });

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${height}`} className="w-full" role="img">
      <defs>
        {stages.map((s, i) => {
          const color = s.color ?? PALETTE[i % PALETTE.length];
          return (
            <linearGradient key={i} id={`funnel-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.85} />
              <stop offset="100%" stopColor={color} stopOpacity={0.55} />
            </linearGradient>
          );
        })}
      </defs>

      {stages.map((stage, i) => {
        const yTop = i * (segH + GAP);
        const yBottom = yTop + segH;
        const wTop = widths[i];
        // Bottom width = next stage's top width (or 60% of itself if last).
        const wBottom =
          i < stages.length - 1 ? widths[i + 1] : Math.max(MIN_WIDTH * 0.7, wTop * 0.6);
        const cx = VIEW_WIDTH / 2;
        const points = [
          [cx - wTop / 2, yTop],
          [cx + wTop / 2, yTop],
          [cx + wBottom / 2, yBottom],
          [cx - wBottom / 2, yBottom],
        ];
        const pathPoints = points.map((p) => p.join(",")).join(" ");
        const labelY = yTop + segH / 2;
        const prev = i > 0 ? stages[i - 1].count : null;
        const pctPrev = prev && prev > 0 ? Math.min(1, stage.count / prev) : null;
        const color = stage.color ?? PALETTE[i % PALETTE.length];

        return (
          <g key={i}>
            <polygon
              points={pathPoints}
              fill={`url(#funnel-grad-${i})`}
              stroke={color}
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />
            {/* Inside the trapezoid: label + count (sin % del total, que confunde
                porque las etapas son anidadas, no una distribución) */}
            <text
              x={cx}
              y={labelY - 6}
              textAnchor="middle"
              className="fill-foreground"
              style={{
                fontSize: "14px",
                fontWeight: 600,
                paintOrder: "stroke",
                stroke: "rgba(0,0,0,0.5)",
                strokeWidth: 0.5,
              }}
            >
              {stage.label}
            </text>
            <text
              x={cx}
              y={labelY + 15}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: "16px", fontWeight: 700, opacity: 0.95 }}
            >
              {formatNumber(stage.count)}
            </text>
            {/* Side annotation: conversión vs etapa anterior (la métrica real del embudo) */}
            {pctPrev !== null && (
              <text
                x={VIEW_WIDTH - PAD_X - 4}
                y={yTop + segH / 2 + 4}
                textAnchor="end"
                className="fill-muted-foreground"
                style={{ fontSize: "12px" }}
              >
                ↓ {formatPercent(pctPrev)} convierte
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
