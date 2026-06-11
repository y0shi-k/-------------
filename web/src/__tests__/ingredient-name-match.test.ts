import { describe, expect, it } from "vitest";
import {
  normalizeIngredientMatchName,
  matchesIngredientName,
  ingredientNameMatchScore,
} from "@/lib/ingredients/name-match";

// ---------------------------------------------------------------------------
// normalizeIngredientMatchName
// ---------------------------------------------------------------------------

describe("normalizeIngredientMatchName", () => {
  it("NFKC正規化で全角英数を半角にする", () => {
    expect(normalizeIngredientMatchName("ａｂｃ")).toBe("abc");
  });

  it("小文字化する", () => {
    expect(normalizeIngredientMatchName("ABC")).toBe("abc");
  });

  it("空白（全角・半角・タブ）を除去する", () => {
    expect(normalizeIngredientMatchName("た ま ご")).toBe("たまご");
    expect(normalizeIngredientMatchName("た　ま　ご")).toBe("たまご");
  });

  it("カタカナをひらがなに変換する", () => {
    expect(normalizeIngredientMatchName("タマゴ")).toBe("たまご");
    expect(normalizeIngredientMatchName("ニンジン")).toBe("にんじん");
  });

  it("長音「ー」はそのまま残す", () => {
    expect(normalizeIngredientMatchName("バター")).toBe("ばたー");
    expect(normalizeIngredientMatchName("ビール")).toBe("びーる");
  });

  it("半角カタカナも NFKC で全角になり、さらにひらがなになる", () => {
    // ﾄﾏﾄ → NFKC → トマト → ひらがな → とまと
    expect(normalizeIngredientMatchName("ﾄﾏﾄ")).toBe("とまと");
  });

  it("漢字はそのまま残す", () => {
    expect(normalizeIngredientMatchName("卵")).toBe("卵");
    expect(normalizeIngredientMatchName("玉子")).toBe("玉子");
  });
});

// ---------------------------------------------------------------------------
// matchesIngredientName — 辞書一致（卵グループ）
// ---------------------------------------------------------------------------

