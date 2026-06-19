import "server-only";
import { isMockMode, store, generateId } from "./store";
import { sb, throwIfError } from "./_supabase";
import type {
  Cobro,
  Comision,
  Contenido,
  GastoFijo,
  KpiDiarioManual,
  Seguimiento,
  Triage,
} from "@/lib/domain";

// =====================================================================
// Contenido / CTAs
// =====================================================================
export async function getContenido(): Promise<Contenido[]> {
  if (isMockMode()) {
    return [...store.contenido].sort((a, b) =>
      b.fecha_publicacion.localeCompare(a.fecha_publicacion),
    );
  }
  const res = throwIfError(
    await sb().from("contenido").select("*").order("fecha_publicacion", { ascending: false }),
    "misc.getContenido",
  );
  return (res.data ?? []) as Contenido[];
}

export async function createContenido(input: Omit<Contenido, "id">): Promise<Contenido> {
  if (isMockMode()) {
    const c: Contenido = { id: generateId("c"), ...input };
    store.contenido.push(c);
    return c;
  }
  const res = throwIfError(
    await sb().from("contenido").insert(input).select().single(),
    "misc.createContenido",
  );
  return res.data as Contenido;
}

// =====================================================================
// Cobros
// =====================================================================
export async function getCobros(): Promise<Cobro[]> {
  if (isMockMode()) {
    return [...store.cobros].sort((a, b) =>
      a.fecha_vencimiento.localeCompare(b.fecha_vencimiento),
    );
  }
  // Usar la vista que tiene dias_atraso calculado
  const res = throwIfError(
    await sb()
      .from("cobros_con_atraso")
      .select("*")
      .order("fecha_vencimiento", { ascending: true }),
    "misc.getCobros",
  );
  return (res.data ?? []) as Cobro[];
}

export async function getCobro(id: string): Promise<Cobro | null> {
  if (isMockMode()) {
    return store.cobros.find((c) => c.id === id) ?? null;
  }
  const res = await sb()
    .from("cobros_con_atraso")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (res.data as Cobro | null) ?? null;
}

export async function updateCobro(id: string, patch: Partial<Cobro>): Promise<Cobro | null> {
  if (isMockMode()) {
    const c = store.cobros.find((x) => x.id === id);
    if (!c) return null;
    Object.assign(c, patch);
    return c;
  }
  // Actualizamos sobre la tabla base, no la vista
  const { dias_atraso, ...realPatch } = patch as Cobro & { dias_atraso?: number };
  void dias_atraso;
  const res = throwIfError(
    await sb().from("cobros").update(realPatch).eq("id", id).select().maybeSingle(),
    "misc.updateCobro",
  );
  return (res.data as Cobro | null) ?? null;
}

// =====================================================================
// Gastos fijos
// =====================================================================
export async function getGastos(): Promise<GastoFijo[]> {
  if (isMockMode()) {
    return [...store.gastos].sort((a, b) => b.fecha_pago.localeCompare(a.fecha_pago));
  }
  // Vista con fecha_proximo_pago calculada
  const res = throwIfError(
    await sb()
      .from("gastos_con_proximo_pago")
      .select("*")
      .order("fecha_pago", { ascending: false }),
    "misc.getGastos",
  );
  return (res.data ?? []) as GastoFijo[];
}

export async function createGasto(input: Omit<GastoFijo, "id">): Promise<GastoFijo> {
  if (isMockMode()) {
    const g: GastoFijo = { id: generateId("g"), ...input };
    store.gastos.push(g);
    return g;
  }
  // Insertamos en la tabla base; fecha_proximo_pago se calcula via la vista
  const { fecha_proximo_pago, ...realInput } = input;
  void fecha_proximo_pago;
  const res = throwIfError(
    await sb().from("gastos_fijos").insert(realInput).select().single(),
    "misc.createGasto",
  );
  return res.data as GastoFijo;
}

// =====================================================================
// Seguimientos
// =====================================================================
export async function getSeguimientos(): Promise<Seguimiento[]> {
  if (isMockMode()) {
    return [...store.seguimientos].sort((a, b) => {
      if (a.estado === b.estado) return 0;
      const order = { caliente: 0, tibio: 1, frio: 2 } as const;
      return order[a.estado] - order[b.estado];
    });
  }
  const res = throwIfError(
    await sb()
      .from("seguimientos_con_dias")
      .select("*")
      .order("estado", { ascending: true }),
    "misc.getSeguimientos",
  );
  return (res.data ?? []) as Seguimiento[];
}

