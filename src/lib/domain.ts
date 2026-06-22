// Domain types — match the SQL schema in supabase/migrations/0001_initial_schema.sql.

export type Moneda = "USD" | "ARS";
export type UserRol = "admin" | "setter" | "closer" | "marketing";

export type LeadEstadoPipeline =
  | "mensaje_apertura"
  | "en_descubrimiento"
  | "calificado"
  | "en_nutricion"
  | "vsl_enviado"
  | "oferta_llamada"
  | "calendly_enviado"
  | "agendado"
  | "en_seguimiento";

export const ESTADOS_PIPELINE: LeadEstadoPipeline[] = [
  "mensaje_apertura",
  "en_descubrimiento",
  "calificado",
  "en_nutricion",
  "vsl_enviado",
  "oferta_llamada",
  "calendly_enviado",
  "agendado",
  "en_seguimiento",
];

export const ESTADO_PIPELINE_LABEL: Record<LeadEstadoPipeline, string> = {
  mensaje_apertura: "Mensaje de apertura",
  en_descubrimiento: "En descubrimiento",
  calificado: "Calificado",
  en_nutricion: "En nutrición",
  vsl_enviado: "VSL enviado",
  oferta_llamada: "Oferta de llamada",
  calendly_enviado: "Calendly enviado",
  agendado: "Agendado",
  en_seguimiento: "En seguimiento",
};

export const ESTADO_PIPELINE_COLOR: Record<LeadEstadoPipeline, string> = {
  mensaje_apertura: "#9b6dff",
  en_descubrimiento: "#06b6d4",
  calificado: "#84cc16",
  en_nutricion: "#eab308",
  vsl_enviado: "#14b8a6",
  oferta_llamada: "#22c55e",
  calendly_enviado: "#a855f7",
  agendado: "#6366f1",
  en_seguimiento: "#f97316",
};

export type LeadFuente =
  | "instagram"
  | "whatsapp_manual"
  | "lanzamiento"
  | "formulario"
  | "youtube"
  | "ads"
  | "referido";

export const FUENTES: LeadFuente[] = [
  "instagram",
  "whatsapp_manual",
  "lanzamiento",
  "formulario",
  "youtube",
  "ads",
  "referido",
];

export const FUENTE_LABEL: Record<LeadFuente, string> = {
  instagram: "Instagram",
  whatsapp_manual: "WhatsApp Manual",
  lanzamiento: "Lanzamiento",
  formulario: "Formulario",
  youtube: "YouTube",
  ads: "ADS",
  referido: "Referido",
};

export type EstadoLlamada = "asistio" | "no_show" | "reagendada" | "pendiente";
export type ResultadoLlamada = "cerrado" | "no_cerrado" | "seguimiento";
export type FormaCierre = "PIF" | "cuotas" | "sena_saldo";
export type Billetera =
  | "Stripe"
  | "Whop"
  | "Transferencia"
  | "Mercadopago"
  | "otros";
export type NivelCalificacion = "calificado" | "no_calificado" | "dudoso";
export type PrimerContactoOrigen =
  | "organico_ig"
  | "ads"
  | "referido"
  | "lista"
  | "otros";
export type ObjecionCategoria =
  | "precio"
  | "timing"
  | "pareja"
  | "confianza"
  | "decision"
  | "otro";

export type SeguimientoEstado = "caliente" | "tibio" | "frio";

export type CobroTipoCuota = "regular" | "upsell" | "resell";
export type CobroEstado = "al_dia" | "vencida" | "cobrada" | "refund" | "churn";

export type GastoFormaPago = "Mensual" | "Trimestral" | "Anual" | "Unico";
export type GastoEstado = "activo" | "no_activo";
export type GastoCategoria = "software" | "publicidad" | "servicios" | "otros";

export type ContenidoPlataforma = "instagram" | "youtube" | "ads" | "otros";

export type TriageEstado = "pendiente" | "hecho" | "rechazado";

// =====================================================================
// Entity shapes
// =====================================================================

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRol;
  activo: boolean;
  aprobado: boolean;
  avatar_url?: string | null;
}

export interface Lead {
  id: string;
  nombre: string;
  instagram_username?: string | null;
  email?: string | null;
  telefono?: string | null;
  manychat_id?: string | null;
  /**
   * Puntos de contacto: lista de CTA IDs por los que el lead respondió.
   * Un mismo lead puede haber tocado varios CTAs (ej: respondió al reel, después
   * a una historia, después a un mensaje del newsletter).
   */
  puntos_contacto?: string[] | null;
  fuente: LeadFuente;
  estado_pipeline: LeadEstadoPipeline;
  assigned_setter_id?: string | null;
  notas?: string | null;
  fecha_ingreso: string;
  // Calificación / contexto del lead (se carga a medida que el setter conversa)
  situacion_actual?: string | null;
  cuellos_botella?: string | null;
  motivacion?: string | null;
  recursos_previos?: string | null;
}

