import Link from "next/link";
import { getLeads } from "@/lib/data/leads";
import { getUsers } from "@/lib/data/users";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClickableRow } from "@/components/leads/clickable-row";
import { EstadoBadge, FuenteBadge } from "@/components/leads/estado-badge";
import { FUENTE_LABEL } from "@/lib/domain";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/forms/date-range-picker";
import { parseDateRange } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { q?: string; from?: string; to?: string; month?: string };
}) {
  const range = parseDateRange(searchParams);
  const leads = await getLeads({ search: searchParams.q, range });
  const users = await getUsers();
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length} leads en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker />
          <form className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Buscar por nombre, IG o email…"
              defaultValue={searchParams.q ?? ""}
              className="w-72 pl-9"
            />
          </form>
          <Button asChild>
            <Link href="/setter/leads/nuevo">
              <Plus className="mr-2 h-4 w-4" /> Nuevo lead
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Setter</TableHead>
              <TableHead>Ingreso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.slice(0, 100).map((l) => (
              <ClickableRow key={l.id} href={`/setter/leads/${l.id}`}>
                <TableCell className="font-medium">{l.nombre}</TableCell>
                <TableCell className="text-muted-foreground">
                  {l.instagram_username ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{l.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{l.telefono ?? "—"}</TableCell>
                <TableCell>
                  <EstadoBadge estado={l.estado_pipeline} />
                </TableCell>
                <TableCell>
                  <FuenteBadge fuente={FUENTE_LABEL[l.fuente]} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {userById.get(l.assigned_setter_id ?? "")?.nombre ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(l.fecha_ingreso).toLocaleDateString("es-AR")}
                </TableCell>
              </ClickableRow>
            ))}
          </TableBody>
        </Table>
        {leads.length > 100 && (
          <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
            Mostrando los primeros 100 de {leads.length}
          </div>
        )}
      </Card>
    </div>
  );
}
