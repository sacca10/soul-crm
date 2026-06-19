-- Dashboard Syndicate — schema completo (V2 con catálogos dinámicos y nuevos campos)
-- Esta migración es IDEMPOTENTE: drop + create. Se puede correr múltiples veces.
-- Pegar todo en Supabase SQL Editor → Run.
--
-- IMPORTANTE: borra todas las tablas existentes del schema public.
-- Si ya tenías datos reales, exportá antes de correr.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- CLEAN SLATE — drop everything in inverse FK order
-- ============================================================================
drop trigger if exists on_auth_user_created on auth.users cascade;
drop function if exists public.handle_new_auth_user() cascade;

drop view if exists public.gastos_con_proximo_pago cascade;
drop view if exists public.cobros_con_atraso cascade;
drop view if exists public.seguimientos_con_dias cascade;

drop table if exists public.app_config cascade;
drop table if exists public.webhook_events cascade;
drop table if exists public.fx_rates cascade;
drop table if exists public.kpis_diarios_manual cascade;
drop table if exists public.triages cascade;
drop table if exists public.comisiones cascade;
drop table if exists public.gastos_fijos cascade;
drop table if exists public.cobros cascade;
drop table if exists public.seguimientos cascade;
drop table if exists public.agendas cascade;
drop table if exists public.leads cascade;
drop table if exists public.contenido cascade;
drop table if exists public.programas_catalogo cascade;
drop table if exists public.billeteras_catalogo cascade;
drop table if exists public.users cascade;

drop function if exists public.set_updated_at() cascade;

drop type if exists user_rol cascade;
drop type if exists lead_estado_pipeline cascade;
drop type if exists lead_fuente cascade;
drop type if exists moneda cascade;
drop type if exists contenido_plataforma cascade;
drop type if exists primer_contacto_origen cascade;
drop type if exists nivel_calificacion cascade;
drop type if exists estado_llamada cascade;
drop type if exists resultado_llamada cascade;
drop type if exists forma_cierre cascade;
drop type if exists objecion_categoria cascade;
drop type if exists seguimiento_estado cascade;
drop type if exists cobro_tipo_cuota cascade;
drop type if exists cobro_estado cascade;
drop type if exists gasto_forma_pago cascade;
drop type if exists gasto_estado cascade;
drop type if exists gasto_categoria cascade;
drop type if exists triage_estado cascade;
drop type if exists webhook_source cascade;
drop type if exists webhook_status cascade;

-- ============================================================================
-- ENUMS (los que NO son dinámicos)
-- billeteras y programas ahora son catálogos editables, no enums
-- ============================================================================
create type user_rol as enum ('admin', 'setter', 'closer', 'marketing');

create type lead_estado_pipeline as enum (
  'mensaje_apertura',
  'en_descubrimiento',
  'calificado',
  'en_nutricion',
  'vsl_enviado',
  'oferta_llamada',
  'calendly_enviado',
  'agendado',
  'en_seguimiento'
);

create type lead_fuente as enum (
  'instagram',
  'whatsapp_manual',
  'lanzamiento',
  'formulario',
  'youtube',
  'ads',
  'referido'
);

create type moneda as enum ('USD', 'ARS');

create type contenido_plataforma as enum ('instagram', 'youtube', 'ads', 'otros');

create type primer_contacto_origen as enum ('organico_ig', 'ads', 'referido', 'lista', 'otros');

create type nivel_calificacion as enum ('calificado', 'no_calificado', 'dudoso');

create type estado_llamada as enum ('asistio', 'no_show', 'reagendada', 'pendiente');

create type resultado_llamada as enum ('cerrado', 'no_cerrado', 'seguimiento');

create type forma_cierre as enum ('PIF', 'cuotas', 'sena_saldo');

create type objecion_categoria as enum ('precio', 'timing', 'pareja', 'confianza', 'decision', 'otro');

create type seguimiento_estado as enum ('caliente', 'tibio', 'frio');

