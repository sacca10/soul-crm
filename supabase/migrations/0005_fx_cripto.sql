-- ============================================================================
-- Migración 0005: agregar columna usd_cripto a fx_rates
--
-- Ahora cotizamos siempre en dólar cripto. El cron diario guarda la cotización
-- cripto de dolarapi.com en esta columna y las conversiones ARS→USD la usan.
-- Las columnas usd_blue / usd_mep / usd_oficial quedan (data histórica) pero
-- ya no se usan.
--
-- Idempotente. Correr en Supabase SQL Editor.
-- ============================================================================

alter table public.fx_rates
  add column if not exists usd_cripto numeric;
