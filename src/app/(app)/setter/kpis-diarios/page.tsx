import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getKpisManual } from "@/lib/data/misc";
import { formatDate } from "@/lib/utils";
import { Edit } from "lucide-react";
import { DeleteKpiButton } from "./delete-button";
import { KpiForm } from "./kpi-form";

export const dynamic = "force-dynamic";

export default async function KpisDiariosPage({
  searchParams,
}: {
  searchParams: { edit?: string };
}) {
  const kpis = await getKpisManual();
  const editing = searchParams.edit
    ? kpis.find((k) => k.id === searchParams.edit) ?? null
    : null;

  // Fecha de hoy en zona horaria Argentina (no UTC) para evitar que a partir
  // de las 21hs se tome la fecha de mañana.
  const todayStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const todayKpi = !editing ? (kpis.find((k) => k.fecha === todayStr) ?? null) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">KPIs diarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cargá a mano los números del día — chats, conversaciones, VSL y agendas — sin
          depender de que el estado de cada lead esté completo.
        </p>
      </header>

      <KpiForm editing={editing} todayKpi={todayKpi} todayStr={todayStr} />

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>{kpis.length} días registrados</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Chats únicos</TableHead>
                <TableHead className="text-right">Conversaciones</TableHead>
                <TableHead className="text-right">VSL Enviados</TableHead>
                <TableHead className="text-right">Calendarios Enviados</TableHead>
                <TableHead className="text-right">Agendas</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.slice(0, 30).map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{formatDate(k.fecha)}</TableCell>
                  <TableCell className="text-right">{k.chats_unicos_abiertos}</TableCell>
                  <TableCell className="text-right">{k.conversaciones}</TableCell>
                  <TableCell className="text-right">{k.enviamos_vsl}</TableCell>
                  <TableCell className="text-right">{k.calendarios_enviados ?? 0}</TableCell>
                  <TableCell className="text-right">{k.agendas_manual}</TableCell>
                  <TableCell className="text-muted-foreground">{k.notas ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 w-7 p-0"
                        aria-label="Editar"
                      >
                        <Link href={`/setter/kpis-diarios?edit=${k.id}`}>
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <DeleteKpiButton id={k.id} fecha={k.fecha} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {kpis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    Todavía no hay KPIs registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
