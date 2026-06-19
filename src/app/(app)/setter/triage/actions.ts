"use server";

import { revalidatePath } from "next/cache";
import { createTriage, deleteTriage } from "@/lib/data/misc";
import type { TriageEstado } from "@/lib/domain";

export async function createTriageAction(formData: FormData) {
  await createTriage({
    lead_id: null,
    agenda_id: (formData.get("agenda_id") as string) || null,
    fecha_hora_agenda: (formData.get("fecha_hora_agenda") as string) || null,
    notas_triage: (formData.get("notas_triage") as string) || null,
    responsable_triage_id: (formData.get("responsable_triage_id") as string) || null,
    estado_triage: (formData.get("estado_triage") as TriageEstado) || "pendiente",
  });
  revalidatePath("/setter/triage");
  revalidatePath("/closer/triages");
}

export async function deleteTriageAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteTriage(id);
  revalidatePath("/setter/triage");
  revalidatePath("/closer/triages");
}
