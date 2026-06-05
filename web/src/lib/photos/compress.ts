export type CompressedPhoto = {
  blob: Blob;
  byteSize: number;
  contentType: string;
  height: number;
  width: number;
};

const DEFAULT_MAX_EDGE = 1024;
const OUTPUT_CONTENT_TYPE = "image/jpeg";
const OUTPUT_QUALITY = 0.82;

/** レシピ画像（4:3 カード）向けの圧縮パラメータ。元画像を巨大なまま保存しない。 */
const RECIPE_IMAGE_MAX_EDGE = 1280;
const RECIPE_IMAGE_ASPECT = 4 / 3;
const RECIPE_IMAGE_WEBP_QUALITY = 0.82;
const RECIPE_IMAGE_WEBP_CONTENT_TYPE = "image/webp";
const RECIPE_IMAGE_JPEG_CONTENT_TYPE = "image/jpeg";
const INGREDIENT_IMAGE_MAX_EDGE = 1024;
const INGREDIENT_IMAGE_WEBP_QUALITY = 0.82;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像を読み込めませんでした。"));
    };
    image.src = objectUrl;
  });
}

function getScaledSize(width: number, height: number, maxEdge: number) {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdge) {
    return { width, height };
  }

  const scale = maxEdge / longestEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("画像を圧縮できませんでした。"));
          return;
        }
        resolve(blob);
      },
      OUTPUT_CONTENT_TYPE,
      OUTPUT_QUALITY
    );
  });
}

export async function compressImageFile(file: File, maxEdge = DEFAULT_MAX_EDGE): Promise<CompressedPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選んでください。");
  }

  const image = await loadImage(file);
  const size = getScaledSize(image.naturalWidth || image.width, image.naturalHeight || image.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("画像処理を開始できませんでした。");
  }

  context.drawImage(image, 0, 0, size.width, size.height);
  const blob = await canvasToBlob(canvas);

  return {
    blob,
    byteSize: blob.size,
    contentType: OUTPUT_CONTENT_TYPE,
    height: size.height,
    width: size.width
  };
}

function canvasToBlobTyped(canvas: HTMLCanvasElement, contentType: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), contentType, quality);
  });
}

/**
 * 中央クロップ後の描画矩形を求める。元画像の縦横比を目標比に合わせて中央でクロップする。
 * 切り抜き位置の偏りを避けるため常に中央基準。
 */
function getCenterCropRect(width: number, height: number, targetAspect: number) {
  const sourceAspect = width / height;
  if (sourceAspect > targetAspect) {
    // 横長すぎる: 幅を削る。
    const cropWidth = Math.round(height * targetAspect);
    return { sx: Math.round((width - cropWidth) / 2), sy: 0, sWidth: cropWidth, sHeight: height };
  }
  // 縦長すぎる: 高さを削る。
  const cropHeight = Math.round(width / targetAspect);
  return { sx: 0, sy: Math.round((height - cropHeight) / 2), sWidth: width, sHeight: cropHeight };
}

/**
 * レシピ画像をカード向けに圧縮・リサイズする。
 * - 4:3 に中央クロップし、最長辺を最大 1280px へ縮小する（元画像を巨大なまま保存しない）。
 * - 既定で WebP 出力。toBlob が WebP 非対応の環境では JPEG へフォールバックする。
 * 拡張子は呼び出し側が `contentType` を見て決める。
 */
export async function compressRecipeImageFile(file: File): Promise<CompressedPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選んでください。");
  }

  const image = await loadImage(file);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (!naturalWidth || !naturalHeight) {
    throw new Error("画像のサイズを取得できませんでした。");
  }

  const crop = getCenterCropRect(naturalWidth, naturalHeight, RECIPE_IMAGE_ASPECT);
  const scaled = getScaledSize(crop.sWidth, crop.sHeight, RECIPE_IMAGE_MAX_EDGE);

  const canvas = document.createElement("canvas");
  canvas.width = scaled.width;
  canvas.height = scaled.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("画像処理を開始できませんでした。");
  }
  context.drawImage(image, crop.sx, crop.sy, crop.sWidth, crop.sHeight, 0, 0, scaled.width, scaled.height);

  const webpBlob = await canvasToBlobTyped(canvas, RECIPE_IMAGE_WEBP_CONTENT_TYPE, RECIPE_IMAGE_WEBP_QUALITY);
  if (webpBlob && webpBlob.type === RECIPE_IMAGE_WEBP_CONTENT_TYPE) {
    return { blob: webpBlob, byteSize: webpBlob.size, contentType: RECIPE_IMAGE_WEBP_CONTENT_TYPE, height: scaled.height, width: scaled.width };
  }

  const jpegBlob = await canvasToBlobTyped(canvas, RECIPE_IMAGE_JPEG_CONTENT_TYPE, RECIPE_IMAGE_WEBP_QUALITY);
  if (!jpegBlob) {
    throw new Error("画像を圧縮できませんでした。");
  }
  return { blob: jpegBlob, byteSize: jpegBlob.size, contentType: RECIPE_IMAGE_JPEG_CONTENT_TYPE, height: scaled.height, width: scaled.width };
}

