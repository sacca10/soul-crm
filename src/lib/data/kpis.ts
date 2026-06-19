import "server-only";
import { cache } from "react";
import { isMockMode, store } from "./store";
import { sb } from "./_supabase";
import {
  ESTADOS_PIPELINE,
  ESTADO_PIPELINE_COLOR,
  ESTADO_PIPELINE_LABEL,
} from "@/lib/domain";
import type {
  Agenda,
  Cobro,
  Comision,
  Contenido,
  KpiDiarioManual,
  Lead,
  LeadEstadoPipeline,
  Seguimiento,
} from "@/lib/domain";

export interface DateRange {
  desde: Date;
  hasta: Date;
}

function inRange(iso: string | null | undefined, range: DateRange): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= range.desde.getTime() && t <= range.hasta.getTime();
}

export function defaultRangeMTD(): DateRange {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(1);
  desde.setHours(0, 0, 0, 0);
  return { desde, hasta };
}

// =====================================================================
// Fetch all the data needed for KPI calculations, deduplicated per request.
// React's `cache()` ensures multiple calls within a single render reuse the
// same Promise — no redundant Supabase round-trips.
// =====================================================================
interface KpiBundle {
  leads: Lead[];
  agendas: Agenda[];
  cobros: Cobro[];
  comisiones: Comision[];
  kpisManual: KpiDiarioManual[];
  contenido: Contenido[];
  seguimientos: Seguimiento[];
}

export const getKpiBundle = cache(async (): Promise<KpiBundle> => {
  if (isMockMode()) {
    return {
      leads: store.leads,
      agendas: store.agendas,
      cobros: store.cobros,
      comisiones: store.comisiones,
      kpisManual: store.kpisManual,
      contenido: store.contenido,
      seguimientos: store.seguimientos,
    };
  }

  const client = sb();
  const [leadsR, agendasR, cobrosR, comisionesR, kpisR, contenidoR, segR] =
    await Promise.all([
      client.from("leads").select("*"),
      client.from("agendas").select("*"),
      client.from("cobros").select("*"),
      client.from("comisiones").select("*"),
      client.from("kpis_diarios_manual").select("*"),
      client.from("contenido").select("*"),
      client.from("seguimientos_con_dias").select("*"),
    ]);
  return {
    leads: (leadsR.data ?? []) as Lead[],
    agendas: (agendasR.data ?? []) as Agenda[],
    cobros: (cobrosR.data ?? []) as Cobro[],
    comisiones: (comisionesR.data ?? []) as Comision[],
    kpisManual: (kpisR.data ?? []) as KpiDiarioManual[],
    contenido: (contenidoR.data ?? []) as Contenido[],
    seguimientos: (segR.data ?? []) as Seguimiento[],
  };
});

/**
 * Dinero estancado en seguimientos = suma de `total_cobrar_proyectado` de
 * seguimientos activos (estado: caliente o tibio — los "frio" se consideran
 * casi perdidos y no cuentan como estancado activo).
 */
export async function dineroEstancadoEnSeguimientos(): Promise<number> {
  const s = await getKpiBundle();
  return s.seguimientos
    .filter((x) => x.estado === "caliente" || x.estado === "tibio")
    .reduce((sum, x) => sum + (x.total_cobrar_proyectado ?? 0), 0);
}

// =====================================================================
// Snapshot — todos los KPIs del mes (o rango)
// =====================================================================
export interface KpiSnapshot {
  facturacion: number;
  cashCollected: number;
  cashSeguimiento: number;
  cashNeto: number;
  comisionesPagadas: number;
  cierres: number;
  ventas: number;
  agendas: number;
  agendasProximas: number;
  shows: number;
  noShows: number;
  calificados: number;
  conversaciones: number;
  chatsUnicos: number;
  pctAgendamiento: number;
  showUpRate: number;
  pctCalificacion: number;
  closeRateBruto: number;
  closeRateCalificado: number;
  AOV: number;
  cashPerShow: number;
  cashPerAgenda: number;
}

