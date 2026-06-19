import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getCobros, getSeguimientos } from "@/lib/data/misc";
import { getAgendas } from "@/lib/data/agendas";
import { formatCurrency, formatDate, formatRangeLabel, parseDateRange } from "@/lib/utils";
import { DateRangePicker } from "@/components/forms/date-range-picker";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCcw,
  Hourglass,
  Flame,
  Snowflake,
  TrendingUp,
} from "lucide-react";
import type { CobroEstado, SeguimientoEstado } from "@/lib/domain";

export const dynamic = "force-dynamic";

const estadoBadgeVariant: Record<CobroEstado, "success" | "warning" | "destructive" | "outline"> = {
  al_dia: "success",
  cobrada: "success",
  vencida: "destructive",
  refund: "warning",
  churn: "destructive",
};

const estadoLabel: Record<CobroEstado, string> = {
  al_dia: "Al día",
  cobrada: "Cobrada",
  vencida: "Vencida",
  refund: "Refund",
  churn: "Churn",
};

const segVariant: Record<SeguimientoEstado, "destructive" | "warning" | "outline"> = {
  caliente: "destructive",
  tibio: "warning",
  frio: "outline",
};

export default async function CobrosPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; month?: string };
}) {
  const range = parseDateRange(searchParams);
  const [allCobros, allSeguimientos, agendas] = await Promise.all([
    getCobros(),
    getSeguimientos(),
    getAgendas(),
  ]);
  const agendaById = new Map(agendas.map((a) => [a.id, a]));

  // Aplicar filtro de fecha si hay rango
  const inRange = (iso: string | null | undefined): boolean => {
    if (!range || !iso) return true;
    if (!iso) return false;
    const t = new Date(iso).getTime();
    return t >= range.desde.getTime() && t <= range.hasta.getTime();
  };

  const cobros = range
    ? allCobros.filter((c) => inRange(c.fecha_vencimiento))
    : allCobros;
  const seguimientos = range
    ? allSeguimientos.filter((s) => inRange(s.fecha_llamada_original))
    : allSeguimientos;

  const cobradas = cobros.filter((c) => c.estado === "cobrada");
  const vencidas = cobros.filter((c) => c.estado === "vencida");
  const alDia = cobros.filter((c) => c.estado === "al_dia");

  const totalCobrado = cobradas.reduce((s, c) => s + c.monto_cobrar, 0);
  const totalVencido = vencidas.reduce((s, c) => s + c.monto_cobrar, 0);
  const totalAlDia = alDia.reduce((s, c) => s + c.monto_cobrar, 0);
  // Total generado en upsell/resell (plata extra que hizo el closer encima del programa regular)
  const totalUpsell = cobros
    .filter(
      (c) =>
        (c.tipo_cuota === "upsell" || c.tipo_cuota === "resell") &&
        c.fecha_cobro_real,
    )
    .reduce((s, c) => s + c.monto_cobrar, 0);

  // Estancado: sólo caliente + tibio (frío se considera casi perdido)
  const estancado = seguimientos
    .filter((s) => s.estado === "caliente" || s.estado === "tibio")
    .reduce((sum, s) => sum + (s.total_cobrar_proyectado ?? 0), 0);
  const calientes = seguimientos.filter((s) => s.estado === "caliente").length;
  const tibios = seguimientos.filter((s) => s.estado === "tibio").length;
  const frios = seguimientos.filter((s) => s.estado === "frio").length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobros</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuotas del programa y seguimientos pendientes · {formatRangeLabel(range)}
          </p>
        </div>
        <DateRangePicker />
      </header>

      <Tabs defaultValue="cuotas">
        <TabsList>
          <TabsTrigger value="cuotas">Cuotas del programa</TabsTrigger>
          <TabsTrigger value="seguimientos">Seguimientos pendientes</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* CUOTAS                                                        */}
        {/* ============================================================ */}
        <TabsContent value="cuotas" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <KpiCard label="Cobrado total" value={formatCurrency(totalCobrado)} tone="green" icon={CheckCircle2} subtitle={`${cobradas.length} cuotas`} />
            <KpiCard label="Al día (próximas)" value={formatCurrency(totalAlDia)} tone="blue" icon={Clock} subtitle={`${alDia.length} cuotas`} />
            <KpiCard label="Vencidas" value={formatCurrency(totalVencido)} tone="red" icon={AlertTriangle} subtitle={`${vencidas.length} cuotas`} />
            <KpiCard label="Generado en upsell" value={formatCurrency(totalUpsell)} tone="yellow" icon={TrendingUp} subtitle="upsell + resell cobrados" />
            <KpiCard label="Total programa activo" value={formatCurrency(totalCobrado + totalAlDia + totalVencido)} tone="purple" icon={RefreshCcw} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cuotas</CardTitle>
              <CardDescription>{cobros.length} cuotas en total · ordenadas por vencimiento</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Programa</TableHead>
                    <TableHead>Cuota</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Cobro real</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Billetera</TableHead>
                    <TableHead className="text-right">Días atraso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cobros.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link href={`/cobros/${c.id}`} className="hover:underline">
                          {c.programa_contratado}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>
                            {c.numero_cuota} de {c.total_cuotas}
                          </span>
                          {c.tipo_cuota !== "regular" && (
                            <Badge
                              variant="warning"
                              className="text-[10px] uppercase"
                            >
                              {c.tipo_cuota}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(c.monto_cobrar, c.monto_cobrar_currency)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(c.fecha_vencimiento)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.fecha_cobro_real ? formatDate(c.fecha_cobro_real) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={estadoBadgeVariant[c.estado]}>{estadoLabel[c.estado]}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.billetera ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {c.dias_atraso > 0 ? (
                          <span className="text-destructive">{c.dias_atraso} días</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* SEGUIMIENTOS                                                  */}
        {/* ============================================================ */}
        <TabsContent value="seguimientos" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Dinero estancado"
              value={formatCurrency(estancado)}
              tone="yellow"
              icon={Hourglass}
              subtitle="proyectado · solo activos"
            />
            <KpiCard label="Calientes" value={calientes.toString()} tone="red" icon={Flame} />
            <KpiCard label="Tibios" value={tibios.toString()} tone="yellow" icon={Hourglass} />
            <KpiCard label="Fríos" value={frios.toString()} tone="blue" icon={Snowflake} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Seguimientos pendientes</CardTitle>
              <CardDescription>
                {seguimientos.length} leads que no cerraron en la llamada y siguen activos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>N° seguimiento</TableHead>
                    <TableHead>Fecha llamada original</TableHead>
                    <TableHead>Próximo seguimiento</TableHead>
                    <TableHead className="text-right">Total proyectado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Próxima acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seguimientos.map((s) => {
                    const ag = s.agenda_id ? agendaById.get(s.agenda_id) : null;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {ag ? (
                            <Link
                              href={`/closer/agendas/${ag.id}`}
                              className="hover:underline"
                            >
                              {ag.nombre}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.numero_seguimiento}°</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(s.fecha_llamada_original)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {s.fecha_proximo_seguimiento ? formatDate(s.fecha_proximo_seguimiento) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.total_cobrar_proyectado
                            ? formatCurrency(s.total_cobrar_proyectado, s.total_cobrar_proyectado_currency ?? "USD")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={segVariant[s.estado]} className="capitalize">
                            {s.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {s.proxima_accion ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {seguimientos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                        Sin seguimientos pendientes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
