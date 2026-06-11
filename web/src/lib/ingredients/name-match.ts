/**
 * 食材名マッチングユーティリティ
 *
 * 正規化・類義語辞書・部分一致の3段階照合を提供する純粋関数群。
 * 画像分類用の normalizeIngredientName (ingredient-image.ts) とは別物。流用・変更しない。
 */

// ---------------------------------------------------------------------------
// 正規化
// ---------------------------------------------------------------------------

/**
 * 食材名をマッチング用に正規化する。
 * NFKC正規化 → 小文字化 → 空白除去 → カタカナ→ひらがな変換。
 * 長音「ー」(U+30FC) はシフト対象外としてそのまま残す。
 * U+30A1（ァ）〜 U+30F6（ヶ）の範囲のみ -0x60 シフト。U+30FC（ー）は含まない。
 */
export function normalizeIngredientMatchName(name: string): string {
  const nfkc = name.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
  // U+30A1–U+30F6 をひらがなに変換。ー(U+30FC) はシフト対象外。
  return nfkc.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

// ---------------------------------------------------------------------------
// 類義語辞書
// ---------------------------------------------------------------------------

/**
 * 同義グループ。各グループ内の語は正規化関数を通した後の表記で登録される。
 * 辞書へはユーザーが実際に入力しうる表記を収録し、SYNONYM_MAP 構築時に一括正規化する。
 *
 * 方針:
 * - 「同一食材と断定できる語」のみ収録（誤マッチ防止）。
 * - ピーマンとパプリカは同一視しない。
 * - 複合語（豚こま切れ肉、鶏もも肉）は収録しない。
 * - 単語2語以上で成立するグループのみ収録（単語が1つだけなら辞書は不要）。
 */
const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  // 卵（グループ 0）
  ["たまご", "卵", "玉子", "タマゴ"],
  // 玉ねぎ（グループ 1）
  ["たまねぎ", "玉ねぎ", "玉葱", "タマネギ", "オニオン"],
  // じゃがいも（グループ 2）
  ["じゃがいも", "ジャガイモ", "じゃが芋", "ジャガ芋", "馬鈴薯", "ポテト"],
  // さつまいも（グループ 3）
  ["さつまいも", "サツマイモ", "さつま芋", "サツマ芋", "薩摩芋"],
  // ねぎ（グループ 4）
  ["ねぎ", "ネギ", "長ねぎ", "長ネギ", "長葱", "青ねぎ", "青ネギ", "万能ねぎ", "万能ネギ"],
  // にんじん（グループ 5）
  ["にんじん", "ニンジン", "人参", "キャロット"],
  // トマト（グループ 6）
  ["トマト", "とまと"],
  // 大根（グループ 7）
  ["だいこん", "大根", "ダイコン"],
  // きゅうり（グループ 8）
  ["きゅうり", "キュウリ", "胡瓜"],
  // ほうれん草（グループ 9）
  ["ほうれんそう", "ほうれん草", "ホウレン草", "ホウレンソウ", "菠薐草"],
  // キャベツ（グループ 10）
  ["キャベツ", "きゃべつ", "甘藍"],
  // 豆腐（グループ 11）
  ["とうふ", "豆腐", "トウフ"],
  // 鶏肉（グループ 12。部位名は収録しない）
  ["鶏肉", "とりにく", "チキン", "鳥肉"],
  // 牛乳（グループ 13）
  ["牛乳", "ぎゅうにゅう", "ミルク"],
  // 砂糖（グループ 14）
  ["砂糖", "さとう", "シュガー"],
  // 醤油（グループ 15）
  ["醤油", "しょうゆ", "ショウユ"],
  // 味噌（グループ 16）
  ["味噌", "みそ", "ミソ"],
  // バター（グループ 17）
  ["バター", "ばたー"],
  // 小麦粉（グループ 18）
  ["小麦粉", "こむぎこ", "薄力粉", "はくりきこ"],
  // もやし（グループ 19）
  ["もやし", "モヤシ", "豆もやし", "豆モヤシ"],
  // 豚肉（グループ 20。部位・切り方付き（豚こま等）とは同一視しない）
  ["豚肉", "ぶた肉", "ポーク"],
  // 豚こま（グループ 21。こま/小間/こま切れ/細切れは同一視。「豚肉」とは別グループ）
  ["豚こま", "豚コマ", "豚こま肉", "豚コマ肉", "豚こま切れ", "豚こま切れ肉", "豚小間", "豚小間肉", "豚小間切れ肉", "豚細切れ肉"],
  // 牛肉（グループ 22）
  ["牛肉", "ぎゅう肉", "ビーフ"],
  // 牛こま（グループ 23）
  ["牛こま", "牛コマ", "牛こま肉", "牛こま切れ", "牛こま切れ肉", "牛小間", "牛小間切れ肉", "牛細切れ肉"],
  // 鶏もも肉（グループ 24）
  ["鶏もも肉", "鶏モモ肉", "鶏もも", "鳥もも肉", "とりもも肉", "鶏腿肉"],
  // 鶏むね肉（グループ 25）
  ["鶏むね肉", "鶏ムネ肉", "鶏むね", "鶏胸肉", "鳥むね肉", "とりむね肉"],
  // 鶏ささみ（グループ 26）
  ["ささみ", "ササミ", "鶏ささみ", "鶏ささ身", "笹身"],
  // ひき肉（グループ 27。肉種なしの総称のみ。豚/鶏/牛/合いびきとは同一視しない）
  ["ひき肉", "挽き肉", "挽肉", "ミンチ"],
  // 豚ひき肉（グループ 28）
  ["豚ひき肉", "豚挽き肉", "豚挽肉", "豚ミンチ"],
  // 鶏ひき肉（グループ 29）
  ["鶏ひき肉", "鶏挽き肉", "鶏挽肉", "鶏ミンチ", "鳥ひき肉"],
  // 牛ひき肉（グループ 30）
  ["牛ひき肉", "牛挽き肉", "牛挽肉", "牛ミンチ"],
  // 合いびき肉（グループ 31）
  ["合いびき肉", "合い挽き肉", "合挽き肉", "合挽肉", "あいびき肉", "合いびきミンチ"],
  // ウインナー（グループ 32。表記ゆれのみ。ソーセージ総称とは同一視しない）
  ["ウインナー", "ウィンナー"],
];

