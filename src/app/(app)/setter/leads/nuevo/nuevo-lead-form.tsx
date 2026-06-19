"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms/form-select";
import { MultiSelect } from "@/components/forms/multi-select";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  ESTADOS_PIPELINE,
  ESTADO_PIPELINE_LABEL,
  FUENTES,
  FUENTE_LABEL,
  type User,
  type Contenido,
} from "@/lib/domain";
import { createLeadAction, type CreateLeadState } from "./actions";

export function NuevoLeadForm({
  setters,
  contenido,
}: {
  setters: User[];
  contenido: Contenido[];
}) {
  const [state, action] = useFormState<CreateLeadState, FormData>(
    createLeadAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Datos básicos</CardTitle>
          <CardDescription>
            Solo lo esencial. Después editás desde el detalle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input id="nombre" name="nombre" required placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_username">Instagram</Label>
              <Input
                id="instagram_username"
                name="instagram_username"
                placeholder="@usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado_pipeline">Situación en el funnel *</Label>
              <FormSelect
                id="estado_pipeline"
                name="estado_pipeline"
                required
                defaultValue="mensaje_apertura"
                options={ESTADOS_PIPELINE.map((e) => ({
                  value: e,
                  label: ESTADO_PIPELINE_LABEL[e],
                }))}
              />
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
              <Label htmlFor="assigned_setter_id">Setter responsable</Label>
              <FormSelect
                id="assigned_setter_id"
                name="assigned_setter_id"
                placeholder="— Sin asignar —"
                options={setters.map((s) => ({ value: s.id, label: s.nombre }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="puntos_contacto">Puntos de contacto</Label>
              <MultiSelect
                id="puntos_contacto"
                name="puntos_contacto"
                placeholder="Elegí uno o varios CTAs por los que respondió el lead…"
                options={contenido.map((c) => ({
                  value: c.cta_id,
                  label: `${c.cta_id} · ${c.nombre}`,
                }))}
              />
              <p className="text-xs text-muted-foreground">
                Podés agregar varios: el que lo atrajo, el que le explicó el problema, el que lo
                hizo agendar. Sirve para entender qué contenido convierte mejor.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                name="notas"
                rows={3}
                placeholder="Lo que necesites recordar de este lead…"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" asChild>
              <Link href="/setter/leads">Cancelar</Link>
            </Button>
            <SubmitButton pendingLabel="Creando...">Crear lead</SubmitButton>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
