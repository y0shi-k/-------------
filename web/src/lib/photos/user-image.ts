/**
 * ユーザー登録画像（レシピ・食材）の表示用ユーティリティ。
 *
 * 画像本体は非公開バケット `photos` に置き、DB には Storage path だけを保存する（公開URLは保存しない）。
 * 表示時はこのヘルパーで短時間だけ有効な署名付きURLを発行する。
 * 実際のアップロードUI・差し替え時の旧オブジェクト削除は後続チケット（TKT-0174 / TKT-0176）で実装する。
 */

/** ユーザー画像を置く非公開バケット（料理記録・食材スキャン写真と共用）。 */
export const PHOTOS_BUCKET = "photos";

/** 署名付きURLの既定有効期限（秒）。短時間だけ有効にする。 */
export const USER_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 30;

/** createSignedUrl だけに依存する最小インターフェース（テスト容易・クライアント実装に非依存）。 */
export type SignedUrlCapableClient = {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (path: string, expiresIn: number) => Promise<{ data: { signedUrl: string } | null }>;
    };
  };
};

/**
 * Storage path から署名付きURLを発行する。path が空なら null（画像なし＝プレースホルダ表示）。
 * 失敗時も例外を投げずに null を返し、呼び出し側はフォールバック表示にできる。
 */
export async function createUserImageSignedUrl(
  client: SignedUrlCapableClient,
  storagePath: string | null | undefined,
  expiresInSeconds: number = USER_IMAGE_SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  if (!storagePath) {
    return null;
  }

  try {
    const { data } = await client.storage.from(PHOTOS_BUCKET).createSignedUrl(storagePath, expiresInSeconds);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
