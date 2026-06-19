import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de Supabase Auth (Google OAuth y otros providers).
 * Recibe el `code` por query string, lo intercambia por una sesión y
 * redirige al panel. El layout chequea si el user está aprobado y, si no,
 * lo manda a /esperando-aprobacion.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam) {
    const url = new URL(`${origin}/login`);
    url.searchParams.set("error", errorDescription ?? errorParam);
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = new URL(`${origin}/login`);
      url.searchParams.set("error", error.message);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.redirect(`${origin}/direccion/general`);
}
