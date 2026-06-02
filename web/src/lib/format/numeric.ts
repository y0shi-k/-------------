// 数値入力の正規化ヘルパー。
// Web標準にはPCのIME（日本語入力）を強制オフにする方法が無いため、
// 全角で入力されてもここで半角へ正規化して受け取る。

const FULLWIDTH_DIGIT_OFFSET = 0xfee0; // U+FF10('０') - 0x30('0')

// 全角数字・全角ピリオドを半角へ変換する。
export function toHalfWidthNumeric(value: string): string {
  return value
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - FULLWIDTH_DIGIT_OFFSET))
    .replace(/[．。]/g, ".");
}

// 数量入力欄向けに、半角の数字と小数点1つだけを残すよう整形する（min>=0前提のため符号は許可しない）。
// 入力途中の "1." も許容する。
export function sanitizeDecimalInput(value: string): string {
  const halfWidth = toHalfWidthNumeric(value).replace(/[^0-9.]/g, "");
  const firstDot = halfWidth.indexOf(".");
  if (firstDot === -1) {
    return halfWidth;
  }
  return halfWidth.slice(0, firstDot + 1) + halfWidth.slice(firstDot + 1).replace(/\./g, "");
}

// スピン（上下）操作で1刻みに増減した値を文字列で返す。浮動小数の誤差を丸める。
export function stepDecimalString(value: string, step: number, direction: 1 | -1, min: number): string {
  const current = Number(sanitizeDecimalInput(value));
  const base = Number.isFinite(current) ? current : 0;
  let next = base + step * direction;
  if (Number.isFinite(min) && next < min) {
    next = min;
  }
  next = Math.round(next * 1e6) / 1e6;
  return String(next);
}
