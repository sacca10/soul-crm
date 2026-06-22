import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAgendas } from "@/lib/data/agendas";
import { getUsers } from "@/lib/data/users";
import { formatCurrency, formatDate, formatRangeLabel, parseDateRange } from "@/lib/utils";
import { DateRangePicker } from "@/components/forms/date-range-picker";
import type { Agenda } from "@/lib/domain";

export const dynamic = "force-dynamic";

const OBJECION_LABEL: Record<string, string> = {
  precio: "Precio",
  timing: "Timing",
  pareja: "Pareja",
  confianza: "Confianza",
  decision: "Decisión",
  otro: "Otro",
};

function objecionTexto(a: Agenda): string {
  const parts: string[] = [];
  if (a.objecion_principal) {
    parts.push(
      a.objecion_principal === "otro" && a.objecion_principal_otro
        ? a.objecion_principal_otro
        : OBJECION_LABEL[a.objecion_principal] ?? a.objecion_principal,
    );
  }
  if (a.objecion_secundaria) parts.push(a.objecion_secundaria);
  return parts.join(" · ");
}

export default async function GrillaReportesPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; month?: string };
}) {
  const range = parseDateRange(searchParams);
  const [agendas, users] = await Promise.all([getAgendas(), getUsers()]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const closerName = (id?: string | null) => userById.get(id ?? "")?.nombre ?? "—";

  const inRange = (iso: string) => {
    if (!range) return true;
    const t = new Date(iso).getTime();
    return t >= range.desde.getTime() && t <= range.hasta.getTime();
  };

  const reportadas = agendas
    .filter((a) => a.estado_llamada !== "pendiente" && inRange(a.fecha_hora_llamada))
    .sort(
      (a, b) =>
        new Date(b.fecha_hora_llamada).getTime() -
        new Date(a.fecha_hora_llamada).getTime(),
    );

  const buildItems = (pick: (a: Agenda) => string | null | undefined) =>
    reportadas
      .map((a) => ({
        id: a.id,
        nombre: a.nombre,
        closer: closerName(a.closer_asignado_id),
        fecha: a.fecha_hora_llamada,
        texto: (pick(a) ?? "").trim(),
      }))
      .filter((x) => x.texto.length > 0);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grilla de Reportes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {reportadas.length} llamadas reportadas · {formatRangeLabel(range)}
          </p>
        </div>
        <DateRangePicker />
      </header>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="situacion">Situación actual</TabsTrigger>
          <TabsTrigger value="dolores">Dolores</TabsTrigger>
          <TabsTrigger value="razones">Razones de compra</TabsTrigger>
          <TabsTrigger value="objeciones">Objeciones</TabsTrigger>
          <TabsTrigger value="frases">Frases clave</TabsTrigger>
        </TabsList>

        {/* Resumen — tabla de plata/resultado */}
        <TabsContent value="resumen">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>Fecha llamada</TableHead>
                  <TableHead>Asistencia</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Cash collected</TableHead>
                  <TableHead>Billetera</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportadas.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <Link href={`/closer/agendas/${a.id}`} className="hover:underline">
                        {a.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {closerName(a.closer_asignado_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(a.fecha_hora_llamada)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          a.estado_llamada === "asistio"
                            ? "success"
                            : a.estado_llamada === "no_show"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {a.estado_llamada === "asistio"
                          ? "Asistió"
                          : a.estado_llamada === "no_show"
                          ? "No se presentó"
                          : "Reagendada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.resultado ? (
                        <Badge
                          variant={
                            a.resultado === "cerrado"
                              ? "success"
                              : a.resultado === "seguimiento"
                              ? "warning"
                              : "outline"
                          }
                        >
                          {a.resultado}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
                    <TableCell>
                      {a.billetera ? (
                        <Badge variant="outline">{a.billetera}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {reportadas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No hay reportes en este período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="situacion">
          <QualTable items={buildItems((a) => a.situacion_actual)} />
        </TabsContent>
        <TabsContent value="dolores">
          <QualTable items={buildItems((a) => a.dolores)} />
        </TabsContent>
        <TabsContent value="razones">
          <QualTable items={buildItems((a) => a.razon_compra)} />
        </TabsContent>
        <TabsContent value="objeciones">
          <QualTable items={buildItems(objecionTexto)} />
        </TabsContent>
        <TabsContent value="frases">
          <QualTable items={buildItems((a) => a.frases_clave)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QualTable({
  items,
}: {
  items: Array<{ id: string; nombre: string; closer: string; fecha: string; texto: string }>;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <div className="py-10 text-center text-sm text-muted-foreground">
          Sin datos cargados en este período.
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-44">Lead</TableHead>
            <TableHead className="w-36">Closer</TableHead>
            <TableHead className="w-32">Fecha</TableHead>
            <TableHead>Detalle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((x) => (
            <TableRow key={x.id}>
              <TableCell className="font-medium align-top">
                <Link href={`/closer/agendas/${x.id}`} className="hover:underline">
                  {x.nombre}
                </Link>
              </TableCell>
              <TableCell className="align-top text-muted-foreground">{x.closer}</TableCell>
              <TableCell className="align-top text-muted-foreground">
                {formatDate(x.fecha)}
              </TableCell>
              <TableCell className="whitespace-pre-wrap align-top">{x.texto}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
