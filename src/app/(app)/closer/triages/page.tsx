import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAgendas } from "@/lib/data/agendas";
import { getTriages } from "@/lib/data/misc";
import { getUsers } from "@/lib/data/users";
import { formatDate } from "@/lib/utils";
import { CalendarDays, ArrowRight, Users as UsersIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TriagesActivosPage() {
  const [triages, agendas, users] = await Promise.all([
    getTriages(),
    getAgendas(),
    getUsers(),
  ]);
  const agendaById = new Map(agendas.map((a) => [a.id, a]));
  const userById = new Map(users.map((u) => [u.id, u]));

  // Triages activos = pendientes/hechos con agenda en el futuro o de los últimos 7 días
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const activos = triages
    .filter((t) => t.estado_triage !== "rechazado")
    .filter((t) => {
      const ag = t.agenda_id ? agendaById.get(t.agenda_id) : null;
      if (!ag) return false;
      // Una vez que se cargó el reporte (estado_llamada deja de ser "pendiente"),
      // el triage sale de activos.
      if (ag.estado_llamada !== "pendiente") return false;
      return new Date(ag.fecha_hora_llamada) >= cutoff;
    })
    .sort((a, b) => {
      const aDate = agendaById.get(a.agenda_id ?? "")?.fecha_hora_llamada ?? "";
      const bDate = agendaById.get(b.agenda_id ?? "")?.fecha_hora_llamada ?? "";
      return aDate.localeCompare(bDate);
    });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Triages activos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tus próximas llamadas con todo el contexto pre-cargado por el setter
        </p>
      </header>

      {activos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No hay triages activos. Cuando el setter haga un triage de una agenda próxima, aparece acá.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {activos.map((t) => {
          const ag = t.agenda_id ? agendaById.get(t.agenda_id) : null;
          const setterName = t.responsable_triage_id
            ? userById.get(t.responsable_triage_id)?.nombre ?? "—"
            : "—";

          return (
            <Card key={t.id} className="overflow-hidden">
              <CardHeader className="border-b border-border bg-secondary/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle>{ag?.nombre ?? "Lead desconocido"}</CardTitle>
                    <CardDescription className="mt-1">
                      {ag?.email ?? "—"} · {ag?.instagram ?? ""}
                    </CardDescription>
                  </div>
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
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  {ag?.fecha_hora_llamada && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(ag.fecha_hora_llamada)} ·{" "}
                      {new Date(ag.fecha_hora_llamada).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <UsersIcon className="h-3.5 w-3.5" />
                    Setter: {setterName}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-sm">
                <Field label="Calificación" value={ag?.nivel_calificacion ?? "—"} />
                <Field label="Origen" value={ag?.primer_contacto_origen ?? "—"} />
                <Field label="Situación actual" value={ag?.situacion_actual ?? "—"} />
                <Field label="Cuellos de botella" value={ag?.cuellos_botella ?? "—"} />
                <Field label="Motivación / objetivo" value={ag?.motivacion ?? "—"} />
                <Field label="Recursos previos" value={ag?.recursos_previos ?? "—"} />
                {t.notas_triage && (
                  <div className="rounded-md border border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--gold)/0.05)] p-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--gold-light))]">
                      Notas del setter
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{t.notas_triage}</p>
                  </div>
                )}
                {ag && (
                  <div className="flex justify-end pt-2">
                    <Button asChild size="sm">
                      <Link href={`/closer/reporte?agenda=${ag.id}`}>
                        Cargar reporte de llamada
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const isEmpty = !value || value === "—";
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <p
        className={`mt-0.5 whitespace-pre-wrap ${
          isEmpty ? "text-muted-foreground/60 italic" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
