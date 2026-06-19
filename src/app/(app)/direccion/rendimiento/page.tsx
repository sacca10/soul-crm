import { KpiCard } from "@/components/dashboard/kpi-card";
import { VisualFunnel } from "@/components/charts/visual-funnel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  computeSnapshot,
  dineroEstancadoEnSeguimientos,
  visualFunnelData,
  vslFunnelManual,
} from "@/lib/data/kpis";
import {
  formatCurrency,
  formatPercent,
  formatRangeLabel,
  parseDateRange,
} from "@/lib/utils";
import { DateRangePicker } from "@/components/forms/date-range-picker";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Hourglass,
  ShoppingBag,
  TrendingUp,
  MessageCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RendimientoPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; month?: string };
}) {
  const range = parseDateRange(searchParams);
  const [snap, estancado, funnel3, vsl] = await Promise.all([
    computeSnapshot(range),
    dineroEstancadoEnSeguimientos(),
    visualFunnelData(range),
    vslFunnelManual(range),
  ]);

  // Todas las etapas en el mismo violeta de marca (sin degradé de tonos).
  const VIOLET = "#9b6dff";
  const vslStages = [
    { label: "Chats únicos", count: vsl.chatsUnicos, color: VIOLET },
    { label: "Conversaciones", count: vsl.conversaciones, color: VIOLET },
    { label: "Enviamos VSL", count: vsl.enviamosVsl, color: VIOLET },
    { label: "Vistas VSL", count: vsl.vistasVsl, color: VIOLET },
    { label: "Llegaron al CTA", count: vsl.llegaronCtaVsl, color: VIOLET },
    { label: "Respondieron CTA", count: vsl.respondieronCtaVsl, color: VIOLET },
    { label: "Agendas (manual)", count: vsl.agendasManual, color: VIOLET },
  ];

  const principal = [
    { label: "Leads totales", count: funnel3.leads, color: VIOLET },
    { label: "Agendamiento", count: funnel3.agendas, color: VIOLET },
    { label: "Cierres", count: funnel3.cierres, color: VIOLET },
  ];

  // Cada tasa muestra un hint cuando su denominador está vacío, así queda claro
  // qué falta cargar (en vez de un "0.0%" pelado que parece un bug).
  const tasas = [
    {
      label: "% Agendamiento",
      value: snap.pctAgendamiento,
      formula: "Agendas / Conversaciones",
      hint:
        snap.conversaciones === 0
          ? "Cargá conversaciones en Ajustes → KPIs diarios"
          : null,
    },
    {
      label: "Show Up Rate",
      value: snap.showUpRate,
      formula: "Shows / Agendas",
      hint: snap.agendas === 0 ? "Sin agendas en el período" : null,
    },
    {
      label: "% Calificación",
      value: snap.pctCalificacion,
      formula: "Calificados / Shows",
      hint: snap.shows === 0 ? "Falta cargar reportes de llamada" : null,
    },
    {
      label: "Close Rate bruto",
      value: snap.closeRateBruto,
      formula: "Cierres / Shows",
      hint: snap.shows === 0 ? "Falta cargar reportes de llamada" : null,
    },
    {
      label: "Close Rate calificado",
      value: snap.closeRateCalificado,
      formula: "Cierres / Calificados",
      hint: snap.calificados === 0 ? "Sin calificados en llamada aún" : null,
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rendimiento del Negocio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            KPIs financieros y operativos · {formatRangeLabel(range)}
          </p>
        </div>
        <DateRangePicker />
      </header>

      {/* KPIs financieros */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Facturación"
          value={formatCurrency(snap.facturacion)}
          tone="green"
          icon={DollarSign}
          subtitle="mes actual"
        />
        <KpiCard
          label="Cash collected"
          value={formatCurrency(snap.cashCollected)}
          tone="blue"
          icon={DollarSign}
          subtitle="bruto"
        />
        <KpiCard
          label="Cash de seguimientos"
          value={formatCurrency(snap.cashSeguimiento)}
          tone="purple"
          icon={DollarSign}
          subtitle="cobrado en seguimientos"
        />
        <KpiCard
          label="Estancado en seguimientos"
          value={formatCurrency(estancado)}
          tone="yellow"
          icon={Hourglass}
          subtitle="por cobrar"
        />
      </div>

      {/* KPIs operativos del mes */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Cierres" value={snap.cierres.toString()} tone="green" icon={ShoppingBag} subtitle="del mes" />
        <KpiCard label="Agendas" value={snap.agendas.toString()} tone="blue" icon={Calendar} />
        <KpiCard label="Shows" value={snap.shows.toString()} tone="purple" icon={CheckCircle2} subtitle={`${snap.noShows} no shows`} />
        <KpiCard label="Conversaciones" value={snap.conversaciones.toString()} tone="yellow" icon={MessageCircle} subtitle="manual diario" />
      </div>

      {/* Derivados monetarios */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Ticket promedio (AOV)" value={formatCurrency(snap.AOV)} tone="green" icon={TrendingUp} />
        <KpiCard label="Cash per show" value={formatCurrency(snap.cashPerShow)} tone="blue" icon={TrendingUp} />
        <KpiCard label="Cash per agenda" value={formatCurrency(snap.cashPerAgenda)} tone="purple" icon={TrendingUp} />
      </div>

      {/* Embudo de conversión + tasas (data clave centralizada acá) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Embudo principal</CardTitle>
            <CardDescription>Leads totales → Agendamiento → Cierres</CardDescription>
          </CardHeader>
          <CardContent>
            <VisualFunnel stages={principal} height={420} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasas de conversión</CardTitle>
            <CardDescription>Sobre el período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasas.map((t) => (
              <div key={t.label} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">{t.label}</span>
                  <span className="text-2xl font-bold tracking-tight text-gold-gradient">
                    {formatPercent(t.value)}
                  </span>
                </div>
                <div
                  className={`mt-0.5 text-xs ${
                    t.hint ? "text-[hsl(var(--gold-light))]/90" : "text-muted-foreground"
                  }`}
                >
                  {t.hint ?? t.formula}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Funnel manual del VSL — números cargados a mano (Ajustes → KPIs diarios) */}
      <Card>
        <CardHeader>
          <CardTitle>Funnel manual del VSL</CardTitle>
          <CardDescription>
            Totales cargados a mano en Ajustes → KPIs diarios · {formatRangeLabel(range)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VisualFunnel stages={vslStages} height={420} />
        </CardContent>
      </Card>
    </div>
  );
}
