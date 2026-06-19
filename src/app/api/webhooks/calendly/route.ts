import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Calendly webhook handler.
 * Recibe eventos `invitee.created` / `invitee.canceled` y crea/actualiza
 * una agenda en la DB. Matchea con un lead existente por email.
 *
 * Firma: Calendly firma con HMAC SHA256. Header: `Calendly-Webhook-Signature`
 * Formato: "t=<timestamp>,v1=<hash>"
 * Doc: https://developer.calendly.com/api-docs/ZG9jOjE3OTAtwebhook-signatures
 */

function verifySignature(rawBody: string, header: string | null): boolean {
  if (!header || !process.env.CALENDLY_WEBHOOK_SECRET) return false;
  try {
    const parts = Object.fromEntries(
      header.split(",").map((p) => p.split("=").map((s) => s.trim())),
    ) as { t?: string; v1?: string };
    if (!parts.t || !parts.v1) return false;
    const signed = `${parts.t}.${rawBody}`;
    const expected = crypto
      .createHmac("sha256", process.env.CALENDLY_WEBHOOK_SECRET)
      .update(signed)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(parts.v1),
    );
  } catch {
    return false;
  }
}

interface CalendlyQA {
  question: string;
  answer: string;
}

interface CalendlyEventMembership {
  user: string;
}

interface CalendlyInviteePayload {
  uri: string;
  name: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  questions_and_answers?: CalendlyQA[];
  scheduled_event?: {
    uri: string;
    name?: string;
    start_time: string;
    end_time: string;
    event_type?: string;
    event_memberships?: CalendlyEventMembership[];
    location?: CalendlyLocation;
  };
}

interface CalendlyLocation {
  type?: string;
  join_url?: string;
  location?: string;
  data?: { url?: string } | null;
}

/**
 * Extrae el link para unirse a la llamada del objeto location de Calendly.
 * Diferentes tipos de conferencia ponen el URL en distintos campos.
 */
function extractMeetingUrl(location: CalendlyLocation | undefined): string | null {
  if (!location) return null;
  if (location.join_url) return location.join_url;
  if (location.data?.url) return location.data.url;
  if (location.location && /^https?:\/\//.test(location.location)) {
    return location.location;
  }
  return null;
}

/**
 * Si `CALENDLY_TRACKED_USER_URI` está seteada en env, solo procesamos eventos
 * donde el host (event_membership) coincide. Si no está seteada, procesamos todo.
 */
function isTrackedHost(payload: CalendlyInviteePayload): boolean {
  const trackedUri = process.env.CALENDLY_TRACKED_USER_URI;
  if (!trackedUri) return true;
  const memberships = payload.scheduled_event?.event_memberships ?? [];
  return memberships.some((m) => m.user === trackedUri);
}

interface CalendlyWebhookBody {
  event: string;
  payload: CalendlyInviteePayload;
}

/**
 * Busca un Q&A por palabra clave en la pregunta. Devuelve la respuesta o null.
 */
function findAnswer(qas: CalendlyQA[] | undefined, keyword: string): string | null {
  if (!qas) return null;
  const q = qas.find((x) => x.question.toLowerCase().includes(keyword.toLowerCase()));
  return q?.answer ?? null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get("calendly-webhook-signature");

  if (!verifySignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: CalendlyWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const logEvent = async (
    status: "procesado" | "error",
    errorMessage?: string,
    entidadId?: string,
  ) => {
    await supabase.from("webhook_events").insert({
      fuente: "calendly",
      payload: body,
      status,
      error_message: errorMessage ?? null,
      entidad_creada_id: entidadId ?? null,
    });
  };

  try {
    // Filtrar por host si está configurado CALENDLY_TRACKED_USER_URI
    if (!isTrackedHost(body.payload)) {
      await logEvent("procesado", "skipped: host no tracked");
      return NextResponse.json({ ok: true, skipped: true, reason: "host_not_tracked" });
    }

    // Solo procesamos invitee.created (crea/actualiza agenda)
    // invitee.canceled → marcamos como cancelada
    if (body.event === "invitee.created") {
      const invitee = body.payload;
      const event = invitee.scheduled_event;
      if (!event) {
        await logEvent("error", "Missing scheduled_event in payload");
        return NextResponse.json({ error: "missing scheduled_event" }, { status: 400 });
      }

      const calendlyEventId = invitee.uri.split("/").pop() ?? invitee.uri;
      const fullName =
        invitee.name ||
        `${invitee.first_name ?? ""} ${invitee.last_name ?? ""}`.trim() ||
        invitee.email;

      // Busco el lead por email para vincular y actualizar su estado
      let leadId: string | null = null;
      if (invitee.email) {
        const { data: lead } = await supabase
          .from("leads")
          .select("id")
          .eq("email", invitee.email)
          .maybeSingle();
        if (lead) leadId = (lead as { id: string }).id;
      }

      // Upsert sobre calendly_event_id (idempotente)
      const { data: agenda, error } = await supabase
        .from("agendas")
        .upsert(
          {
            calendly_event_id: calendlyEventId,
            lead_id: leadId,
            nombre: fullName,
            email: invitee.email,
            fecha_agenda: event.start_time.slice(0, 10),
            fecha_hora_llamada: event.start_time,
            situacion_actual: findAnswer(invitee.questions_and_answers, "situación"),
            cuellos_botella: findAnswer(invitee.questions_and_answers, "cuello"),
            motivacion: findAnswer(invitee.questions_and_answers, "motivación"),
            recursos_previos: findAnswer(invitee.questions_and_answers, "recurso"),
            calendly_event_type: event.name ?? null,
            meeting_url: extractMeetingUrl(event.location),
            estado_llamada: "pendiente",
          },
          { onConflict: "calendly_event_id" },
        )
        .select("id")
        .single();

      if (error) throw error;

      // Si encontramos un lead asociado, actualizamos su pipeline
      if (leadId) {
        await supabase
          .from("leads")
          .update({ estado_pipeline: "agendado" })
          .eq("id", leadId);
      }

      const agendaId = (agenda as { id: string }).id;
      await logEvent("procesado", undefined, agendaId);
      return NextResponse.json({ ok: true, agenda_id: agendaId });
    }

    if (body.event === "invitee.canceled") {
      const invitee = body.payload;
      const calendlyEventId = invitee.uri.split("/").pop() ?? invitee.uri;
      await supabase
        .from("agendas")
        .update({ estado_llamada: "reagendada" })
        .eq("calendly_event_id", calendlyEventId);
      await logEvent("procesado", "canceled");
      return NextResponse.json({ ok: true });
    }

    // Otros eventos: solo log
    await logEvent("procesado", `unhandled event: ${body.event}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvent("error", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
