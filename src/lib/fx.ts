import { createServiceClient } from "@/lib/supabase/server";

export type FxStrategy = "blue" | "mep" | "oficial";

export interface FxRate {
  fecha: string;
  usd_blue: number | null;
  usd_mep: number | null;
  usd_oficial: number | null;
  actualizado_at?: string;
}

/**
 * Devuelve la cotización más reciente disponible en la tabla fx_rates.
 * Si no hay ninguna (nunca corrió el cron), devuelve null.
 */
export async function getLatestFxRate(): Promise<FxRate | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("fx_rates")
    .select("fecha, usd_blue, usd_mep, usd_oficial, actualizado_at")
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as FxRate | null) ?? null;
}

/**
 * Pull latest FX rates from dolarapi.com and upsert into `fx_rates`.
 * Called by Vercel Cron at /api/cron/fx-rates.
 */
export async function refreshFxRates(): Promise<FxRate> {
  const res = await fetch("https://dolarapi.com/v1/dolares", {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`dolarapi.com responded ${res.status}`);
  }

  const data = (await res.json()) as Array<{
    casa: string;
    venta: number;
  }>;

  const today = new Date().toISOString().slice(0, 10);

  const blue = data.find((d) => d.casa === "blue")?.venta ?? null;
  const mep = data.find((d) => d.casa === "bolsa")?.venta ?? null;
  const oficial = data.find((d) => d.casa === "oficial")?.venta ?? null;

  const supabase = createServiceClient();
  const { data: upserted, error } = await supabase
    .from("fx_rates")
    .upsert(
      {
        fecha: today,
        usd_blue: blue,
        usd_mep: mep,
        usd_oficial: oficial,
        actualizado_at: new Date().toISOString(),
      },
      { onConflict: "fecha" },
    )
    .select()
    .single();

  if (error) throw error;
  return upserted as FxRate;
}

/**
 * Get the FX rate for a given date (or the latest available before that date).
 * Used to convert historical transactions at the rate they happened.
 */
export async function getFxForDate(
  fecha: string | Date,
  strategy: FxStrategy = "blue",
): Promise<number> {
  const dateStr =
    typeof fecha === "string" ? fecha : fecha.toISOString().slice(0, 10);

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("fx_rates")
    .select("usd_blue, usd_mep, usd_oficial")
    .lte("fecha", dateStr)
    .order("fecha", { ascending: false })
    .limit(1)
    .single();

  if (!data) return 1; // fallback: assume 1:1 if no rate available
  const rate = data as Record<string, number | null>;
  const fieldMap: Record<FxStrategy, string> = {
    blue: "usd_blue",
    mep: "usd_mep",
    oficial: "usd_oficial",
  };
  return rate[fieldMap[strategy]] ?? 1;
}

/**
 * Convert an amount in ARS to USD using the rate for a given date.
 */
export async function arsToUsd(
  amount: number,
  fecha: string | Date,
  strategy: FxStrategy = "blue",
): Promise<number> {
  const rate = await getFxForDate(fecha, strategy);
  return amount / rate;
}
