import type {
  Agenda,
  Cobro,
  Comision,
  Contenido,
  GastoFijo,
  KpiDiarioManual,
  Lead,
  LeadEstadoPipeline,
  LeadFuente,
  Seguimiento,
  Triage,
  User,
} from "@/lib/domain";

// Deterministic pseudo-random so the mock data stays stable across renders.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function intBetween(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// ---------------------------------------------------------------------
// USERS
// ---------------------------------------------------------------------
export const mockUsers: User[] = [
  { id: "u-admin", nombre: "Juani", email: "juani@soul.local", rol: "admin", activo: true, aprobado: true },
  { id: "u-set-1", nombre: "Ana Setter", email: "ana@soul.local", rol: "setter", activo: true, aprobado: true },
  { id: "u-set-2", nombre: "Carlos Setter", email: "carlos@soul.local", rol: "setter", activo: true, aprobado: true },
  { id: "u-clo-1", nombre: "María Closer", email: "maria@soul.local", rol: "closer", activo: true, aprobado: true },
  { id: "u-clo-2", nombre: "Carlos Closer", email: "carlos.c@soul.local", rol: "closer", activo: true, aprobado: true },
  { id: "u-mkt-1", nombre: "Lucas MKT", email: "lucas@soul.local", rol: "marketing", activo: true, aprobado: true },
];

const setters = mockUsers.filter((u) => u.rol === "setter");
const closers = mockUsers.filter((u) => u.rol === "closer");

// ---------------------------------------------------------------------
// CONTENIDO / CTAs
// ---------------------------------------------------------------------
export const mockContenido: Contenido[] = [
  {
    id: "c-1",
    cta_id: "CTA_PRUEBA_15ENERO",
    nombre: "Reel framework de prospección",
    plataforma: "instagram",
    fecha_publicacion: daysAgo(40).slice(0, 10),
    descripcion: "Reel orgánico explicando los 3 errores al prospectar.",
    chats_unicos_abiertos: 87,
    conversaciones: 34,
  },
  {
    id: "c-2",
    cta_id: "CTA_VIDEO_29_12",
    nombre: "Video YouTube — caso de éxito",
    plataforma: "youtube",
    fecha_publicacion: daysAgo(60).slice(0, 10),
    descripcion: "Caso de éxito alumno facturó $30k en 60 días.",
    chats_unicos_abiertos: 142,
    conversaciones: 58,
  },
  {
    id: "c-3",
    cta_id: "CTA_TEST_1",
    nombre: "Test creativo ADS — pain point",
    plataforma: "ads",
    fecha_publicacion: daysAgo(20).slice(0, 10),
    descripcion: "Creativo testeando hook con pain point #1.",
    chats_unicos_abiertos: 32,
    conversaciones: 11,
  },
  {
    id: "c-4",
    cta_id: "CTA_REEL_ESTRUCTURA",
    nombre: "Reel — estructura de mensaje",
    plataforma: "instagram",
    fecha_publicacion: daysAgo(10).slice(0, 10),
    chats_unicos_abiertos: 21,
    conversaciones: 7,
  },
];

// ---------------------------------------------------------------------
// LEADS — 80 leads distribuidos en estados
// ---------------------------------------------------------------------
const NOMBRES = [
  "Martín Rodríguez", "Sofía González", "Lucas Fernández", "Valentina López",
  "Mateo Martínez", "Camila Sánchez", "Santiago Pérez", "Isabella Romero",
  "Benjamín Torres", "Emma Díaz", "Nicolás Castro", "Mía Vargas",
  "Thiago Morales", "Catalina Ruiz", "Joaquín Herrera", "Lucía Mendoza",
  "Felipe Navarro", "Victoria Silva", "Sebastián Ortiz", "Renata Campos",
  "Bautista Soto", "Olivia Vega", "Tomás Aguilar", "Julieta Rojas",
  "Bruno Cabrera", "Antonella Núñez", "Ignacio Domínguez", "Pilar Acosta",
  "Lorenzo Méndez", "Florencia Gutiérrez", "Maximo Suárez", "Delfina Paz",
  "Ramiro Cordero", "Constanza Aguirre", "Dante Rivero", "Agustina Ponce",
  "Franco Ibáñez", "Martina Quiroga", "Ezequiel Vera", "Lara Bravo",
];

