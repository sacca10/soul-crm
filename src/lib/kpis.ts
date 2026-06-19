import { createClient } from "@/lib/supabase/server";
import { arsToUsd, type FxStrategy } from "@/lib/fx";

export interface DateRange {
  desde: Date;
  hasta: Date;
}

export interface KpiOptions {
  range: DateRange;
  fxStrategy?: FxStrategy;
}

/**
 * Normalize an amount in either USD or ARS to USD, using the FX rate of the transaction date.
 */
async function toUsd(
  amount: number | null,
  currency: "USD" | "ARS" | null,
  fecha: string,
  strategy: FxStrategy,
): Promise<number> {
  if (!amount) return 0;
  if (currency === "USD" || !currency) return amount;
  return arsToUsd(amount, fecha, strategy);
}

/**
 * Facturación = sum of `monto_facturado` of agendas with resultado='cerrado' in range.
 */
export async function facturacion({
  range,
  fxStrategy = "blue",
}: KpiOptions): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("agendas")
    .select("monto_facturado, monto_facturado_currency, fecha_hora_llamada")
    .eq("resultado", "cerrado")
    .gte("fecha_hora_llamada", range.desde.toISOString())
    .lte("fecha_hora_llamada", range.hasta.toISOString());

  if (!data) return 0;
  const rows = data as Array<{
    monto_facturado: number | null;
    monto_facturado_currency: "USD" | "ARS" | null;
    fecha_hora_llamada: string;
  }>;
  const totals = await Promise.all(
    rows.map((r) =>
      toUsd(r.monto_facturado, r.monto_facturado_currency, r.fecha_hora_llamada, fxStrategy),
    ),
  );
  return totals.reduce((a, b) => a + b, 0);
}

/**
 * Cash collected = closing payments (from agendas.cash_collected) + cobros del programa cobrados en el rango.
 */
export async function cashCollected({
  range,
  fxStrategy = "blue",
}: KpiOptions): Promise<number> {
  const supabase = createClient();
  const [agRes, coRes] = await Promise.all([
    supabase
      .from("agendas")
      .select("cash_collected, cash_collected_currency, fecha_hora_llamada")
      .not("cash_collected", "is", null)
      .gte("fecha_hora_llamada", range.desde.toISOString())
      .lte("fecha_hora_llamada", range.hasta.toISOString()),
    supabase
      .from("cobros")
      .select("monto_cobrar, monto_cobrar_currency, fecha_cobro_real")
      .not("fecha_cobro_real", "is", null)
      .gte("fecha_cobro_real", range.desde.toISOString().slice(0, 10))
      .lte("fecha_cobro_real", range.hasta.toISOString().slice(0, 10)),
  ]);

  const agRows = (agRes.data ?? []) as Array<{
    cash_collected: number | null;
    cash_collected_currency: "USD" | "ARS" | null;
    fecha_hora_llamada: string;
  }>;
  const coRows = (coRes.data ?? []) as Array<{
    monto_cobrar: number | null;
    monto_cobrar_currency: "USD" | "ARS" | null;
    fecha_cobro_real: string;
  }>;

  const agTotals = await Promise.all(
    agRows.map((r) =>
      toUsd(r.cash_collected, r.cash_collected_currency, r.fecha_hora_llamada, fxStrategy),
    ),
  );
  const coTotals = await Promise.all(
    coRows.map((r) =>
      toUsd(r.monto_cobrar, r.monto_cobrar_currency, r.fecha_cobro_real, fxStrategy),
    ),
  );

  return [...agTotals, ...coTotals].reduce((a, b) => a + b, 0);
}

/**
 * Cash de seguimiento = cobros cobrados en el rango con numero_cuota > 1
 * (es decir, cobros que NO son del cierre original).
 */
