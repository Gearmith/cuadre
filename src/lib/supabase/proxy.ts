import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/**
 * Refresca la sesión de Supabase y escribe las cookies nuevas en `response`.
 * Devuelve si hay un usuario con sesión válida.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
): Promise<boolean> {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims?.sub);
}
