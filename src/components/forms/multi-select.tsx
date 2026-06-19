"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  name: string;
  options: MultiSelectOption[];
  defaultValue?: string[];
  placeholder?: string;
  id?: string;
}

/**
 * Multi-select estilo "tags". Renderiza un input oculto con los valores
 * separados por coma (parseable en el server action vía split(',')).
 * UX: trigger con badges de los seleccionados + dropdown con checkboxes.
 */
export function MultiSelect({
  name,
  options,
  defaultValue = [],
  placeholder = "Seleccionar…",
  id,
}: MultiSelectProps) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [open, setOpen] = useState(false);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function remove(value: string) {
    setSelected((prev) => prev.filter((v) => v !== value));
  }

  return (
    <div className="relative">
      {/* Hidden input: el server action recibe los valores separados por coma */}
      <input type="hidden" name={name} value={selected.join(",")} />

      {/* Trigger */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors",
          "hover:border-[hsl(var(--gold)/0.5)]",
          "focus:outline-none focus:border-[hsl(var(--gold)/0.7)] focus:ring-2 focus:ring-[hsl(var(--gold)/0.3)]",
          open && "border-[hsl(var(--gold)/0.7)] ring-2 ring-[hsl(var(--gold)/0.3)]",
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {selected.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded bg-[hsl(var(--gold)/0.15)] px-1.5 py-0.5 text-xs text-[hsl(var(--gold-light))]"
              >
                {opt?.label ?? v}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(v);
                  }}
                  className="cursor-pointer hover:text-foreground"
                  aria-label={`Quitar ${opt?.label ?? v}`}
                >
                  <X className="h-3 w-3" />
                </span>
              </span>
            );
          })}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[hsl(var(--gold)/0.6)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-[hsl(var(--gold)/0.25)] bg-popover p-1 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Sin opciones disponibles
              </div>
            )}
            {options.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-1.5 text-sm transition-colors",
                    "hover:bg-[hsl(var(--gold)/0.12)] hover:text-[hsl(var(--gold-light))]",
                    isSelected && "text-[hsl(var(--gold-light))] font-medium",
                  )}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 text-[hsl(var(--gold))]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
