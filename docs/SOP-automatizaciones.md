# SOP — Automatizaciones del CRM Syndicate

**Última actualización:** 17 mayo 2026
**Responsable:** Juani Saccani
**Alcance:** configuración inicial de los webhooks de **ManyChat** y **Calendly** para que los leads y agendas entren automáticamente al CRM (`https://mediapeak-syndicate-dashboard-crm.vercel.app`).

> Este documento es para que cualquier miembro del equipo (o vos en el futuro) pueda repetir la configuración desde cero sin necesidad de pedir ayuda.

---

## Tabla de contenidos

1. [Pre-requisitos generales](#pre-requisitos)
2. [Dónde encontrar los valores secretos](#secretos)
3. [Parte A — Webhook de ManyChat](#manychat)
4. [Parte B — Webhook de Calendly](#calendly)
5. [Verificación end-to-end](#verificacion)
6. [Troubleshooting](#troubleshooting)
7. [Cómo desactivar / regenerar credenciales](#desactivar)

---

<a id="pre-requisitos"></a>

## 1. Pre-requisitos generales

Antes de empezar, asegurate de tener:

- [ ] Acceso admin al CRM en `https://mediapeak-syndicate-dashboard-crm.vercel.app`
- [ ] Acceso admin al proyecto en Vercel (`vercel.com/dashboard`)
- [ ] Acceso admin al proyecto en Supabase (`supabase.com/dashboard`)
- [ ] Cuenta de **ManyChat Pro** (la free no tiene "External Request")
- [ ] Cuenta de **Calendly Standard / Teams / Enterprise** (la free no tiene webhooks nativos)
- [ ] PowerShell o terminal abierta para correr los comandos de Calendly

---

<a id="secretos"></a>

## 2. Dónde encontrar los valores secretos

Vas a necesitar 2 valores secretos durante la config:

### `MANYCHAT_WEBHOOK_SECRET`

Es la "contraseña" que comparte ManyChat con tu CRM para que el CRM sepa que el request viene de ManyChat (y no de un atacante).

- **Dónde está**: Vercel Dashboard → tu proyecto **mediapeak-syndicate-dashboard-crm** → **Settings → Environment Variables** → buscá `MANYCHAT_WEBHOOK_SECRET` → **Show value** → copialo.

### `CALENDLY_WEBHOOK_SECRET`

Lo mismo pero para Calendly.

- **Dónde está**: Vercel Dashboard → **Settings → Environment Variables** → `CALENDLY_WEBHOOK_SECRET`.

> Si por algún motivo no existen en Vercel, están en el archivo local `.env.local` del proyecto. Si tampoco están ahí, generá uno nuevo en PowerShell con:
> ```powershell
> -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
> ```
> y agregalo en Vercel + en `.env.local`.

---

<a id="manychat"></a>

## 3. Parte A — Webhook de ManyChat

### 3.1 Crear el "Punto de contacto" (CTA) en el CRM

Cada CTA en ManyChat tiene que tener un ID único registrado en el CRM, sino los leads que entran no quedan atribuidos a ninguna pieza de contenido.

1. Entrá al CRM → menú lateral **Marketing**
2. Click arriba a la derecha en **➕ Nuevo punto de contacto**
3. Llená:
   - **CTA ID** (obligatorio): código corto sin espacios, en mayúsculas. Ej: `CTA_REEL_PROSPECCION_15ENE` o `CTA_STORY_FRAMEWORK_22MAR`
   - **Nombre descriptivo**: ej "Reel framework de prospección 15 ene"
   - **Plataforma**: Instagram / YouTube / Ads / Otros
   - **Fecha de publicación**
   - **URL** (opcional, dejar vacío si es una historia que no tiene URL pública)
4. Click **Crear CTA**
5. **Copiate el CTA ID exacto** — lo vas a usar en el siguiente paso

> Repetí este paso por cada pieza de contenido nueva que tenga su propio CTA.

### 3.2 Configurar el bloque External Request en ManyChat

1. Login en https://manychat.com
2. Seleccioná la cuenta de **Instagram** (si tenés varios canales)
3. Menú lateral → **Automation**
4. Abrí el **flow** que se dispara cuando alguien responde al CTA. Si tiene un nombre tipo "Respuesta CTA Reel 15ene", ese es.
5. En el editor del flow, identificá dónde querés capturar al lead. **Recomendación**: justo después del PRIMER intercambio (cuando ya tenés `first_name` y `last_name`), antes de derivar a otro flow o cerrar la conversación.
6. Click en el **➕** al final del último bloque
7. **Actions** → **External Request** (también llamado "Request URL")
8. Completá la config:

| Campo | Valor |
|---|---|
| **Method** | `POST` |
| **URL** | `https://mediapeak-syndicate-dashboard-crm.vercel.app/api/webhooks/manychat` |

9. **Headers**: agregá 2 entradas con el botón "Add Header":

| Key | Value |
|---|---|
| `Content-Type` | `application/json` |
| `x-webhook-secret` | *(pegá el valor de `MANYCHAT_WEBHOOK_SECRET`)* |

10. **Body** → **JSON** (no "Key/Value"), pegá esto:

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

- **Importante**: las variables `{{user_id}}`, `{{first_name}}`, etc. son **User Fields** de ManyChat. Usá el botón "Insert User Field" o "Personalize" del editor para insertarlos correctamente.
- **Reemplazá** `PEGA_ACA_TU_CTA_ID` por el CTA ID exacto que creaste en el paso 3.1.
- Si para este flow particular no tenés `email` o `phone` (porque no se lo pediste al lead), borrá esa línea del JSON.

11. Click **Save** en el bloque External Request
12. Arriba a la derecha del flow → **Publish**

### 3.3 Probar ManyChat

1. Desde tu Instagram (o el de otra cuenta de prueba) andá a la story/reel que dispara este flow
2. Respondé como si fueras un lead
3. ManyChat ejecuta el flow, llega al External Request, y manda el POST al CRM
4. En el CRM → **Setter → Leads** → tendría que aparecer un lead nuevo en menos de 5 segundos con tu nombre, instagram, y el CTA correcto
5. También aparece en **Setter → Estado de los leads** (Kanban) en la columna "Primer mensaje"

✅ Si lo ves: ManyChat configurado correctamente.
❌ Si no aparece: ir a [Troubleshooting](#troubleshooting).

---

<a id="calendly"></a>

## 4. Parte B — Webhook de Calendly

Calendly no tiene UI para crear webhooks — hay que hacerlo via API (2 comandos en PowerShell).

### 4.1 Obtener el Personal Access Token de Calendly

1. Login en https://calendly.com
2. Andá a **Integrations & Apps** (menú lateral)
3. Buscá **API & Webhooks** → click
4. Sección **Personal Access Tokens** → **Create New Token**
5. Nombre: ej "Syndicate CRM"
6. Copialo (lo vas a usar 2 veces, **no se vuelve a mostrar**)

> Guardalo temporalmente en un block de notas — al final de este SOP lo agregás a Vercel como variable `CALENDLY_API_KEY`.

### 4.2 Obtener tu Organization URI

Abrí **PowerShell** (Windows + R → escribí `powershell` → Enter) y corré esto (reemplazá `PEGA_TU_TOKEN_ACA` por el token del paso anterior):

```powershell
$token = "PEGA_TU_TOKEN_ACA"
curl -s -H "Authorization: Bearer $token" https://api.calendly.com/users/me
```

Vas a recibir un JSON. Buscá la línea que dice `"current_organization"` y copiate el valor (algo como `https://api.calendly.com/organizations/AAAA-BBBB-CCCC-DDDD`).

### 4.3 Crear la suscripción al webhook

En la misma PowerShell, pegá esto (reemplazá los 3 valores entre comillas):

```powershell
$token = "PEGA_TU_TOKEN_ACA"
$secret = "PEGA_TU_CALENDLY_WEBHOOK_SECRET_ACA"
$orgUri = "PEGA_TU_ORG_URI_ACA"
$webhookUrl = "https://mediapeak-syndicate-dashboard-crm.vercel.app/api/webhooks/calendly"

$body = @{
  url = $webhookUrl
  events = @("invitee.created", "invitee.canceled")
  organization = $orgUri
  scope = "organization"
  signing_key = $secret
} | ConvertTo-Json

curl -X POST https://api.calendly.com/webhook_subscriptions `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $body
```

Tienen que devolver un JSON con:
- `"uri": "https://api.calendly.com/webhook_subscriptions/..."` ← prueba que se creó
- `"state": "active"` ← prueba que está activo

Si te tira error, mirá el mensaje. Errores comunes:
- `"organization not found"` → el Org URI está mal copiado (no copiaste el dominio completo o sobra algo)
- `"unauthorized"` → el token está mal o expiró
- `"invalid scope"` → asegurate de poner `"scope": "organization"` (no `"user"`)

### 4.4 Configurar preguntas custom en Calendly (recomendado)

Para que el webhook capture **situación actual, cuellos de botella, motivación y recursos previos** del lead, agregá esas preguntas en tu event type de Calendly.

1. Calendly → **Event Types** → click en el evento (ej "Llamada de descubrimiento")
2. Tab **Invitee Questions**
3. **Add a New Question** por cada una, con esos exact wording en la pregunta:

| Pregunta a poner | Por qué |
|---|---|
| "Contame tu situación actual con tu negocio" | El webhook busca la palabra "situación" y guarda la respuesta en `situacion_actual` |
| "¿Cuál es tu cuello de botella principal?" | Busca "cuello" → `cuellos_botella` |
| "¿Cuál es tu motivación / objetivo más grande?" | Busca "motivación" → `motivacion` |
| "¿Qué recursos previos probaste?" | Busca "recurso" → `recursos_previos` |

> Si querés cambiar el wording, lo importante es que la palabra clave (situación / cuello / motivación / recurso) esté en algún lugar de la pregunta — el handler hace matching insensible a mayúsculas.

4. **Save** el event type

### 4.5 (Opcional) Guardar el API Key en Vercel

Si querés poder gestionar webhooks de Calendly en el futuro desde el código:

1. Vercel Dashboard → **Settings → Environment Variables**
2. Agregá nueva variable:
   - Key: `CALENDLY_API_KEY`
   - Value: el Personal Access Token del paso 4.1
   - Scope: Production + Preview
3. **Save**

### 4.6 Probar Calendly

1. Pedile a alguien (o vos mismo desde otra cuenta personal) que agende una llamada por tu link público de Calendly
2. Llene los campos
3. **Inmediatamente** (en 1-2 segundos) andá al CRM → **Closer → Triages activos** → tendría que aparecer una card nueva con el nombre, fecha, datos pre-llamada
4. También aparece en el **Calendario del Closer** si tenés configurado el Google Calendar (porque Calendly lo sincroniza)
5. Si la persona que agendó tenía un email que ya estaba en la tabla `leads`, ese lead va a cambiar automáticamente a estado **"Agendado"**

✅ Si lo ves: Calendly configurado correctamente.
❌ Si no aparece: ir a [Troubleshooting](#troubleshooting).

---

<a id="verificacion"></a>

## 5. Verificación end-to-end

Una vez configurados ambos, hacé esta prueba integral:

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Respondé a una story/reel desde tu IG | Aparece un lead en `/setter/leads` con tu nombre y el CTA correcto |
| 2 | Como setter, mové ese lead en el Kanban a "Calendly enviado" | El estado cambia y persiste al refrescar |
| 3 | Agendá una llamada por Calendly con el MISMO email que pusiste como lead | El lead cambia de estado a "Agendado" automáticamente. Aparece la agenda en `/closer/triages` con todos los campos pre-cargados |
| 4 | Como closer, abrí el triage → click "Cargar reporte" → completá → guardá | El reporte se ve en `/closer/grilla` y los KPIs de `/direccion/general` cambian |

---

<a id="troubleshooting"></a>

## 6. Troubleshooting

### ManyChat — el lead no entra

1. Vercel Dashboard → tu proyecto → pestaña **Logs**
2. Buscá `/api/webhooks/manychat` en los últimos logs
3. Mirá el **status code** y **body de respuesta**:

| Status | Causa probable | Solución |
|---|---|---|
| `401 Unauthorized` | El `x-webhook-secret` del header no coincide con `MANYCHAT_WEBHOOK_SECRET` en Vercel | Verificá que pegaste exactamente el mismo valor en ambos lados (sin espacios extra, sin saltos de línea) |
| `400 Missing required fields` | Falta `manychat_id` o `nombre` en el body JSON | Verificá que las variables `{{user_id}}` y `{{first_name}}` se hayan resuelto correctamente (a veces ManyChat manda `null` si el lead no tiene esos campos aún) |
| `500 Internal Server Error` | Algo falló en la base de datos (probablemente la tabla `leads` no existe o las columnas no coinciden) | Mandame el mensaje exacto del log |
| No aparece request en logs | ManyChat nunca ejecutó el External Request | Asegurate de haber hecho **Publish** del flow después de agregar el bloque. Verificá que el flow se dispara con tu story (probá manualmente el trigger) |

### Calendly — la agenda no aparece

1. Vercel logs → buscá `/api/webhooks/calendly`
2. Errores comunes:

| Status | Causa | Solución |
|---|---|---|
| `401 Invalid signature` | El `signing_key` que pusiste al crear el webhook (paso 4.3) no coincide con `CALENDLY_WEBHOOK_SECRET` en Vercel | Recreá el webhook subscription con el secret correcto (cancelá el viejo con `DELETE /webhook_subscriptions/...`) |
| `400 missing scheduled_event` | Payload extraño de Calendly | Casi nunca pasa. Pegame el log y lo investigo |
| No hay logs | El webhook nunca se ejecutó | Verificá que la suscripción esté `state: active` con: `curl -H "Authorization: Bearer $token" https://api.calendly.com/webhook_subscriptions?scope=organization&organization=$orgUri` |

### Cómo ver el historial de webhooks

Cada request que llega a los webhooks queda registrado en la tabla `webhook_events` de Supabase. Para auditarlo:

1. Supabase → **Table Editor** → tabla `webhook_events`
2. Ordenar por `received_at` descendente
3. Vas a ver cada request con su payload, status (procesado/error), y mensaje de error si hubo

---

<a id="desactivar"></a>

## 7. Cómo desactivar / regenerar credenciales

### Desactivar el webhook de ManyChat temporalmente

- ManyChat → Flow → bloque External Request → toggle de **Enabled** OFF
- O directamente borrá el bloque (igual queda guardado el flow)

### Desactivar el webhook de Calendly

```powershell
$token = "TU_TOKEN"
$webhookId = "PEGA_EL_URI_DEL_WEBHOOK"  # lo guardaste cuando lo creaste
curl -X DELETE "https://api.calendly.com/webhook_subscriptions/$webhookId" -H "Authorization: Bearer $token"
```

### Regenerar un secret (si crees que se filtró)

1. Generá uno nuevo en PowerShell:
   ```powershell
   -join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
   ```
2. Actualizá en Vercel → Environment Variables (y hacé **Redeploy** para que tome el cambio)
3. Actualizá en `.env.local` local
4. En ManyChat: editá el header `x-webhook-secret` del bloque External Request
5. En Calendly: tenés que **eliminar** el webhook viejo (sección anterior) y **crear uno nuevo** con el nuevo signing_key

### Regenerar el Calendly API Token

1. Calendly → API & Webhooks → revocá el token viejo
2. Generá uno nuevo
3. Actualizalo en Vercel → `CALENDLY_API_KEY`

---

## Anexo — Mapping de campos

### ManyChat → CRM (tabla `leads`)

| Campo en ManyChat | Variable | Columna en leads |
|---|---|---|
| User ID | `{{user_id}}` | `manychat_id` (único) |
| Nombre | `{{first_name}} {{last_name}}` | `nombre` |
| Instagram handle | `{{user_handle}}` | `instagram_username` |
| Email | `{{email}}` | `email` |
| Teléfono | `{{phone}}` | `telefono` |
| Tag del CTA | (string fijo) | `puntos_contacto[]` (se agrega al array) |

### Calendly → CRM (tabla `agendas`)

| Calendly | Columna en agendas |
|---|---|
| Invitee URI | `calendly_event_id` (único) |
| Invitee name | `nombre` |
| Invitee email | `email` (también se busca el lead por este email para vincular) |
| Scheduled event start_time | `fecha_hora_llamada` + `fecha_agenda` |
| Custom question con "situación" | `situacion_actual` |
| Custom question con "cuello" | `cuellos_botella` |
| Custom question con "motivación" | `motivacion` |
| Custom question con "recurso" | `recursos_previos` |
| Event type name | `calendly_event_type` |