const ESTADO_WEIGHTS: Array<[LeadEstadoPipeline, number]> = [
  ["mensaje_apertura", 16],
  ["en_descubrimiento", 12],
  ["calificado", 8],
  ["en_nutricion", 7],
  ["vsl_enviado", 6],
  ["oferta_llamada", 5],
  ["calendly_enviado", 7],
  ["agendado", 6],
  ["en_seguimiento", 5],
];

function pickWeightedEstado(): LeadEstadoPipeline {
  const total = ESTADO_WEIGHTS.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [estado, w] of ESTADO_WEIGHTS) {
    r -= w;
    if (r <= 0) return estado;
  }
  return "mensaje_apertura";
}

const FUENTES: LeadFuente[] = [
  "instagram",
  "instagram",
  "instagram",
  "youtube",
  "ads",
  "whatsapp_manual",
  "formulario",
  "referido",
];

export const mockLeads: Lead[] = Array.from({ length: NOMBRES.length * 2 }).map((_, i) => {
  const nombre = NOMBRES[i % NOMBRES.length] + (i >= NOMBRES.length ? " II" : "");
  const handle = nombre.toLowerCase().replace(/\s+/g, ".").replace(/í/g, "i").replace(/á/g, "a").replace(/é/g, "e").replace(/ó/g, "o").replace(/ú/g, "u");
  // Algunos leads tienen 1 punto de contacto, otros 2-3 (simula que respondieron varios CTAs)
  const ctaCount = intBetween(1, 3);
  const puntos = Array.from(new Set(
    Array.from({ length: ctaCount }).map(() => pick(mockContenido).cta_id),
  ));
  return {
    id: `l-${i + 1}`,
    nombre,
    instagram_username: `@${handle}`,
    email: `${handle}@gmail.com`,
    telefono: `+54 9 11 ${intBetween(1000, 9999)}-${intBetween(1000, 9999)}`,
    manychat_id: `mc-${100000 + i}`,
    puntos_contacto: puntos,
    fuente: pick(FUENTES),
    estado_pipeline: pickWeightedEstado(),
    assigned_setter_id: pick(setters).id,
    notas: null,
    fecha_ingreso: daysAgo(intBetween(0, 90)),
  };
});

// ---------------------------------------------------------------------
// AGENDAS — 30 agendas mezclando estados
// ---------------------------------------------------------------------
const PROGRAMAS = ["Programa Élite", "Programa Master", "Programa Starter"];
const FORMAS_CIERRE = ["PIF", "cuotas", "sena_saldo"] as const;
const BILLETERAS = ["Stripe", "Whop", "Transferencia", "Mercadopago"] as const;

export const mockAgendas: Agenda[] = Array.from({ length: 35 }).map((_, i) => {
  const lead = mockLeads[i % mockLeads.length];
  const fechaCall = new Date();
  fechaCall.setDate(fechaCall.getDate() - intBetween(-15, 60));
  fechaCall.setHours(intBetween(9, 19), pick([0, 15, 30, 45]), 0, 0);

  const estadoLlamada = i < 8 ? "pendiente" : pick(["asistio", "asistio", "asistio", "no_show", "reagendada"] as const);
  const resultado =
    estadoLlamada === "asistio"
      ? pick(["cerrado", "cerrado", "no_cerrado", "seguimiento"] as const)
      : null;
  const cerrado = resultado === "cerrado";
  const monto = cerrado ? intBetween(15, 60) * 100 : 0;
  const cashCol = cerrado ? Math.round(monto * (rand() * 0.5 + 0.5)) : 0;

  return {
    id: `a-${i + 1}`,
    lead_id: lead.id,
    calendly_event_id: `cal-evt-${i + 1}`,
    nombre: lead.nombre,
    instagram: lead.instagram_username ?? null,
    telefono: lead.telefono ?? null,
    email: lead.email ?? null,
    fecha_agenda: fechaCall.toISOString().slice(0, 10),
    fecha_hora_llamada: fechaCall.toISOString(),
    primer_contacto_origen: pick(["organico_ig", "ads", "referido", "lista"] as const),
    situacion_actual: pick([
      "Tiene un negocio chico y quiere escalar.",
      "Recién arranca, busca claridad.",
      "Estancado hace 6 meses.",
    ]),
    cuellos_botella: pick([
      "No tiene proceso de ventas",
      "No genera leads",
      "Cierra mal las llamadas",
    ]),
    motivacion: pick([
      "Llegar a $20k MRR",
      "Renunciar al trabajo",
      "Tener libertad de tiempo",
    ]),
    recursos_previos: pick([
      "Cursos en Hotmart",
      "YouTube",
      "Ningún curso pago",
    ]),
    nivel_calificacion:
      estadoLlamada === "asistio" ? pick(["calificado", "calificado", "no_calificado", "dudoso"] as const) : null,
    closer_asignado_id: pick(closers).id,
    calendly_event_type: pick(["Calendly · TEST 1", "Calendly · TEST 2"]),
    meeting_url: `https://meet.google.com/${pick(["abc-defg-hij", "xyz-mnop-qrs", "lmn-opqr-stu"])}`,
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
    pago_en_cuotas: cerrado ? rand() > 0.5 : false,
    objecion_principal:
      resultado === "no_cerrado" ? pick(["precio", "timing", "pareja", "confianza", "decision"] as const) : null,
    feedback_notas: cerrado ? "Llamada productiva, ya pasó al onboarding." : null,
    proximo_seguimiento: resultado === "seguimiento" ? daysAgo(-intBetween(3, 14)).slice(0, 10) : null,
  };
});

