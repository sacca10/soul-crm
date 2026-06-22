"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/forms/form-select";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import {
  refreshFxNowAction,
  setFxManualAction,
  updateFxStrategyAction,
  type ActionResult,
} from "./actions";

export function FxManualForm({ defaultValue }: { defaultValue?: number | null }) {
  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    setFxManualAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5 sm:max-w-[200px]">
          <Label htmlFor="usd_cripto">Cargar a mano (ej. dolarhoy)</Label>
          <Input
            id="usd_cripto"
            name="usd_cripto"
            type="number"
            step="0.01"
            min="0"
            placeholder="1524"
            defaultValue={defaultValue ?? ""}
          />
        </div>
        <ManualSaveButton />
      </div>
      {state && <FeedbackBanner state={state} />}
    </form>
  );
}

function ManualSaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="shrink-0">
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Fijar cotización
    </Button>
  );
}

export function FxStrategyForm({ defaultStrategy }: { defaultStrategy: string }) {
  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    updateFxStrategyAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2 md:max-w-sm">
        <Label htmlFor="fx_strategy">Estrategia activa</Label>
        <FormSelect
          id="fx_strategy"
          name="fx_strategy"
          defaultValue={defaultStrategy}
          options={[
            { value: "blue", label: "Dólar Blue (recomendado)" },
            { value: "mep", label: "Dólar MEP" },
            { value: "oficial", label: "Dólar Oficial" },
          ]}
        />
      </div>

      {state && (
        <FeedbackBanner state={state} />
      )}

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}

export function RefreshFxButton() {
  const [state, formAction] = useFormState<ActionResult | null, FormData>(
    refreshFxNowAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Las cotizaciones se actualizan automático todos los días a las 9 UTC (6
          AM ARG) vía Vercel Cron. También podés refrescarlas manualmente acá:
        </p>
        <RefreshButton />
      </div>
      {state && <FeedbackBanner state={state} />}
    </form>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar estrategia
    </Button>
  );
}

function RefreshButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending} className="shrink-0">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      Refrescar ahora
    </Button>
  );
}

function FeedbackBanner({ state }: { state: ActionResult }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
        state.success
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      }`}
    >
      {state.success ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{state.message}</span>
    </div>
  );
}
