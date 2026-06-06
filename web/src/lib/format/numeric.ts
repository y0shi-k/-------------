// 数値入力の正規化ヘルパー。
// Web標準にはPCのIME（日本語入力）を強制オフにする方法が無いため、
// 全角で入力されてもここで半角へ正規化して受け取る。
// 在庫数量は `1/2` や `2 1/2`（帯分数）の分数入力も許し、保存は number に揃える（DBは既存 numeric のまま）。
// ただし分数入力は g / cc(ml) 以外の数えられる単位に限定する（`isFractionalUnit`）。

const FULLWIDTH_DIGIT_OFFSET = 0xfee0; // U+FF10('０') - 0x30('0')

// 数値を分数表記へ戻す際に優先する代表的な端数。
const FRACTION_LABELS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1 / 4, label: "1/4" },
  { value: 1 / 3, label: "1/3" },
  { value: 1 / 2, label: "1/2" },
  { value: 2 / 3, label: "2/3" },
  { value: 3 / 4, label: "3/4" }
];

// 分数入力を許さない単位（重さ・体積）。これら以外は数えられる単位として分数を許す。
const NON_FRACTIONAL_UNITS = new Set(["g", "ml", "cc"]);

// 単位が分数入力の対象か（g / ml / cc は対象外で小数のみ）。
export function isFractionalUnit(unit: string): boolean {
  return !NON_FRACTIONAL_UNITS.has(unit.trim().toLowerCase());
}

// 全角数字・全角ピリオド・全角スラッシュ・全角スペースを半角へ変換する。
export function toHalfWidthNumeric(value: string): string {
  return value
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - FULLWIDTH_DIGIT_OFFSET))
    .replace(/[．。]/g, ".")
    .replace(/[／]/g, "/")
    .replace(/　/g, " ");
}

// 数量入力欄向けに、半角の数字と小数点1つだけを残すよう整形する（min>=0前提のため符号は許可しない）。
// 入力途中の "1." も許容する。分数を許さない単位（g/cc）で使う。
export function sanitizeDecimalInput(value: string): string {
  const halfWidth = toHalfWidthNumeric(value).replace(/[^0-9.]/g, "");
  const firstDot = halfWidth.indexOf(".");
  if (firstDot === -1) {
    return halfWidth;
  }
  return halfWidth.slice(0, firstDot + 1) + halfWidth.slice(firstDot + 1).replace(/\./g, "");
}

