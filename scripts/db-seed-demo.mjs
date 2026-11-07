// Script ad-hoc: carga datos de DEMO claramente marcados en la base real de
// Supabase (para screenshots), guardando un manifiesto de IDs para poder
// borrarlos después con db-cleanup-demo.mjs. No tocar en el flujo normal de
// la app — esto es tooling de un solo uso.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const manifest = {};
async function insertTracked(table, rows) {
  const { data, error } = await sb.from(table).insert(rows).select("id");
  if (error) throw new Error(`${table}: ${error.message}`);
  manifest[table] = (manifest[table] ?? []).concat(data.map((r) => r.id));
  return data;
}

function rand() {
  return Math.random();
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}
function intBetween(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------------------------------------------------------------------
// 1. USERS (demo setters/closers/marketing — auth_id null, no pueden logearse)
// ---------------------------------------------------------------------
const demoUsersInput = [
  { nombre: "DEMO Ana Setter", email: "demo-ana.setter@soul-demo.local", rol: "setter", activo: true, aprobado: true },
  { nombre: "DEMO Carlos Setter", email: "demo-carlos.setter@soul-demo.local", rol: "setter", activo: true, aprobado: true },
  { nombre: "DEMO María Closer", email: "demo-maria.closer@soul-demo.local", rol: "closer", activo: true, aprobado: true },
  { nombre: "DEMO Nico Closer", email: "demo-nico.closer@soul-demo.local", rol: "closer", activo: true, aprobado: true },
  { nombre: "DEMO Lucas MKT", email: "demo-lucas.mkt@soul-demo.local", rol: "marketing", activo: true, aprobado: true },
];
const demoUsers = await insertTracked("users", demoUsersInput);
const withNombre = (rows, inputs) => rows.map((r, i) => ({ id: r.id, ...inputs[i] }));
const users = withNombre(demoUsers, demoUsersInput);
const setters = users.filter((u) => u.rol === "setter");
const closers = users.filter((u) => u.rol === "closer");

// ---------------------------------------------------------------------
// 2. CONTENIDO (CTAs demo)
// ---------------------------------------------------------------------
const demoContenidoInput = [
  {
    cta_id: "DEMO_CTA_REEL_FRAMEWORK",
    nombre: "DEMO Reel framework de prospección",
    plataforma: "instagram",
    fecha_publicacion: daysAgo(40).toISOString().slice(0, 10),
    descripcion: "Reel orgánico explicando los 3 errores al prospectar.",
    chats_unicos_abiertos: 87,
    conversaciones: 34,
  },
  {
    cta_id: "DEMO_CTA_VIDEO_CASO_EXITO",
    nombre: "DEMO Video YouTube — caso de éxito",
    plataforma: "youtube",
    fecha_publicacion: daysAgo(60).toISOString().slice(0, 10),
    descripcion: "Caso de éxito alumno facturó $30k en 60 días.",
    chats_unicos_abiertos: 142,
    conversaciones: 58,
  },
  {
    cta_id: "DEMO_CTA_ADS_PAINPOINT",
    nombre: "DEMO Test creativo ADS — pain point",
    plataforma: "ads",
    fecha_publicacion: daysAgo(20).toISOString().slice(0, 10),
    descripcion: "Creativo testeando hook con pain point #1.",
    chats_unicos_abiertos: 32,
    conversaciones: 11,
  },
  {
    cta_id: "DEMO_CTA_REEL_ESTRUCTURA",
    nombre: "DEMO Reel — estructura de mensaje",
    plataforma: "instagram",
    fecha_publicacion: daysAgo(10).toISOString().slice(0, 10),
    chats_unicos_abiertos: 21,
    conversaciones: 7,
  },
];
await insertTracked("contenido", demoContenidoInput);
const ctaIds = demoContenidoInput.map((c) => c.cta_id);

// ---------------------------------------------------------------------
// 3. LEADS (40, nombres marcados DEMO, repartidos en el pipeline)
// ---------------------------------------------------------------------
const NOMBRES = [
  "Martín Rodríguez", "Sofía González", "Lucas Fernández", "Valentina López",
  "Mateo Martínez", "Camila Sánchez", "Santiago Pérez", "Isabella Romero",
  "Benjamín Torres", "Emma Díaz", "Nicolás Castro", "Mía Vargas",
  "Thiago Morales", "Catalina Ruiz", "Joaquín Herrera", "Lucía Mendoza",
  "Felipe Navarro", "Victoria Silva", "Sebastián Ortiz", "Renata Campos",
];
const ESTADO_WEIGHTS = [
  ["mensaje_apertura", 16], ["en_descubrimiento", 12], ["calificado", 8],
  ["en_nutricion", 7], ["vsl_enviado", 6], ["oferta_llamada", 5],
  ["calendly_enviado", 7], ["agendado", 6], ["en_seguimiento", 5],
];
function pickWeightedEstado() {
  const total = ESTADO_WEIGHTS.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [estado, w] of ESTADO_WEIGHTS) {
    r -= w;
    if (r <= 0) return estado;
  }
  return "mensaje_apertura";
}
const FUENTES = ["instagram", "instagram", "instagram", "youtube", "ads", "whatsapp_manual", "formulario", "referido"];

