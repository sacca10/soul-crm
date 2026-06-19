import { KpiCard } from "@/components/dashboard/kpi-card";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getLeads } from "@/lib/data/leads";
import {
  leadStateDistribution,
  leadsCountByEstado,
} from "@/lib/data/kpis";
import { formatRangeLabel, parseDateRange } from "@/lib/utils";
import { DateRangePicker } from "@/components/forms/date-range-picker";
import {
  Users,
  MessageCircle,
  CheckCircle2,
  Sprout,
  CalendarCheck,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PanelSetterPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; month?: string };
}) {
  const range = parseDateRange(searchParams);
  const [counts, distribution, leads] = await Promise.all([
    leadsCountByEstado(range),
    leadStateDistribution(range),
    getLeads({ range }),
  ]);

  const totalLeads = leads.length;
  const mensajeApertura = counts.mensaje_apertura ?? 0;
  const enDescubrimiento = counts.en_descubrimiento ?? 0;
  const calificados = counts.calificado ?? 0;
  const enNutricion = counts.en_nutricion ?? 0;
  const vslEnviado = counts.vsl_enviado ?? 0;
  const ofertaLlamada = counts.oferta_llamada ?? 0;
  const calendlyEnviado = counts.calendly_enviado ?? 0;
  const agendados = counts.agendado ?? 0;
  const enSeguimiento = counts.en_seguimiento ?? 0;

  // Leads ingresados por día (últimos 14 días)
  const last14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const count = leads.filter(
      (l) => l.fecha_ingreso.slice(0, 10) === key,
    ).length;
    return {
      label: d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
      value: count,
    };
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vista del setter · {formatRangeLabel(range)}
          </p>
        </div>
        <DateRangePicker />
      </header>

      {/* KPIs por estado */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Cantidad de leads" value={totalLeads.toString()} tone="purple" icon={Users} />
        <KpiCard label="Mensaje de apertura" value={mensajeApertura.toString()} tone="blue" icon={MessageCircle} />
        <KpiCard label="En descubrimiento" value={enDescubrimiento.toString()} tone="blue" icon={MessageCircle} />
        <KpiCard label="Calificados" value={calificados.toString()} tone="green" icon={CheckCircle2} />
        <KpiCard label="En nutrición" value={enNutricion.toString()} tone="yellow" icon={Sprout} />
        <KpiCard label="VSL enviado" value={vslEnviado.toString()} tone="blue" icon={Send} />
        <KpiCard label="Oferta de llamada" value={ofertaLlamada.toString()} tone="green" icon={Send} />
        <KpiCard label="Calendly enviado" value={calendlyEnviado.toString()} tone="purple" icon={Send} />
        <KpiCard label="Agendados" value={agendados.toString()} tone="blue" icon={CalendarCheck} />
        <KpiCard label="En seguimiento" value={enSeguimiento.toString()} tone="yellow" icon={CalendarCheck} />
      </div>

      {/* Leads ingresados (chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ingresados</CardTitle>
          <CardDescription>Últimos 14 días</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChart data={last14} format="number" />
        </CardContent>
      </Card>

      {/* Detalle por estado — distribución (cada lead en un solo estado, suma 100%) */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de leads por estado</CardTitle>
          <CardDescription>
            Dónde están tus {distribution.total} leads ahora mismo · los porcentajes suman 100%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelChart stages={distribution.stages} total={distribution.total} />
        </CardContent>
      </Card>
    </div>
  );
}
