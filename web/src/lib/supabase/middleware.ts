import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthRedirectPath } from "@/lib/auth/routing";
import { getPublicSupabaseEnv } from "@/lib/supabase/public-env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });
  const { url, anonKey } = getPublicSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const redirectPath = getAuthRedirectPath(request.nextUrl.pathname, Boolean(user));

  if (!redirectPath) {
    return response;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = redirectPath;
  redirectUrl.search = "";

  return NextResponse.redirect(redirectUrl);
}
