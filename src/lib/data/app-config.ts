import "server-only";
import { isMockMode, store } from "./store";
import { sb, throwIfError } from "./_supabase";
import type { AppConfig } from "@/lib/domain";

export async function getAppConfig(): Promise<AppConfig> {
  if (isMockMode()) {
    return { ...store.appConfig };
  }
  const res = await sb()
    .from("app_config")
    .select("google_calendar_url, fx_strategy")
    .eq("id", 1)
    .maybeSingle();
  return (res.data as AppConfig | null) ?? { google_calendar_url: null, fx_strategy: "blue" };
}

export async function updateAppConfig(patch: Partial<AppConfig>): Promise<void> {
  if (isMockMode()) {
    Object.assign(store.appConfig, patch);
    return;
  }
  throwIfError(
    await sb()
      .from("app_config")
      .upsert({ id: 1, ...patch, updated_at: new Date().toISOString() }),
    "appConfig.updateAppConfig",
  );
}

/**
 * Acepta tanto una URL directa como un iframe completo
 * (`<iframe src="..."></iframe>`). Extrae el src si es iframe.
 */
export function normalizeCalendarInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/src=["']([^"']+)["']/);
  if (match) return match[1];
  return trimmed;
}
