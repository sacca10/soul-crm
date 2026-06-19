-- ============================================================================
-- Migración 0003: agregar columnas manuales del funnel del VSL a kpis_diarios_manual
--
-- Para poder cargar a mano (estilo Excel) los números del día sin depender
-- de automatizaciones ni del estado de cada lead:
--   - enviamos_vsl
--   - vistas_vsl
--   - llegaron_cta_vsl
--   - respondieron_cta_vsl
--   - agendas_manual  (conteo manual de agendas, separado del row-based)
--
-- Idempotente: se puede correr varias veces sin romper.
-- Correr en Supabase SQL Editor.
-- ============================================================================

alter table public.kpis_diarios_manual
  add column if not exists enviamos_vsl integer not null default 0;
alter table public.kpis_diarios_manual
  add column if not exists vistas_vsl integer not null default 0;
alter table public.kpis_diarios_manual
  add column if not exists llegaron_cta_vsl integer not null default 0;
alter table public.kpis_diarios_manual
  add column if not exists respondieron_cta_vsl integer not null default 0;
alter table public.kpis_diarios_manual
  add column if not exists agendas_manual integer not null default 0;
