import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GrillaReportesPage() {
  const [agendas, users] = await Promise.all([getAgendas(), getUsers()]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const reportadas = agendas.filter((a) => a.estado_llamada !== "pendiente");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Grilla de Reportes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {reportadas.length} llamadas reportadas
        </p>
      </header>

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
                  {userById.get(a.closer_asignado_id ?? "")?.nombre ?? "—"}
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
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
