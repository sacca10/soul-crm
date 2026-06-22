import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getPendingUsers, getUsers } from "@/lib/data/users";
import { getBilleteras, getProgramas } from "@/lib/data/catalogs";
import { getLatestFxRate } from "@/lib/fx";
import { RefreshFxButton } from "./fx-form";
import { formatDate } from "@/lib/utils";
import {
  addBilleteraAction,
  addProgramaAction,
  approveUserAction,
  createUserAction,
  deleteBilleteraAction,
  deleteProgramaAction,
  deleteUserAction,
  rejectUserAction,
  renameBilleteraAction,
  renameProgramaAction,
  updateUserAction,
} from "./actions";
import { Trash2, Plus, Save, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AjustesPage() {
  const [users, pending, billeteras, programas, latestFx] =
    await Promise.all([
      getUsers(),
      getPendingUsers(),
      getBilleteras(),
      getProgramas(),
      getLatestFxRate(),
    ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Equipo, catálogos y configuración
        </p>
      </header>

      <Tabs defaultValue={pending.length > 0 ? "solicitudes" : "equipo"}>
        <TabsList>
          <TabsTrigger value="solicitudes" className="relative">
            Solicitudes
            {pending.length > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--gold))] px-1.5 text-[10px] font-bold text-[hsl(var(--primary-foreground))]">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="billeteras">Billeteras</TabsTrigger>
          <TabsTrigger value="programas">Programas</TabsTrigger>
          <TabsTrigger value="fx">Cotizaciones FX</TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* SOLICITUDES PENDIENTES                                            */}
        {/* ================================================================ */}
        <TabsContent value="solicitudes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de acceso</CardTitle>
              <CardDescription>
                Los usuarios que se registran (email/password o Google) entran como
                pendientes. Tenés que aprobarlos para que puedan acceder al panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <Clock className="h-8 w-8 text-muted-foreground/40" />
                  <div>No hay solicitudes pendientes.</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol asignado</TableHead>
                      <TableHead className="w-48 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nombre}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {u.rol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <form action={approveUserAction}>
                              <input type="hidden" name="id" value={u.id} />
                              <Button type="submit" size="sm">
                                <Check className="mr-1 h-4 w-4" />
                                Aprobar
                              </Button>
                            </form>
                            <form action={rejectUserAction}>
                              <input type="hidden" name="id" value={u.id} />
                              <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <X className="mr-1 h-4 w-4" />
                                Rechazar
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* EQUIPO                                                            */}
        {/* ================================================================ */}
        <TabsContent value="equipo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agregar miembro</CardTitle>
              <CardDescription>Nuevo integrante del equipo</CardDescription>
            </CardHeader>
            <form action={createUserAction}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" name="nombre" required placeholder="Ana Setter" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="ana@empresa.com" />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="rol">Rol</Label>
                    <select
                      id="rol"
                      name="rol"
                      defaultValue="setter"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="setter">Setter</option>
                      <option value="closer">Closer</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">
                    <Plus className="mr-2 h-4 w-4" /> Agregar
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Miembros del equipo</CardTitle>
              <CardDescription>{users.length} usuarios · editar inline o eliminar</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead className="w-32 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <form action={updateUserAction} id={`f-user-${u.id}`}>
                          <input type="hidden" name="id" value={u.id} />
                          <Input
                            name="nombre"
                            defaultValue={u.nombre}
                            form={`f-user-${u.id}`}
                            className="h-8 max-w-[200px]"
                          />
                        </form>
                      </TableCell>
                      <TableCell>
                        <Input
                          name="email"
                          type="email"
                          defaultValue={u.email}
                          form={`f-user-${u.id}`}
                          className="h-8 max-w-[240px]"
                        />
                      </TableCell>
                      <TableCell>
                        <select
                          name="rol"
                          defaultValue={u.rol}
                          form={`f-user-${u.id}`}
                          className="flex h-8 w-32 rounded-md border border-input bg-background px-2 text-sm"
                        >
                          <option value="admin">Admin</option>
                          <option value="setter">Setter</option>
                          <option value="closer">Closer</option>
                          <option value="marketing">Marketing</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <input
                          type="checkbox"
                          name="activo"
                          defaultChecked={u.activo}
                          form={`f-user-${u.id}`}
                          className="h-4 w-4"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="submit"
                            form={`f-user-${u.id}`}
                            size="icon"
                            variant="ghost"
                            aria-label="Guardar"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <form action={deleteUserAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <Button
                              type="submit"
                              size="icon"
                              variant="ghost"
                              aria-label="Eliminar"
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* BILLETERAS                                                        */}
        {/* ================================================================ */}
        <TabsContent value="billeteras" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de pago / billeteras</CardTitle>
              <CardDescription>
                Estos aparecen como opciones al cargar un reporte de llamada o un gasto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={addBilleteraAction} className="flex gap-2">
                <Input name="nombre" placeholder="Ej: Binance Pay" required className="max-w-sm" />
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </form>

              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-32 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billeteras.map((b) => (
                      <TableRow key={b}>
                        <TableCell>
                          <form action={renameBilleteraAction} id={`f-bil-${b}`} className="flex gap-2">
                            <input type="hidden" name="viejo" value={b} />
                            <Input name="nuevo" defaultValue={b} className="h-8 max-w-sm" />
                          </form>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="submit"
                              form={`f-bil-${b}`}
                              size="icon"
                              variant="ghost"
                              aria-label="Guardar"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <form action={deleteBilleteraAction}>
                              <input type="hidden" name="nombre" value={b} />
                              <Button
                                type="submit"
                                size="icon"
                                variant="ghost"
                                aria-label="Eliminar"
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {billeteras.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                          Sin billeteras configuradas.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* PROGRAMAS                                                         */}
        {/* ================================================================ */}
        <TabsContent value="programas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Programas / productos</CardTitle>
              <CardDescription>
                Los programas que vendés. Aparecen al cargar el reporte de llamada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={addProgramaAction} className="flex gap-2">
                <Input name="nombre" placeholder="Ej: Programa Élite" required className="max-w-sm" />
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" /> Agregar
                </Button>
              </form>

              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="w-32 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programas.map((p) => (
                      <TableRow key={p}>
                        <TableCell>
                          <form action={renameProgramaAction} id={`f-prog-${p}`} className="flex gap-2">
                            <input type="hidden" name="viejo" value={p} />
                            <Input name="nuevo" defaultValue={p} className="h-8 max-w-sm" />
                          </form>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="submit"
                              form={`f-prog-${p}`}
                              size="icon"
                              variant="ghost"
                              aria-label="Guardar"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <form action={deleteProgramaAction}>
                              <input type="hidden" name="nombre" value={p} />
                              <Button
                                type="submit"
                                size="icon"
                                variant="ghost"
                                aria-label="Eliminar"
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {programas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="py-6 text-center text-sm text-muted-foreground">
                          Sin programas configurados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* FX                                                                */}
        {/* ================================================================ */}
        <TabsContent value="fx" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cotización Dólar Cripto</CardTitle>
              <CardDescription>
                Todos los montos en ARS se convierten a USD usando el dólar cripto.
                Datos en vivo desde dolarapi.com.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestFx ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:max-w-xs">
                    <FxRateCard
                      label="Dólar Cripto"
                      value={latestFx.usd_cripto}
                      active
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Última actualización: {formatDate(latestFx.fecha)}
                    {latestFx.actualizado_at && (
                      <>
                        {" "}
                        ·{" "}
                        {new Date(latestFx.actualizado_at).toLocaleTimeString(
                          "es-AR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Todavía no hay cotizaciones registradas. Apretá &quot;Refrescar ahora&quot;
                  para traer la del día desde dolarapi.com.
                </div>
              )}
              <RefreshFxButton />
              <p className="text-xs text-muted-foreground">
                La cotización del dólar cripto se toma automáticamente de
                criptoya.com (mismo valor que dolarhoy) y se actualiza todos los
                días. Podés forzar la actualización con &quot;Refrescar ahora&quot;.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FxRateCard({
  label,
  value,
  active,
}: {
  label: string;
  value: number | null;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3 transition-colors",
        active
          ? "border-[hsl(var(--gold)/0.6)] bg-[hsl(var(--gold)/0.1)]"
          : "border-border bg-card/40",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {active && (
          <span className="rounded bg-[hsl(var(--gold)/0.2)] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--gold-light))]">
            Activa
          </span>
        )}
      </div>
      <div className="mt-1 text-xl font-bold tracking-tight">
        {value ? `$${value.toFixed(2)}` : "—"}
      </div>
    </div>
  );
}
