"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const OPTIONS = [
  { value: "precio", label: "Precio" },
  { value: "timing", label: "Timing" },
  { value: "pareja", label: "Pareja" },
  { value: "confianza", label: "Confianza" },
  { value: "decision", label: "Decisión" },
  { value: "otro", label: "Otro (escribir abajo)" },
];

/**
 * Select for objeción principal. When "otro" is selected, reveals an extra
 * text input to capture the custom objection.
 */
export function ObjecionPicker() {
  const [value, setValue] = useState<string | undefined>(undefined);
  const isOtro = value === "otro";

  return (
    <div className="space-y-2">
      <input type="hidden" name="objecion_principal" value={value ?? ""} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id="objecion_principal">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isOtro && (
        <Input
          name="objecion_principal_otro"
          placeholder="Describí la objeción…"
          autoFocus
        />
      )}
    </div>
  );
}
