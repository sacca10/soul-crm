# Diseño: Reportes cualitativos + FX Dólar Cripto

Fecha: 2026-06-22
Aplica a los 3 CRMs: **soul-crm**, **GrowForge** (`syndicate-crm-main`), **Syndicate** (`Dashboard Syndicate`).

## Objetivo

1. Cotizar SIEMPRE en dólar cripto (sacar blue/mep/oficial de la UI).
2. Estructurar el reporte de llamada en 4 secciones: Dolores, Razones de compra, Objeciones, Frases clave.
3. Vista centralizada de lo cualitativo en la Grilla de Reportes, con filtro de fecha.

---

## 1. Cotizaciones — solo Dólar Cripto

**Migración** (`0005_fx_cripto.sql`):
```sql
alter table public.fx_rates add column if not exists usd_cripto numeric;
```
Las columnas `usd_blue / usd_mep / usd_oficial` quedan en la base (no se borran) pero no se usan ni se muestran.

**`src/lib/fx.ts`**:
- Agregar `usd_cripto` a `FxRate` y al `select` de `getLatestFxRate`.
- `refreshFxRates`: traer `casa === "cripto"` de dolarapi.com y guardarlo en `usd_cripto`.
- `getFxForDate` / `arsToUsd`: usar siempre `usd_cripto` (se elimina el parámetro de estrategia; fallback 1 si no hay cotización).

**`src/app/(app)/ajustes/page.tsx`**: sacar el `FxStrategyForm` (selector) y las 3 tarjetas Blue/MEP/Oficial. Queda 1 tarjeta "Dólar Cripto" (`latestFx.usd_cripto`) + `RefreshFxButton`.

**`src/app/(app)/ajustes/fx-form.tsx`** / **`actions.ts`**: queda `RefreshFxButton` y `refreshFxNowAction`. `FxStrategyForm` / `updateFxStrategyAction` se dejan de usar (se pueden eliminar). `app_config.fx_strategy` deja de leerse (la columna queda).

El cron diario `/api/cron/fx-rates` sigue corriendo y ahora guarda también la cotización cripto.

---

## 2. Reporte de llamada — 4 secciones

**Migración** (`0006_agenda_reporte_cualitativo.sql`):
```sql
alter table public.agendas add column if not exists dolores text;
alter table public.agendas add column if not exists frases_clave text;
```

**`src/lib/domain.ts`** — `Agenda`: agregar `dolores?: string | null;` y `frases_clave?: string | null;`.

**`src/app/(app)/closer/reporte/page.tsx`** — la card "Resultado y objeciones" se reorganiza en 4 bloques etiquetados:
- **Dolores** → `<Textarea name="dolores">` (nuevo)
- **Razones de compra** → `<Textarea name="razon_compra">` (ya existe el campo)
- **Objeciones** → `ObjecionPicker` (objecion_principal) + `objecion_secundaria`
- **Frases clave del lead** → `<Textarea name="frases_clave">` (nuevo)

El resto (plata, seguimiento, motivo de no cierre, feedback/notas) queda igual.

**`src/app/(app)/closer/reporte/actions.ts`**: guardar `dolores` y `frases_clave` en `updateAgenda`.

**`src/app/(app)/closer/agendas/[id]/page.tsx`**: mostrar Dolores y Frases clave junto a los campos cualitativos existentes.

---

## 3. Grilla de Reportes — tabs + filtro de fecha

**`src/app/(app)/closer/grilla/page.tsx`**:
- Selector de fecha arriba (Esta semana / Este mes / Rango): reutilizar `DateRangePicker` y el parseo de rango por `searchParams` que ya usa `direccion/rendimiento`. Filtrar `reportadas` por `fecha_hora_llamada` dentro del rango.
- `Tabs` (componente existente):
  - **Resumen** → la tabla actual (Lead, Closer, Fecha, Asistencia, Resultado, Monto, Cash, Billetera).
  - **Dolores** / **Razones de compra** / **Objeciones** / **Frases clave** → cada tab lista una fila por reporte del período que tenga ese campo cargado: Lead · Closer · Fecha · texto. Ordenado por fecha desc.
- Para "Objeciones" se muestra objeción principal (label) + secundaria.

---

## 4. Alcance y migraciones

- Implementar y verificar primero en **soul-crm** (mock local), luego replicar a GrowForge y Syndicate respetando los colores/branding de cada uno (la Grilla y el reporte usan tokens/componentes, así que el grueso es idéntico; los tabs no llevan color hardcodeado).
- **2 migraciones** a correr en cada uno de los 3 Supabase: `0005_fx_cripto.sql` y `0006_agenda_reporte_cualitativo.sql`.

## Fuera de alcance (YAGNI)

- No se borran columnas viejas de `fx_rates` ni `app_config.fx_strategy`.
- Las objeciones/dolores siguen siendo texto libre (no tags/listas).
- No se agrega export/CSV de la vista centralizada (se puede sumar después).
