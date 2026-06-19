"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAgenda } from "@/lib/data/agendas";
import { createLead } from "@/lib/data/leads";
import { createTriage } from "@/lib/data/misc";
import { getContenido } from "@/lib/data/misc";
import type { LeadFuente, NivelCalificacion, PrimerContactoOrigen } from "@/lib/domain";

export async function createLeadAgendadoAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const fechaAgendaStr = String(formData.get("fecha_hora_llamada") ?? "");
  if (!nombre || !fechaAgendaStr) return;

  const fuente = String(formData.get("fuente") ?? "instagram") as LeadFuente;
  const setterId = (formData.get("assigned_setter_id") as string) || undefined;
  const closerId = (formData.get("closer_asignado_id") as string) || undefined;

  // Puntos de contacto (multi-select): validar contra los CTAs existentes
  const puntosRaw = String(formData.get("puntos_contacto") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  let puntosContacto: string[] | undefined = undefined;
  if (puntosRaw.length > 0) {
    const contenidos = await getContenido();
    const validos = puntosRaw.filter((p) =>
      contenidos.some((c) => c.cta_id === p),
    );
    if (validos.length > 0) puntosContacto = validos;
  }

  // 1. Crear el lead con todo el contexto
  const lead = await createLead({
    nombre,
    instagram_username: (formData.get("instagram_username") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    telefono: (formData.get("telefono") as string) || undefined,
    puntos_contacto: puntosContacto,
    fuente,
    estado_pipeline: "agendado",
    assigned_setter_id: setterId,
    notas: (formData.get("notas") as string) || undefined,
    situacion_actual: (formData.get("situacion_actual") as string) || undefined,
    cuellos_botella: (formData.get("cuellos_botella") as string) || undefined,
    motivacion: (formData.get("motivacion") as string) || undefined,
    recursos_previos: (formData.get("recursos_previos") as string) || undefined,
  });

  // 2. Crear la agenda asociada
  const fechaHora = new Date(fechaAgendaStr).toISOString();
  const agenda = await createAgenda({
    lead_id: lead.id,
    calendly_event_id: null,
    nombre: lead.nombre,
    instagram: lead.instagram_username,
    telefono: lead.telefono,
    email: lead.email,
    fecha_agenda: fechaAgendaStr.slice(0, 10),
    fecha_hora_llamada: fechaHora,
    primer_contacto_origen:
      ((formData.get("primer_contacto_origen") as PrimerContactoOrigen | null) || null),
    situacion_actual: lead.situacion_actual,
    cuellos_botella: lead.cuellos_botella,
    motivacion: lead.motivacion,
    recursos_previos: lead.recursos_previos,
    nivel_calificacion:
      ((formData.get("nivel_calificacion") as NivelCalificacion | null) || null),
    closer_asignado_id: closerId ?? null,
    calendly_event_type: null,
    meeting_url: (formData.get("meeting_url") as string) || null,
    estado_llamada: "pendiente",
    resultado: null,
    programa_ofrecido: null,
    forma_cierre: null,
    monto_facturado: null,
    monto_facturado_currency: null,
    monto_upfront: null,
    monto_upfront_currency: null,
    cash_collected: null,
    cash_collected_currency: null,
    billetera: null,
    pago_en_cuotas: false,
    objecion_principal: null,
    objecion_principal_otro: null,
    objecion_secundaria: null,
    motivo_no_cierre: null,
    razon_compra: null,
    feedback_notas: null,
    proximo_seguimiento: null,
  });

  // 3. Crear automáticamente un Triage pendiente para que el closer lo vea
  await createTriage({
    lead_id: lead.id,
    agenda_id: agenda.id,
    fecha_hora_agenda: fechaHora,
    notas_triage: (formData.get("notas") as string) || null,
    responsable_triage_id: setterId ?? null,
    estado_triage: "pendiente",
  });

  revalidatePath("/setter/leads");
  revalidatePath("/setter/kanban");
  revalidatePath("/setter/panel");
  revalidatePath("/setter/triage");
  revalidatePath("/closer/triages");
  redirect(`/closer/triages`);
}
