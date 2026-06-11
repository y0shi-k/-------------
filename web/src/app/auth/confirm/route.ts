import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";
import { getPublicSupabaseEnv } from "@/lib/supabase/public-env";

// メール確認・パスワードリセットのリンク先。
// signup/email（確認）と recovery（TKT-0232 が利用）を共用で処理する。
// Supabase の verifyOtp が受ける EmailOtpType の部分集合（auth-js は transitive 依存のため直接 import しない）。
type AllowedOtpType = "signup" | "email" | "recovery";

const allowedOtpTypes: ReadonlyArray<AllowedOtpType> = ["signup", "email", "recovery"];

function isAllowedOtpType(value: string | null): value is AllowedOtpType {
  return value !== null && (allowedOtpTypes as ReadonlyArray<string>).includes(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const failureUrl = request.nextUrl.clone();
  failureUrl.pathname = "/login";
  failureUrl.search = "";
  failureUrl.searchParams.set("error", "auth_confirm_failed");

  if (!tokenHash || !isAllowedOtpType(type)) {
    return NextResponse.redirect(failureUrl);
  }

  const { url, anonKey } = getPublicSupabaseEnv();
  const cookieStore = await cookies();
  // sanitizeNextPath が先頭 `/`（かつ `//` 拒否）を保証するため same-origin に閉じる。
  // pathname への代入だとクエリ付き next の `?` がエンコードされるため URL で解決する。
  const successUrl = new URL(nextPath, request.nextUrl.origin);

  let response = NextResponse.redirect(successUrl);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash
  });

  if (error) {
    response = NextResponse.redirect(failureUrl);
    return response;
  }

  return response;
}
