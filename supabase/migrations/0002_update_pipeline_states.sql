-- ============================================================================
-- Migración 0002: actualizar los estados del pipeline de leads
-- (sin perder datos existentes)
--
-- Estados viejos → nuevos:
--   primer_mensaje, contactado          → mensaje_apertura
--   posible_calificado                  → calificado
--   no_calificado                       → en_seguimiento
--   agenda_enviada                      → calendly_enviado
--   perdido                             → en_seguimiento
--   (en_descubrimiento, calificado, en_nutricion, calendly_enviado, agendado se mantienen)
--   NUEVOS: vsl_enviado, oferta_llamada, en_seguimiento
--
-- Correr una sola vez en Supabase SQL Editor.
-- ============================================================================

-- 1. Convertir la columna a text temporalmente (para poder remapear valores)
alter table public.leads alter column estado_pipeline drop default;
alter table public.leads alter column estado_pipeline type text;

-- 2. Remapear los valores viejos a los nuevos
update public.leads set estado_pipeline = 'mensaje_apertura'
  where estado_pipeline in ('primer_mensaje', 'contactado', 'sin_contactar');
update public.leads set estado_pipeline = 'calificado'
  where estado_pipeline = 'posible_calificado';
update public.leads set estado_pipeline = 'en_seguimiento'
  where estado_pipeline in ('no_calificado', 'perdido');
update public.leads set estado_pipeline = 'calendly_enviado'
  where estado_pipeline = 'agenda_enviada';

-- 3. Por las dudas, cualquier valor que no esté en la nueva lista → mensaje_apertura
update public.leads set estado_pipeline = 'mensaje_apertura'
  where estado_pipeline not in (
    'mensaje_apertura', 'en_descubrimiento', 'calificado', 'en_nutricion',
    'vsl_enviado', 'oferta_llamada', 'calendly_enviado', 'agendado', 'en_seguimiento'
  );

-- 4. Recrear el enum
drop type if exists lead_estado_pipeline cascade;
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

-- 5. Volver a convertir la columna al enum y restaurar el default + índice
alter table public.leads
  alter column estado_pipeline type lead_estado_pipeline
  using estado_pipeline::lead_estado_pipeline;
alter table public.leads
  alter column estado_pipeline set default 'mensaje_apertura';

-- El índice idx_leads_estado se mantiene (no se dropea con el cascade del type
-- porque es sobre la columna, pero si quedó eliminado, recrearlo):
create index if not exists idx_leads_estado on public.leads(estado_pipeline);