const leadsInput = NOMBRES.map((nombreBase, i) => {
  const nombre = `DEMO ${nombreBase}`;
  const handle = nombreBase.toLowerCase().replace(/\s+/g, ".")
    .replace(/í/g, "i").replace(/á/g, "a").replace(/é/g, "e").replace(/ó/g, "o").replace(/ú/g, "u");
  const ctaCount = intBetween(1, 3);
  const puntos = Array.from(new Set(Array.from({ length: ctaCount }).map(() => pick(ctaIds))));
  return {
    nombre,
    instagram_username: `@demo.${handle}`,
    email: `demo.${handle}@gmail.com`,
    telefono: `+54 9 11 ${intBetween(1000, 9999)}-${intBetween(1000, 9999)}`,
    manychat_id: `demo-mc-${100000 + i}`,
    puntos_contacto: puntos,
    fuente: pick(FUENTES),
    estado_pipeline: pickWeightedEstado(),
    assigned_setter_id: pick(setters).id,
    fecha_ingreso: daysAgo(intBetween(0, 90)).toISOString(),
  };
});
const demoLeads = await insertTracked("leads", leadsInput);
const leads = demoLeads.map((r, i) => ({ id: r.id, ...leadsInput[i] }));

// ---------------------------------------------------------------------
// 4. AGENDAS (24 — un bloque garantizado "cerrado" dentro del mes en curso
//    para que el panel de Dirección muestre ventas, el resto histórico)
// ---------------------------------------------------------------------
const PROGRAMAS = ["Programa Élite", "Programa Master", "Programa Starter"];
const FORMAS_CIERRE = ["PIF", "cuotas", "sena_saldo"];
const BILLETERAS = ["Stripe", "Whop", "Transferencia", "Mercadopago"];
const diasTranscurridosDelMes = new Date().getDate() - 1;