export async function computeSnapshot(
  range: DateRange = defaultRangeMTD(),
): Promise<KpiSnapshot> {
  const s = await getKpiBundle();

  const agendasEnRango = s.agendas.filter((a) => inRange(a.fecha_hora_llamada, range));
  const cierres = agendasEnRango.filter((a) => a.resultado === "cerrado");
  const shows = agendasEnRango.filter((a) => a.estado_llamada === "asistio");
  const noShows = agendasEnRango.filter((a) => a.estado_llamada === "no_show");
  const calificados = shows.filter((a) => a.nivel_calificacion === "calificado");

  const facturacion = cierres.reduce((sum, a) => sum + (a.monto_facturado ?? 0), 0);
  const cashCollected =
    cierres.reduce((sum, a) => sum + (a.cash_collected ?? 0), 0) +
    s.cobros
      .filter((c) => c.fecha_cobro_real && inRange(c.fecha_cobro_real, range))
      .reduce((sum, c) => sum + c.monto_cobrar, 0);

  const cashSeguimiento = s.cobros
    .filter(
      (c) =>
        c.numero_cuota > 1 &&
        c.fecha_cobro_real &&
        inRange(c.fecha_cobro_real, range),
    )
    .reduce((sum, c) => sum + c.monto_cobrar, 0);

  const comisionesPagadas = s.comisiones
    .filter(
      (c) =>
        c.pagado && c.fecha_pago_comision && inRange(c.fecha_pago_comision, range),
    )
    .reduce(
      (sum, c) =>
        sum + (c.comision_setter_monto ?? 0) + (c.comision_closer_monto ?? 0),
      0,
    );

  const kpisManual = s.kpisManual.filter((k) => inRange(k.fecha, range));
  const conversaciones = kpisManual.reduce((sum, k) => sum + k.conversaciones, 0);
  const chatsUnicos = kpisManual.reduce((sum, k) => sum + k.chats_unicos_abiertos, 0);

  const agendasProximas = s.agendas.filter(
    (a) => new Date(a.fecha_hora_llamada) >= new Date(),
  ).length;

  const safeDiv = (n: number, d: number) => (d > 0 ? n / d : 0);

  return {
    facturacion,
    cashCollected,
    cashSeguimiento,
    cashNeto: cashCollected - comisionesPagadas,
    comisionesPagadas,
    cierres: cierres.length,
    ventas: cierres.length,
    agendas: agendasEnRango.length,
    agendasProximas,
    shows: shows.length,
    noShows: noShows.length,
    calificados: calificados.length,
    conversaciones,
    chatsUnicos,
    pctAgendamiento: safeDiv(agendasEnRango.length, conversaciones),
    showUpRate: safeDiv(shows.length, agendasEnRango.length),
    pctCalificacion: safeDiv(calificados.length, shows.length),
    closeRateBruto: safeDiv(cierres.length, shows.length),
    closeRateCalificado: safeDiv(cierres.length, calificados.length),
    AOV: safeDiv(facturacion, cierres.length),
    cashPerShow: safeDiv(cashCollected, shows.length),
    cashPerAgenda: safeDiv(cashCollected, agendasEnRango.length),
  };
}

// =====================================================================
// Facturación mensual (últimos N meses) — para gráfico de evolución
// =====================================================================
export async function monthlyFacturacion(
  months = 12,
): Promise<Array<{ label: string; value: number }>> {
  const s = await getKpiBundle();
  const result: Array<{ label: string; value: number }> = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const sum = s.agendas
      .filter(
        (a) =>
          a.resultado === "cerrado" &&
          new Date(a.fecha_hora_llamada) >= d &&
          new Date(a.fecha_hora_llamada) < next,
      )
      .reduce((acc, a) => acc + (a.monto_facturado ?? 0), 0);
    result.push({
      label: d.toLocaleDateString("es-AR", { month: "short" }),
      value: sum,
    });
  }
  return result;
}

// =====================================================================
// Conteos por estado del pipeline
// =====================================================================
export async function leadsCountByEstado(
  range?: DateRange,
): Promise<Record<LeadEstadoPipeline, number>> {
  const s = await getKpiBundle();
  const counts = {} as Record<LeadEstadoPipeline, number>;
  const leads = range
    ? s.leads.filter((l) => inRange(l.fecha_ingreso, range))
    : s.leads;
  for (const l of leads) {
    counts[l.estado_pipeline] = (counts[l.estado_pipeline] ?? 0) + 1;
  }
  return counts;
}

