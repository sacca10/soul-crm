import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface ManychatPayload {
  manychat_id: string;
  nombre: string;
  instagram_username?: string;
  email?: string;
  telefono?: string;
  /**
   * Punto de contacto: el CTA por el que respondió este lead.
   * Si el lead ya existía (mismo manychat_id) y tenía otros puntos,
   * éste se agrega a la lista (no la reemplaza).
   */
  cta_tag?: string;
}

export async function POST(request: Request) {
  // Validate shared secret
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.MANYCHAT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ManychatPayload>;
  const supabase = createServiceClient();

  // Log every request (success or fail) for auditability
  const logEvent = async (
    status: "procesado" | "error",
    errorMessage?: string,
    entidadId?: string,
  ) => {
    await supabase.from("webhook_events").insert({
      fuente: "manychat",
      payload: body,
      status,
      error_message: errorMessage ?? null,
      entidad_creada_id: entidadId ?? null,
    });
  };

  if (!body.manychat_id || !body.nombre) {
    await logEvent("error", "missing required fields manychat_id or nombre");
    return NextResponse.json(
      { error: "Missing required fields: manychat_id, nombre" },
      { status: 400 },
    );
  }

  try {
    // Si el lead ya existe, agregamos el cta_tag al array existente (sin duplicar)
    const { data: existing } = await supabase
      .from("leads")
      .select("id, puntos_contacto")
      .eq("manychat_id", body.manychat_id)
      .maybeSingle();

    const existingPuntos =
      (existing as { puntos_contacto?: string[] } | null)?.puntos_contacto ?? [];
    const nextPuntos = body.cta_tag
      ? Array.from(new Set([...existingPuntos, body.cta_tag]))
      : existingPuntos;

    const { data, error } = await supabase
      .from("leads")
      .upsert(
        {
          manychat_id: body.manychat_id,
          nombre: body.nombre,
          instagram_username: body.instagram_username ?? null,
          email: body.email ?? null,
          telefono: body.telefono ?? null,
          puntos_contacto: nextPuntos,
          fuente: "instagram",
          estado_pipeline: existing ? undefined : "mensaje_apertura",
        },
        { onConflict: "manychat_id" },
      )
      .select("id")
      .single();

    if (error) throw error;

    const id = (data as { id: string }).id;
    await logEvent("procesado", undefined, id);
    return NextResponse.json({ ok: true, lead_id: id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvent("error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