/**
 * 「正規化済み語 → グループインデックス」の Map（モジュール初期化時に一度だけ構築）。
 * O(1) 照合のために使用する。
 */
const SYNONYM_MAP: ReadonlyMap<string, number> = (() => {
  const map = new Map<string, number>();
  SYNONYM_GROUPS.forEach((group, idx) => {
    group.forEach((word) => {
      map.set(normalizeIngredientMatchName(word), idx);
    });
  });
  return map;
})();

// ---------------------------------------------------------------------------
// ユーザー定義の同義語辞書（モジュール状態）
// ---------------------------------------------------------------------------

/**
 * ユーザー定義の同義語 Map（正規化済み語 → `user:${idx}` 形式のグループID）。
 * 静的辞書のグループID（number）と名前空間が異なるため衝突しない。
 *
 * 注意: このモジュールは純粋関数群だが、この変数のみモジュール状態を持つ例外。
 * localStorage との同期のため setUserSynonymGroups() で差し替える。
 * 既存の Map を mutate せず、常に新しい Map を構築して参照を差し替える（イミュータブル）。
 */
let userSynonymMap: ReadonlyMap<string, string> = new Map();

/**
 * ユーザー定義の同義グループを設定する。
 * 新しい Map を構築して参照を差し替える（既存 Map の mutate はしない）。
 *
 * 同じ語が複数行に出現する場合（例: 行0「A＝B」 行1「B＝C」）、
 * 後の行が前の行のグループIDを上書きして A↔B の同一視が切れる問題を防ぐため、
 * Union-Find で推移的に統合してから Map を構築する。
 *
 * アルゴリズム:
 * 1. 全行を走査し、正規化済み語を頂点として Union-Find を構築する。
 * 2. 各行内の語を先頭語の根に unite する。
 * 3. find(語) の根を安定したグループIDとして Map に登録する。
 *    根の文字列自体をIDに使うことで、推移的統合後も一貫したIDが得られる。
 */
export function setUserSynonymGroups(
  groups: readonly (readonly string[])[]
): void {
  // --- Union-Find（path compression のみ。配列 mutate はデータ構造維持に必要な内部操作）---
  const parent = new Map<string, string>();

  function find(x: string): string {
    const p = parent.get(x);
    if (p === undefined || p === x) return x;
    const root = find(p);
    parent.set(x, root); // path compression（Map の内部更新）
    return root;
  }

  function unite(a: string, b: string): void {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent.set(rb, ra); // ra を代表根とする
    }
  }

  // 全語を正規化して Union-Find に登録
  groups.forEach((group) => {
    const normalized = group
      .map((word) => normalizeIngredientMatchName(word))
      .filter((w) => w.length > 0);
    if (normalized.length < 2) return;
    // 先頭語を代表として残り全語を unite
    const [first, ...rest] = normalized;
    if (!parent.has(first)) parent.set(first, first);
    rest.forEach((word) => {
      if (!parent.has(word)) parent.set(word, word);
      unite(first, word);
    });
  });

  // 根をグループIDとして新規 Map を構築（既存 Map の mutate ではなく新規生成）
  const map = new Map<string, string>();
  parent.forEach((_, word) => {
    const root = find(word);
    map.set(word, `user:${root}`);
  });

  userSynonymMap = map;
}