// =====================================================================
// Distribución de leads por estado del pipeline.
// Cada lead está en UN solo estado → los counts suman al total de leads
// y los porcentajes (count/total) suman 100%.
// =====================================================================
export async function leadStateDistribution(range?: DateRange): Promise<{
  stages: Array<{ label: string; count: number; color: string }>;
  total: number;
}> {
  const s = await getKpiBundle();
  const leads = range
    ? s.leads.filter((l) => inRange(l.fecha_ingreso, range))
    : s.leads;

  const byEstado: Record<string, number> = {};
  for (const l of leads) {
    byEstado[l.estado_pipeline] = (byEstado[l.estado_pipeline] ?? 0) + 1;
  }

  const stages = ESTADOS_PIPELINE.map((e) => ({
    label: ESTADO_PIPELINE_LABEL[e],
    count: byEstado[e] ?? 0,
    color: ESTADO_PIPELINE_COLOR[e],
  }));

  return { stages, total: leads.length };
}

// =====================================================================
// VSL funnel manual — totales del período cargados a mano (Ajustes → KPIs)
// =====================================================================
export interface VslFunnelManual {
  chatsUnicos: number;
  conversaciones: number;
  enviamosVsl: number;
  vistasVsl: number;
  llegaronCtaVsl: number;
  respondieronCtaVsl: number;
  agendasManual: number;
}

export async function vslFunnelManual(
  range?: DateRange,
): Promise<VslFunnelManual> {
  const s = await getKpiBundle();
  const rows = range
    ? s.kpisManual.filter((k) => inRange(k.fecha, range))
    : s.kpisManual;
  const sum = (pick: (k: (typeof rows)[number]) => number) =>
    rows.reduce((acc, k) => acc + (pick(k) ?? 0), 0);
  return {
    chatsUnicos: sum((k) => k.chats_unicos_abiertos),
    conversaciones: sum((k) => k.conversaciones),
    enviamosVsl: sum((k) => k.enviamos_vsl ?? 0),
    vistasVsl: sum((k) => k.vistas_vsl ?? 0),
    llegaronCtaVsl: sum((k) => k.llegaron_cta_vsl ?? 0),
    respondieronCtaVsl: sum((k) => k.respondieron_cta_vsl ?? 0),
    agendasManual: sum((k) => k.agendas_manual ?? 0),
  };
}

// =====================================================================
// 3-stage funnel para el dibujo principal (Leads → Agendas → Cierres)
// =====================================================================
export async function visualFunnelData(range?: DateRange): Promise<{
  leads: number;
  agendas: number;
  cierres: number;
}> {
  const s = await getKpiBundle();
  const leads = range
    ? s.leads.filter((l) => inRange(l.fecha_ingreso, range))
    : s.leads;
  const agendasInRange = range
    ? s.agendas.filter((a) => inRange(a.fecha_hora_llamada, range))
    : s.agendas;

  const leadIds = new Set(leads.map((l) => l.id));

  // "Agendamiento" = leads del set que tienen estado del pipeline indicando agendamiento
  // O que tienen al menos una agenda asociada en el rango.
  // De esa manera, mover un lead en el Kanban a 'agendado' reflejará inmediatamente
  // en el embudo, sin esperar a que se cree la fila de agenda.
  const leadIdsConAgenda = new Set(
    agendasInRange
      .map((a) => a.lead_id)
      .filter((id): id is string => Boolean(id && leadIds.has(id))),
  );
  const leadIdsEnEstadoAgendado = new Set(
    leads
      .filter(
        (l) =>
          l.estado_pipeline === "agendado" ||
          l.estado_pipeline === "calendly_enviado",
      )
      .map((l) => l.id),
  );
  const leadsAgendamiento = new Set([
    ...leadIdsConAgenda,
    ...leadIdsEnEstadoAgendado,
  ]);

  // "Cierres" = leads que tienen al menos una agenda en el rango con resultado='cerrado'
  const leadIdsConCierre = new Set(
    agendasInRange
      .filter((a) => a.resultado === "cerrado")
      .map((a) => a.lead_id)
      .filter((id): id is string => Boolean(id && leadIds.has(id))),
  );

  return {
    leads: leads.length,
    agendas: leadsAgendamiento.size,
    cierres: leadIdsConCierre.size,
  };
}

