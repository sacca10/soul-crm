import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Dev-only escape hatch: skip auth entirely so the app can be previewed
  // without Supabase Auth set up. Toggle via NEXT_PUBLIC_DEV_BYPASS_AUTH.
  if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true") {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLoginPage = path.startsWith("/login");
  const isWaitingPage = path.startsWith("/esperando-aprobacion");
  const isAuthCallback = path.startsWith("/auth/");
  const isApiRoute = path.startsWith("/api");

  // Sin user → forzar a /login (excepto rutas públicas)
  if (!user && !isLoginPage && !isApiRoute && !isAuthCallback) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con user en /login → mandarlo al panel (el layout chequea aprobado y redirige
  // a /esperando-aprobacion si corresponde)
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/direccion/general";
    return NextResponse.redirect(url);
  }

  // /esperando-aprobacion solo tiene sentido si estás logueado
  if (!user && isWaitingPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
