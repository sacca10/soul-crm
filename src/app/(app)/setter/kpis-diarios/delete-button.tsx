"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteKpiManualAction } from "./actions";

export function DeleteKpiButton({ id, fecha }: { id: string; fecha: string }) {
  return (
    <form
      action={deleteKpiManualAction}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar los KPIs del ${fecha}? No se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label="Eliminar"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </form>
  );
}
