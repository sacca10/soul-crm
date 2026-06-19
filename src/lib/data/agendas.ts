import "server-only";
import { isMockMode, store, generateId } from "./store";
import { sb, throwIfError } from "./_supabase";
import type { Agenda } from "@/lib/domain";

export async function getAgendas(): Promise<Agenda[]> {
  if (isMockMode()) {
    return [...store.agendas].sort(
      (a, b) =>
        new Date(b.fecha_hora_llamada).getTime() - new Date(a.fecha_hora_llamada).getTime(),
    );
  }
  const res = throwIfError(
    await sb().from("agendas").select("*").order("fecha_hora_llamada", { ascending: false }),
    "agendas.getAgendas",
  );
  return (res.data ?? []) as Agenda[];
}

export async function getAgenda(id: string): Promise<Agenda | null> {
  if (isMockMode()) {
    return store.agendas.find((a) => a.id === id) ?? null;
  }
  const res = await sb().from("agendas").select("*").eq("id", id).maybeSingle();
  return (res.data as Agenda | null) ?? null;
}

export async function getAgendasProximas(): Promise<Agenda[]> {
  if (isMockMode()) {
    const now = new Date();
    return store.agendas
      .filter((a) => new Date(a.fecha_hora_llamada) >= now)
      .sort(
        (a, b) =>
          new Date(a.fecha_hora_llamada).getTime() -
          new Date(b.fecha_hora_llamada).getTime(),
      );
  }
  const res = throwIfError(
    await sb()
      .from("agendas")
      .select("*")
      .gte("fecha_hora_llamada", new Date().toISOString())
      .order("fecha_hora_llamada", { ascending: true }),
    "agendas.getAgendasProximas",
  );
  return (res.data ?? []) as Agenda[];
}

export async function getAgendasByCloser(closerId: string): Promise<Agenda[]> {
  if (isMockMode()) {
    return store.agendas.filter((a) => a.closer_asignado_id === closerId);
  }
  const res = throwIfError(
    await sb().from("agendas").select("*").eq("closer_asignado_id", closerId),
    "agendas.getAgendasByCloser",
  );
  return (res.data ?? []) as Agenda[];
}

export async function updateAgenda(id: string, patch: Partial<Agenda>): Promise<Agenda | null> {
  if (isMockMode()) {
    const a = store.agendas.find((x) => x.id === id);
    if (!a) return null;
    Object.assign(a, patch);
    return a;
  }
  const res = throwIfError(
    await sb().from("agendas").update(patch).eq("id", id).select().maybeSingle(),
    "agendas.updateAgenda",
  );
  return (res.data as Agenda | null) ?? null;
}

export async function createAgenda(input: Omit<Agenda, "id">): Promise<Agenda> {
  if (isMockMode()) {
    const agenda: Agenda = { id: generateId("a"), ...input };
    store.agendas.push(agenda);
    return agenda;
  }
  const res = throwIfError(
    await sb().from("agendas").insert(input).select().single(),
    "agendas.createAgenda",
  );
  return res.data as Agenda;
}
