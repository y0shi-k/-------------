// 分数の端数候補（¼ ⅓ ½ ⅔ ¾ などのプリセット＋ユーザーが追加したもの）を端末内に記憶する。
// 単位のように「よく使う候補から選ぶ」UIにし、新しい分数を入れたらタグのように覚える。schema は変更しない。

const STORAGE_KEY = "stock-master:custom-fractions:v1";

// 既定の端数候補（label は "分子/分母" 表記）。
export const DEFAULT_FRACTIONS: readonly string[] = ["1/4", "1/3", "1/2", "2/3", "3/4"];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readList(): string[] {
  if (!isBrowser()) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch (error) {
    console.error("分数候補の読み込みに失敗しました:", error);
    return [];
  }
}

function writeList(list: string[]): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error("分数候補の保存に失敗しました:", error);
  }
}

// ユーザーが追加した分数候補（既定に無いものだけ）を返す。
export function getCustomFractions(): string[] {
  return readList().filter((entry) => !DEFAULT_FRACTIONS.includes(entry));
}

// 分数候補を追加して記憶する（重複・既定と同じものは追加しない。新しいオブジェクトで保存）。
export function addCustomFraction(label: string): void {
  const trimmed = label.trim();
  if (!trimmed || DEFAULT_FRACTIONS.includes(trimmed)) {
    return;
  }
  const current = readList();
  if (current.includes(trimmed)) {
    return;
  }
  writeList([...current, trimmed]);
}
