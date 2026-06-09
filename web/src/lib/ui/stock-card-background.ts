// 食材カードの背景写真（TKT-0215）の「濃さ＝写真の見え方」を端末内（localStorage）に記憶する。
// CSS 側はオーバーレイの不透明度を CSS変数 `--stock-bg-overlay` で受け取り、
// 値が小さいほど写真がくっきり、値が大きいほど写真が薄く（背景色寄りに）なる。
// ユーザーには「濃さ（intensity 0〜100）」で見せ、ここで不透明度へ変換する。schema は変更しない。

const STORAGE_KEY = "stock-master:stock-card-bg-intensity:v1";
const CSS_VAR = "--stock-bg-overlay";

// 文字ラベルの背景プレート（写真の上の文字を読みやすくする）の設定キー。
const LABEL_COLOR_KEY = "stock-master:stock-card-label-bg-color:v1";
const LABEL_ALPHA_KEY = "stock-master:stock-card-label-bg-alpha:v1";
const LABEL_RGB_CSS_VAR = "--stock-label-bg-rgb";
const LABEL_ALPHA_CSS_VAR = "--stock-label-bg-alpha";
const LABEL_FG_CSS_VAR = "--stock-label-fg";

export const DEFAULT_LABEL_BG_COLOR = "#ffffff";
export const DEFAULT_LABEL_BG_ALPHA = 82; // 0〜100（%）。文字背景プレートの不透明度。

// 濃さ（intensity）の範囲とオーバーレイ不透明度のマッピング。
// intensity が大きいほど写真をくっきり見せる（= オーバーレイを薄くする）。
// 可読性確保のため、最も濃くしてもオーバーレイは MIN_ALPHA より薄くしない。
export const MIN_INTENSITY = 0;
export const MAX_INTENSITY = 100;
export const DEFAULT_INTENSITY = 35;

const MIN_OVERLAY_ALPHA = 0.4; // intensity=100（最も濃い／写真くっきり）
const MAX_OVERLAY_ALPHA = 0.92; // intensity=0（最も薄い／写真ほぼ見えない）

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clampIntensity(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_INTENSITY;
  }
  return Math.min(MAX_INTENSITY, Math.max(MIN_INTENSITY, Math.round(value)));
}

// 濃さ（0〜100）→ オーバーレイ不透明度（0.4〜0.92）へ変換する。
export function intensityToOverlayAlpha(intensity: number): number {
  const ratio = clampIntensity(intensity) / MAX_INTENSITY;
  const alpha = MAX_OVERLAY_ALPHA - ratio * (MAX_OVERLAY_ALPHA - MIN_OVERLAY_ALPHA);
  return Math.round(alpha * 1000) / 1000;
}

// 記憶された濃さを返す（未設定なら既定値）。
export function getStockCardBgIntensity(): number {
  if (!isBrowser()) {
    return DEFAULT_INTENSITY;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_INTENSITY;
    }
    const parsed = Number.parseInt(raw, 10);
    return clampIntensity(parsed);
  } catch (error) {
    console.error("食材カード背景の濃さの読み込みに失敗しました:", error);
    return DEFAULT_INTENSITY;
  }
}

// 濃さを保存する。
export function setStockCardBgIntensity(intensity: number): number {
  const next = clampIntensity(intensity);
  if (!isBrowser()) {
    return next;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch (error) {
    console.error("食材カード背景の濃さの保存に失敗しました:", error);
  }
  return next;
}

// CSS変数 `--stock-bg-overlay` を document root に反映する（表示への即時反映用）。
export function applyStockCardBgIntensity(intensity: number): void {
  if (typeof document === "undefined") {
    return;
  }
  const alpha = intensityToOverlayAlpha(intensity);
  document.documentElement.style.setProperty(CSS_VAR, String(alpha));
}

// ---- 文字ラベルの背景プレート ----

// "#rrggbb" を検証して正規化する（不正なら既定色）。
function normalizeHexColor(value: string | null): string {
  if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
    return value.toLowerCase();
  }
  return DEFAULT_LABEL_BG_COLOR;
}

// "#rrggbb" → "r g b"（CSS の rgb() に渡す成分文字列）。
function hexToRgbTriplet(hex: string): string {
  const normalized = normalizeHexColor(hex);
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

// 背景色の明度から、読みやすい文字色（濃紺 or 白）を選ぶ。
function contrastForeground(hex: string): string {
  const normalized = normalizeHexColor(hex);
  const r = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const g = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const b = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  // 相対輝度（簡易・sRGBの線形化は省略した近似）。
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}

function clampAlpha(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LABEL_BG_ALPHA;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

// 記憶された文字背景色を返す（未設定なら既定色）。
export function getStockLabelBgColor(): string {
  if (!isBrowser()) {
    return DEFAULT_LABEL_BG_COLOR;
  }
  try {
    return normalizeHexColor(window.localStorage.getItem(LABEL_COLOR_KEY));
  } catch (error) {
    console.error("文字背景色の読み込みに失敗しました:", error);
    return DEFAULT_LABEL_BG_COLOR;
  }
}

// 記憶された文字背景の濃さ（0〜100）を返す（未設定なら既定値）。
export function getStockLabelBgAlpha(): number {
  if (!isBrowser()) {
    return DEFAULT_LABEL_BG_ALPHA;
  }
  try {
    const raw = window.localStorage.getItem(LABEL_ALPHA_KEY);
    if (raw === null) {
      return DEFAULT_LABEL_BG_ALPHA;
    }
    return clampAlpha(Number.parseInt(raw, 10));
  } catch (error) {
    console.error("文字背景の濃さの読み込みに失敗しました:", error);
    return DEFAULT_LABEL_BG_ALPHA;
  }
}

// 文字背景色を保存する。
export function setStockLabelBgColor(color: string): string {
  const next = normalizeHexColor(color);
  if (!isBrowser()) {
    return next;
  }
  try {
    window.localStorage.setItem(LABEL_COLOR_KEY, next);
  } catch (error) {
    console.error("文字背景色の保存に失敗しました:", error);
  }
  return next;
}

// 文字背景の濃さを保存する。
export function setStockLabelBgAlpha(alpha: number): number {
  const next = clampAlpha(alpha);
  if (!isBrowser()) {
    return next;
  }
  try {
    window.localStorage.setItem(LABEL_ALPHA_KEY, String(next));
  } catch (error) {
    console.error("文字背景の濃さの保存に失敗しました:", error);
  }
  return next;
}

// 文字ラベル背景の CSS変数（色成分・不透明度・文字色）を document root に反映する。
export function applyStockLabelBg(color: string, alpha: number): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement.style;
  root.setProperty(LABEL_RGB_CSS_VAR, hexToRgbTriplet(color));
  root.setProperty(LABEL_ALPHA_CSS_VAR, String(clampAlpha(alpha) / 100));
  root.setProperty(LABEL_FG_CSS_VAR, contrastForeground(color));
}