const agendasInput = Array.from({ length: 24 }).map((_, i) => {
  const lead = leads[i % leads.length];
  const esVentaRecienteGarantizada = i >= 4 && i < 16;
  const fechaCall = esVentaRecienteGarantizada
    ? daysAgo(intBetween(0, diasTranscurridosDelMes))
    : daysAgo(intBetween(-10, 60));
  fechaCall.setHours(intBetween(9, 19), pick([0, 15, 30, 45]), 0, 0);

  const estadoLlamada = i < 4
    ? "pendiente"
    : esVentaRecienteGarantizada
    ? "asistio"
    : pick(["asistio", "asistio", "asistio", "no_show", "reagendada"]);
  const resultado = estadoLlamada === "asistio"
    ? esVentaRecienteGarantizada
      ? pick(["cerrado", "cerrado", "cerrado", "no_cerrado"])
      : pick(["cerrado", "cerrado", "no_cerrado", "seguimiento"])
    : null;
  const cerrado = resultado === "cerrado";
  const monto = cerrado ? intBetween(15, 60) * 100 : 0;
  const cashCol = cerrado ? Math.round(monto * (rand() * 0.5 + 0.5)) : 0;
  const closer = pick(closers);
  const pagoEnCuotas = cerrado && rand() > 0.5;

  return {
    lead_id: lead.id,
    nombre: lead.nombre,
    instagram: lead.instagram_username,
    telefono: lead.telefono,
    email: lead.email,
    fecha_agenda: fechaCall.toISOString().slice(0, 10),
    fecha_hora_llamada: fechaCall.toISOString(),
    primer_contacto_origen: pick(["organico_ig", "ads", "referido", "lista"]),
    situacion_actual: pick(["Tiene un negocio chico y quiere escalar.", "Recién arranca, busca claridad.", "Estancado hace 6 meses."]),
    cuellos_botella: pick(["No tiene proceso de ventas", "No genera leads", "Cierra mal las llamadas"]),
    motivacion: pick(["Llegar a $20k MRR", "Renunciar al trabajo", "Tener libertad de tiempo"]),
    recursos_previos: pick(["Cursos en Hotmart", "YouTube", "Ningún curso pago"]),
    nivel_calificacion: estadoLlamada === "asistio" ? pick(["calificado", "calificado", "no_calificado", "dudoso"]) : null,
    closer_asignado_id: closer.id,
    estado_llamada: estadoLlamada,
    resultado,
    programa_ofrecido: cerrado ? pick(PROGRAMAS) : null,
    forma_cierre: cerrado ? pick(FORMAS_CIERRE) : null,
    monto_facturado: cerrado ? monto : null,
    monto_facturado_currency: cerrado ? "USD" : null,
    monto_upfront: cerrado ? Math.round(monto * 0.4) : null,
    monto_upfront_currency: cerrado ? "USD" : null,
    cash_collected: cerrado ? cashCol : null,
    cash_collected_currency: cerrado ? "USD" : null,
    billetera: cerrado ? pick(BILLETERAS) : null,
    pago_en_cuotas: pagoEnCuotas,
    objecion_principal: resultado === "no_cerrado" ? pick(["precio", "timing", "pareja", "confianza", "decision"]) : null,
    feedback_notas: cerrado ? "DEMO — Llamada productiva, ya pasó al onboarding." : null,
    proximo_seguimiento: resultado === "seguimiento" ? daysAgo(-intBetween(3, 14)).toISOString().slice(0, 10) : null,
  };
});
const demoAgendas = await insertTracked("agendas", agendasInput);
const agendas = demoAgendas.map((r, i) => ({ id: r.id, ...agendasInput[i], setter_id: pick(setters).id }));

// ---------------------------------------------------------------------
// 5. COMISIONES (una por venta cerrada)
// ---------------------------------------------------------------------
const cerradas = agendas.filter((a) => a.resultado === "cerrado" && a.monto_facturado);
if (cerradas.length) {
  const comisionesInput = cerradas.map((a) => {
    const monto = a.monto_facturado;
    return {
      agenda_id: a.id,
      setter_id: pick(setters).id,
      closer_id: a.closer_asignado_id,
      setter_pct: 5,
      closer_pct: 10,
      comision_setter_monto: Math.round(monto * 0.05),
      comision_setter_currency: "USD",
      comision_closer_monto: Math.round(monto * 0.1),
      comision_closer_currency: "USD",
      pagado: rand() > 0.4,
      fecha_pago_comision: rand() > 0.4 ? daysAgo(intBetween(1, 30)).toISOString().slice(0, 10) : null,
    };
  });
  await insertTracked("comisiones", comisionesInput);
}

