import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUsersByRol } from "@/lib/data/users";
import { getAgendas } from "@/lib/data/agendas";
import { getTriages } from "@/lib/data/misc";
import { createTriageAction, deleteTriageAction } from "./actions";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function TriagePage() {
  const [setters, agendas, triages] = await Promise.all([
    getUsersByRol("setter"),
    getAgendas(),
    getTriages(),
  ]);
  const upcoming = agendas.filter((a) => new Date(a.fecha_hora_llamada) >= new Date()).slice(0, 30);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Triage de agendas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Registrá el triage previo a una llamada agendada
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Nuevo triage</CardTitle>
            <CardDescription>Seleccioná la agenda y agregá tus notas</CardDescription>
          </CardHeader>
          <form action={createTriageAction}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agenda_id">Agenda</Label>
                <select
                  id="agenda_id"
                  name="agenda_id"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Elegir agenda —</option>
                  {upcoming.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} · {formatDate(a.fecha_hora_llamada)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsable_triage_id">Responsable</Label>
                <select
                  id="responsable_triage_id"
                  name="responsable_triage_id"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Sin asignar —</option>
                  {setters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado_triage">Estado</Label>
                <select
                  id="estado_triage"
                  name="estado_triage"
                  defaultValue="pendiente"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="hecho">Hecho</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas_triage">Notas</Label>
                <Textarea
                  id="notas_triage"
                  name="notas_triage"
                  rows={4}
                  placeholder="Observaciones del triage…"
                />
              </div>
              <Button type="submit" className="w-full">
                Guardar triage
              </Button>
            </CardContent>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Triages existentes</CardTitle>
            <CardDescription>{triages.length} registros</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agenda</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {triages.map((t) => {
                  const agenda = agendas.find((a) => a.id === t.agenda_id);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">
                        {agenda?.nombre ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.fecha_hora_agenda ? formatDate(t.fecha_hora_agenda) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.estado_triage === "hecho"
                              ? "success"
                              : t.estado_triage === "rechazado"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {t.estado_triage}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {t.notas_triage ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={deleteTriageAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <Button
                            type="submit"
                            size="icon"
                            variant="ghost"
                            aria-label="Eliminar triage"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