export interface Agenda {
  id: string;
  lead_id?: string | null;
  calendly_event_id?: string | null;
  nombre: string;
  instagram?: string | null;
  telefono?: string | null;
  email?: string | null;
  fecha_agenda: string;
  fecha_hora_llamada: string;
  primer_contacto_origen?: PrimerContactoOrigen | null;
  situacion_actual?: string | null;
  cuellos_botella?: string | null;
  motivacion?: string | null;
  recursos_previos?: string | null;
  nivel_calificacion?: NivelCalificacion | null;
  closer_asignado_id?: string | null;
  calendly_event_type?: string | null;
  /** Link para unirse a la llamada (Google Meet / Zoom, viene de Calendly) */
  meeting_url?: string | null;
  estado_llamada: EstadoLlamada;
  resultado?: ResultadoLlamada | null;
  programa_ofrecido?: string | null;
  forma_cierre?: FormaCierre | null;
  monto_facturado?: number | null;
  monto_facturado_currency?: Moneda | null;
  monto_upfront?: number | null;
  monto_upfront_currency?: Moneda | null;
  cash_collected?: number | null;
  cash_collected_currency?: Moneda | null;
  billetera?: Billetera | null;
  pago_en_cuotas?: boolean;
  objecion_principal?: ObjecionCategoria | null;
  objecion_principal_otro?: string | null;
  objecion_secundaria?: string | null;
  motivo_no_cierre?: string | null;
  razon_compra?: string | null;
  /** Dolores / problemas del lead que surgieron en la llamada */
  dolores?: string | null;
  /** Frases textuales clave que dijo el lead */
  frases_clave?: string | null;
  feedback_notas?: string | null;
  proximo_seguimiento?: string | null;
}

export interface Seguimiento {
  id: string;
  lead_id?: string | null;
  agenda_id: string;
  numero_seguimiento: number;
  fecha_llamada_original: string;
  fecha_proximo_seguimiento?: string | null;
  total_cobrar_proyectado?: number | null;
  total_cobrar_proyectado_currency?: Moneda | null;
  estado: SeguimientoEstado;
  proxima_accion?: string | null;
  aclaraciones?: string | null;
  dias_desde_ultima_interaccion: number;
}

export interface Cobro {
  id: string;
  lead_id?: string | null;
  agenda_id: string;
  programa_contratado: string;
  tipo_cuota: CobroTipoCuota;
  numero_cuota: number;
  total_cuotas: number;
  monto_cobrar: number;
  monto_cobrar_currency: Moneda;
  fecha_vencimiento: string;
  fecha_cobro_real?: string | null;
  estado: CobroEstado;
  billetera?: Billetera | null;
  dias_atraso: number;
  aclaraciones?: string | null;
}

export interface GastoFijo {
  id: string;
  nombre: string;
  monto: number;
  monto_currency: Moneda;
  fecha_pago: string;
  forma_pago: GastoFormaPago;
  estado: GastoEstado;
  categoria: GastoCategoria;
  comprobante_url?: string | null;
  fecha_proximo_pago?: string | null;
  notas?: string | null;
}

export interface Contenido {
  id: string;
  cta_id: string;
  nombre: string;
  descripcion?: string | null;
  plataforma: ContenidoPlataforma;
  fecha_publicacion: string;
  url?: string | null;
  notas?: string | null;
  /** Chats únicos abiertos atribuidos a esta pieza (cargado manual por marketing) */
  chats_unicos_abiertos?: number;
  /** Conversaciones generadas atribuidas a esta pieza (cargado manual por marketing) */
  conversaciones?: number;
}

export interface Comision {
  id: string;
  agenda_id: string;
  setter_id?: string | null;
  closer_id?: string | null;
  setter_pct: number;
  closer_pct: number;
  comision_setter_monto?: number | null;
  comision_setter_currency?: Moneda | null;
  comision_closer_monto?: number | null;
  comision_closer_currency?: Moneda | null;
  pagado: boolean;
  fecha_pago_comision?: string | null;
}

export interface Triage {
  id: string;
  lead_id?: string | null;
  agenda_id?: string | null;
  fecha_hora_agenda?: string | null;
  notas_triage?: string | null;
  responsable_triage_id?: string | null;
  estado_triage: TriageEstado;
}

export interface KpiDiarioManual {
  id: string;
  fecha: string;
  chats_unicos_abiertos: number;
  conversaciones: number;
  enviamos_vsl: number;
  /** Calendarios (links de Calendly) enviados */
  calendarios_enviados?: number;
  agendas_manual: number;
  // Legacy del funnel VSL detallado — ya no se cargan desde el form, pero las
  // columnas siguen en la DB. Opcionales para no romper datos viejos.
  vistas_vsl?: number;
  llegaron_cta_vsl?: number;
  respondieron_cta_vsl?: number;
  notas?: string | null;
}

export interface AppConfig {
  google_calendar_url?: string | null;
  fx_strategy?: string | null;
}
