-- ============================================================================
-- Migración 0004: agregar columna calendarios_enviados a kpis_diarios_manual
--
-- Métrica nueva del funnel: cuántos links de Calendly / calendarios se enviaron
-- en el día (paso entre "VSL Enviados" y "Agendas").
--
-- Idempotente: se puede correr varias veces sin romper.
-- Correr en Supabase SQL Editor.
-- ============================================================================

alter table public.kpis_diarios_manual
  add column if not exists calendarios_enviados integer not null default 0;
