import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAgenda } from "@/lib/data/agendas";
import { getUserName } from "@/lib/data/users";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Mail, Phone, Instagram, Calendar, User, Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AgendaDetailPage({ params }: { params: { id: string } }) {
  const agenda = await getAgenda(params.id);
  if (!agenda) notFound();

  const closerName = await getUserName(agenda.closer_asignado_id);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link href="/closer/calendario">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al calendario
          </Link>
        </Button>
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agenda.nombre}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Agenda #{agenda.id} · {formatDate(agenda.fecha_hora_llamada)} ·{" "}
              {new Date(agenda.fecha_hora_llamada).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge
              variant={
                agenda.estado_llamada === "asistio"
                  ? "success"
                  : agenda.estado_llamada === "no_show"
                  ? "destructive"
                  : "warning"
              }
            >
              {agenda.estado_llamada}
            </Badge>
            {agenda.resultado && (
              <Badge
                variant={
                  agenda.resultado === "cerrado"
                    ? "success"
                    : agenda.resultado === "seguimiento"
                    ? "warning"
                    : "outline"
                }
              >
                {agenda.resultado}
              </Badge>
            )}
          </div>
        </header>
      </div>

      {/* Link para unirse a la llamada (de Calendly) */}
      {agenda.meeting_url && (
        <Card className="border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--gold)/0.05)]">
          <CardContent className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--gold)/0.15)]">
                <Video className="h-5 w-5 text-[hsl(var(--gold-light))]" />
              </div>
              <div>
                <div className="text-sm font-semibold">Link de la llamada</div>
                <div className="text-xs text-muted-foreground">
                  {agenda.meeting_url}
                </div>
              </div>
            </div>
            <Button asChild>
              <a href={agenda.meeting_url} target="_blank" rel="noopener noreferrer">
                <Video className="mr-2 h-4 w-4" />
                Unirse a la llamada
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow icon={Instagram} value={agenda.instagram ?? "—"} />
            <InfoRow icon={Mail} value={agenda.email ?? "—"} />
            <InfoRow icon={Phone} value={agenda.telefono ?? "—"} />
            <InfoRow icon={User} value={closerName} />
            <InfoRow icon={Calendar} value={agenda.calendly_event_type ?? "—"} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pre-llamada (setter)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <Field label="Origen" value={agenda.primer_contacto_origen ?? "—"} />
            <Field label="Calificación" value={agenda.nivel_calificacion ?? "—"} />
            <Field label="Situación actual" value={agenda.situacion_actual ?? "—"} full />
            <Field label="Cuellos de botella" value={agenda.cuellos_botella ?? "—"} full />
            <Field label="Motivación" value={agenda.motivacion ?? "—"} full />
            <Field label="Recursos previos" value={agenda.recursos_previos ?? "—"} full />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Bloque closing</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/closer/reporte?agenda=${agenda.id}`}>
                  Cargar / editar reporte
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
            <Field label="Programa ofrecido" value={agenda.programa_ofrecido ?? "—"} />
            <Field label="Forma de cierre" value={agenda.forma_cierre ?? "—"} />
            <Field label="Billetera" value={agenda.billetera ?? "—"} />
            <Field
              label="Monto facturado"
              value={
                agenda.monto_facturado
                  ? formatCurrency(agenda.monto_facturado, agenda.monto_facturado_currency ?? "USD")
                  : "—"
              }
            />
            <Field
              label="Monto upfront"
              value={
                agenda.monto_upfront
                  ? formatCurrency(agenda.monto_upfront, agenda.monto_upfront_currency ?? "USD")
                  : "—"
              }
            />
            <Field
              label="Cash collected"
              value={
                agenda.cash_collected
                  ? formatCurrency(agenda.cash_collected, agenda.cash_collected_currency ?? "USD")
                  : "—"
              }
            />
            <Field
              label="Objeción principal"
              value={
                agenda.objecion_principal === "otro" && agenda.objecion_principal_otro
                  ? `Otro: ${agenda.objecion_principal_otro}`
                  : agenda.objecion_principal ?? "—"
              }
            />
            <Field label="Objeción secundaria" value={agenda.objecion_secundaria ?? "—"} />
            <Field label="Pago en cuotas" value={agenda.pago_en_cuotas ? "Sí" : "No"} />
            <Field
              label="Próximo seguimiento"
              value={agenda.proximo_seguimiento ? formatDate(agenda.proximo_seguimiento) : "—"}
            />
            <Field label="Motivo de no cierre" value={agenda.motivo_no_cierre ?? "—"} full />
            <Field label="Razón de compra" value={agenda.razon_compra ?? "—"} full />
            <Field label="Feedback / notas" value={agenda.feedback_notas ?? "—"} full />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{value}</span>
    </div>
  );
}

function Field({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-3" : ""}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 whitespace-pre-wrap">{value}</div>
    </div>
  );
}
