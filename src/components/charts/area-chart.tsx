"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
}

type FormatType = "currency" | "number" | "percent";

interface AreaChartProps {
  data: DataPoint[];
  color?: string;
  format?: FormatType;
  height?: number;
}

const formatters: Record<FormatType, (v: number) => string> = {
  currency: (v) => formatCurrency(v),
  number: (v) => formatNumber(v),
  percent: (v) => formatPercent(v),
};

export function AreaChart({
  data,
  color = "#9b6dff",
  format = "currency",
  height = 280,
}: AreaChartProps) {
  const formatter = formatters[format];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatter}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
          }}
          formatter={(v: number) => [formatter(v), ""]}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#area-fill)"
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}