export async function createSeguimiento(input: Omit<Seguimiento, "id">): Promise<Seguimiento> {
  if (isMockMode()) {
    const s: Seguimiento = { id: generateId("s"), ...input };
    store.seguimientos.push(s);
    return s;
  }
  // El insert va a la tabla base; la columna dias_desde_ultima_interaccion vive en la vista
  const { dias_desde_ultima_interaccion, ...realInput } = input;
  void dias_desde_ultima_interaccion;
  const res = throwIfError(
    await sb().from("seguimientos").insert(realInput).select().single(),
    "misc.createSeguimiento",
  );
  return res.data as Seguimiento;
}

// =====================================================================
// Triages
// =====================================================================
export async function getTriages(): Promise<Triage[]> {
  if (isMockMode()) {
    return [...store.triages];
  }
  const res = throwIfError(
    await sb().from("triages").select("*").order("created_at", { ascending: false }),
    "misc.getTriages",
  );
  return (res.data ?? []) as Triage[];
}

export async function createTriage(input: Omit<Triage, "id">): Promise<Triage> {
  if (isMockMode()) {
    const t: Triage = { id: generateId("t"), ...input };
    store.triages.push(t);
    return t;
  }
  const res = throwIfError(
    await sb().from("triages").insert(input).select().single(),
    "misc.createTriage",
  );
  return res.data as Triage;
}

export async function deleteTriage(id: string): Promise<boolean> {
  if (isMockMode()) {
    const i = store.triages.findIndex((t) => t.id === id);
    if (i === -1) return false;
    store.triages.splice(i, 1);
    return true;
  }
  throwIfError(
    await sb().from("triages").delete().eq("id", id),
    "misc.deleteTriage",
  );
  return true;
}

export async function deleteContenido(id: string): Promise<boolean> {
  if (isMockMode()) {
    const i = store.contenido.findIndex((c) => c.id === id);
    if (i === -1) return false;
    store.contenido.splice(i, 1);
    return true;
  }
  throwIfError(
    await sb().from("contenido").delete().eq("id", id),
    "misc.deleteContenido",
  );
  return true;
}

// =====================================================================
// Comisiones
// =====================================================================
export async function getComisiones(): Promise<Comision[]> {
  if (isMockMode()) {
    return [...store.comisiones];
  }
  const res = throwIfError(
    await sb().from("comisiones").select("*").order("created_at", { ascending: false }),
    "misc.getComisiones",
  );
  return (res.data ?? []) as Comision[];
}

// =====================================================================
// KPIs diarios manuales
// =====================================================================
export async function getKpisManual(): Promise<KpiDiarioManual[]> {
  if (isMockMode()) {
    return [...store.kpisManual].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }
  const res = throwIfError(
    await sb()
      .from("kpis_diarios_manual")
      .select("*")
      .order("fecha", { ascending: false }),
    "misc.getKpisManual",
  );
  return (res.data ?? []) as KpiDiarioManual[];
}

export async function upsertKpiManual(
  input: Omit<KpiDiarioManual, "id">,
): Promise<KpiDiarioManual> {
  if (isMockMode()) {
    const existing = store.kpisManual.find((k) => k.fecha === input.fecha);
    if (existing) {
      Object.assign(existing, input);
      return existing;
    }
    const k: KpiDiarioManual = { id: generateId("k"), ...input };
    store.kpisManual.push(k);
    return k;
  }
  const res = throwIfError(
    await sb()
      .from("kpis_diarios_manual")
      .upsert(input, { onConflict: "fecha" })
      .select()
      .single(),
    "misc.upsertKpiManual",
  );
  return res.data as KpiDiarioManual;
}

export async function updateKpiManual(
  id: string,
  input: Omit<KpiDiarioManual, "id">,
): Promise<KpiDiarioManual> {
  if (isMockMode()) {
    const existing = store.kpisManual.find((k) => k.id === id);
    if (!existing) throw new Error(`KPI ${id} no encontrado`);
    Object.assign(existing, input);
    return existing;
  }
  const res = throwIfError(
    await sb()
      .from("kpis_diarios_manual")
      .update(input)
      .eq("id", id)
      .select()
      .single(),
    "misc.updateKpiManual",
  );
  return res.data as KpiDiarioManual;
}

export async function deleteKpiManual(id: string): Promise<void> {
  if (isMockMode()) {
    const i = store.kpisManual.findIndex((k) => k.id === id);
    if (i >= 0) store.kpisManual.splice(i, 1);
    return;
  }
  throwIfError(
    await sb().from("kpis_diarios_manual").delete().eq("id", id),
    "misc.deleteKpiManual",
  );
}
