import "server-only";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Helper para obtener un cliente Supabase tipado libremente para las
 * funciones del data layer. Cuando regeneres los types con `npx supabase
 * gen types typescript` podés tipar más estrictamente.
 */
export function sb() {
  return createServerSupabaseClient();
}

/**
 * Lanza el error de Supabase de forma consistente si la query falló.
 */
export function throwIfError<T extends { error: { message: string } | null }>(
  res: T,
  context: string,
): T {
  if (res.error) {
    throw new Error(`[supabase:${context}] ${res.error.message}`);
  }
  return res;
}