// ---------------------------------------------------------------------------
// マッチング関数
// ---------------------------------------------------------------------------

/**
 * 2つの食材名が同一食材と判定できるかを返す。
 * 判定条件: 正規化一致 OR 類義語辞書の同一グループ。
 * 部分一致のみでは true を返さない（買い忘れ防止のユーザー確定方針）。
 */
export function matchesIngredientName(a: string, b: string): boolean {
  const na = normalizeIngredientMatchName(a);
  const nb = normalizeIngredientMatchName(b);

  // 正規化一致
  if (na === nb) return true;

  // 静的辞書一致
  const ga = SYNONYM_MAP.get(na);
  const gb = SYNONYM_MAP.get(nb);
  if (ga !== undefined && gb !== undefined && ga === gb) return true;

  // ユーザー辞書一致（静的とユーザーにまたがる語は各 Map 内でのみ同一視する）
  const ua = userSynonymMap.get(na);
  const ub = userSynonymMap.get(nb);
  if (ua !== undefined && ub !== undefined && ua === ub) return true;

  return false;
}

// ---------------------------------------------------------------------------
// スコア
// ---------------------------------------------------------------------------

/**
 * 短い方の文字列が長い方の「部分列」（順序を保って飛び飛びに出現）かを返す。
 * 例: 「豚肉」は「豚こま切れ肉」の部分列（豚…肉）。
 * 1文字では過剰マッチするため2文字以上のみ対象。
 */
function isSubsequenceOf(shorter: string, longer: string): boolean {
  const target = Array.from(shorter);
  if (target.length < 2) return false;
  let index = 0;
  for (const ch of longer) {
    if (ch === target[index]) {
      index += 1;
      if (index >= target.length) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 在庫マッチング
// ---------------------------------------------------------------------------

/**
 * 在庫リストからレシピ食材に最も合致する在庫アイテムを1件返す。
 *
 * 条件:
 * - category（分類）一致
 * - unit 一致
 * - quantity > 0
 * - matchesIngredientName が true（score >= 2。部分一致のみは除外）
 *
 * 複数候補がある場合は ingredientNameMatchScore の降順（高スコア優先）で選ぶ。
 * 一致なしの場合は undefined を返す。
 */
export function findMatchingStock<
  TStock extends { category: string; name: string; unit: string; quantity: number }
>(
  ingredientName: string,
  ingredientType: string,
  ingredientUnit: string,
  items: TStock[]
): TStock | undefined {
  const candidates = items.filter(
    (item) =>
      item.category === ingredientType &&
      item.unit === ingredientUnit &&
      item.quantity > 0 &&
      matchesIngredientName(item.name, ingredientName)
  );
  if (candidates.length === 0) return undefined;
  return [...candidates].sort(
    (a, b) => ingredientNameMatchScore(b.name, ingredientName) - ingredientNameMatchScore(a.name, ingredientName)
  )[0];
}

// ---------------------------------------------------------------------------
// スコア
// ---------------------------------------------------------------------------

/**
 * マッチングスコア（並び順用）。
 * 4: 完全一致（生文字列）
 * 3: 正規化一致
 * 2: 辞書一致
 * 1: 部分一致（正規化後に一方が他方を含む、または短い方が長い方の部分列。
 *    例: 豚肉↔豚こま切れ肉。候補の並び順にのみ使い、同一視には使わない）
 * 0: 不一致
 *
 * matches（同一視）は 2 以上のみ。
 */
export function ingredientNameMatchScore(a: string, b: string): 0 | 1 | 2 | 3 | 4 {
  // 4: 完全一致（生文字列）
  if (a === b) return 4;

  const na = normalizeIngredientMatchName(a);
  const nb = normalizeIngredientMatchName(b);

  // 3: 正規化一致
  if (na === nb) return 3;

  // 2: 静的辞書一致
  const ga = SYNONYM_MAP.get(na);
  const gb = SYNONYM_MAP.get(nb);
  if (ga !== undefined && gb !== undefined && ga === gb) return 2;

  // 2: ユーザー辞書一致（静的とユーザーにまたがる語は各 Map 内でのみ同一視する）
  const ua = userSynonymMap.get(na);
  const ub = userSynonymMap.get(nb);
  if (ua !== undefined && ub !== undefined && ua === ub) return 2;

  // 1: 部分一致（一方が他方を含む / 短い方が長い方の部分列）
  if (na.includes(nb) || nb.includes(na)) return 1;
  const [shorter, longer] = na.length <= nb.length ? [na, nb] : [nb, na];
  if (isSubsequenceOf(shorter, longer)) return 1;

  // 0: 不一致
  return 0;
}
