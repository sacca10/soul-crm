"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DayPicker, type DateRange } from "react-day-picker";
import { es } from "date-fns/locale";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  format,
} from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Preset {
  label: string;
  range: () => DateRange;
}

const PRESETS: Preset[] = [
  {
    label: "Hoy",
    range: () => {
      const today = new Date();
      return { from: startOfDay(today), to: endOfDay(today) };
    },
  },
  {
    label: "Esta semana",
    range: () => {
      const today = new Date();
      return {
        from: startOfWeek(today, { weekStartsOn: 1 }),
        to: endOfWeek(today, { weekStartsOn: 1 }),
      };
    },
  },
  {
    label: "Este mes",
    range: () => {
      const today = new Date();
      return { from: startOfMonth(today), to: endOfMonth(today) };
    },
  },
  {
    label: "Mes pasado",
    range: () => {
      const prev = subMonths(new Date(), 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    },
  },
  {
    label: "Últimos 30 días",
    range: () => {
      const today = new Date();
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
    },
  },
  {
    label: "Últimos 90 días",
    range: () => {
      const today = new Date();
      return { from: startOfDay(subDays(today, 89)), to: endOfDay(today) };
    },
  },
  {
    label: "Año actual",
    range: () => {
      const today = new Date();
      return { from: startOfYear(today), to: endOfYear(today) };
    },
  },
];

function toIso(d: Date | undefined): string {
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}

function fromIso(s: string | null | undefined): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function formatRangeLabel(range: DateRange | undefined): string {
  if (!range?.from) return "Todos los tiempos";
  if (!range.to) return format(range.from, "d MMM yyyy", { locale: es });
  const sameYear = range.from.getFullYear() === range.to.getFullYear();
  const sameDay =
    range.from.toDateString() === range.to.toDateString();
  if (sameDay) return format(range.from, "d MMM yyyy", { locale: es });
  if (sameYear)
    return `${format(range.from, "d MMM", { locale: es })} - ${format(
      range.to,
      "d MMM yyyy",
      { locale: es },
    )}`;
  return `${format(range.from, "d MMM yyyy", { locale: es })} - ${format(
    range.to,
    "d MMM yyyy",
    { locale: es },
  )}`;
}

/**
 * Lee `?from=YYYY-MM-DD&to=YYYY-MM-DD` de la URL y muestra un selector de
 * rango de fechas con calendario + presets.
 */
export function DateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const fromParam = params.get("from");
  const toParam = params.get("to");
  const current: DateRange | undefined =
    fromParam || toParam
      ? { from: fromIso(fromParam), to: fromIso(toParam) }
      : undefined;

  function applyRange(r: DateRange | undefined) {
    const next = new URLSearchParams(params.toString());
    if (r?.from) next.set("from", toIso(r.from));
    else next.delete("from");
    if (r?.to) next.set("to", toIso(r.to));
    else next.delete("to");
    router.push(`${pathname}?${next.toString()}`);
  }

  function clear() {
    applyRange(undefined);
    setOpen(false);
  }

  function applyPreset(preset: Preset) {
    applyRange(preset.range());
    setOpen(false);
  }

  const hasRange = Boolean(current?.from);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 items-center gap-2.5 rounded-md border border-input bg-background px-3 text-sm transition-colors",
            "hover:border-[hsl(var(--gold)/0.5)] hover:text-[hsl(var(--gold-light))]",
            "focus:outline-none focus:border-[hsl(var(--gold)/0.7)] focus:ring-2 focus:ring-[hsl(var(--gold)/0.3)]",
            "data-[state=open]:border-[hsl(var(--gold)/0.7)] data-[state=open]:ring-2 data-[state=open]:ring-[hsl(var(--gold)/0.3)]",
          )}
        >
          <Calendar className="h-4 w-4 text-[hsl(var(--gold)/0.6)]" />
          <span className={cn(!hasRange && "text-muted-foreground")}>
            {formatRangeLabel(current)}
          </span>
          {hasRange && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                clear();
              }}
              className="ml-1 cursor-pointer rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Limpiar filtro"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-auto gap-0 p-0">
        {/* Presets */}
        <div className="flex w-40 flex-col gap-0.5 border-r border-border p-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-md px-2.5 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-[hsl(var(--gold)/0.12)] hover:text-[hsl(var(--gold-light))]"
            >
              {p.label}
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={clear}
            className="rounded-md px-2.5 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Limpiar
          </button>
        </div>

        {/* Calendar */}
        <div className="p-2">
          <DayPicker
            mode="range"
            locale={es}
            numberOfMonths={2}
            selected={current}
            onSelect={(r) => applyRange(r)}
            weekStartsOn={1}
            classNames={{
              months: "flex gap-4",
              month: "space-y-2",
              caption: "flex items-center justify-between px-2 py-1",
              caption_label: "text-sm font-medium capitalize",
              nav: "flex items-center gap-1",
              nav_button:
                "h-6 w-6 rounded hover:bg-[hsl(var(--gold)/0.12)] hover:text-[hsl(var(--gold-light))] inline-flex items-center justify-center",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell:
                "w-9 text-center text-xs font-normal uppercase tracking-wider text-muted-foreground",
              row: "flex w-full mt-1",
              // Padding 0 entre celdas para que el highlight del rango se vea continuo
              cell: "w-9 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[hsl(var(--gold)/0.35)] [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              day: "h-9 w-9 rounded-md p-0 font-normal aria-selected:opacity-100 hover:bg-[hsl(var(--gold)/0.2)] hover:text-[hsl(var(--gold-light))]",
              day_selected:
                "bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))] font-bold hover:bg-[hsl(var(--gold))] hover:text-[hsl(var(--primary-foreground))] focus:bg-[hsl(var(--gold))] focus:text-[hsl(var(--primary-foreground))]",
              day_today: "border border-[hsl(var(--gold)/0.6)] font-semibold",
              day_outside: "text-muted-foreground/40 opacity-50 aria-selected:bg-[hsl(var(--gold)/0.15)] aria-selected:text-muted-foreground",
              day_disabled: "text-muted-foreground opacity-30",
              day_range_start:
                "day-range-start rounded-l-md bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))]",
              day_range_end:
                "day-range-end rounded-r-md bg-[hsl(var(--gold))] text-[hsl(var(--primary-foreground))]",
              day_range_middle:
                "rounded-none bg-[hsl(var(--gold)/0.35)] text-[hsl(var(--gold-light))] hover:bg-[hsl(var(--gold)/0.45)]",
              day_hidden: "invisible",
            }}
          />
          {current?.from && (
            <div className="mt-2 flex justify-end gap-2 border-t border-border pt-2">
              <Button size="sm" variant="ghost" onClick={clear}>
                Cancelar
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Aplicar
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
