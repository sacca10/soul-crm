import { createServiceClient } from "@/lib/supabase/server";

export type FxStrategy = "cripto" | "blue" | "mep" | "oficial";

export interface FxRate {
  fecha: string;
  usd_cripto: number | null;
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
    .select("fecha, usd_cripto, usd_blue, usd_mep, usd_oficial, actualizado_at")
    .order("fecha", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as FxRate | null) ?? null;
}

/**
 * Refresca las cotizaciones y las guarda en `fx_rates`.
 * Llamado por el Vercel Cron en /api/cron/fx-rates y por el botón "Refrescar".
 *
 * El dólar cripto se toma de criptoya.com (USDC venta), que es la referencia
 * de cripto en Argentina y coincide con dolarhoy. blue/mep/oficial se siguen
 * trayendo de dolarapi.com (quedan en la base, aunque ya no se muestran).
 */
export async function refreshFxRates(): Promise<FxRate> {
  const today = new Date().toISOString().slice(0, 10);

  // blue / mep / oficial (+ cripto de fallback) desde dolarapi.com
  let blue: number | null = null;
  let mep: number | null = null;
  let oficial: number | null = null;
  let criptoFallback: number | null = null;
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares", {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = (await res.json()) as Array<{ casa: string; venta: number }>;
      blue = data.find((d) => d.casa === "blue")?.venta ?? null;
      mep = data.find((d) => d.casa === "bolsa")?.venta ?? null;
      oficial = data.find((d) => d.casa === "oficial")?.venta ?? null;
      criptoFallback = data.find((d) => d.casa === "cripto")?.venta ?? null;
    }
  } catch {
    // si dolarapi falla, seguimos con criptoya para el cripto
  }

  // Dólar cripto desde criptoya.com (USDT venta) — coincide con dolarhoy
  let cripto: number | null = criptoFallback;
  try {
    const res = await fetch("https://criptoya.com/api/dolar", {
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        cripto?: Record<string, { ask?: number; bid?: number }>;
      };
      const c = data.cripto ?? {};
      cripto =
        c.usdc?.ask ?? c.usdt?.ask ?? c.ccb?.ask ?? criptoFallback;
    }
  } catch {
    // si criptoya falla, queda el cripto de dolarapi (fallback)
  }

  if (cripto == null && blue == null && oficial == null) {
    throw new Error("No se pudieron obtener cotizaciones (dolarapi y criptoya fallaron).");
  }

  const supabase = createServiceClient();
  const { data: upserted, error } = await supabase
    .from("fx_rates")
    .upsert(
      {
        fecha: today,
        usd_cripto: cripto,
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
  strategy: FxStrategy = "cripto",
): Promise<number> {
  const dateStr =
    typeof fecha === "string" ? fecha : fecha.toISOString().slice(0, 10);

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("fx_rates")
    .select("usd_cripto, usd_blue, usd_mep, usd_oficial")
    .lte("fecha", dateStr)
    .order("fecha", { ascending: false })
    .limit(1)
    .single();

  if (!data) return 1; // fallback: assume 1:1 if no rate available
  const rate = data as Record<string, number | null>;
  const fieldMap: Record<FxStrategy, string> = {
    cripto: "usd_cripto",
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
  strategy: FxStrategy = "cripto",
): Promise<number> {
  const rate = await getFxForDate(fecha, strategy);
  return amount / rate;
}
