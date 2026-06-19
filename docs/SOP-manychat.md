# SOP — Webhook de ManyChat para Syndicate CRM

**Última actualización:** 17 mayo 2026
**Responsable:** Juani Saccani
**Alcance:** configurar ManyChat (Pro) para que cada respuesta a una story / reel / CTA cree automáticamente un lead en el CRM (`https://mediapeak-syndicate-dashboard-crm.vercel.app`).

> Este documento es para que cualquier miembro del equipo pueda repetir la configuración sin pedir ayuda. Tiempo estimado: **10 minutos**.

---

## Tabla de contenidos

1. [Pre-requisitos](#pre)
2. [Paso 1 — Crear el punto de contacto (CTA) en el CRM](#paso1)
3. [Paso 2 — Configurar el bloque External Request en ManyChat](#paso2)
4. [Paso 3 — Probar](#paso3)
5. [Troubleshooting](#troubleshooting)
6. [Cómo desactivar / regenerar](#desactivar)
7. [Anexo — Mapping de campos](#anexo)

---

<a id="pre"></a>

## 1. Pre-requisitos

Antes de empezar, asegurate de tener:

- [ ] Cuenta de **ManyChat Pro** (la free no tiene "External Request")
- [ ] Acceso admin al CRM
- [ ] Acceso admin al proyecto en Vercel (para copiar el secret)
- [ ] El flow de ManyChat que se dispara con la respuesta al CTA ya existente

### Obtener el secret del webhook

Vas a necesitar el `MANYCHAT_WEBHOOK_SECRET` para autenticar el request.

1. https://vercel.com/dashboard → tu proyecto **mediapeak-syndicate-dashboard-crm**
2. **Settings → Environment Variables**
3. Buscá `MANYCHAT_WEBHOOK_SECRET`
4. Click el ojito **Show value** → copialo a un block de notas temporal

> Si no existe la variable, generá una nueva con PowerShell:
> ```powershell
> -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
> ```
> Y agregala en Vercel + en `.env.local`.

---

<a id="paso1"></a>

## 2. Paso 1 — Crear el punto de contacto (CTA) en el CRM

Cada CTA en ManyChat necesita un identificador único registrado en el CRM. Sin esto, los leads que entran no quedan atribuidos a ninguna pieza de contenido y no aparecen en las métricas de marketing.

1. Entrá al CRM → menú lateral **Marketing**
2. Click arriba a la derecha en **➕ Nuevo punto de contacto**
3. Llená los campos:

| Campo | Ejemplo | Reglas |
|---|---|---|
| **CTA ID** | `CTA_REEL_PROSPECCION_15ENE` | Sin espacios, MAYÚSCULAS, descriptivo. Tag único. |
| **Nombre descriptivo** | "Reel framework de prospección 15 ene" | Lo que el equipo va a ver en el dashboard |
| **Plataforma** | Instagram / YouTube / Ads / Otros | Para agrupar en reportes |
| **Fecha de publicación** | 15/01/2026 | Cuándo subiste la pieza |
| **URL** | (opcional, dejar vacío si es story) | Si tiene URL pública |

4. Click **Crear CTA**
5. **Copiate el CTA ID exacto** — lo vas a usar en el siguiente paso

> 💡 Repetí este paso cada vez que crees una pieza de contenido nueva con su propio CTA. El equipo de marketing puede hacerlo sin pedir ayuda al admin.

---

<a id="paso2"></a>

## 3. Paso 2 — Configurar el bloque External Request en ManyChat

### 3.1 Abrir el flow

1. Login en https://manychat.com
2. Seleccioná la cuenta de **Instagram** (si tenés varios canales conectados)
3. Menú lateral → **Automation**
4. Buscá el **flow** que se dispara con la respuesta del CTA. Probablemente tiene un nombre como "Respuesta CTA Reel 15ene" o similar. Abrilo en el editor.

### 3.2 Elegir el punto del flow

Mirá el flow y elegí UN punto donde capturar al lead. **Recomendación**: justo **después** del PRIMER intercambio de mensajes (cuando ya tenés `first_name` y `last_name` capturados), pero **antes** de derivar a otro flow o cerrar la conversación.

Buen lugar: después del bloque del bot que confirma "¡Listo, te paso el link!" o similar.

### 3.3 Agregar el bloque External Request

1. En ese punto, click en el **➕** al final del último bloque
2. **Actions** → buscá **External Request** (también figura como "Request URL")
3. Te abre el panel de configuración. Completalo así:

#### Method
```
POST
```

#### URL
```
https://mediapeak-syndicate-dashboard-crm.vercel.app/api/webhooks/manychat
```

#### Headers
Agregá 2 entradas con el botón **+ Add Header**:

| Key | Value |
|---|---|
| `Content-Type` | `application/json` |
| `x-webhook-secret` | *(pegá el valor de `MANYCHAT_WEBHOOK_SECRET`)* |

#### Body
Cambiá el tipo a **JSON** (no Key/Value) y pegá:

```json
{
  "manychat_id": "{{user_id}}",
  "nombre": "{{first_name}} {{last_name}}",
  "instagram_username": "{{user_handle}}",
  "cta_tag": "PEGA_ACA_TU_CTA_ID",
  "email": "{{email}}",
  "telefono": "{{phone}}"
}
```

> ⚠️ **Importante sobre `{{...}}`:** son **User Fields** de ManyChat. **No los escribas a mano** — usá el botón **Insert User Field** / **Personalize** del editor para insertarlos correctamente.

> ⚠️ **Reemplazá `PEGA_ACA_TU_CTA_ID`** por el CTA ID exacto que creaste en el Paso 1 (ej. `CTA_REEL_PROSPECCION_15ENE`).

> Si para este flow no tenés algún campo (ej. el lead no te dio email o teléfono), borrá esa línea del JSON. La app lo guarda como NULL.

### 3.4 Guardar y publicar

1. Click **Save** en el bloque External Request
2. Arriba a la derecha del flow → **Publish**
3. Confirmá que el toggle del flow esté **ON** (encendido)

---

<a id="paso3"></a>

## 4. Paso 3 — Probar

1. Desde tu Instagram (o de una cuenta de prueba) andá a la story / reel / publicación que dispara el flow
2. Respondela como si fueras un lead real (con el texto/keyword que activa el flow)
3. ManyChat ejecuta el flow, llega al bloque External Request, y manda el POST al CRM
4. Esperá 2-3 segundos
5. Andá al CRM → **Setter → Leads**

✅ **Tendrías que ver un lead nuevo** con:
- Tu nombre (del IG)
- Tu username de Instagram
- El CTA correcto en la columna "Punto de contacto"
- Estado: "Primer mensaje"
- Setter: "Sin asignar" (o el que tengas configurado por default)

También aparece en **Setter → Estado de los leads** (Kanban) en la columna "Primer mensaje".

❌ Si no aparece, ir a [Troubleshooting](#troubleshooting).

---

<a id="troubleshooting"></a>

## 5. Troubleshooting

### El lead no aparece en el CRM

**Paso 1:** mirá los logs de Vercel

1. https://vercel.com/dashboard → tu proyecto → pestaña **Logs**
2. Filtrá por `/api/webhooks/manychat` o buscá ese texto
3. Vas a ver cada POST request con su status code

**Paso 2:** identificá el error según el status code

| Status | Error en el JSON de respuesta | Causa probable | Solución |
|---|---|---|---|
| `401` | `"Unauthorized"` | El `x-webhook-secret` no coincide | Comprobá que copiaste exactamente el mismo valor en ManyChat y en Vercel. Sin espacios, sin saltos de línea, sin comillas |
| `400` | `"Missing required fields: manychat_id, nombre"` | Las variables `{{user_id}}` o `{{first_name}}` están vacías | El lead no tiene esos datos cargados aún. Movéel bloque External Request a un punto del flow donde el lead ya respondió y ManyChat tiene los datos |
| `500` | Algo de DB | La tabla `leads` no existe o tiene un schema viejo | Verificá en Supabase que la tabla existe y tiene la columna `puntos_contacto` |
| No aparece request | — | ManyChat nunca ejecutó el External Request | Asegurate que hiciste **Publish** del flow. Verificá que el flow está activo (toggle ON). Probá disparar el trigger manualmente desde ManyChat |

**Paso 3:** auditar en Supabase

Cada request que llega queda registrado en la tabla `webhook_events`:

1. Supabase → **Table Editor → webhook_events**
2. Filtrá por `fuente = 'manychat'`
3. Ordená por `received_at` descendente
4. Inspeccioná el payload y el error_message del último registro

---

### El lead entra pero no tiene CTA atribuido

Causa: el `cta_tag` que mandás desde ManyChat no existe en el CRM (no creaste el punto de contacto en el Paso 1).

Solución: andá al CRM → **Marketing → Nuevo punto de contacto** y creá el CTA con ese ID exacto. Los leads que entraron antes seguirán sin CTA atribuido (ese campo se setea al momento del insert), los próximos sí.

---

### Quiero atribuir varios CTAs al mismo lead

El campo `puntos_contacto` es un **array**. Si el mismo `manychat_id` responde a varios CTAs distintos:
- La primera vez: se crea el lead con `puntos_contacto: ["CTA_1"]`
- La segunda vez (mismo manychat_id, distinto cta_tag): el webhook **agrega** `CTA_2` al array existente sin duplicar. Resultado: `["CTA_1", "CTA_2"]`

No tenés que hacer nada especial — el webhook maneja esto automáticamente.

---

<a id="desactivar"></a>

## 6. Cómo desactivar / regenerar

### Pausar temporalmente el webhook

Opción A: en ManyChat → flow → bloque External Request → toggle **Enabled** OFF
Opción B: pausar el flow entero (toggle del flow en OFF)

### Regenerar el secret (si crees que se filtró)

1. Generá uno nuevo en PowerShell:
   ```powershell
   -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
   ```
2. Vercel → Settings → Environment Variables → editá `MANYCHAT_WEBHOOK_SECRET` con el valor nuevo
3. **Deployments → último → ⋯ → Redeploy** (importante: sin esto el server sigue usando el viejo)
4. En ManyChat: editá el header `x-webhook-secret` del bloque External Request con el valor nuevo
5. **Save + Publish** del flow

### Eliminar el bloque por completo

ManyChat → flow → seleccioná el bloque External Request → tecla **Delete** → **Publish**

---

<a id="anexo"></a>

## 7. Anexo — Mapping de campos

### ManyChat → tabla `leads` del CRM

| Campo en ManyChat | Variable a usar | Columna en `leads` |
|---|---|---|
| User ID (subscriber ID) | `{{user_id}}` | `manychat_id` (único, identifica al lead) |
| Nombre | `{{first_name}} {{last_name}}` | `nombre` |
| Instagram handle | `{{user_handle}}` | `instagram_username` |
| Email | `{{email}}` | `email` |
| Teléfono | `{{phone}}` | `telefono` |
| Tag del CTA | (string fijo del CTA_ID) | `puntos_contacto[]` (se agrega al array) |
| — | (fijo) | `estado_pipeline = 'primer_mensaje'` |
| — | (fijo) | `fuente = 'instagram'` |

### Comportamiento al recibir un mismo `manychat_id` 2 veces

- **Lead nuevo (no existe)**: se crea con todos los campos
- **Lead existente (mismo manychat_id)**:
  - Se hace `upsert` por `manychat_id`
  - El `cta_tag` se agrega al array `puntos_contacto` SIN duplicar
  - El estado actual del pipeline NO se sobreescribe (el lead mantiene el progreso que tenía)
  - Los demás campos (nombre, email, etc.) sí se actualizan

---

## 📌 Quick reference

**Endpoint del webhook**:
```
POST https://mediapeak-syndicate-dashboard-crm.vercel.app/api/webhooks/manychat
```

**Header obligatorio**:
```
x-webhook-secret: <MANYCHAT_WEBHOOK_SECRET>
```

**Body mínimo válido**:
```json
{
  "manychat_id": "...",
  "nombre": "..."
}
```

**Respuesta exitosa**:
```json
{ "ok": true, "lead_id": "uuid-del-lead-creado" }
```