// ---------------------------------------------------------------------
// COMISIONES (una por venta cerrada)
// ---------------------------------------------------------------------
export const mockComisiones: Comision[] = mockAgendas
  .filter((a) => a.resultado === "cerrado" && a.monto_facturado)
  .map((a, i) => {
    const monto = a.monto_facturado ?? 0;
    return {
      id: `cm-${i + 1}`,
      agenda_id: a.id,
      setter_id: pick(setters).id,
      closer_id: a.closer_asignado_id ?? closers[0].id,
      setter_pct: 5,
      closer_pct: 10,
      comision_setter_monto: Math.round(monto * 0.05),
      comision_setter_currency: "USD",
      comision_closer_monto: Math.round(monto * 0.1),
      comision_closer_currency: "USD",
      pagado: rand() > 0.4,
      fecha_pago_comision: rand() > 0.4 ? daysAgo(intBetween(1, 30)).slice(0, 10) : null,
    };
  });

// ---------------------------------------------------------------------
// COBROS (cuotas activas — para los cerrados con cuotas)
// ---------------------------------------------------------------------
export const mockCobros: Cobro[] = mockAgendas
  .filter((a) => a.resultado === "cerrado" && a.pago_en_cuotas)
  .flatMap((a, idx) => {
    const total = intBetween(3, 6);
    const montoTotal = a.monto_facturado ?? 1500;
    const porCuota = Math.round(montoTotal / total);
    return Array.from({ length: total }).map((_, i) => {
      const venc = new Date();
      venc.setDate(venc.getDate() - 30 * (total - i - 1) + intBetween(-5, 5));
      const venceFuturo = venc > new Date();
      const cobradaProb = !venceFuturo && rand() > 0.2;
      return {
        id: `co-${idx}-${i}`,
        lead_id: a.lead_id,
        agenda_id: a.id,
        programa_contratado: a.programa_ofrecido ?? "Programa Élite",
        tipo_cuota: "regular" as const,
        numero_cuota: i + 1,
        total_cuotas: total,
        monto_cobrar: porCuota,
        monto_cobrar_currency: "USD" as const,
        fecha_vencimiento: venc.toISOString().slice(0, 10),
        fecha_cobro_real: cobradaProb ? venc.toISOString().slice(0, 10) : null,
        estado: cobradaProb
          ? ("cobrada" as const)
          : venceFuturo
          ? ("al_dia" as const)
          : ("vencida" as const),
        billetera: a.billetera ?? "Stripe",
        dias_atraso: !cobradaProb && !venceFuturo ? Math.floor((Date.now() - venc.getTime()) / 86400000) : 0,
      };
    });
  });

// ---------------------------------------------------------------------
// SEGUIMIENTOS — para agendas con resultado='seguimiento'
// ---------------------------------------------------------------------
export const mockSeguimientos: Seguimiento[] = mockAgendas
  .filter((a) => a.resultado === "seguimiento")
  .map((a, i) => ({
    id: `s-${i + 1}`,
    lead_id: a.lead_id,
    agenda_id: a.id,
    numero_seguimiento: intBetween(1, 3),
    fecha_llamada_original: a.fecha_hora_llamada.slice(0, 10),
    fecha_proximo_seguimiento: daysAgo(-intBetween(2, 14)).slice(0, 10),
    total_cobrar_proyectado: intBetween(15, 40) * 100,
    total_cobrar_proyectado_currency: "USD",
    estado: pick(["caliente", "tibio", "frio"] as const),
    proxima_accion: pick([
      "Mandar audio recordatorio",
      "Llamarlo por teléfono",
      "Esperar a que junte la plata",
      "Mandar testimonio nuevo",
    ]),
    aclaraciones: null,
    dias_desde_ultima_interaccion: intBetween(1, 14),
  }));

