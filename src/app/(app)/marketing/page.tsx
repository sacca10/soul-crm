import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BarChart } from "@/components/charts/bar-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { contenidoStats, marketingTotals } from "@/lib/data/kpis";
import { formatCurrency, formatDate, formatNumber, formatRangeLabel, parseDateRange } from "@/lib/utils";
import {
  Plus,
  DollarSign,
  Film,
  MessageCircle,
  MessageSquare,
  ShoppingBag,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { DateRangePicker } from "@/components/forms/date-range-picker";
import { deleteCtaAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; month?: string };
}) {
  const range = parseDateRange(searchParams);
  const [stats, totals] = await Promise.all([
    contenidoStats(range),
    marketingTotals(range),
  ]);

  const ranking = [...stats].sort((a, b) => b.dinero_generado - a.dinero_generado);
  const porPlataforma = ["instagram", "youtube", "ads", "otros"].map((p) => ({
    name: p,
    leads: stats
      .filter((c) => c.plataforma === p)
      .reduce((s, c) => s + c.leads_generados, 0),
  }));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rendimiento del contenido · {formatRangeLabel(range)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button asChild>
            <Link href="/marketing/cta/nuevo">
              <Plus className="mr-2 h-4 w-4" /> Nuevo punto de contacto
            </Link>
          </Button>
          <DateRangePicker />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Chats únicos abiertos"
          value={formatNumber(totals.chatsUnicos)}
          tone="purple"
          icon={MessageCircle}
        />
        <KpiCard
          label="Conversaciones"
          value={formatNumber(totals.conversaciones)}
          tone="blue"
          icon={MessageSquare}
        />
        <KpiCard
          label="Leads calificados"
          value={formatNumber(totals.leadsCalificados)}
          tone="green"
          icon={CheckCircle2}
          subtitle={`de ${totals.leadsTotales} totales`}
        />
        <KpiCard
          label="Ventas"
          value={formatNumber(totals.ventas)}
          tone="yellow"
          icon={ShoppingBag}
        />
        <KpiCard
          label="Total generado"
          value={formatCurrency(totals.dineroGenerado)}
          tone="green"
          icon={DollarSign}
        />
        <KpiCard
          label="Piezas de contenido"
          value={stats.length.toString()}
          tone="purple"
          icon={Film}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ranking por dinero generado</CardTitle>
            <CardDescription>De mejor a peor punto de contacto</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={ranking.map((c) => ({ name: c.cta_id, monto: c.dinero_generado }))}
              index="name"
              categories={[{ key: "monto", label: "USD", color: "#9b6dff" }]}
              format="currency"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por plataforma</CardTitle>
            <CardDescription>Distribución</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              data={porPlataforma}
              index="name"
              categories={[{ key: "leads", label: "Leads", color: "#9b6dff" }]}
              format="number"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tabla de puntos de contacto</CardTitle>
          <CardDescription>{stats.length} CTAs registrados</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Pieza</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Chats únicos</TableHead>
                <TableHead className="text-right">Conversaciones</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Calificados</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">$ generado</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.cta_id}</TableCell>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {c.plataforma}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(c.fecha_publicacion)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {c.chats_unicos_abiertos ?? 0}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {c.conversaciones ?? 0}
                  </TableCell>
                  <TableCell className="text-right">{c.leads_generados}</TableCell>
                  <TableCell className="text-right">
                    {c.leads_calificados > 0 ? (
                      <span className="text-[hsl(var(--gold-light))] font-medium">
                        {c.leads_calificados}
                      </span>
                    ) : (
                      c.leads_calificados
                    )}
                  </TableCell>
                  <TableCell className="text-right">{c.ventas_generadas}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(c.dinero_generado)}
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deleteCtaAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        aria-label={`Eliminar ${c.cta_id}`}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
