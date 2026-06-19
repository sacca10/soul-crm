"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteLead, updateLeadEstado } from "@/lib/data/leads";
import type { LeadEstadoPipeline } from "@/lib/domain";

function revalidateLeadPages(id?: string) {
  if (id) revalidatePath(`/setter/leads/${id}`);
  revalidatePath("/setter/leads");
  revalidatePath("/setter/kanban");
  revalidatePath("/setter/panel");
  revalidatePath("/direccion/general");
  revalidatePath("/direccion/rendimiento");
  revalidatePath("/marketing");
}

export async function deleteLeadAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteLead(id);
  revalidateLeadPages();
  redirect("/setter/leads");
}

export async function updateLeadEstadoAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const estado = formData.get("estado") as LeadEstadoPipeline | null;
  if (!id || !estado) return;
  await updateLeadEstado(id, estado);
  revalidateLeadPages(id);
}
