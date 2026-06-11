import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  parseUserSynonymGroups,
  formatUserSynonymGroups,
  loadUserSynonymGroups,
  saveUserSynonymGroups,
} from "@/lib/ingredients/user-synonyms";
import {
  matchesIngredientName,
  ingredientNameMatchScore,
  setUserSynonymGroups,
} from "@/lib/ingredients/name-match";

// ---------------------------------------------------------------------------
// parseUserSynonymGroups
// ---------------------------------------------------------------------------

describe("parseUserSynonymGroups", () => {
  it("「＝」区切りで2語以上のグループを返す", () => {
    expect(parseUserSynonymGroups("かしわ＝鶏肉")).toEqual([["かしわ", "鶏肉"]]);
  });

  it("「=」（半角）区切りでも動作する", () => {
    expect(parseUserSynonymGroups("かしわ=鶏肉")).toEqual([["かしわ", "鶏肉"]]);
  });

  it("「、」区切りでも動作する", () => {
    expect(parseUserSynonymGroups("万願寺とうがらし、万願寺")).toEqual([
      ["万願寺とうがらし", "万願寺"],
    ]);
  });

  it("「,」（半角カンマ）区切りでも動作する", () => {
    expect(parseUserSynonymGroups("A,B,C")).toEqual([["A", "B", "C"]]);
  });

  it("各語の前後の空白を trim する", () => {
    expect(parseUserSynonymGroups(" かしわ ＝ 鶏肉 ")).toEqual([
      ["かしわ", "鶏肉"],
    ]);
  });

  it("2語未満の行（1語のみ）は無視する", () => {
    expect(parseUserSynonymGroups("かしわ")).toEqual([]);
  });

  it("空行は無視する", () => {
    const text = "かしわ＝鶏肉\n\n万願寺とうがらし、万願寺";
    expect(parseUserSynonymGroups(text)).toEqual([
      ["かしわ", "鶏肉"],
      ["万願寺とうがらし", "万願寺"],
    ]);
  });

  it("空白だけの語は除去され、残り2語以上あれば有効グループとなる", () => {
    expect(parseUserSynonymGroups("A＝  ＝B")).toEqual([["A", "B"]]);
  });

  it("空文字列では空配列を返す", () => {
    expect(parseUserSynonymGroups("")).toEqual([]);
  });

  it("複数行をまとめて処理できる", () => {
    const text = "かしわ＝鶏肉\nA=B=C\n1語のみ";
    expect(parseUserSynonymGroups(text)).toEqual([
      ["かしわ", "鶏肉"],
      ["A", "B", "C"],
    ]);
  });
});

// ---------------------------------------------------------------------------
// formatUserSynonymGroups
// ---------------------------------------------------------------------------

describe("formatUserSynonymGroups", () => {
  it("各グループを「＝」区切りで1行にする", () => {
    expect(
      formatUserSynonymGroups([
        ["かしわ", "鶏肉"],
        ["万願寺とうがらし", "万願寺"],
      ])
    ).toBe("かしわ＝鶏肉\n万願寺とうがらし＝万願寺");
  });

  it("空配列では空文字列を返す", () => {
    expect(formatUserSynonymGroups([])).toBe("");
  });

  it("parse → format の往復で内容が保たれる（＝区切り入力）", () => {
    const original = "かしわ＝鶏肉\n万願寺とうがらし＝万願寺";
    const groups = parseUserSynonymGroups(original);
    expect(formatUserSynonymGroups(groups)).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// loadUserSynonymGroups / saveUserSynonymGroups（localStorage）
// ---------------------------------------------------------------------------

describe("loadUserSynonymGroups / saveUserSynonymGroups", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    // name-match のモジュール状態を初期化して次のテストに漏らさない
    setUserSynonymGroups([]);
  });

  it("localStorage が空のとき空配列を返す", () => {
    expect(loadUserSynonymGroups()).toEqual([]);
  });

  it("saveUserSynonymGroups で保存した内容を loadUserSynonymGroups で復元できる", () => {
    const groups = [["かしわ", "鶏肉"], ["万願寺とうがらし", "万願寺"]];
    saveUserSynonymGroups(groups);
    expect(loadUserSynonymGroups()).toEqual(groups);
  });

  it("保存キーは stock-master:user-synonym-groups:v1", () => {
    saveUserSynonymGroups([["A", "B"]]);
    const raw = localStorage.getItem("stock-master:user-synonym-groups:v1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual([["A", "B"]]);
  });

  it("不正な JSON が入っていても空配列を返す（エラーを握り潰す）", () => {
    localStorage.setItem("stock-master:user-synonym-groups:v1", "{invalid}");
    expect(loadUserSynonymGroups()).toEqual([]);
  });

  it("型が string[][] でない JSON も空配列を返す", () => {
    localStorage.setItem(
      "stock-master:user-synonym-groups:v1",
      JSON.stringify({ foo: "bar" })
    );
    expect(loadUserSynonymGroups()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// save → matchesIngredientName 即時反映 → 空保存で解除
// ---------------------------------------------------------------------------

describe("saveUserSynonymGroups → matchesIngredientName 即時反映", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    setUserSynonymGroups([]);
  });

  it("保存直後にユーザー辞書の同一グループ語が true を返す", () => {
    // 初期状態: 「かしわ」と「鶏肉」は静的辞書にないため false
    expect(matchesIngredientName("かしわ", "鶏肉")).toBe(false);

    saveUserSynonymGroups([["かしわ", "鶏肉"]]);

    // 保存後は即時反映されて true になる
    expect(matchesIngredientName("かしわ", "鶏肉")).toBe(true);
  });

  it("ユーザー辞書一致のスコアは 2（辞書一致）", () => {
    saveUserSynonymGroups([["かしわ", "鶏肉"]]);
    expect(ingredientNameMatchScore("かしわ", "鶏肉")).toBe(2);
  });

  it("空グループを保存すると辞書が解除され false に戻る", () => {
    saveUserSynonymGroups([["かしわ", "鶏肉"]]);
    expect(matchesIngredientName("かしわ", "鶏肉")).toBe(true);

    // 空グループで上書き→解除
    saveUserSynonymGroups([]);
    expect(matchesIngredientName("かしわ", "鶏肉")).toBe(false);
  });

  it("静的辞書の挙動はユーザー辞書追加後も不変", () => {
    saveUserSynonymGroups([["かしわ", "鶏肉"]]);
    // 静的辞書の卵グループは引き続き有効
    expect(matchesIngredientName("たまご", "卵")).toBe(true);
    // 静的とユーザーにまたがる語は各 Map 内でのみ同一視（跨ぎは false）
    expect(matchesIngredientName("かしわ", "チキン")).toBe(false);
  });

  it("複数グループを登録できる", () => {
    saveUserSynonymGroups([
      ["かしわ", "鶏肉"],
      ["万願寺とうがらし", "万願寺"],
    ]);
    expect(matchesIngredientName("かしわ", "鶏肉")).toBe(true);
    expect(matchesIngredientName("万願寺とうがらし", "万願寺")).toBe(true);
    // 異なるグループ間は false
    expect(matchesIngredientName("かしわ", "万願寺")).toBe(false);
  });

  it("正規化後の語でも照合される（カタカナ→ひらがな）", () => {
    saveUserSynonymGroups([["カシワ", "鶏肉"]]);
    // カシワ（カタカナ）を保存 → 正規化後 「かしわ」で登録される
    expect(matchesIngredientName("かしわ", "鶏肉")).toBe(true);
  });
});
