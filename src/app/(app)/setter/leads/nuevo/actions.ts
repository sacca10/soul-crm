"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLead } from "@/lib/data/leads";
import type { LeadEstadoPipeline, LeadFuente } from "@/lib/domain";

export type CreateLeadState = { error: string } | null;

export async function createLeadAction(
  _prevState: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "El nombre es requerido." };

  // Verificar (y refrescar) la sesión antes de tocar la DB.
  // getUser() fuerza el refresh del access token si está por expirar.
  const supabase = createClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return {
      error:
        "Tu sesión expiró. Recargá la página e iniciá sesión de nuevo.",
    };
  }

  const fuente = String(formData.get("fuente") ?? "instagram") as LeadFuente;
  const estado = String(
    formData.get("estado_pipeline") ?? "mensaje_apertura",
  ) as LeadEstadoPipeline;

  const puntos = String(formData.get("puntos_contacto") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const lead = await createLead({
      nombre,
      instagram_username: (formData.get("instagram_username") as string) || undefined,
      fuente,
      estado_pipeline: estado,
      puntos_contacto: puntos.length > 0 ? puntos : undefined,
      assigned_setter_id: (formData.get("assigned_setter_id") as string) || undefined,
      notas: (formData.get("notas") as string) || undefined,
    });

    revalidatePath("/setter/leads");
    revalidatePath("/setter/kanban");
    revalidatePath("/setter/panel");
    redirect(`/setter/leads/${lead.id}`);
  } catch (e) {
    // Re-throw Next.js redirect — no es un error, es control-flow intencional
    if (
      e != null &&
      typeof e === "object" &&
      "digest" in e &&
      String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { error: `No se pudo crear el lead. ${msg}` };
  }
  return null;
}
