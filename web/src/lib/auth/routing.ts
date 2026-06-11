export const loginPath = "/login";
export const homePath = "/";
export const signupPath = "/signup";
export const pendingPath = "/pending";
export const forgotPasswordPath = "/forgot-password";
export const resetPasswordPath = "/reset-password";

// 認証・承認の状態。middleware が getUser + profiles.status から決定する。
// - unauthenticated: 未ログイン
// - pending: ログイン済みだが未承認（profiles 行なし・取得失敗もこちらに倒す＝安全側）
// - disabled: 利用停止
// - approved: 利用可能（従来挙動）
export type AuthState = "unauthenticated" | "pending" | "disabled" | "approved";

// 未ログインでもアクセスできる公開パス。
// 完全一致（loginPath / signupPath / forgotPasswordPath）と、`/auth/` 配下のメールリンク処理ルートを許可する。
// reset-password は recovery セッション（ログイン済み）前提だが、unauthenticated で到達した場合は
// ページ側で /login へ案内するため、ここでは公開扱いにしない（unauthenticated は /login へ寄せる）。
export function isPublicPath(pathname: string): boolean {
  if (pathname === loginPath || pathname === signupPath || pathname === forgotPasswordPath) {
    return true;
  }

  return pathname === "/auth" || pathname.startsWith("/auth/");
}

// `/auth/` 配下はメール確認・パスワードリセットの処理ルートのため、
// pending/disabled でも到達を許す（承認待ち中の確認リンク等を壊さない）。
function isAuthRoute(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

// 状態 × パス から「リダイレクト先」を返す純関数。null はそのまま通す。
export function getAuthRedirectPath(pathname: string, state: AuthState): string | null {
  if (state === "unauthenticated") {
    return isPublicPath(pathname) ? null : loginPath;
  }

  if (state === "pending" || state === "disabled") {
    // recovery セッションでログイン状態の未承認ユーザーもパスワード再設定に到達できる必要があるため、
    // /reset-password は承認ゲート（/pending 固定）の例外にする。
    if (pathname === pendingPath || pathname === resetPasswordPath || isAuthRoute(pathname)) {
      return null;
    }
    // ログイン済みのため /login /signup へも入れず、データ画面も遮断して /pending に固定する。
    return pendingPath;
  }

  // approved: 認証画面・承認待ち画面からは本体へ離脱させる。
  // /reset-password は recovery セッション中のパスワード再設定に使うため、本体扱いで素通しする。
  if (pathname === loginPath || pathname === signupPath || pathname === pendingPath) {
    return homePath;
  }

  return null;
}
