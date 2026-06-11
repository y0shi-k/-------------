/**
 * ユーザー定義の同義語辞書（localStorage IO）。
 *
 * localStorage キー: stock-master:user-synonym-groups:v1
 * フォーマット: JSON 配列 `string[][]`
 *   例: [["かしわ","鶏肉"],["万願寺とうがらし","万願寺"]]
 *
 * stock-card-background.ts と同パターン（SSR-safe・try/catch）。
 */

import { setUserSynonymGroups } from "@/lib/ingredients/name-match";

const STORAGE_KEY = "stock-master:user-synonym-groups:v1";

/** 区切り文字の正規表現（「＝」「=」「、」「,」） */
const DELIMITER_RE = /[＝=、,]/;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// ---------------------------------------------------------------------------
// parse / format
// ---------------------------------------------------------------------------

/**
 * テキスト形式（1行=1グループ、区切り「＝」「=」「、」「,」）を
 * string[][] に変換する。
 * - 各語を trim・空語除去
 * - 2語未満の行は捨てる
 */
export function parseUserSynonymGroups(text: string): string[][] {
  return text
    .split("\n")
    .map((line) => {
      const words = line
        .split(DELIMITER_RE)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      return words;
    })
    .filter((words) => words.length >= 2);
}

/**
 * string[][] をテキスト形式（「＝」区切り・1行1グループ）に変換する。
 */
export function formatUserSynonymGroups(
  groups: readonly (readonly string[])[]
): string {
  return groups.map((group) => group.join("＝")).join("\n");
}

// ---------------------------------------------------------------------------
// localStorage IO
// ---------------------------------------------------------------------------

/**
 * localStorage からユーザー辞書を読み込む。
 * SSR-safe（typeof window ガード）・try/catch・型検証つき。
 * 未設定・エラー時は空配列を返す。
 */
export function loadUserSynonymGroups(): string[][] {
  if (!isBrowser()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    // 型検証: string[][] であることを確認する
    if (
      !Array.isArray(parsed) ||
      !parsed.every(
        (item) =>
          Array.isArray(item) &&
          item.every((word) => typeof word === "string")
      )
    ) {
      return [];
    }
    return parsed as string[][];
  } catch (error) {
    console.error("ユーザー同義語辞書の読み込みに失敗しました:", error);
    return [];
  }
}

/**
 * ユーザー辞書を localStorage に保存し、マッチングに即時反映する。
 */
export function saveUserSynonymGroups(
  groups: readonly (readonly string[])[]
): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error("ユーザー同義語辞書の保存に失敗しました:", error);
  }
  // localStorage 保存の成否にかかわらずメモリ上の辞書は更新する
  setUserSynonymGroups(groups);
}

/**
 * localStorage から読み込んでマッチングに反映する（起動時初期化用）。
 */
export function applyUserSynonymGroupsFromStorage(): void {
  const groups = loadUserSynonymGroups();
  setUserSynonymGroups(groups);
}
