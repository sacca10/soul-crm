import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCobro } from "@/lib/data/misc";
import { getAgenda } from "@/lib/data/agendas";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CobroDetailPage({ params }: { params: { id: string } }) {
  const cobro = await getCobro(params.id);
  if (!cobro) notFound();
  const agenda = cobro.agenda_id ? await getAgenda(cobro.agenda_id) : null;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link href="/cobros">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a cobros
          </Link>
        </Button>
        <header>
          <h1 className="text-3xl font-bold tracking-tight">
            Cuota {cobro.numero_cuota} de {cobro.total_cuotas}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cobro.programa_contratado} · {agenda?.nombre ?? "Cliente desconocido"}
          </p>
        </header>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalle</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <Field label="Monto" value={formatCurrency(cobro.monto_cobrar, cobro.monto_cobrar_currency)} />
          <Field label="Tipo de cuota" value={cobro.tipo_cuota} />
          <Field label="Vencimiento" value={formatDate(cobro.fecha_vencimiento)} />
          <Field
            label="Cobro real"
            value={cobro.fecha_cobro_real ? formatDate(cobro.fecha_cobro_real) : "—"}
          />
          <Field
            label="Estado"
            value={<Badge variant="outline">{cobro.estado}</Badge>}
          />
          <Field label="Billetera" value={cobro.billetera ?? "—"} />
          <Field
            label="Días atraso"
            value={
              cobro.dias_atraso > 0 ? (
                <span className="text-destructive">{cobro.dias_atraso} días</span>
              ) : (
                "—"
              )
            }
          />
          <Field label="Cliente" value={agenda?.nombre ?? "—"} />
          {cobro.aclaraciones && (
            <Field label="Aclaraciones" value={cobro.aclaraciones} full />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}
