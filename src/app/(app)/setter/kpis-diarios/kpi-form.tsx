"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/forms/submit-button";
import { CheckCircle2 } from "lucide-react";
import { saveKpiManualAction, type KpiSaveState } from "./actions";
import type { KpiDiarioManual } from "@/lib/domain";

export function KpiForm({
  editing,
  todayKpi,
  todayStr,
}: {
  editing: KpiDiarioManual | null;
  todayKpi: KpiDiarioManual | null;
  todayStr: string;
}) {
  const [state, action] = useFormState<KpiSaveState, FormData>(
    saveKpiManualAction,
    null,
  );

  const current = editing ?? todayKpi;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? "Editar KPI" : "Cargar KPI del día"}</CardTitle>
        <CardDescription>
          {editing
            ? `Modificando los datos del ${editing.fecha}`
            : "Los valores se actualizan cada vez que guardás — podés volver a cargar durante el día."}
        </CardDescription>
      </CardHeader>
      <form action={action}>
        {current && <input type="hidden" name="id" value={current.id} />}
        {/* Solo en modo edición explícita (lápiz del historial) redirige al guardar.
            En modo "talonario" del día se queda en la página y muestra el banner. */}
        {editing && <input type="hidden" name="_mode" value="edit" />}
        <CardContent className="space-y-4">
          {state && "error" in state && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state && "ok" in state && (
            <div className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              KPIs guardados correctamente.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={current?.fecha ?? todayStr}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chats_unicos_abiertos">Chats únicos abiertos</Label>
              <Input
                id="chats_unicos_abiertos"
                name="chats_unicos_abiertos"
                type="number"
                min="0"
                placeholder="12"
                defaultValue={current?.chats_unicos_abiertos ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conversaciones">Conversaciones</Label>
              <Input
                id="conversaciones"
                name="conversaciones"
                type="number"
                min="0"
                placeholder="5"
                defaultValue={current?.conversaciones ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enviamos_vsl">Enviamos VSL</Label>
              <Input
                id="enviamos_vsl"
                name="enviamos_vsl"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={current?.enviamos_vsl ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vistas_vsl">Vistas VSL</Label>
              <Input
                id="vistas_vsl"
                name="vistas_vsl"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={current?.vistas_vsl ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="llegaron_cta_vsl">Llegaron al CTA</Label>
              <Input
                id="llegaron_cta_vsl"
                name="llegaron_cta_vsl"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={current?.llegaron_cta_vsl ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="respondieron_cta_vsl">Respondieron al CTA</Label>
              <Input
                id="respondieron_cta_vsl"
                name="respondieron_cta_vsl"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={current?.respondieron_cta_vsl ?? ""}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="agendas_manual">Agendas (manual)</Label>
              <Input
                id="agendas_manual"
                name="agendas_manual"
                type="number"
                min="0"
                placeholder="0"
                defaultValue={current?.agendas_manual ?? ""}
              />
            </div>
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                name="notas"
                rows={2}
                defaultValue={current?.notas ?? ""}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editing && (
              <Button variant="outline" asChild>
                <Link href="/setter/kpis-diarios">Cancelar</Link>
              </Button>
            )}
            <SubmitButton pendingLabel="Guardando...">
              {editing ? "Guardar cambios" : "Guardar KPIs del día"}
            </SubmitButton>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