export async function cashSeguimiento({
  range,
  fxStrategy = "blue",
}: KpiOptions): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("cobros")
    .select("monto_cobrar, monto_cobrar_currency, fecha_cobro_real, numero_cuota")
    .not("fecha_cobro_real", "is", null)
    .gt("numero_cuota", 1)
    .gte("fecha_cobro_real", range.desde.toISOString().slice(0, 10))
    .lte("fecha_cobro_real", range.hasta.toISOString().slice(0, 10));

  if (!data) return 0;
  const rows = data as Array<{
    monto_cobrar: number;
    monto_cobrar_currency: "USD" | "ARS";
    fecha_cobro_real: string;
  }>;
  const totals = await Promise.all(
    rows.map((r) =>
      toUsd(r.monto_cobrar, r.monto_cobrar_currency, r.fecha_cobro_real, fxStrategy),
    ),
  );
  return totals.reduce((a, b) => a + b, 0);
}

/**
 * Simple count KPIs.
 */
export async function countCierres(range: DateRange): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("agendas")
    .select("*", { count: "exact", head: true })
    .eq("resultado", "cerrado")
    .gte("fecha_hora_llamada", range.desde.toISOString())
    .lte("fecha_hora_llamada", range.hasta.toISOString());
  return count ?? 0;
}

export async function countAgendas(range: DateRange): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("agendas")
    .select("*", { count: "exact", head: true })
    .gte("fecha_agenda", range.desde.toISOString().slice(0, 10))
    .lte("fecha_agenda", range.hasta.toISOString().slice(0, 10));
  return count ?? 0;
}

export async function countShows(range: DateRange): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("agendas")
    .select("*", { count: "exact", head: true })
    .eq("estado_llamada", "asistio")
    .gte("fecha_hora_llamada", range.desde.toISOString())
    .lte("fecha_hora_llamada", range.hasta.toISOString());
  return count ?? 0;
}

export async function countCalificadosEnLlamada(range: DateRange): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("agendas")
    .select("*", { count: "exact", head: true })
    .eq("estado_llamada", "asistio")
    .eq("nivel_calificacion", "calificado")
    .gte("fecha_hora_llamada", range.desde.toISOString())
    .lte("fecha_hora_llamada", range.hasta.toISOString());
  return count ?? 0;
}

export async function sumConversacionesManual(range: DateRange): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("kpis_diarios_manual")
    .select("conversaciones")
    .gte("fecha", range.desde.toISOString().slice(0, 10))
    .lte("fecha", range.hasta.toISOString().slice(0, 10));
  if (!data) return 0;
  return (data as Array<{ conversaciones: number }>).reduce(
    (a, r) => a + (r.conversaciones ?? 0),
    0,
  );
}

/**
 * Aggregate snapshot of all KPIs for the dashboard top cards.
 */
export interface KpiSnapshot {
  facturacion: number;
  cashCollected: number;
  cashSeguimiento: number;
  cierres: number;
  agendas: number;
  shows: number;
  calificados: number;
  conversaciones: number;
  // Tasas
  pctAgendamiento: number;
  showUpRate: number;
  pctCalificacion: number;
  closeRateBruto: number;
  closeRateCalificado: number;
  // Derivados monetarios
  AOV: number;
  cashPerShow: number;
  cashPerAgenda: number;
}

export async function kpiSnapshot(opts: KpiOptions): Promise<KpiSnapshot> {
  const [
    fact,
    cash,
    cashSeg,
    cierres,
    agendas,
    shows,
    calificados,
    conversaciones,
  ] = await Promise.all([
    facturacion(opts),
    cashCollected(opts),
    cashSeguimiento(opts),
    countCierres(opts.range),
    countAgendas(opts.range),
    countShows(opts.range),
    countCalificadosEnLlamada(opts.range),
    sumConversacionesManual(opts.range),
  ]);

  const safeDiv = (n: number, d: number) => (d > 0 ? n / d : 0);

  return {
    facturacion: fact,
    cashCollected: cash,
    cashSeguimiento: cashSeg,
    cierres,
    agendas,
    shows,
    calificados,
    conversaciones,
    pctAgendamiento: safeDiv(agendas, conversaciones),
    showUpRate: safeDiv(shows, agendas),
    pctCalificacion: safeDiv(calificados, shows),
    closeRateBruto: safeDiv(cierres, shows),
    closeRateCalificado: safeDiv(cierres, calificados),
    AOV: safeDiv(fact, cierres),
    cashPerShow: safeDiv(cash, shows),
    cashPerAgenda: safeDiv(cash, agendas),
  };
}
