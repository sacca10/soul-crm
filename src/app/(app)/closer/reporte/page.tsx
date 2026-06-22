import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms/form-select";
import { ObjecionPicker } from "@/components/forms/objecion-picker";
import { getAgendas } from "@/lib/data/agendas";
import { getBilleteras, getProgramas } from "@/lib/data/catalogs";
import { formatDate } from "@/lib/utils";
import { submitReporteAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReporteLlamadaPage({
  searchParams,
}: {
  searchParams: { agenda?: string };
}) {
  const [agendas, billeteras, programas] = await Promise.all([
    getAgendas(),
    getBilleteras(),
    getProgramas(),
  ]);
  const pendientes = agendas.filter((a) => a.estado_llamada === "pendiente" || !a.resultado);
  const preselected = searchParams.agenda ?? "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Reporte de Llamadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Llená esto después de cada llamada. La data alimenta dashboards y comisiones.
        </p>
      </header>

      <form action={submitReporteAction} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la llamada</CardTitle>
            <CardDescription>
              Seleccioná la agenda correspondiente y completá el resultado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="agenda_id">Agenda *</Label>
                <FormSelect
                  id="agenda_id"
                  name="agenda_id"
                  required
                  defaultValue={preselected || undefined}
                  placeholder="— Elegir agenda —"
                  options={pendientes.map((a) => ({
                    value: a.id,
                    label: `${a.nombre} · ${formatDate(a.fecha_hora_llamada)}`,
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado_llamada">¿Se presentó? *</Label>
                <FormSelect
                  id="estado_llamada"
                  name="estado_llamada"
                  required
                  defaultValue="asistio"
                  options={[
                    { value: "asistio", label: "Asistió" },
                    { value: "no_show", label: "No se presentó" },
                    { value: "reagendada", label: "Reagendada" },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resultado">Resultado</Label>
                <FormSelect
                  id="resultado"
                  name="resultado"
                  placeholder="— Sin resultado —"
                  options={[
                    { value: "cerrado", label: "Cerrado" },
                    { value: "no_cerrado", label: "No cerrado" },
                    { value: "seguimiento", label: "Seguimiento" },
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="programa_ofrecido">Programa ofrecido</Label>
                <FormSelect
                  id="programa_ofrecido"
                  name="programa_ofrecido"
                  placeholder="— Elegir —"
                  options={programas.map((p) => ({ value: p, label: p }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_cierre">Forma de cierre</Label>
                <FormSelect
                  id="forma_cierre"
                  name="forma_cierre"
                  placeholder="—"
                  options={[
                    { value: "PIF", label: "Pago completo (PIF)" },
                    { value: "cuotas", label: "Cuotas" },
                    { value: "sena_saldo", label: "Seña + saldo" },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <FormSelect
                  id="currency"
                  name="currency"
                  defaultValue="USD"
                  options={[
                    { value: "USD", label: "USD" },
                    { value: "ARS", label: "ARS" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monto_facturado">Monto facturado</Label>
                <Input
                  id="monto_facturado"
                  name="monto_facturado"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="3000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monto_upfront">Monto upfront</Label>
                <Input
                  id="monto_upfront"
                  name="monto_upfront"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cash_collected">Cash collected</Label>
                <Input
                  id="cash_collected"
                  name="cash_collected"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billetera">Billetera / medio</Label>
                <FormSelect
                  id="billetera"
                  name="billetera"
                  placeholder="—"
                  options={billeteras.map((b) => ({ value: b, label: b }))}
                />
              </div>
              <div className="flex items-end gap-2">
                <input id="pago_en_cuotas" name="pago_en_cuotas" type="checkbox" className="h-4 w-4 accent-[hsl(var(--gold))]" />
                <Label htmlFor="pago_en_cuotas" className="cursor-pointer">
                  Pago en cuotas
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte de la llamada</CardTitle>
            <CardDescription>
              Lo central del reporte: dolores, razones de compra, objeciones y frases
              clave del lead. Completá lo que aplique.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Situación actual */}
            <div className="space-y-2">
              <Label htmlFor="situacion_actual">Situación actual</Label>
              <Textarea
                id="situacion_actual"
                name="situacion_actual"
                rows={3}
                placeholder="En qué situación está hoy el lead…"
              />
            </div>

            {/* Dolores */}
            <div className="space-y-2">
              <Label htmlFor="dolores">Dolores</Label>
              <Textarea
                id="dolores"
                name="dolores"
                rows={3}
                placeholder="Qué problemas / dolores expresó el lead…"
              />
            </div>

            {/* Razones de compra */}
            <div className="space-y-2">
              <Label htmlFor="razon_compra">Razones de compra</Label>
              <Textarea
                id="razon_compra"
                name="razon_compra"
                rows={3}
                placeholder="Qué lo motiva a avanzar / por qué compraría…"
              />
            </div>

            {/* Objeciones */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="objecion_principal">Objeción principal</Label>
                <ObjecionPicker />
              </div>
              <div className="space-y-2">
                <Label htmlFor="objecion_secundaria">Objeción secundaria (opcional)</Label>
                <Input
                  id="objecion_secundaria"
                  name="objecion_secundaria"
                  placeholder="Otra objeción que mencionó…"
                />
              </div>
            </div>

            {/* Frases clave */}
            <div className="space-y-2">
              <Label htmlFor="frases_clave">Frases clave del lead</Label>
              <Textarea
                id="frases_clave"
                name="frases_clave"
                rows={3}
                placeholder="Frases textuales que dijo y conviene recordar…"
              />
            </div>

            {/* Cierre / seguimiento */}
            <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="motivo_no_cierre">Motivo de no cierre (si aplica)</Label>
                <Textarea
                  id="motivo_no_cierre"
                  name="motivo_no_cierre"
                  rows={2}
                  placeholder="Por qué no cerró la venta…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proximo_seguimiento">Próximo seguimiento (fecha)</Label>
                <Input id="proximo_seguimiento" name="proximo_seguimiento" type="date" />
                <p className="text-xs text-muted-foreground">
                  Si elegiste resultado &quot;Seguimiento&quot;, completá esto.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seguimiento_estado">Estado del seguimiento</Label>
                <FormSelect
                  id="seguimiento_estado"
                  name="seguimiento_estado"
                  defaultValue="tibio"
                  options={[
                    { value: "caliente", label: "Caliente" },
                    { value: "tibio", label: "Tibio" },
                    { value: "frio", label: "Frío" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_cobrar_proyectado">Total proyectado a cobrar</Label>
                <Input
                  id="total_cobrar_proyectado"
                  name="total_cobrar_proyectado"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="3000"
                />
                <p className="text-xs text-muted-foreground">
                  Solo si vas a seguir trabajándolo. Suma al &quot;dinero estancado&quot;.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proxima_accion">Próxima acción concreta</Label>
                <Input
                  id="proxima_accion"
                  name="proxima_accion"
                  placeholder="Ej: mandar audio, llamarlo el mié, mandar testimonio"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="feedback_notas">Feedback / notas generales</Label>
                <Textarea
                  id="feedback_notas"
                  name="feedback_notas"
                  rows={4}
                  placeholder="Resumen de la llamada, lo que pasó, etc."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit">Guardar reporte</Button>
        </div>
      </form>
    </div>
  );
}
