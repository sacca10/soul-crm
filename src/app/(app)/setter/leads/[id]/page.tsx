import { notFound } from "next/navigation";
import Link from "next/link";
import { getLead } from "@/lib/data/leads";
import { getUserName } from "@/lib/data/users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstadoBadge, FuenteBadge } from "@/components/leads/estado-badge";
import { FUENTE_LABEL, type LeadEstadoPipeline } from "@/lib/domain";
import { ArrowLeft, Mail, Phone, Instagram, Tag, Calendar, User, Check } from "lucide-react";
import { DeleteLeadButton } from "./delete-button";
import { updateLeadEstadoAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await getLead(params.id);
  if (!lead) notFound();

  const setterName = await getUserName(lead.assigned_setter_id);
  const hasQualification =
    lead.situacion_actual || lead.cuellos_botella || lead.motivacion || lead.recursos_previos;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link href="/setter/leads">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a leads
          </Link>
        </Button>
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{lead.nombre}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lead #{lead.id} · ingresado el{" "}
              {new Date(lead.fecha_ingreso).toLocaleDateString("es-AR")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <EstadoBadge estado={lead.estado_pipeline} />
            <DeleteLeadButton leadId={lead.id} leadName={lead.nombre} />
          </div>
        </header>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow icon={Instagram} label="Instagram" value={lead.instagram_username ?? "—"} />
            <InfoRow icon={Mail} label="Email" value={lead.email ?? "—"} />
            <InfoRow icon={Phone} label="Teléfono" value={lead.telefono ?? "—"} />
            <InfoRow
              icon={Tag}
              label="Puntos de contacto"
              value={
                lead.puntos_contacto && lead.puntos_contacto.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {lead.puntos_contacto.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center rounded bg-[hsl(var(--gold)/0.15)] px-1.5 py-0.5 font-mono text-xs text-[hsl(var(--gold-light))]"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                ) : (
                  "—"
                )
              }
            />
            <InfoRow
              icon={Calendar}
              label="Fuente"
              value={<FuenteBadge fuente={FUENTE_LABEL[lead.fuente]} />}
            />
            <InfoRow icon={User} label="Setter asignado" value={setterName} />
            {lead.notas && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Notas
                </div>
                <p className="mt-1 whitespace-pre-wrap">{lead.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
            <CardDescription>
              Cambian el estado del lead en el pipeline (se refleja en el Kanban y los KPIs)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <EstadoQuickAction
              leadId={lead.id}
              estado="en_descubrimiento"
              label="Mover a descubrimiento"
              current={lead.estado_pipeline}
            />
            <EstadoQuickAction
              leadId={lead.id}
              estado="calificado"
              label="Marcar como calificado"
              current={lead.estado_pipeline}
            />
            <EstadoQuickAction
              leadId={lead.id}
              estado="en_nutricion"
              label="Mover a nutrición"
              current={lead.estado_pipeline}
            />
            <EstadoQuickAction
              leadId={lead.id}
              estado="calendly_enviado"
              label="Enviar Calendly"
              current={lead.estado_pipeline}
            />
            <EstadoQuickAction
              leadId={lead.id}
              estado="agendado"
              label="Marcar como agendado"
              current={lead.estado_pipeline}
            />
            <EstadoQuickAction
              leadId={lead.id}
              estado="en_seguimiento"
              label="Mover a seguimiento"
              current={lead.estado_pipeline}
            />
          </CardContent>
        </Card>
      </div>

      {hasQualification && (
        <Card>
          <CardHeader>
            <CardTitle>Calificación / contexto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <QField label="Situación actual" value={lead.situacion_actual} />
            <QField label="Cuellos de botella / dolor principal" value={lead.cuellos_botella} />
            <QField label="Motivación / objetivo" value={lead.motivacion} />
            <QField label="Recursos previos que probó" value={lead.recursos_previos} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="w-32 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex-1 text-foreground">{value}</div>
    </div>
  );
}

function QField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}

function EstadoQuickAction({
  leadId,
  estado,
  label,
  current,
  destructive,
}: {
  leadId: string;
  estado: LeadEstadoPipeline;
  label: string;
  current: LeadEstadoPipeline;
  destructive?: boolean;
}) {
  const isCurrent = current === estado;
  return (
    <form action={updateLeadEstadoAction}>
      <input type="hidden" name="id" value={leadId} />
      <input type="hidden" name="estado" value={estado} />
      <Button
        type="submit"
        variant={destructive ? "destructive" : "secondary"}
        className="w-full justify-start"
        disabled={isCurrent}
      >
        {isCurrent && <Check className="mr-2 h-4 w-4" />}
        {label}
        {isCurrent && <span className="ml-auto text-xs opacity-70">estado actual</span>}
      </Button>
    </form>
  );
}