/**
 * 食材画像を表示用に圧縮・リサイズする。
 * 元の縦横比は保ち、最長辺を最大 1024px にする。WebP 非対応環境では JPEG に戻す。
 */
export async function compressIngredientImageFile(file: File): Promise<CompressedPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選んでください。");
  }

  const image = await loadImage(file);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (!naturalWidth || !naturalHeight) {
    throw new Error("画像のサイズを取得できませんでした。");
  }

  const scaled = getScaledSize(naturalWidth, naturalHeight, INGREDIENT_IMAGE_MAX_EDGE);
  const canvas = document.createElement("canvas");
  canvas.width = scaled.width;
  canvas.height = scaled.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("画像処理を開始できませんでした。");
  }
  context.drawImage(image, 0, 0, scaled.width, scaled.height);

  const webpBlob = await canvasToBlobTyped(canvas, RECIPE_IMAGE_WEBP_CONTENT_TYPE, INGREDIENT_IMAGE_WEBP_QUALITY);
  if (webpBlob && webpBlob.type === RECIPE_IMAGE_WEBP_CONTENT_TYPE) {
    return { blob: webpBlob, byteSize: webpBlob.size, contentType: RECIPE_IMAGE_WEBP_CONTENT_TYPE, height: scaled.height, width: scaled.width };
  }

  const jpegBlob = await canvasToBlobTyped(canvas, RECIPE_IMAGE_JPEG_CONTENT_TYPE, INGREDIENT_IMAGE_WEBP_QUALITY);
  if (!jpegBlob) {
    throw new Error("画像を圧縮できませんでした。");
  }
  return { blob: jpegBlob, byteSize: jpegBlob.size, contentType: RECIPE_IMAGE_JPEG_CONTENT_TYPE, height: scaled.height, width: scaled.width };
}

/** contentType から Storage path の拡張子を決める（WebP / JPEG）。 */
export function imageExtensionFromContentType(contentType: string): string {
  return contentType === RECIPE_IMAGE_WEBP_CONTENT_TYPE ? "webp" : "jpg";
}

export function buildPhotoStoragePath(userId: string) {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${userId}/ingredient-scan/${Date.now()}-${randomPart}.jpg`;
}

export function buildCookingHistoryPhotoStoragePath(userId: string) {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${userId}/cooking-history/${Date.now()}-${randomPart}.jpg`;
}

function randomFileStem() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * ユーザー登録レシピ画像の Storage path。
 * 既存 `photos` バケット内に `<user_id>/recipe-images/<recipe_id>/<uuid>.<ext>` で置く。
 * 先頭フォルダが user_id のため、既存の本人限定 storage policy でそのまま保護される。
 */
export function buildRecipeImageStoragePath(userId: string, recipeId: string, extension = "webp") {
  return `${userId}/recipe-images/${recipeId}/${randomFileStem()}.${extension}`;
}

/**
 * ユーザー登録食材（在庫アイテム）画像の Storage path。
 * 既存 `photos` バケット内に `<user_id>/inventory-images/<item_id>/<uuid>.<ext>` で置く。
 */
export function buildInventoryImageStoragePath(userId: string, itemId: string, extension = "webp") {
  return `${userId}/inventory-images/${itemId}/${randomFileStem()}.${extension}`;
}

/**
 * 同名食材で再利用するユーザー画像の Storage path。
 * normalizedName はUI側で NFKC / 小文字 / 空白除去済みにする。
 */
export function buildUserIngredientImageStoragePath(userId: string, normalizedName: string, extension = "webp") {
  return `${userId}/ingredient-images/${encodeURIComponent(normalizedName)}/${randomFileStem()}.${extension}`;
}
