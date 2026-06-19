"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-12">
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/15 p-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-destructive">
                Algo se rompió en esta página
              </h2>
              <p className="text-xs text-muted-foreground">
                Error capturado por el error boundary
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-destructive/30 bg-background/50 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Mensaje
            </div>
            <p className="font-mono text-sm text-foreground">{error.message}</p>
            {error.digest && (
              <>
                <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Digest (para correlacionar con Vercel logs)
                </div>
                <p className="font-mono text-xs text-muted-foreground">
                  {error.digest}
                </p>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              Volver
            </Button>
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
