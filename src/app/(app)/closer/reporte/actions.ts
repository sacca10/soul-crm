"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAgenda, updateAgenda } from "@/lib/data/agendas";
import { createSeguimiento } from "@/lib/data/misc";
import type {
  Agenda,
  EstadoLlamada,
  FormaCierre,
  Moneda,
  ObjecionCategoria,
  ResultadoLlamada,
  SeguimientoEstado,
} from "@/lib/domain";

export async function submitReporteAction(formData: FormData) {
  const agendaId = String(formData.get("agenda_id") ?? "");
  if (!agendaId) return;

  const estadoLlamada = String(formData.get("estado_llamada") ?? "pendiente") as EstadoLlamada;
  const resultado = (formData.get("resultado") as ResultadoLlamada | null) || null;

  const monto = Number(formData.get("monto_facturado") ?? 0) || null;
  const cashCol = Number(formData.get("cash_collected") ?? 0) || null;
  const upfront = Number(formData.get("monto_upfront") ?? 0) || null;
  const currency = (formData.get("currency") as Moneda) || "USD";

  const proximoSeguimiento = (formData.get("proximo_seguimiento") as string) || null;
  const totalProyectado = Number(formData.get("total_cobrar_proyectado") ?? 0) || null;
  const seguimientoEstado =
    ((formData.get("seguimiento_estado") as SeguimientoEstado) ?? "tibio") as SeguimientoEstado;
  const proximaAccion = (formData.get("proxima_accion") as string) || null;

  await updateAgenda(agendaId, {
    estado_llamada: estadoLlamada,
    resultado,
    programa_ofrecido: (formData.get("programa_ofrecido") as string) || null,
    forma_cierre: (formData.get("forma_cierre") as FormaCierre | null) || null,
    monto_facturado: monto,
    monto_facturado_currency: monto ? currency : null,
    cash_collected: cashCol,
    cash_collected_currency: cashCol ? currency : null,
    monto_upfront: upfront,
    monto_upfront_currency: upfront ? currency : null,
    billetera: ((formData.get("billetera") as string) || null) as Agenda["billetera"],
    pago_en_cuotas: formData.get("pago_en_cuotas") === "on",
    objecion_principal: (formData.get("objecion_principal") as ObjecionCategoria | null) || null,
    objecion_principal_otro: (formData.get("objecion_principal_otro") as string) || null,
    objecion_secundaria: (formData.get("objecion_secundaria") as string) || null,
    motivo_no_cierre: (formData.get("motivo_no_cierre") as string) || null,
    razon_compra: (formData.get("razon_compra") as string) || null,
    situacion_actual: (formData.get("situacion_actual") as string) || null,
    dolores: (formData.get("dolores") as string) || null,
    frases_clave: (formData.get("frases_clave") as string) || null,
    feedback_notas: (formData.get("feedback_notas") as string) || null,
    proximo_seguimiento: proximoSeguimiento,
  });

  // Auto-crear seguimiento si el resultado fue "seguimiento"
  if (resultado === "seguimiento") {
    const agenda = await getAgenda(agendaId);
    if (agenda) {
      await createSeguimiento({
        lead_id: agenda.lead_id ?? null,
        agenda_id: agendaId,
        numero_seguimiento: 1,
        fecha_llamada_original: agenda.fecha_hora_llamada.slice(0, 10),
        fecha_proximo_seguimiento: proximoSeguimiento,
        total_cobrar_proyectado: totalProyectado,
        total_cobrar_proyectado_currency: totalProyectado ? currency : null,
        estado: seguimientoEstado,
        proxima_accion: proximaAccion,
        aclaraciones: null,
        dias_desde_ultima_interaccion: 0,
      });
    }
  }

  revalidatePath("/closer/triages");
  revalidatePath("/closer/grilla");
  revalidatePath("/closer/calendario");
  revalidatePath("/cobros");
  revalidatePath("/direccion/general");
  revalidatePath("/direccion/rendimiento");
  redirect(`/closer/agendas/${agendaId}`);
}
