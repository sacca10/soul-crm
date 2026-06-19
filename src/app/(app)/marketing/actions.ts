"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createContenido, deleteContenido } from "@/lib/data/misc";
import type { ContenidoPlataforma } from "@/lib/domain";

export async function createCtaAction(formData: FormData) {
  const cta_id = String(formData.get("cta_id") ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!cta_id || !nombre) return;

  await createContenido({
    cta_id,
    nombre,
    descripcion: (formData.get("descripcion") as string) || null,
    plataforma: (formData.get("plataforma") as ContenidoPlataforma) ?? "instagram",
    fecha_publicacion: String(formData.get("fecha_publicacion") ?? new Date().toISOString().slice(0, 10)),
    url: (formData.get("url") as string) || null,
    notas: null,
    chats_unicos_abiertos: Number(formData.get("chats_unicos_abiertos") ?? 0) || 0,
    conversaciones: Number(formData.get("conversaciones") ?? 0) || 0,
  });

  revalidatePath("/marketing");
  redirect("/marketing");
}

export async function deleteCtaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteContenido(id);
  revalidatePath("/marketing");
  revalidatePath("/setter/leads/nuevo");
  revalidatePath("/setter/leads/nuevo-agendado");
}
