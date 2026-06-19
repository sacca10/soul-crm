import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createCtaAction } from "../../actions";

export default function NuevoCtaPage() {
  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link href="/marketing">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a marketing
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo punto de contacto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Creá un identificador único para una pieza de contenido (reel, historia, ad, video, etc.)
        </p>
      </div>

      <form action={createCtaAction}>
        <Card>
          <CardHeader>
            <CardTitle>Datos del CTA</CardTitle>
            <CardDescription>El CTA ID se usa para taggear los leads en ManyChat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cta_id">CTA ID *</Label>
                <Input
                  id="cta_id"
                  name="cta_id"
                  required
                  placeholder="CTA_PRUEBA_15ENERO"
                  pattern="[A-Za-z0-9_]+"
                  title="Solo letras, números y guión bajo"
                />
                <p className="text-xs text-muted-foreground">
                  Se convertirá a mayúsculas. Sin espacios.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nombre">Nombre descriptivo *</Label>
                <Input id="nombre" name="nombre" required placeholder="Reel framework de prospección" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plataforma">Plataforma</Label>
                <select
                  id="plataforma"
                  name="plataforma"
                  defaultValue="instagram"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="ads">ADS</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_publicacion">Fecha publicación</Label>
                <Input
                  id="fecha_publicacion"
                  name="fecha_publicacion"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="url">URL (opcional)</Label>
                <Input
                  id="url"
                  name="url"
                  type="text"
                  placeholder="Opcional. Si es una historia o no tiene URL pública, dejalo vacío."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chats_unicos_abiertos">Chats únicos abiertos</Label>
                <Input
                  id="chats_unicos_abiertos"
                  name="chats_unicos_abiertos"
                  type="number"
                  min="0"
                  defaultValue="0"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  DMs únicos que se abrieron desde esta pieza
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversaciones">Conversaciones</Label>
                <Input
                  id="conversaciones"
                  name="conversaciones"
                  type="number"
                  min="0"
                  defaultValue="0"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Conversaciones generadas atribuibles a esta pieza
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" name="descripcion" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" asChild>
                <Link href="/marketing">Cancelar</Link>
              </Button>
              <Button type="submit">Crear CTA</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
