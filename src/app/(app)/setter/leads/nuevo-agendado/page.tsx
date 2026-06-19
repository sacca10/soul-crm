import Link from "next/link";
import { getUsersByRol } from "@/lib/data/users";
import { getContenido } from "@/lib/data/misc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms/form-select";
import { MultiSelect } from "@/components/forms/multi-select";
import { SubmitButton } from "@/components/forms/submit-button";
import { FUENTES, FUENTE_LABEL } from "@/lib/domain";
import { ArrowLeft } from "lucide-react";
import { createLeadAgendadoAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NuevoLeadAgendadoPage() {
  const [setters, closers, contenido] = await Promise.all([
    getUsersByRol("setter"),
    getUsersByRol("closer"),
    getContenido(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link href="/setter/leads">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a leads
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo lead agendado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Para leads que ya agendaron una llamada (por fuera de Calendly). Carga todo el contexto
          para que el closer tenga la info al tomar la llamada.
        </p>
      </div>

      <form action={createLeadAgendadoAction} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Datos del lead</CardTitle>
            <CardDescription>Los campos con * son obligatorios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input id="nombre" name="nombre" required placeholder="Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram_username">Instagram</Label>
                <Input id="instagram_username" name="instagram_username" placeholder="@usuario" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="juan@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" placeholder="+54 9 11 1234-5678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuente">Fuente</Label>
                <FormSelect
                  id="fuente"
                  name="fuente"
                  defaultValue="instagram"
                  options={FUENTES.map((f) => ({ value: f, label: FUENTE_LABEL[f] }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="puntos_contacto">Puntos de contacto</Label>
                <MultiSelect
                  id="puntos_contacto"
                  name="puntos_contacto"
                  placeholder="Elegí uno o varios CTAs…"
                  options={contenido.map((c) => ({
                    value: c.cta_id,
                    label: `${c.cta_id} · ${c.nombre}`,
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Todos los CTAs por los que pasó: el que lo atrajo, el que le explicó el
                  problema, el que lo convirtió.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos de la agenda</CardTitle>
            <CardDescription>Cuándo y con quién</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha_hora_llamada">Fecha y hora de la llamada *</Label>
                <Input
                  id="fecha_hora_llamada"
                  name="fecha_hora_llamada"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primer_contacto_origen">Origen / 1er contacto</Label>
                <FormSelect
                  id="primer_contacto_origen"
                  name="primer_contacto_origen"
                  placeholder="—"
                  options={[
                    { value: "organico_ig", label: "Orgánico IG" },
                    { value: "ads", label: "ADS" },
                    { value: "referido", label: "Referido" },
                    { value: "lista", label: "Lista" },
                    { value: "otros", label: "Otros" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nivel_calificacion">Nivel de calificación</Label>
                <FormSelect
                  id="nivel_calificacion"
                  name="nivel_calificacion"
                  placeholder="—"
                  options={[
                    { value: "calificado", label: "Calificado" },
                    { value: "no_calificado", label: "No calificado" },
                    { value: "dudoso", label: "Dudoso" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned_setter_id">Setter responsable</Label>
                <FormSelect
                  id="assigned_setter_id"
                  name="assigned_setter_id"
                  placeholder="— Sin asignar —"
                  options={setters.map((s) => ({ value: s.id, label: s.nombre }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closer_asignado_id">Closer asignado</Label>
                <FormSelect
                  id="closer_asignado_id"
                  name="closer_asignado_id"
                  placeholder="— Sin asignar —"
                  options={closers.map((c) => ({ value: c.id, label: c.nombre }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_url">Link de la llamada (Meet/Zoom)</Label>
                <Input
                  id="meeting_url"
                  name="meeting_url"
                  type="url"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexto pre-llamada (para el triage)</CardTitle>
            <CardDescription>
              Todo lo que el closer necesita saber antes de la llamada. Se va a mostrar en
              /closer/triages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="situacion_actual">Situación actual</Label>
                <Textarea
                  id="situacion_actual"
                  name="situacion_actual"
                  rows={3}
                  placeholder="Tiene un negocio chico y quiere escalar…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuellos_botella">Cuellos de botella / dolor principal</Label>
                <Textarea
                  id="cuellos_botella"
                  name="cuellos_botella"
                  rows={3}
                  placeholder="No tiene proceso de ventas…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivacion">Motivación / objetivo</Label>
                <Textarea
                  id="motivacion"
                  name="motivacion"
                  rows={3}
                  placeholder="Llegar a $20k MRR…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recursos_previos">Recursos previos que probó</Label>
                <Textarea
                  id="recursos_previos"
                  name="recursos_previos"
                  rows={3}
                  placeholder="Cursos en Hotmart, YouTube…"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notas">Notas adicionales (van al triage)</Label>
                <Textarea
                  id="notas"
                  name="notas"
                  rows={2}
                  placeholder="Cualquier otra cosa que el closer deba saber…"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/setter/leads">Cancelar</Link>
          </Button>
          <SubmitButton pendingLabel="Creando...">
            Crear lead agendado y enviar al triage
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
