import Link from "next/link";
import { getUsersByRol } from "@/lib/data/users";
import { getContenido } from "@/lib/data/misc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck } from "lucide-react";
import { NuevoLeadForm } from "./nuevo-lead-form";

export const dynamic = "force-dynamic";

export default async function NuevoLeadPage() {
  const [setters, contenido] = await Promise.all([
    getUsersByRol("setter"),
    getContenido(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link href="/setter/leads">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a leads
          </Link>
        </Button>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo lead</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Para registrar un lead nuevo que estás chateando por DM. Cargá lo
              básico — el contexto completo lo agregás cuando lo califiques.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/setter/leads/nuevo-agendado">
              <CalendarCheck className="mr-2 h-4 w-4" />
              ¿Ya se agendó? Cargá con contexto
            </Link>
          </Button>
        </div>
      </div>

      <NuevoLeadForm setters={setters} contenido={contenido} />
    </div>
  );
}
