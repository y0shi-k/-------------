// 在庫数量の「表示形式（分数 or 小数）」を端末内（localStorage）に記憶する。
// DBの quantity は数値型のままで、`1/2` と `0.5` のどちらで入力されたかは保存すると消えるため、
// ユーザーが最後に入力した形式を端末ごとに覚えて一覧表示に反映する。schema は変更しない。

import type { QuantityNotation } from "@/lib/format/numeric";

const STORAGE_KEY = "stock-master:quantity-notation:v1";

type NotationMap = Record<string, QuantityNotation>;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readMap(): NotationMap {
  if (!isBrowser()) {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return parsed as NotationMap;
  } catch (error) {
    console.error("数量表示形式の読み込みに失敗しました:", error);
    return {};
  }
}

function writeMap(map: NotationMap): void {
  if (!isBrowser()) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.error("数量表示形式の保存に失敗しました:", error);
  }
}

// 指定アイテムの記憶された表示形式を返す（無ければ undefined）。
export function getQuantityNotation(itemId: string): QuantityNotation | undefined {
  if (!itemId) {
    return undefined;
  }
  return readMap()[itemId];
}

// 指定アイテムの表示形式を記憶する（新しいオブジェクトで保存・ミューテーションしない）。
export function setQuantityNotation(itemId: string, notation: QuantityNotation): void {
  if (!itemId) {
    return;
  }
  const current = readMap();
  if (current[itemId] === notation) {
    return;
  }
  writeMap({ ...current, [itemId]: notation });
}

// 指定アイテムの記憶を削除する（在庫削除時などに使う）。
export function clearQuantityNotation(itemId: string): void {
  if (!itemId) {
    return;
  }
  const current = readMap();
  if (!(itemId in current)) {
    return;
  }
  const { [itemId]: _removed, ...rest } = current;
  writeMap(rest);
}
