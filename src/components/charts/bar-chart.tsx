"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

type FormatType = "currency" | "number" | "percent";

interface BarChartProps {
  data: Array<Record<string, string | number>>;
  index: string;
  categories: Array<{ key: string; label: string; color: string }>;
  format?: FormatType;
  height?: number;
}

const formatters: Record<FormatType, (v: number) => string> = {
  currency: (v) => formatCurrency(v),
  number: (v) => formatNumber(v),
  percent: (v) => formatPercent(v),
};

export function BarChart({
  data,
  index,
  categories,
  format = "number",
  height = 280,
}: BarChartProps) {
  const formatter = formatters[format];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey={index}
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
        <Legend wrapperStyle={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }} />
        {categories.map((cat) => (
          <Bar key={cat.key} dataKey={cat.key} name={cat.label} fill={cat.color} radius={[4, 4, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
