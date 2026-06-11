export const defaultNextPath = "/";

/**
 * メール確認リンクからの redirect 先（`next` クエリ）をサニタイズする。
 * オープンリダイレクト防止のため、相対パス（先頭が `/`）のみ許可し、
 * `//` や `/\` で始まるプロトコル相対URLは拒否する。許可外は既定値へフォールバックする。
 */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next) {
    return defaultNextPath;
  }

  // 先頭が `/` でないものは絶対URL・相対参照とみなし拒否。
  if (!next.startsWith("/")) {
    return defaultNextPath;
  }

  // `//host` や `/\host` はプロトコル相対URLとして外部へ飛びうるため拒否。
  if (next.startsWith("//") || next.startsWith("/\\")) {
    return defaultNextPath;
  }

  return next;
}
