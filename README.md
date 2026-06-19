# Dashboard Syndicate

Reemplazo del CRM/dashboard de Airtable (ATV ADVANTAGE SYSTEMA) con stack propio:
**Next.js 14 + Supabase + Vercel**.

Plan completo: `C:\Users\Juani\.claude\plans\necesito-hacer-un-dashboard-dazzling-sunset.md`.

---

## Estado actual

Lo que ya funciona localmente con `npm run dev` (modo bypass auth + mock data):

✅ **Layout** con sidebar colapsable de 4 secciones (Dirección, Setter, Closer, Marketing) + Cobros + Ajustes
✅ **Auth** Supabase (deshabilitado con `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` para preview)
✅ **Middleware** de protección de rutas
✅ **Schema SQL** completo con 12 tablas + enums + RLS + triggers (`supabase/migrations/0001_initial_schema.sql`)
✅ **Componentes UI base** (Button, Card, Input, Label, Badge, Select, Dialog, Tabs, Table, Textarea, Separator)
✅ **Componentes de dashboard** (KPI card con gradientes, Area chart, Bar chart, Funnel compacto, **Embudo visual SVG**)
✅ **Biblioteca de KPIs** (`lib/data/kpis.ts`) con todas las fórmulas del plan
✅ **Helper de FX** (`lib/fx.ts`) que consulta dolarapi.com y cachea en DB
✅ **Endpoints**: `/api/webhooks/manychat`, `/api/webhooks/calendly`, `/api/cron/fx-rates`, `/api/health`

### Páginas construidas

**Dirección (5)**
- Panel General — KPIs reales, gráfico 12 meses, embudo compacto, tabla últimas ventas
- Comisiones del Equipo — pivot setter×closer, gráfico de comisión por closer
- Rendimiento del Negocio — 8 KPI cards, embudo visual completo, tasas, distribución por estado
- Gastos Fijos — tabla + chart por categoría + form para nuevo gasto
- Rendimiento del Contenido — ranking por $ generado, leads por plataforma

**Setter (7)**
- Panel de Leads — 8 cards por estado + ingresos diarios + embudo compacto
- Leads — tabla con búsqueda
- Lead detail — info, notas
- Nuevo lead — form completo
- **Kanban con drag-and-drop** — 12 columnas, sin scrollbars visibles
- Embudo de Conversión — embudo visual SVG con 12 etapas pipeline + 3 post-agenda
- Triage — form + tabla

**Closer (5)**
- Panel General — KPIs + cards próximas agendas
- Reporte de Llamadas — form completo (programa/billetera dinámicos desde Ajustes)
- Grilla de Reportes — tabla
- Calendario — FullCalendar mes/semana/día color-coded
- Agenda detail — pre-llamada + bloque closing

**Marketing + Cobros (4)**
- Marketing — lista CTAs + form nuevo CTA
- Cobros — KPIs + tabla cuotas con estado
- Cobro detail

**Ajustes (5 tabs)**
- KPIs diarios manual + historial
- **Equipo** — agregar/editar/eliminar miembros (admin, setter, closer, marketing)
- **Billeteras** — agregar/editar/eliminar métodos de pago
- **Programas** — agregar/editar/eliminar programas que vendés
- Cotizaciones FX

---

## ⏭️ Lo que TE FALTA HACER

### Inmediato (preview local — opcional, ya funciona)
- Nada, `npm run dev` y andá a http://localhost:3000

### Cuando quieras pasar a producción

#### Paso 1 — Setup Supabase ✅ HECHO

1. Crear cuenta en https://supabase.com (si no tenés)
2. Nuevo proyecto, esperar 1-2 min a que aprovisione
3. **SQL Editor** → New query → pegar todo `supabase/migrations/0001_initial_schema.sql` → Run
4. Verificar **Database → Tables** que aparecen las 12 tablas
5. **Storage** → New bucket `comprobantes` (Public NO, max 10MB, MIME: `application/pdf, image/jpeg, image/png, image/webp`)
6. Storage → Policies del bucket: una para SELECT y otra para INSERT, ambas `to authenticated` con expresión `bucket_id = 'comprobantes'`
7. **Settings → API** → copiar Project URL, anon key, service_role key a `.env.local`

#### Paso 2 — Migrar la capa de datos a Supabase ✅ HECHO

Cada función en `src/lib/data/*.ts` tiene dos caminos:
- **Modo dev** (`NEXT_PUBLIC_DEV_BYPASS_AUTH=true`): lee/escribe del store en memoria (mock data)
- **Modo producción** (`NEXT_PUBLIC_DEV_BYPASS_AUTH=false`): consulta Supabase vía `createClient()` de `lib/supabase/server.ts`

Una vez que tengas Supabase configurado y los datos iniciales (al menos un user admin, las billeteras/programas defaults que vienen en la migración), basta con cambiar el flag y la app empieza a usar Supabase automáticamente. Las queries respetan RLS (sólo ven los datos los autenticados).