// ---------------------------------------------------------------------
// 6. COBROS (cuotas para los cerrados con pago_en_cuotas)
// ---------------------------------------------------------------------
const conCuotas = agendas.filter((a) => a.resultado === "cerrado" && a.pago_en_cuotas);
if (conCuotas.length) {
  const cobrosInput = conCuotas.flatMap((a) => {
    const total = intBetween(3, 6);
    const montoTotal = a.monto_facturado ?? 1500;
    const porCuota = Math.round(montoTotal / total);
    return Array.from({ length: total }).map((_, i) => {
      const vencDate = new Date();
      vencDate.setDate(vencDate.getDate() - (30 * (total - i - 1) + intBetween(-5, 5)));
      const venceFuturo = vencDate > new Date();
      const cobradaProb = !venceFuturo && rand() > 0.2;
      return {
        lead_id: a.lead_id,
        agenda_id: a.id,
        programa_contratado: a.programa_ofrecido ?? "Programa Élite",
        tipo_cuota: "regular",
        numero_cuota: i + 1,
        total_cuotas: total,
        monto_cobrar: porCuota,
        monto_cobrar_currency: "USD",
        fecha_vencimiento: vencDate.toISOString().slice(0, 10),
        fecha_cobro_real: cobradaProb ? vencDate.toISOString().slice(0, 10) : null,
        estado: cobradaProb ? "cobrada" : venceFuturo ? "al_dia" : "vencida",
        billetera: a.billetera ?? "Stripe",
      };
    });
  });
  await insertTracked("cobros", cobrosInput);
}

// ---------------------------------------------------------------------
// 7. GASTOS FIJOS (demo)
// ---------------------------------------------------------------------
const gastosInput = [
  { nombre: "DEMO Zoom Pro", monto: 30, monto_currency: "USD", fecha_pago: daysAgo(28).toISOString().slice(0, 10), forma_pago: "Mensual", estado: "activo", categoria: "software" },
  { nombre: "DEMO Calendly Standard", monto: 12, monto_currency: "USD", fecha_pago: daysAgo(15).toISOString().slice(0, 10), forma_pago: "Mensual", estado: "activo", categoria: "software" },
  { nombre: "DEMO ManyChat Pro", monto: 15, monto_currency: "USD", fecha_pago: daysAgo(7).toISOString().slice(0, 10), forma_pago: "Mensual", estado: "activo", categoria: "software" },
  { nombre: "DEMO Editor de video", monto: 500, monto_currency: "USD", fecha_pago: daysAgo(20).toISOString().slice(0, 10), forma_pago: "Mensual", estado: "activo", categoria: "servicios" },
  { nombre: "DEMO Meta Ads (presupuesto)", monto: 1500, monto_currency: "USD", fecha_pago: daysAgo(5).toISOString().slice(0, 10), forma_pago: "Mensual", estado: "activo", categoria: "publicidad" },
];
await insertTracked("gastos_fijos", gastosInput);

// ---------------------------------------------------------------------
// 8. TRIAGES
// ---------------------------------------------------------------------
const triagesInput = agendas.slice(0, 6).map((a) => ({
  lead_id: a.lead_id,
  agenda_id: a.id,
  fecha_hora_agenda: a.fecha_hora_llamada,
  notas_triage: "DEMO — " + pick(["Cliente listo", "Pedir más info de presupuesto", "Calificación dudosa, validar"]),
  responsable_triage_id: pick(setters).id,
  estado_triage: pick(["pendiente", "hecho", "rechazado"]),
}));
await insertTracked("triages", triagesInput);

writeFileSync("demo-data-manifest.json", JSON.stringify(manifest, null, 2));
console.log("Insertado OK. Resumen:");
for (const [table, ids] of Object.entries(manifest)) console.log(`  ${table}: ${ids.length}`);
console.log(`Ventas demo cerradas: ${cerradas.length}`);
console.log("Manifiesto guardado en demo-data-manifest.json");
