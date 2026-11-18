import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18n = createIntlMiddleware(routing);

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/setup"];

function stripLocale(pathname: string) {
  const [, maybeLocale, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(maybeLocale)) {
    return { locale: maybeLocale, path: "/" + rest.join("/") };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

export async function proxy(request: NextRequest) {
  const response = handleI18n(request);

  // Si next-intl redirige (p. ej. "/" → "/es"), no hace falta nada más.
  if (response.headers.get("location")) return response;

  const { locale, path } = stripLocale(request.nextUrl.pathname);

  if (!isSupabaseConfigured) {
    if (path === "/setup") return response;
    return NextResponse.redirect(new URL(`/${locale}/setup`, request.url));
  }

  const isLoggedIn = await updateSession(request, response);
  const isPublic = PUBLIC_PATHS.some((p) => path === p);

  const redirectTo = (target: string) => {
    const redirect = NextResponse.redirect(new URL(`/${locale}${target}`, request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  };

  if (!isLoggedIn && !isPublic && path !== "/reset-password") {
    return redirectTo("/login");
  }
  if (isLoggedIn && isPublic) {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  // Todo menos archivos estáticos, la API interna de Next y el callback de auth.
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