// ---------------------------------------------------------------------
// GASTOS FIJOS
// ---------------------------------------------------------------------
export const mockGastos: GastoFijo[] = [
  {
    id: "g-1",
    nombre: "Zoom Pro",
    monto: 30,
    monto_currency: "USD",
    fecha_pago: daysAgo(28).slice(0, 10),
    forma_pago: "Mensual",
    estado: "activo",
    categoria: "software",
    fecha_proximo_pago: daysAgo(-2).slice(0, 10),
  },
  {
    id: "g-2",
    nombre: "Calendly Standard",
    monto: 12,
    monto_currency: "USD",
    fecha_pago: daysAgo(15).slice(0, 10),
    forma_pago: "Mensual",
    estado: "activo",
    categoria: "software",
    fecha_proximo_pago: daysAgo(-15).slice(0, 10),
  },
  {
    id: "g-3",
    nombre: "ManyChat Pro",
    monto: 15,
    monto_currency: "USD",
    fecha_pago: daysAgo(7).slice(0, 10),
    forma_pago: "Mensual",
    estado: "activo",
    categoria: "software",
    fecha_proximo_pago: daysAgo(-23).slice(0, 10),
  },
  {
    id: "g-4",
    nombre: "Editor de video",
    monto: 500,
    monto_currency: "USD",
    fecha_pago: daysAgo(20).slice(0, 10),
    forma_pago: "Mensual",
    estado: "activo",
    categoria: "servicios",
    fecha_proximo_pago: daysAgo(-10).slice(0, 10),
  },
  {
    id: "g-5",
    nombre: "Meta Ads (presupuesto)",
    monto: 1500,
    monto_currency: "USD",
    fecha_pago: daysAgo(5).slice(0, 10),
    forma_pago: "Mensual",
    estado: "activo",
    categoria: "publicidad",
    fecha_proximo_pago: daysAgo(-25).slice(0, 10),
  },
  {
    id: "g-6",
    nombre: "Plan viejo de Mailchimp",
    monto: 25,
    monto_currency: "USD",
    fecha_pago: daysAgo(45).slice(0, 10),
    forma_pago: "Mensual",
    estado: "no_activo",
    categoria: "software",
    fecha_proximo_pago: null,
  },
];

// ---------------------------------------------------------------------
// TRIAGES
// ---------------------------------------------------------------------
export const mockTriages: Triage[] = mockAgendas.slice(0, 8).map((a, i) => ({
  id: `t-${i + 1}`,
  lead_id: a.lead_id,
  agenda_id: a.id,
  fecha_hora_agenda: a.fecha_hora_llamada,
  notas_triage: pick(["Cliente listo", "Pedir más info de presupuesto", "Calificación dudosa, validar"]),
  responsable_triage_id: pick(setters).id,
  estado_triage: pick(["pendiente", "hecho", "rechazado"] as const),
}));

// ---------------------------------------------------------------------
// KPIs DIARIOS MANUAL — últimos 60 días
// ---------------------------------------------------------------------
export const mockKpisManual: KpiDiarioManual[] = Array.from({ length: 60 }).map((_, i) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - i);
  const enviamos = intBetween(1, 8);
  const vistas = Math.max(0, enviamos - intBetween(0, 2));
  const llegaron = Math.max(0, vistas - intBetween(0, 2));
  const respondieron = Math.max(0, llegaron - intBetween(0, 1));
  const calendarios = Math.max(0, enviamos - intBetween(0, 2));
  return {
    id: `k-${i + 1}`,
    fecha: fecha.toISOString().slice(0, 10),
    chats_unicos_abiertos: intBetween(8, 25),
    conversaciones: intBetween(3, 12),
    enviamos_vsl: enviamos,
    vistas_vsl: vistas,
    llegaron_cta_vsl: llegaron,
    respondieron_cta_vsl: respondieron,
    calendarios_enviados: calendarios,
    agendas_manual: Math.max(0, calendarios - intBetween(0, 1)),
    notas: null,
  };
});
