"use server";

import { revalidatePath } from "next/cache";
import { updateLeadEstado } from "@/lib/data/leads";
import type { LeadEstadoPipeline } from "@/lib/domain";

export async function moveLeadAction(leadId: string, nuevoEstado: LeadEstadoPipeline) {
  await updateLeadEstado(leadId, nuevoEstado);
  // Revalidar todas las páginas que muestran datos de leads/funnel/KPIs
  revalidatePath("/setter/kanban");
  revalidatePath("/setter/panel");
  revalidatePath("/setter/leads");
  revalidatePath("/setter/triage");
  revalidatePath("/closer/triages");
  revalidatePath("/direccion/general");
  revalidatePath("/direccion/rendimiento");
  revalidatePath("/marketing");
  revalidatePath("/cobros");
}
