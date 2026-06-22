-- ============================================================================
-- Migración 0006: campos cualitativos del reporte de llamada en agendas
--
-- El reporte ahora tiene 4 secciones: Dolores, Razones de compra, Objeciones
-- y Frases clave del lead. "Razones de compra" reusa razon_compra y "Objeciones"
-- reusa objecion_principal/objecion_secundaria (ya existían). Faltaban:
--   - dolores
--   - frases_clave
--
-- Idempotente. Correr en Supabase SQL Editor.
-- ============================================================================

alter table public.agendas add column if not exists dolores text;
alter table public.agendas add column if not exists frases_clave text;