Los KPIs (`lib/data/kpis.ts`) cachean el fetch por request usando React `cache()`, así que renderear una página que usa varios KPIs no dispara 6 queries — dispara 1.

#### Paso 3 — Crear tu primer usuario admin ✅ HECHO

User admin creado en Supabase Auth con el trigger `handle_new_auth_user()` (parchado para ser defensivo y no bloquear el signup si algo falla).

#### Paso 4 — Apagar el modo dev ✅ HECHO

`NEXT_PUBLIC_DEV_BYPASS_AUTH=false` en `.env.local`. La app ahora pide login real y lee/escribe contra Supabase.

#### Paso 5 — Deploy a Vercel

1. Crear repo en GitHub y subir el código (`git push`)
2. Vercel → New Project → Import desde GitHub
3. **Settings → Environment Variables** → copiar todas las vars de tu `.env.local` (excepto `DEV_BYPASS_AUTH` que dejás en `false`)
4. Deploy
5. Cuando Vercel termine, tu app está en `https://<proyecto>.vercel.app`
6. Vercel Cron empieza a correr `/api/cron/fx-rates` cada hora automáticamente

#### Paso 6 — Webhook ManyChat (Pro)

En tu flow del CTA, agregar bloque **External Request**:
- Method: `POST`
- URL: `https://<tu-dominio>.vercel.app/api/webhooks/manychat`
- Headers: `Content-Type: application/json`, `x-webhook-secret: <MANYCHAT_WEBHOOK_SECRET>`
- Body:
  ```json
  {
    "manychat_id": "{{user_id}}",
    "nombre": "{{first_name}} {{last_name}}",
    "instagram_username": "{{user_handle}}",
    "cta_tag": "CTA_TU_TAG",
    "email": "{{email}}",
    "telefono": "{{phone}}"
  }
  ```

Probar respondiendo a tu story/reel → el lead debería aparecer en `/setter/leads`.

#### Paso 7 — Webhook Calendly (Standard+)

```bash
curl -X POST https://api.calendly.com/webhook_subscriptions \
  -H "Authorization: Bearer $CALENDLY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<tu-dominio>.vercel.app/api/webhooks/calendly",
    "events": ["invitee.created", "invitee.canceled"],
    "organization": "<TU_ORG_URI>",
    "scope": "organization",
    "signing_key": "<CALENDLY_WEBHOOK_SECRET>"
  }'
```

API key: https://calendly.com/integrations/api_webhooks
Org URI: `curl https://api.calendly.com/users/me -H "Authorization: Bearer $CALENDLY_API_KEY"` → leer `current_organization`

---

## Comandos locales

```bash
npm run dev          # Dev server en http://localhost:3000
npm run build        # Build producción
npm run start        # Servir build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

---

## Estructura del proyecto

```
src/
  app/
    (auth)/login/                Login page
    (app)/                       Layout autenticado con sidebar
      direccion/                 Panel general, comisiones, rendimiento, gastos, contenido
      setter/                    Panel, leads (table + kanban + embudo + form), triage
      closer/                    Panel, reporte, grilla, calendario, agendas/[id]
      marketing/                 CTAs + form
      cobros/                    Lista + detalle de cuotas
      ajustes/                   KPIs, equipo, billeteras, programas, FX
    api/webhooks/                ManyChat + Calendly
    api/cron/                    FX rates
    api/health/                  Health check
  components/
    ui/                          Primitivos shadcn-style
    layout/                      Sidebar, user menu, page placeholder
    dashboard/                   KPI card
    charts/                      Area, Bar, Funnel compacto, Visual funnel SVG
    kanban/                      Kanban board con dnd-kit
    closer/                      Calendar view con FullCalendar
    leads/                       Estado badge
  lib/
    data/                        Capa de datos (mock + futuro Supabase)
      store.ts                   In-memory store
      leads.ts, agendas.ts, misc.ts, users.ts, catalogs.ts, kpis.ts
    mock/seed.ts                 Datos mockeados deterministas
    supabase/                    Clients (browser, server, middleware, service)
    domain.ts                    Types + enums + labels
    kpis.ts                      (legacy, ya no se usa — kpis viven en data/kpis.ts)
    fx.ts                        Cotizaciones
    utils.ts                     formatters
supabase/migrations/
  0001_initial_schema.sql        Schema completo (correr una vez en Supabase)
```

---

## Variables de entorno

Ver `.env.local.example` para el template completo.

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key pública (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Key privada (server only) |
| `MANYCHAT_WEBHOOK_SECRET` | Header `x-webhook-secret` de ManyChat |
| `CALENDLY_WEBHOOK_SECRET` | HMAC signing key de Calendly |
| `CALENDLY_API_KEY` | Para crear webhook subscriptions vía API |
| `CRON_SECRET` | Bearer token del cron de Vercel |
| `NEXT_PUBLIC_APP_URL` | URL pública del proyecto |
| `NEXT_PUBLIC_DEV_BYPASS_AUTH` | `true` salta el login en local (poné `false` en producción) |
