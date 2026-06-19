import "server-only";
import { isMockMode, store, generateId } from "./store";
import { sb, throwIfError } from "./_supabase";
import type { Lead, LeadEstadoPipeline, LeadFuente } from "@/lib/domain";

export interface LeadFilters {
  estado?: LeadEstadoPipeline | null;
  fuente?: LeadFuente | null;
  setterId?: string | null;
  search?: string;
  range?: { desde: Date; hasta: Date };
}

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  if (isMockMode()) {
    let leads = [...store.leads];
    if (filters.estado) leads = leads.filter((l) => l.estado_pipeline === filters.estado);
    if (filters.fuente) leads = leads.filter((l) => l.fuente === filters.fuente);
    if (filters.setterId) leads = leads.filter((l) => l.assigned_setter_id === filters.setterId);
    if (filters.range) {
      const desde = filters.range.desde.getTime();
      const hasta = filters.range.hasta.getTime();
      leads = leads.filter((l) => {
        const t = new Date(l.fecha_ingreso).getTime();
        return t >= desde && t <= hasta;
      });
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.nombre.toLowerCase().includes(q) ||
          l.instagram_username?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q),
      );
    }
    return leads.sort(
      (a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime(),
    );
  }
  let q = sb().from("leads").select("*").order("fecha_ingreso", { ascending: false });
  if (filters.estado) q = q.eq("estado_pipeline", filters.estado);
  if (filters.fuente) q = q.eq("fuente", filters.fuente);
  if (filters.setterId) q = q.eq("assigned_setter_id", filters.setterId);
  if (filters.range) {
    q = q
      .gte("fecha_ingreso", filters.range.desde.toISOString())
      .lte("fecha_ingreso", filters.range.hasta.toISOString());
  }
  if (filters.search) {
    const s = filters.search.replace(/%/g, "");
    q = q.or(
      `nombre.ilike.%${s}%,instagram_username.ilike.%${s}%,email.ilike.%${s}%`,
    );
  }
  const res = throwIfError(await q, "leads.getLeads");
  return (res.data ?? []) as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  if (isMockMode()) {
    return store.leads.find((l) => l.id === id) ?? null;
  }
  const res = await sb().from("leads").select("*").eq("id", id).maybeSingle();
  return (res.data as Lead | null) ?? null;
}

export async function countLeadsByEstado(): Promise<Record<string, number>> {
  if (isMockMode()) {
    const counts: Record<string, number> = {};
    for (const l of store.leads) {
      counts[l.estado_pipeline] = (counts[l.estado_pipeline] ?? 0) + 1;
    }
    return counts;
  }
  const res = throwIfError(
    await sb().from("leads").select("estado_pipeline"),
    "leads.countLeadsByEstado",
  );
  const counts: Record<string, number> = {};
  for (const r of (res.data ?? []) as Array<{ estado_pipeline: string }>) {
    counts[r.estado_pipeline] = (counts[r.estado_pipeline] ?? 0) + 1;
  }
  return counts;
}

export interface CreateLeadInput {
  nombre: string;
  instagram_username?: string;
  email?: string;
  telefono?: string;
  puntos_contacto?: string[];
  fuente: LeadFuente;
  assigned_setter_id?: string;
  notas?: string;
  estado_pipeline?: LeadEstadoPipeline;
  situacion_actual?: string;
  cuellos_botella?: string;
  motivacion?: string;
  recursos_previos?: string;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  if (isMockMode()) {
    const lead: Lead = {
      id: generateId("l"),
      nombre: input.nombre,
      instagram_username: input.instagram_username ?? null,
      email: input.email ?? null,
      telefono: input.telefono ?? null,
      manychat_id: null,
      puntos_contacto: input.puntos_contacto ?? [],
      fuente: input.fuente,
      estado_pipeline: input.estado_pipeline ?? "mensaje_apertura",
      assigned_setter_id: input.assigned_setter_id ?? null,
      notas: input.notas ?? null,
      fecha_ingreso: new Date().toISOString(),
      situacion_actual: input.situacion_actual ?? null,
      cuellos_botella: input.cuellos_botella ?? null,
      motivacion: input.motivacion ?? null,
      recursos_previos: input.recursos_previos ?? null,
    };
    store.leads.push(lead);
    return lead;
  }
  const res = throwIfError(
    await sb()
      .from("leads")
      .insert({
        nombre: input.nombre,
        instagram_username: input.instagram_username ?? null,
        email: input.email ?? null,
        telefono: input.telefono ?? null,
        puntos_contacto: input.puntos_contacto ?? [],
        fuente: input.fuente,
        estado_pipeline: input.estado_pipeline ?? "mensaje_apertura",
        assigned_setter_id: input.assigned_setter_id ?? null,
        notas: input.notas ?? null,
        situacion_actual: input.situacion_actual ?? null,
        cuellos_botella: input.cuellos_botella ?? null,
        motivacion: input.motivacion ?? null,
        recursos_previos: input.recursos_previos ?? null,
      })
      .select()
      .single(),
    "leads.createLead",
  );
  return res.data as Lead;
}

export async function updateLeadEstado(
  id: string,
  estado: LeadEstadoPipeline,
): Promise<Lead | null> {
  if (isMockMode()) {
    const lead = store.leads.find((l) => l.id === id);
    if (!lead) return null;
    lead.estado_pipeline = estado;
    return lead;
  }
  const res = throwIfError(
    await sb()
      .from("leads")
      .update({ estado_pipeline: estado })
      .eq("id", id)
      .select()
      .maybeSingle(),
    "leads.updateLeadEstado",
  );
  return (res.data as Lead | null) ?? null;
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<Lead | null> {
  if (isMockMode()) {
    const lead = store.leads.find((l) => l.id === id);
    if (!lead) return null;
    Object.assign(lead, patch);
    return lead;
  }
  const res = throwIfError(
    await sb().from("leads").update(patch).eq("id", id).select().maybeSingle(),
    "leads.updateLead",
  );
  return (res.data as Lead | null) ?? null;
}

export async function deleteLead(id: string): Promise<boolean> {
  if (isMockMode()) {
    const i = store.leads.findIndex((l) => l.id === id);
    if (i === -1) return false;
    store.leads.splice(i, 1);
    return true;
  }
  throwIfError(await sb().from("leads").delete().eq("id", id), "leads.deleteLead");
  return true;
}
