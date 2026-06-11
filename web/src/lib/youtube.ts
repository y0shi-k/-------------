/**
 * YouTube URL ユーティリティ
 *
 * YouTube URL から videoId を安全に抽出する純関数群。
 * React 非依存・副作用なし。
 */

/** 許可する YouTube ホスト名の完全一致リスト */
const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "music.youtube.com",
]);

/** videoId として有効なパターン（11文字の英数字・アンダースコア・ハイフン） */
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * 文字列から videoId 候補を取り出すヘルパー。
 * 候補が VIDEO_ID_RE を満たさない場合は null を返す。
 */
function validateId(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  return VIDEO_ID_RE.test(candidate) ? candidate : null;
}

/**
 * YouTube URL 1行から videoId を抽出する。
 *
 * 対応形式:
 * - watch?v=<id>（クエリ順不同）
 * - youtu.be/<id>
 * - shorts/<id>
 * - embed/<id>
 *
 * ホストは ALLOWED_HOSTS のみ許容。
 * videoId が [A-Za-z0-9_-]{11} でなければ null を返す。
 */
export function extractYoutubeVideoId(text: string): string | null {
  if (!text) return null;

  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }

  if (!ALLOWED_HOSTS.has(url.hostname)) return null;

  // watch?v=<id>
  if (url.pathname === "/watch" || url.pathname.startsWith("/watch?")) {
    return validateId(url.searchParams.get("v"));
  }

  // youtu.be/<id>
  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return validateId(id);
  }

  // shorts/<id> または embed/<id>
  const pathMatch = url.pathname.match(/^\/(?:shorts|embed)\/([^/?#]+)/);
  if (pathMatch) {
    return validateId(pathMatch[1]);
  }

  return null;
}

/**
 * 改行区切りの複数行テキスト（recipes.source 形式）から
 * 最初に videoId が取れた行の videoId を返す。
 * 一行も videoId を含まない場合は null を返す。
 */
export function findFirstYoutubeVideoId(text: string): string | null {
  if (!text) return null;
  for (const line of text.split("\n")) {
    const id = extractYoutubeVideoId(line.trim());
    if (id !== null) return id;
  }
  return null;
}
