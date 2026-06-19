import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "./logout-button";
import { Clock } from "lucide-react";

export default function EsperandoAprobacionPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(155,109,255,0.14)_0%,rgba(0,0,0,0)_60%)]"
        aria-hidden
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold tracking-[0.2em] text-gold-gradient">
              SOUL
            </h1>
          </div>

          <Card className="border-[hsl(var(--gold)/0.25)] bg-card/85 backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(155,109,255,0.08)]">
            <CardContent className="space-y-5 pt-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--gold)/0.15)]">
                <Clock className="h-7 w-7 text-[hsl(var(--gold-light))]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold">Esperando aprobación</h2>
                <p className="text-sm text-muted-foreground">
                  Tu cuenta fue creada correctamente. Un admin del equipo tiene que
                  aprobarte antes de poder acceder al panel.
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Vas a poder entrar apenas te aprueben — refresca esta página o
                  volvé a entrar más tarde.
                </p>
              </div>

              <LogoutButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
