import Link from "next/link";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AreaChart } from "@/components/charts/area-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, ShoppingBag, Receipt } from "lucide-react";
import {
  computeSnapshot,
  monthlyFacturacion,
} from "@/lib/data/kpis";
import { getAgendas } from "@/lib/data/agendas";
import { getUsers } from "@/lib/data/users";
import { formatCurrency, formatDate, formatRangeLabel, parseDateRange } from "@/lib/utils";
import { DateRangePicker } from "@/components/forms/date-range-picker";

export const dynamic = "force-dynamic";

export default async function PanelGeneralPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; month?: string };
}) {
  const range = parseDateRange(searchParams);
  const [snap, serie, agendas, users] = await Promise.all([
    computeSnapshot(range),
    monthlyFacturacion(12),
    getAgendas(),
    getUsers(),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  // Cierres filtrados por rango si hay
  const cerradas = (() => {
    const all = agendas.filter((a) => a.resultado === "cerrado");
    if (!range) return all.slice(0, 10);
    return all
      .filter((a) => {
        const t = new Date(a.fecha_hora_llamada).getTime();
        return t >= range.desde.getTime() && t <= range.hasta.getTime();
      })
      .slice(0, 10);
  })();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel General</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Finanzas · {range ? formatRangeLabel(range) : formatDate(new Date())}
          </p>
        </div>
        <DateRangePicker />
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Cantidad de ventas"
          value={snap.ventas.toString()}
          tone="purple"
          icon={ShoppingBag}
          subtitle="este mes"
        />
        <KpiCard
          label="Cash collected"
          value={formatCurrency(snap.cashCollected)}
          tone="green"
          icon={DollarSign}
          subtitle="bruto del mes"
        />
        <KpiCard
          label="Facturación"
          value={formatCurrency(snap.facturacion)}
          tone="yellow"
          icon={Receipt}
          subtitle="cerrado este mes"
        />
        <KpiCard
          label="Ticket promedio (AOV)"
          value={formatCurrency(snap.AOV)}
          tone="blue"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolución de facturación</CardTitle>
          <CardDescription>Últimos 12 meses · USD</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChart data={serie} format="currency" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas ventas</CardTitle>
          <CardDescription>{cerradas.length} cierres recientes</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Cash collected</TableHead>
                <TableHead>Closer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cerradas.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`/closer/agendas/${a.id}`} className="hover:underline">
                      {a.nombre}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(a.fecha_hora_llamada)}
                  </TableCell>
                  <TableCell>
                    {a.programa_ofrecido && <Badge variant="outline">{a.programa_ofrecido}</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.monto_facturado
                      ? formatCurrency(a.monto_facturado, a.monto_facturado_currency ?? "USD")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.cash_collected
                      ? formatCurrency(a.cash_collected, a.cash_collected_currency ?? "USD")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {userById.get(a.closer_asignado_id ?? "")?.nombre ?? "—"}
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
