"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteKpiManual,
  updateKpiManual,
  upsertKpiManual,
} from "@/lib/data/misc";

export type KpiSaveState = { error: string } | { ok: true } | null;

function revalidateAll() {
  revalidatePath("/setter/kpis-diarios");
  revalidatePath("/direccion/general");
  revalidatePath("/direccion/rendimiento");
  revalidatePath("/marketing");
}

export async function saveKpiManualAction(
  _prevState: KpiSaveState,
  formData: FormData,
): Promise<KpiSaveState> {
  const id = (formData.get("id") as string) || null;
  const isEditMode = formData.get("_mode") === "edit";
  const fecha = String(
    formData.get("fecha") ?? new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
    }),
  );
  const data = {
    fecha,
    chats_unicos_abiertos: Number(formData.get("chats_unicos_abiertos") ?? 0),
    conversaciones: Number(formData.get("conversaciones") ?? 0),
    enviamos_vsl: Number(formData.get("enviamos_vsl") ?? 0),
    vistas_vsl: Number(formData.get("vistas_vsl") ?? 0),
    llegaron_cta_vsl: Number(formData.get("llegaron_cta_vsl") ?? 0),
    respondieron_cta_vsl: Number(formData.get("respondieron_cta_vsl") ?? 0),
    agendas_manual: Number(formData.get("agendas_manual") ?? 0),
    notas: (formData.get("notas") as string) || null,
  };

  try {
    if (id) {
      await updateKpiManual(id, data);
    } else {
      await upsertKpiManual(data);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { error: `No se pudo guardar. ${msg}` };
  }

  revalidateAll();
  // Solo el modo edición explícita (lápiz del historial) navega de vuelta.
  // El guardado inline del día se queda en la página para mostrar el banner.
  if (isEditMode) redirect("/setter/kpis-diarios");
  return { ok: true };
}

export async function deleteKpiManualAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteKpiManual(id);
  revalidateAll();
}
