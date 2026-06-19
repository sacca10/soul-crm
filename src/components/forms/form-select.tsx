"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  options: FormSelectOption[];
  required?: boolean;
  /** Optional id used to keep the trigger label tied via htmlFor */
  id?: string;
  /** Notify parent when selection changes (for conditional fields) */
  onChange?: (value: string) => void;
}

/**
 * Form-friendly wrapper around Radix Select. Renders a hidden native input
 * with the given `name` so the value is submitted with the parent form.
 */
export function FormSelect({
  name,
  defaultValue,
  placeholder = "—",
  options,
  required,
  id,
  onChange,
}: FormSelectProps) {
  const [value, setValue] = useState<string | undefined>(defaultValue);

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={value ?? ""}
        required={required && !value ? true : undefined}
      />
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onChange?.(v);
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