create type cobro_tipo_cuota as enum ('regular', 'upsell', 'resell');

create type cobro_estado as enum ('al_dia', 'vencida', 'cobrada', 'refund', 'churn');

create type gasto_forma_pago as enum ('Mensual', 'Trimestral', 'Anual', 'Unico');

create type gasto_estado as enum ('activo', 'no_activo');

create type gasto_categoria as enum ('software', 'publicidad', 'servicios', 'otros');

create type triage_estado as enum ('pendiente', 'hecho', 'rechazado');

create type webhook_source as enum ('manychat', 'calendly');

create type webhook_status as enum ('procesado', 'error');

-- ============================================================================
-- HELPER: updated_at trigger
-- ============================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 1. users (extends auth.users)
-- ============================================================================
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  nombre text not null,
  email text unique not null,
  rol user_rol not null default 'setter',
  activo boolean not null default true,
  -- Aprobado por un admin antes de poder acceder a la app
  aprobado boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_updated_at before update on public.users
  for each row execute function set_updated_at();

-- ============================================================================
-- 2. billeteras_catalogo (medios de pago, editables en Ajustes)
-- ============================================================================
create table public.billeteras_catalogo (
  id uuid primary key default uuid_generate_v4(),
  nombre text unique not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.billeteras_catalogo (nombre) values
  ('Stripe'), ('Whop'), ('Transferencia'), ('Mercadopago'), ('PayPal');

-- ============================================================================
-- 3. programas_catalogo (productos, editables en Ajustes)
-- ============================================================================
create table public.programas_catalogo (
  id uuid primary key default uuid_generate_v4(),
  nombre text unique not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.programas_catalogo (nombre) values
  ('Programa Élite'), ('Programa Master'), ('Programa Starter');

-- ============================================================================
-- 4. contenido (CTAs / piezas de marketing)
-- ============================================================================
create table public.contenido (
  id uuid primary key default uuid_generate_v4(),
  cta_id text unique not null,
  nombre text not null,
  descripcion text,
  plataforma contenido_plataforma not null,
  fecha_publicacion date not null,
  url text,
  notas text,
  -- Métricas por pieza (cargadas a mano por el marketing/setter)
  chats_unicos_abiertos integer not null default 0,
  conversaciones integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contenido_updated_at before update on public.contenido
  for each row execute function set_updated_at();

create index idx_contenido_cta_id on public.contenido(cta_id);
create index idx_contenido_fecha on public.contenido(fecha_publicacion);

-- ============================================================================
-- 5. leads (con campos nuevos de calificación)
-- ============================================================================
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  instagram_username text,
  email text,
  telefono text,
  manychat_id text unique,
  -- Puntos de contacto: array de cta_ids (un lead puede responder a varios CTAs)
  puntos_contacto text[] default '{}',
  fuente lead_fuente not null default 'instagram',
  estado_pipeline lead_estado_pipeline not null default 'mensaje_apertura',
  assigned_setter_id uuid references public.users(id) on delete set null,
  notas text,
  -- Campos de calificación (cargados a medida que el setter conversa)
  situacion_actual text,
  cuellos_botella text,
  motivacion text,
  recursos_previos text,
  fecha_ingreso timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger leads_updated_at before update on public.leads
  for each row execute function set_updated_at();

create index idx_leads_estado on public.leads(estado_pipeline);
create index idx_leads_setter on public.leads(assigned_setter_id);
-- Índice GIN para búsquedas en el array de puntos_contacto
create index idx_leads_puntos_contacto on public.leads using gin(puntos_contacto);
create index idx_leads_fecha on public.leads(fecha_ingreso);

-- ============================================================================
-- 6. agendas (registro de agendas + bloque closing)
-- Nota: billetera es TEXT (no enum) porque las billeteras son dinámicas
-- (se editan desde Ajustes → billeteras_catalogo)
-- ============================================================================
create table public.agendas (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete set null,
  calendly_event_id text unique,
  -- Pre-llamada (setter)
  nombre text not null,
  instagram text,
  telefono text,
  email text,
  fecha_agenda date not null,
  fecha_hora_llamada timestamptz not null,
  primer_contacto_origen primer_contacto_origen,
  situacion_actual text,
  cuellos_botella text,
  motivacion text,
  recursos_previos text,
  nivel_calificacion nivel_calificacion,
  closer_asignado_id uuid references public.users(id) on delete set null,
  calendly_event_type text,
  -- Link para unirse a la llamada (Google Meet / Zoom, viene de Calendly)
  meeting_url text,
  -- Bloque closing (closer)
  estado_llamada estado_llamada default 'pendiente',
  resultado resultado_llamada,
  programa_ofrecido text,
  forma_cierre forma_cierre,
  monto_facturado numeric(12, 2),
  monto_facturado_currency moneda,
  monto_upfront numeric(12, 2),
  monto_upfront_currency moneda,
  cash_collected numeric(12, 2),
  cash_collected_currency moneda,
  billetera text,
  pago_en_cuotas boolean default false,
  objecion_principal objecion_categoria,
  objecion_principal_otro text,
  objecion_secundaria text,
  motivo_no_cierre text,
  razon_compra text,
  feedback_notas text,
  proximo_seguimiento date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger agendas_updated_at before update on public.agendas
  for each row execute function set_updated_at();

create index idx_agendas_lead on public.agendas(lead_id);
create index idx_agendas_closer on public.agendas(closer_asignado_id);
create index idx_agendas_fecha_llamada on public.agendas(fecha_hora_llamada);
create index idx_agendas_estado on public.agendas(estado_llamada);
create index idx_agendas_resultado on public.agendas(resultado);

-- ============================================================================
-- 7. seguimientos
-- ============================================================================
create table public.seguimientos (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete set null,
  agenda_id uuid references public.agendas(id) on delete cascade,
  numero_seguimiento integer not null default 1,
  fecha_llamada_original date not null,
  fecha_proximo_seguimiento date,
  total_cobrar_proyectado numeric(12, 2),
  total_cobrar_proyectado_currency moneda,
  estado seguimiento_estado not null default 'tibio',
  proxima_accion text,
  aclaraciones text,
  ultima_interaccion_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger seguimientos_updated_at before update on public.seguimientos
  for each row execute function set_updated_at();

create index idx_seguimientos_agenda on public.seguimientos(agenda_id);
create index idx_seguimientos_estado on public.seguimientos(estado);
create index idx_seguimientos_proximo on public.seguimientos(fecha_proximo_seguimiento);

create or replace view public.seguimientos_con_dias as
select
  s.*,
  extract(day from now() - s.ultima_interaccion_at)::int as dias_desde_ultima_interaccion
from public.seguimientos s;

-- ============================================================================
-- 8. cobros (una fila por cuota)
-- billetera también es TEXT
-- ============================================================================
create table public.cobros (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete set null,
  agenda_id uuid references public.agendas(id) on delete cascade,
  programa_contratado text not null,
  tipo_cuota cobro_tipo_cuota not null default 'regular',
  numero_cuota integer not null,
  total_cuotas integer not null,
  monto_cobrar numeric(12, 2) not null,
  monto_cobrar_currency moneda not null default 'USD',
  fecha_vencimiento date not null,
  fecha_cobro_real date,
  estado cobro_estado not null default 'al_dia',
  billetera text,
  aclaraciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger cobros_updated_at before update on public.cobros
  for each row execute function set_updated_at();

create index idx_cobros_agenda on public.cobros(agenda_id);
create index idx_cobros_estado on public.cobros(estado);
create index idx_cobros_vencimiento on public.cobros(fecha_vencimiento);

create or replace view public.cobros_con_atraso as
select
  c.*,
  case
    when c.fecha_cobro_real is not null then 0
    when c.fecha_vencimiento >= current_date then 0
    else (current_date - c.fecha_vencimiento)
  end as dias_atraso
from public.cobros c;

-- ============================================================================
-- 9. gastos_fijos
-- ============================================================================
create table public.gastos_fijos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  monto numeric(12, 2) not null,
  monto_currency moneda not null default 'USD',
  fecha_pago date not null,
  forma_pago gasto_forma_pago not null default 'Mensual',
  estado gasto_estado not null default 'activo',
  categoria gasto_categoria not null default 'software',
  comprobante_url text,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger gastos_fijos_updated_at before update on public.gastos_fijos
  for each row execute function set_updated_at();

create or replace view public.gastos_con_proximo_pago as
select
  g.*,
  case g.forma_pago
    when 'Mensual' then g.fecha_pago + interval '1 month'
    when 'Trimestral' then g.fecha_pago + interval '3 months'
    when 'Anual' then g.fecha_pago + interval '1 year'
    else null
  end::date as fecha_proximo_pago
from public.gastos_fijos g;

-- ============================================================================
-- 10. comisiones
-- ============================================================================
create table public.comisiones (
  id uuid primary key default uuid_generate_v4(),
  agenda_id uuid not null references public.agendas(id) on delete cascade,
  setter_id uuid references public.users(id) on delete set null,
  closer_id uuid references public.users(id) on delete set null,
  setter_pct numeric(5, 2) default 5.00,
  closer_pct numeric(5, 2) default 10.00,
  comision_setter_monto numeric(12, 2),
  comision_setter_currency moneda,
  comision_closer_monto numeric(12, 2),
  comision_closer_currency moneda,
  pagado boolean not null default false,
  fecha_pago_comision date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger comisiones_updated_at before update on public.comisiones
  for each row execute function set_updated_at();

create index idx_comisiones_agenda on public.comisiones(agenda_id);
create index idx_comisiones_setter on public.comisiones(setter_id);
create index idx_comisiones_closer on public.comisiones(closer_id);

-- ============================================================================
-- 11. triages
-- ============================================================================
create table public.triages (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references public.leads(id) on delete set null,
  agenda_id uuid references public.agendas(id) on delete set null,
  fecha_hora_agenda timestamptz,
  notas_triage text,
  responsable_triage_id uuid references public.users(id) on delete set null,
  estado_triage triage_estado not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger triages_updated_at before update on public.triages
  for each row execute function set_updated_at();

-- ============================================================================
-- 12. kpis_diarios_manual
-- ============================================================================
create table public.kpis_diarios_manual (
  id uuid primary key default uuid_generate_v4(),
  fecha date unique not null,
  chats_unicos_abiertos integer not null default 0,
  conversaciones integer not null default 0,
  enviamos_vsl integer not null default 0,
  vistas_vsl integer not null default 0,
  llegaron_cta_vsl integer not null default 0,
  respondieron_cta_vsl integer not null default 0,
  agendas_manual integer not null default 0,
  notas text,
  cargado_por_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger kpis_diarios_updated_at before update on public.kpis_diarios_manual
  for each row execute function set_updated_at();

-- ============================================================================
-- 13. fx_rates (cotizaciones USD/ARS — cron las actualiza)
-- ============================================================================
create table public.fx_rates (
  id uuid primary key default uuid_generate_v4(),
  fecha date unique not null,
  usd_blue numeric(12, 4),
  usd_mep numeric(12, 4),
  usd_oficial numeric(12, 4),
  fuente_api text default 'dolarapi.com',
  actualizado_at timestamptz not null default now()
);

create index idx_fx_fecha on public.fx_rates(fecha);

-- ============================================================================
-- 14. webhook_events (auditoría)
-- ============================================================================
create table public.webhook_events (
  id uuid primary key default uuid_generate_v4(),
  fuente webhook_source not null,
  received_at timestamptz not null default now(),
  payload jsonb not null,
  status webhook_status not null default 'procesado',
  error_message text,
  entidad_creada_id uuid
);

create index idx_webhook_fuente on public.webhook_events(fuente);
create index idx_webhook_status on public.webhook_events(status);
create index idx_webhook_received on public.webhook_events(received_at desc);

-- ============================================================================
-- 15. app_config (configuración global single-row)
-- ============================================================================
create table public.app_config (
  id int primary key default 1,
  google_calendar_url text,
  fx_strategy text default 'blue',
  updated_at timestamptz not null default now(),
  constraint singleton check (id = 1)
);

insert into public.app_config (id) values (1) on conflict do nothing;

-- ============================================================================
-- ROW LEVEL SECURITY
-- "Todos ven todo" — cualquier user autenticado tiene full CRUD.
-- Webhooks usan service_role que bypassea RLS.
-- ============================================================================
alter table public.users enable row level security;
alter table public.billeteras_catalogo enable row level security;
alter table public.programas_catalogo enable row level security;
alter table public.contenido enable row level security;
alter table public.leads enable row level security;
alter table public.agendas enable row level security;
alter table public.seguimientos enable row level security;
alter table public.cobros enable row level security;
alter table public.gastos_fijos enable row level security;
alter table public.comisiones enable row level security;
alter table public.triages enable row level security;
alter table public.kpis_diarios_manual enable row level security;
alter table public.fx_rates enable row level security;
alter table public.webhook_events enable row level security;
alter table public.app_config enable row level security;
create policy "auth_full_access_app_config" on public.app_config
  for all to authenticated using (true) with check (true);

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'users', 'billeteras_catalogo', 'programas_catalogo', 'contenido',
      'leads', 'agendas', 'seguimientos', 'cobros', 'gastos_fijos',
      'comisiones', 'triages', 'kpis_diarios_manual', 'fx_rates'
    ])
  loop
    execute format(
      'create policy "auth_full_access_%I" on public.%I for all to authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;

create policy "auth_read_webhook_events" on public.webhook_events
  for select to authenticated using (true);

-- ============================================================================
-- AUTO-PROVISION users RECORD ON AUTH SIGNUP
-- ============================================================================
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text;
  v_es_primer_user boolean;
begin
  -- Nombre: del metadata o derivado del email
  v_nombre := coalesce(
    nullif(trim(new.raw_user_meta_data->>'nombre'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Si NO hay ningún user en public.users, este es el primero → admin aprobado
  -- (bootstrap: el primero que se loguea queda como dueño automáticamente).
  -- Cualquiera después entra como setter PENDIENTE de aprobación.
  select count(*) = 0 into v_es_primer_user from public.users;

  insert into public.users (auth_id, email, nombre, rol, aprobado, activo)
  values (
    new.id,
    new.email,
    v_nombre,
    case when v_es_primer_user then 'admin'::user_rol else 'setter'::user_rol end,
    v_es_primer_user,  -- primer user aprobado, los demás pendientes
    true
  )
  on conflict (auth_id) do nothing;

  return new;
exception when others then
  raise warning 'handle_new_auth_user failed for %: %', new.email, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- BOOTSTRAP: pre-crear public.users para auth.users que ya existían antes
-- de esta migración (porque borramos public.users al inicio). Marcarlos como
-- admin aprobado para no quedar lockeados afuera.
-- ============================================================================
insert into public.users (auth_id, email, nombre, rol, aprobado, activo)
select
  id,
  email,
  coalesce(
    nullif(trim(raw_user_meta_data->>'nombre'), ''),
    nullif(trim(raw_user_meta_data->>'full_name'), ''),
    nullif(trim(raw_user_meta_data->>'name'), ''),
    split_part(email, '@', 1)
  ),
  'admin'::user_rol,
  true,
  true
from auth.users
where email is not null
on conflict (auth_id) do nothing;

-- ============================================================================
-- STORAGE BUCKET (manual en Dashboard de Supabase):
--   bucket "comprobantes" (privado, MIME pdf/jpg/png/webp, max 10MB)
--   + 2 policies: authenticated SELECT y INSERT con bucket_id = 'comprobantes'
-- ============================================================================