// 数量入力欄向けに、半角の数字・小数点1つ・スラッシュ1つ・区切り空白1つだけを残す（分数・帯分数入力を許す）。
// 入力途中の "1.", "1/", "2 " も許容する。
export function sanitizeQuantityInput(value: string): string {
  // 数字・ドット・スラッシュ・空白のみ。連続空白は1つに、先頭空白は除去。
  let result = toHalfWidthNumeric(value)
    .replace(/[^0-9./ ]/g, "")
    .replace(/ +/g, " ")
    .replace(/^ /, "");
  const firstSlash = result.indexOf("/");
  if (firstSlash !== -1) {
    result = result.slice(0, firstSlash + 1) + result.slice(firstSlash + 1).replace(/\//g, "");
  }
  const firstDot = result.indexOf(".");
  if (firstDot !== -1) {
    result = result.slice(0, firstDot + 1) + result.slice(firstDot + 1).replace(/\./g, "");
  }
  return result;
}

export type ParseQuantityResult = { ok: true; value: number } | { ok: false; error: string };

const FRACTION_ERROR =
  "原因: 分数の形式が正しくありません。影響: 保存できません。修正方法: 「1/2」や「2 1/2」のように入力してください。";
const DENOMINATOR_ZERO_ERROR = "原因: 分母が0です。影響: 数量を計算できません。修正方法: 分母に1以上の数字を入力してください。";
const NEGATIVE_ERROR = "原因: 数量に負の数は使えません。影響: 保存できません。修正方法: 0以上の数値で入力してください。";

// 数量文字列（整数・小数・分数・帯分数）を number へ変換する。不正値は原因・影響・修正方法を含むエラーを返す。
export function parseQuantityInput(value: string): ParseQuantityResult {
  const normalized = toHalfWidthNumeric(value).trim().replace(/ +/g, " ");
  if (!normalized) {
    return {
      ok: false,
      error: "原因: 数量が空です。影響: 保存できません。修正方法: 0以上の数値（例 2 や 1/2）を入力してください。"
    };
  }

  // 帯分数 "2 1/2"
  const mixedMatch = normalized.match(/^(\d+) (\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const numerator = Number(mixedMatch[2]);
    const denominator = Number(mixedMatch[3]);
    if (denominator === 0) {
      return { ok: false, error: DENOMINATOR_ZERO_ERROR };
    }
    return { ok: true, value: roundQuantity(whole + numerator / denominator) };
  }

  // 分数 "1/2"
  if (normalized.includes("/")) {
    const parts = normalized.split("/");
    const numerator = Number(parts[0]);
    const denominator = Number(parts[1]);
    if (parts.length !== 2 || parts[0] === "" || parts[1] === "" || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
      return { ok: false, error: FRACTION_ERROR };
    }
    if (denominator === 0) {
      return { ok: false, error: DENOMINATOR_ZERO_ERROR };
    }
    if (numerator < 0 || denominator < 0) {
      return { ok: false, error: NEGATIVE_ERROR };
    }
    return { ok: true, value: roundQuantity(numerator / denominator) };
  }

  // 小数・整数（ここまで来て空白が残っていれば不正な帯分数）
  if (normalized.includes(" ")) {
    return { ok: false, error: FRACTION_ERROR };
  }
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) {
    return {
      ok: false,
      error: "原因: 数量を数値として読み取れません。影響: 保存できません。修正方法: 0以上の数値（例 2 や 1/2）を入力してください。"
    };
  }
  return { ok: true, value: num };
}

// 数量文字列を number に変換する簡易版。不正値は NaN を返す（呼び出し側で Number.isFinite 判定する箇所向け）。
export function quantityToNumber(value: string): number {
  const result = parseQuantityInput(value);
  return result.ok ? result.value : Number.NaN;
}

// 浮動小数の誤差を抑えて丸める（6桁）。
export function roundQuantity(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export type QuantityNotation = "fraction" | "decimal";

// 入力文字列が分数表記か小数表記かを判定する（スラッシュが有れば分数）。
export function detectNotation(value: string): QuantityNotation {
  return value.includes("/") ? "fraction" : "decimal";
}

// 小数として短く（最大2桁）表示する（分数へは戻さない）。
export function formatQuantityDecimal(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  const rounded = roundQuantity(value);
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return String(Math.round(rounded * 100) / 100);
}

// "分子/分母" 文字列を数値へ。真分数（0<値<1）以外は null。
function fractionLabelToValue(label: string): number | null {
  if (!/^\d+\/\d+$/.test(label)) {
    return null;
  }
  const parsed = parseQuantityInput(label);
  if (!parsed.ok || parsed.value <= 0 || parsed.value >= 1) {
    return null;
  }
  return parsed.value;
}

// number を短い表示文字列へ戻す。代表的な端数（＋追加候補）は分数（例 "2/3"・"2 1/2"・"1 3/8"）で表示する。
export function formatQuantity(value: number, extraFractions: readonly string[] = []): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  if (value < 0) {
    return String(roundQuantity(value));
  }
  const rounded = roundQuantity(value);
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  const whole = Math.floor(rounded);
  const fraction = rounded - whole;
  const table = [
    ...FRACTION_LABELS,
    ...extraFractions
      .map((label) => ({ label, value: fractionLabelToValue(label) }))
      .filter((entry): entry is { label: string; value: number } => entry.value !== null)
  ];
  const match = table.find((entry) => Math.abs(fraction - entry.value) < 1e-3);
  if (match) {
    return whole === 0 ? match.label : `${whole} ${match.label}`;
  }
  // 分数に戻せない値は小数を短く（最大2桁）丸めて表示する。
  return formatQuantityDecimal(rounded);
}

// 表示用。notation に従い、"decimal" なら小数、"fraction"/未指定なら分数優先で表示する。
// extraFractions に追加候補（例 "3/8"）を渡すと、その端数も分数で表示できる。
export function displayQuantity(value: number, notation?: QuantityNotation, extraFractions: readonly string[] = []): string {
  if (notation === "decimal") {
    return formatQuantityDecimal(value);
  }
  return formatQuantity(value, extraFractions);
}

// 入力欄の初期値向けに number を文字列へ戻す。
// allowFraction=false（g/cc など）や notation="decimal" のときは小数。
// それ以外は帯分数を含む分数表記（再パース可能なので編集欄でも安全）。
export function formatQuantityForInput(
  value: number,
  options?: { allowFraction?: boolean; notation?: QuantityNotation }
): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  const allowFraction = options?.allowFraction ?? true;
  if (!allowFraction || options?.notation === "decimal") {
    return formatQuantityDecimal(value);
  }
  return formatQuantity(value);
}

// スピン（上下）操作で1刻みに増減した値を文字列で返す。浮動小数の誤差を丸める。分数値からの増減も扱う。
export function stepDecimalString(value: string, step: number, direction: 1 | -1, min: number): string {
  const parsed = parseQuantityInput(value);
  const base = parsed.ok ? parsed.value : 0;
  let next = base + step * direction;
  if (Number.isFinite(min) && next < min) {
    next = min;
  }
  return String(roundQuantity(next));
}