// =====================================================================
// Totales para el dashboard de Marketing
// =====================================================================
export interface MarketingTotals {
  chatsUnicos: number;
  conversaciones: number;
  leadsTotales: number;
  leadsCalificados: number;
  ventas: number;
  dineroGenerado: number;
}

export async function marketingTotals(range?: DateRange): Promise<MarketingTotals> {
  const s = await getKpiBundle();

  const inRangeLeads = range
    ? s.leads.filter((l) => inRange(l.fecha_ingreso, range))
    : s.leads;
  const inRangeAgendas = range
    ? s.agendas.filter((a) => inRange(a.fecha_hora_llamada, range))
    : s.agendas;
  const inRangeKpis = range
    ? s.kpisManual.filter((k) => inRange(k.fecha, range))
    : s.kpisManual;

  const chatsUnicos = inRangeKpis.reduce(
    (sum, k) => sum + k.chats_unicos_abiertos,
    0,
  );
  const conversaciones = inRangeKpis.reduce(
    (sum, k) => sum + k.conversaciones,
    0,
  );
  const leadsTotales = inRangeLeads.length;
  // "Calificados" = leads que llegaron a estado calificado o más adelante en el embudo
  const calificadoOMas: LeadEstadoPipeline[] = [
    "calificado",
    "en_nutricion",
    "vsl_enviado",
    "oferta_llamada",
    "calendly_enviado",
    "agendado",
    "en_seguimiento",
  ];
  const leadsCalificados = inRangeLeads.filter((l) =>
    calificadoOMas.includes(l.estado_pipeline),
  ).length;
  const cierres = inRangeAgendas.filter((a) => a.resultado === "cerrado");
  const ventas = cierres.length;
  const dineroGenerado = cierres.reduce(
    (sum, a) => sum + (a.monto_facturado ?? 0),
    0,
  );
  return {
    chatsUnicos,
    conversaciones,
    leadsTotales,
    leadsCalificados,
    ventas,
    dineroGenerado,
  };
}

// =====================================================================
// $ generado por CTA, leads por plataforma — para Rendimiento del Contenido
// =====================================================================
export async function contenidoStats(range?: DateRange): Promise<
  Array<
    Contenido & {
      leads_generados: number;
      leads_calificados: number;
      ventas_generadas: number;
      dinero_generado: number;
    }
  >
> {
  const s = await getKpiBundle();
  const leadsBase = range
    ? s.leads.filter((l) => inRange(l.fecha_ingreso, range))
    : s.leads;
  const agendasBase = range
    ? s.agendas.filter((a) => inRange(a.fecha_hora_llamada, range))
    : s.agendas;

  return s.contenido.map((c) => {
    // Un lead "pertenece" a un CTA si lo tiene en sus puntos_contacto.
    // Como un lead puede tener varios puntos, las atribuciones pueden solaparse
    // (se cuenta el lead/venta en cada CTA que respondió).
    const leadsDelCta = leadsBase.filter((l) =>
      (l.puntos_contacto ?? []).includes(c.cta_id),
    );
    const leadsCalificadosDelCta = leadsDelCta.filter((l) =>
      [
        "calificado",
        "en_nutricion",
        "vsl_enviado",
        "oferta_llamada",
        "calendly_enviado",
        "agendado",
        "en_seguimiento",
      ].includes(l.estado_pipeline),
    );
    const leadsIdsDelCta = new Set(leadsDelCta.map((l) => l.id));
    const ventasDelCta = agendasBase.filter(
      (a) => a.lead_id && leadsIdsDelCta.has(a.lead_id) && a.resultado === "cerrado",
    );
    const dineroGenerado = ventasDelCta.reduce(
      (sum, a) => sum + (a.monto_facturado ?? 0),
      0,
    );
    return {
      ...c,
      leads_generados: leadsDelCta.length,
      leads_calificados: leadsCalificadosDelCta.length,
      ventas_generadas: ventasDelCta.length,
      dinero_generado: dineroGenerado,
    };
  });
}
