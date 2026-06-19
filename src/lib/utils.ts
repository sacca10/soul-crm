import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: "USD" | "ARS" = "USD",
): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-AR").format(n);
}

export function formatPercent(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Convierte "YYYY-MM" en un rango de fechas que cubre todo ese mes.
 */
export function monthToRange(
  monthString: string | undefined,
): { desde: Date; hasta: Date } | undefined {
  if (!monthString) return undefined;
  const m = /^(\d{4})-(\d{2})$/.exec(monthString);
  if (!m) return undefined;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const desde = new Date(year, month, 1, 0, 0, 0, 0);
  const hasta = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { desde, hasta };
}

export function formatMonthLabel(monthString: string): string {
  const [y, m] = monthString.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

/**
 * Parsea `from` / `to` (formato YYYY-MM-DD) de query string a un DateRange.
 * Si solo hay uno de los dos, igual devuelve un rango válido.
 */
export function parseDateRange(searchParams: {
  from?: string;
  to?: string;
  month?: string;
}): { desde: Date; hasta: Date } | undefined {
  // Compat: si hay ?month=YYYY-MM, usarlo como rango del mes completo
  if (searchParams.month && !searchParams.from && !searchParams.to) {
    return monthToRange(searchParams.month);
  }
  if (!searchParams.from && !searchParams.to) return undefined;

  const parseLocal = (s: string): Date | undefined => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return undefined;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };

  const fromDate = searchParams.from ? parseLocal(searchParams.from) : undefined;
  const toDate = searchParams.to ? parseLocal(searchParams.to) : undefined;

  const desde = fromDate
    ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0)
    : toDate;
  const hasta = toDate
    ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999)
    : fromDate
    ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 23, 59, 59, 999)
    : undefined;

  if (!desde || !hasta) return undefined;
  return { desde, hasta };
}

/**
 * Genera el label legible de un rango ya parseado.
 */
export function formatRangeLabel(
  range: { desde: Date; hasta: Date } | undefined,
): string {
  if (!range) return "Todos los tiempos";
  const sameDay = range.desde.toDateString() === range.hasta.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(range.desde);
  }
  const sameYear = range.desde.getFullYear() === range.hasta.getFullYear();
  const fmt = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: sameYear ? undefined : "numeric",
  });
  const yearFmt = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${fmt.format(range.desde)} → ${yearFmt.format(range.hasta)}`;
}
