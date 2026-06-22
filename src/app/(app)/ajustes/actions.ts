"use server";

import { revalidatePath } from "next/cache";
import {
  approveUser,
  createUser,
  deleteUser,
  rejectUser,
  updateUser,
} from "@/lib/data/users";
import {
  addBilletera,
  addPrograma,
  deleteBilletera,
  deletePrograma,
  renameBilletera,
  renamePrograma,
} from "@/lib/data/catalogs";
import { normalizeCalendarInput, updateAppConfig } from "@/lib/data/app-config";
import { refreshFxRates, setManualCriptoRate } from "@/lib/fx";
import type { UserRol } from "@/lib/domain";

function revalidateAll() {
  revalidatePath("/ajustes");
  revalidatePath("/direccion/general");
  revalidatePath("/direccion/rendimiento");
  revalidatePath("/closer/reporte");
  revalidatePath("/marketing");
}

// =====================================================================
// Users CRUD
// =====================================================================
export async function createUserAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!nombre || !email) return;
  await createUser({
    nombre,
    email,
    rol: (formData.get("rol") as UserRol) ?? "setter",
  });
  revalidateAll();
}

export async function updateUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await updateUser(id, {
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? ""),
    rol: (formData.get("rol") as UserRol) ?? "setter",
    activo: formData.get("activo") === "on",
  });
  revalidateAll();
}

export async function deleteUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteUser(id);
  revalidateAll();
}

export async function approveUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await approveUser(id);
  revalidateAll();
}

export async function rejectUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await rejectUser(id);
  revalidateAll();
}

// =====================================================================
// Billeteras CRUD
// =====================================================================
export async function addBilleteraAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;
  await addBilletera(nombre);
  revalidateAll();
}

export async function renameBilleteraAction(formData: FormData) {
  const viejo = String(formData.get("viejo") ?? "");
  const nuevo = String(formData.get("nuevo") ?? "").trim();
  if (!viejo || !nuevo) return;
  await renameBilletera(viejo, nuevo);
  revalidateAll();
}

export async function deleteBilleteraAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "");
  if (!nombre) return;
  await deleteBilletera(nombre);
  revalidateAll();
}

// =====================================================================
// Programas CRUD
// =====================================================================
export async function addProgramaAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;
  await addPrograma(nombre);
  revalidateAll();
}

export async function renameProgramaAction(formData: FormData) {
  const viejo = String(formData.get("viejo") ?? "");
  const nuevo = String(formData.get("nuevo") ?? "").trim();
  if (!viejo || !nuevo) return;
  await renamePrograma(viejo, nuevo);
  revalidateAll();
}

export async function deleteProgramaAction(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "");
  if (!nombre) return;
  await deletePrograma(nombre);
  revalidateAll();
}

// =====================================================================
// Integraciones (Google Calendar embed URL)
// =====================================================================
export interface ActionResult {
  success: boolean;
  message: string;
}

export async function updateGoogleCalendarUrlAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const raw = String(formData.get("google_calendar_url") ?? "");
    const normalized = normalizeCalendarInput(raw);

    if (!normalized) {
      await updateAppConfig({ google_calendar_url: null });
      revalidatePath("/ajustes");
      revalidatePath("/closer/calendario");
      return { success: true, message: "Google Calendar desconectado." };
    }

    // Validación básica: tiene que ser una URL de google.com/calendar
    if (!/calendar\.google\.com\/calendar/.test(normalized)) {
      return {
        success: false,
        message:
          "La URL no parece de Google Calendar. Asegurate de copiar el 'Public URL' o el iframe del calendar.",
      };
    }

    await updateAppConfig({ google_calendar_url: normalized });
    revalidatePath("/ajustes");
    revalidatePath("/closer/calendario");
    return { success: true, message: "Google Calendar conectado correctamente." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Error al guardar: ${msg}`,
    };
  }
}

// =====================================================================
// FX: estrategia + refresh manual
// =====================================================================
export async function updateFxStrategyAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const strategy = String(formData.get("fx_strategy") ?? "blue");
    if (!["blue", "mep", "oficial"].includes(strategy)) {
      return { success: false, message: "Estrategia inválida." };
    }
    await updateAppConfig({ fx_strategy: strategy });
    revalidatePath("/ajustes");
    revalidatePath("/direccion/general");
    revalidatePath("/direccion/rendimiento");
    return { success: true, message: `Estrategia cambiada a ${strategy}.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Error: ${msg}` };
  }
}

export async function refreshFxNowAction(
  _prev: ActionResult | null,
): Promise<ActionResult> {
  try {
    const rate = await refreshFxRates();
    revalidatePath("/ajustes");
    revalidatePath("/direccion/general");
    revalidatePath("/direccion/rendimiento");
    const fmt = (n: number | null) => (n ? `$${n.toFixed(2)}` : "—");
    return {
      success: true,
      message: `Cotización cripto actualizada — ${fmt(rate.usd_cripto)}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Error al traer cotizaciones: ${msg}` };
  }
}

export async function setFxManualAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const value = Number(formData.get("usd_cripto") ?? 0);
    if (!value || value <= 0) {
      return { success: false, message: "Ingresá un valor válido (ej. 1524)." };
    }
    await setManualCriptoRate(value);
    revalidatePath("/ajustes");
    revalidatePath("/direccion/general");
    revalidatePath("/direccion/rendimiento");
    return {
      success: true,
      message: `Cotización cripto fijada a mano en $${value.toFixed(2)}.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Error: ${msg}` };
  }
}