describe("matchesIngredientName: 卵グループ", () => {
  it("たまご / 卵 は true", () => {
    expect(matchesIngredientName("たまご", "卵")).toBe(true);
  });

  it("卵 / 玉子 は true", () => {
    expect(matchesIngredientName("卵", "玉子")).toBe(true);
  });

  it("たまご / 玉子 は true", () => {
    expect(matchesIngredientName("たまご", "玉子")).toBe(true);
  });

  it("タマゴ / たまご は true（カタカナ→ひらがな正規化後に一致）", () => {
    expect(matchesIngredientName("タマゴ", "たまご")).toBe(true);
  });

  it("タマゴ / 卵 は true（カタカナ正規化 + 辞書）", () => {
    expect(matchesIngredientName("タマゴ", "卵")).toBe(true);
  });

  it("自己一致: 卵 / 卵 は true", () => {
    expect(matchesIngredientName("卵", "卵")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// matchesIngredientName — 正規化一致（全角半角・空白ゆれ）
// ---------------------------------------------------------------------------

describe("matchesIngredientName: 正規化一致（表記ゆれ）", () => {
  it("全角/半角の数字ゆれ: １個 / 1個 は true（正規化後に一致）", () => {
    // NFKC で １ → 1
    expect(matchesIngredientName("牛乳１L", "牛乳1l")).toBe(true);
  });

  it("空白ゆれ: 「 玉 ね ぎ 」/ 「玉ねぎ」 は true", () => {
    expect(matchesIngredientName(" 玉 ね ぎ ", "玉ねぎ")).toBe(true);
  });

  it("トマト系: トマト / とまと は true（カタカナ→ひらがな）", () => {
    expect(matchesIngredientName("トマト", "とまと")).toBe(true);
  });

  it("半角カタカナ: ﾄﾏﾄ / トマト は true", () => {
    expect(matchesIngredientName("ﾄﾏﾄ", "トマト")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// matchesIngredientName — 辞書一致（各グループ抜粋）
// ---------------------------------------------------------------------------

describe("matchesIngredientName: 辞書一致（各グループ）", () => {
  it("玉ねぎ / オニオン は true", () => {
    expect(matchesIngredientName("玉ねぎ", "オニオン")).toBe(true);
  });

  it("じゃがいも / ポテト は true", () => {
    expect(matchesIngredientName("じゃがいも", "ポテト")).toBe(true);
  });

  it("じゃがいも / 馬鈴薯 は true", () => {
    expect(matchesIngredientName("じゃがいも", "馬鈴薯")).toBe(true);
  });

  it("ねぎ / 長ねぎ は true", () => {
    expect(matchesIngredientName("ねぎ", "長ねぎ")).toBe(true);
  });

  it("にんじん / キャロット は true", () => {
    expect(matchesIngredientName("にんじん", "キャロット")).toBe(true);
  });

  it("にんじん / 人参 は true", () => {
    expect(matchesIngredientName("にんじん", "人参")).toBe(true);
  });

  it("バター / ばたー は true（長音ー保持）", () => {
    expect(matchesIngredientName("バター", "ばたー")).toBe(true);
  });

  it("牛乳 / ミルク は true", () => {
    expect(matchesIngredientName("牛乳", "ミルク")).toBe(true);
  });

  it("醤油 / しょうゆ は true", () => {
    expect(matchesIngredientName("醤油", "しょうゆ")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// matchesIngredientName — 肉系グループ（TKT-0222 追補）
// ---------------------------------------------------------------------------

describe("matchesIngredientName: 肉系グループ", () => {
  it("豚こま肉 / 豚コマ は true（辞書一致。カナ→かな正規化込み）", () => {
    expect(matchesIngredientName("豚こま肉", "豚コマ")).toBe(true);
  });

  it("豚こま切れ肉 / 豚小間 は true", () => {
    expect(matchesIngredientName("豚こま切れ肉", "豚小間")).toBe(true);
  });

  it("豚肉 / ポーク は true", () => {
    expect(matchesIngredientName("豚肉", "ポーク")).toBe(true);
  });

  it("豚肉 / 豚こま肉 は false（総称と切り方付きは同一視しない）", () => {
    expect(matchesIngredientName("豚肉", "豚こま肉")).toBe(false);
    expect(ingredientNameMatchScore("豚肉", "豚こま肉")).toBe(1);
  });

  it("鶏もも肉 / 鶏モモ肉 は true（正規化一致）", () => {
    expect(matchesIngredientName("鶏もも肉", "鶏モモ肉")).toBe(true);
  });

  it("鶏もも肉 / 鶏むね肉 は false（部位違いは同一視しない）", () => {
    expect(matchesIngredientName("鶏もも肉", "鶏むね肉")).toBe(false);
  });

  it("豚ひき肉 / 豚ミンチ は true", () => {
    expect(matchesIngredientName("豚ひき肉", "豚ミンチ")).toBe(true);
  });

  it("合いびき肉 / 合挽き肉 は true", () => {
    expect(matchesIngredientName("合いびき肉", "合挽き肉")).toBe(true);
  });

  it("ひき肉 / 豚ひき肉 は false（総称と肉種付きは同一視しない。部分一致止まり）", () => {
    expect(matchesIngredientName("ひき肉", "豚ひき肉")).toBe(false);
    expect(ingredientNameMatchScore("ひき肉", "豚ひき肉")).toBe(1);
  });

  it("ウインナー / ウィンナー は true（辞書一致）", () => {
    expect(matchesIngredientName("ウインナー", "ウィンナー")).toBe(true);
  });

  it("ウインナー / ソーセージ は false（総称とは同一視しない）", () => {
    expect(matchesIngredientName("ウインナー", "ソーセージ")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// matchesIngredientName — false を返すべきケース
// ---------------------------------------------------------------------------

describe("matchesIngredientName: false を返すべきケース", () => {
  it("卵 / 牛乳 は false（無関係）", () => {
    expect(matchesIngredientName("卵", "牛乳")).toBe(false);
  });

  it("豚肉 / 豚こま切れ肉 は false（部分一致止まり。自動同一視しない）", () => {
    expect(matchesIngredientName("豚肉", "豚こま切れ肉")).toBe(false);
  });

  it("ピーマン / パプリカ は false（同一視しない方針）", () => {
    expect(matchesIngredientName("ピーマン", "パプリカ")).toBe(false);
  });

  it("鶏もも肉 / 鶏胸肉 は false（部位名は同一視しない）", () => {
    expect(matchesIngredientName("鶏もも肉", "鶏胸肉")).toBe(false);
  });

  it("にんじん / にんにく は false（無関係）", () => {
    expect(matchesIngredientName("にんじん", "にんにく")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// matchesIngredientName — 部分一致だけでは true を返さないことを固定
// ---------------------------------------------------------------------------

describe("matchesIngredientName: 部分一致だけでは true を返さない（ユーザー確定方針）", () => {
  it("豚肉 / 豚こま切れ肉: score=1（部分列マッチ）だが matches は false", () => {
    expect(matchesIngredientName("豚肉", "豚こま切れ肉")).toBe(false);
    expect(ingredientNameMatchScore("豚肉", "豚こま切れ肉")).toBe(1);
  });

  it("にんじん / にんじんジュース: 部分一致（score=1）だが matches は false", () => {
    expect(matchesIngredientName("にんじん", "にんじんジュース")).toBe(false);
  });

  it("鶏肉 / 鶏もも肉: 部分一致だが false（鶏肉グループは「鶏肉」のみと鶏もも肉は別語）", () => {
    // 鶏もも肉は辞書未収録のため部分一致のみ → false
    expect(matchesIngredientName("鶏肉", "鶏もも肉")).toBe(false);
  });

  it("にんじん / にんじんジュース: 部分一致だが false", () => {
    expect(matchesIngredientName("にんじん", "にんじんジュース")).toBe(false);
  });

  it("玉ねぎ / 玉ねぎスープ: 部分一致だが false", () => {
    expect(matchesIngredientName("玉ねぎ", "玉ねぎスープ")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ingredientNameMatchScore — スコアの序列
// ---------------------------------------------------------------------------

describe("ingredientNameMatchScore: スコアの序列", () => {
  it("完全一致（生文字列）は 4", () => {
    expect(ingredientNameMatchScore("卵", "卵")).toBe(4);
    expect(ingredientNameMatchScore("たまご", "たまご")).toBe(4);
  });

  it("正規化一致は 3（生文字列では不一致だが正規化後に一致）", () => {
    // タマゴ（カタカナ）≠ たまご（ひらがな）だが正規化後は同じ
    expect(ingredientNameMatchScore("タマゴ", "たまご")).toBe(3);
    // 全角半角
    expect(ingredientNameMatchScore("ﾄﾏﾄ", "とまと")).toBe(3);
    // 空白ゆれ
    expect(ingredientNameMatchScore(" 卵 ", "卵")).toBe(3);
  });

  it("辞書一致は 2", () => {
    expect(ingredientNameMatchScore("たまご", "卵")).toBe(2);
    expect(ingredientNameMatchScore("玉ねぎ", "オニオン")).toBe(2);
    expect(ingredientNameMatchScore("じゃがいも", "ポテト")).toBe(2);
  });

  it("部分一致は 1（一方の正規化後文字列が他方に含まれる場合）", () => {
    // にんじん は にんじんジュース に含まれる
    expect(ingredientNameMatchScore("にんじん", "にんじんジュース")).toBe(1);
    // 玉ねぎ は 玉ねぎスープ に含まれる
    expect(ingredientNameMatchScore("玉ねぎ", "玉ねぎスープ")).toBe(1);
  });

  it("豚肉 / 豚こま切れ肉 は部分列マッチでスコア 1（不一致 0 より高い。チケット acceptance）", () => {
    // 正規化後の "豚肉" はサブストリングではないが、「豚…肉」の部分列として一致する
    expect(ingredientNameMatchScore("豚肉", "豚こま切れ肉")).toBe(1);
  });

  it("不一致は 0", () => {
    expect(ingredientNameMatchScore("卵", "牛乳")).toBe(0);
    expect(ingredientNameMatchScore("ピーマン", "パプリカ")).toBe(0);
  });

  it("スコアの序列: 4 > 3 > 2 > 1 > 0", () => {
    const score4 = ingredientNameMatchScore("卵", "卵");
    const score3 = ingredientNameMatchScore("タマゴ", "たまご");
    const score2 = ingredientNameMatchScore("たまご", "卵");
    // 部分一致の例: にんじん / にんじんジュース（正規化後に一方が他方を含む）
    const score1 = ingredientNameMatchScore("にんじん", "にんじんジュース");
    const score0 = ingredientNameMatchScore("卵", "牛乳");
    expect(score4).toBeGreaterThan(score3);
    expect(score3).toBeGreaterThan(score2);
    expect(score2).toBeGreaterThan(score1);
    expect(score1).toBeGreaterThan(score0);
  });

  it("matches（同一視）は score >= 2 のみ: score=1（部分一致）は matches=false", () => {
    // にんじん / にんじんジュース は部分一致（score=1）だが matches は false
    const a = "にんじん";
    const b = "にんじんジュース";
    expect(ingredientNameMatchScore(a, b)).toBe(1);
    expect(matchesIngredientName(a, b)).toBe(false);
  });

  it("matches（同一視）は score >= 2 のみ: score=2（辞書一致）は matches=true", () => {
    const a = "たまご";
    const b = "卵";
    expect(ingredientNameMatchScore(a, b)).toBe(2);
    expect(matchesIngredientName(a, b)).toBe(true);
  });
});
