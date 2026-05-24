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

export function buildPhotoStoragePath(userId: string) {
  const randomPart = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${userId}/ingredient-scan/${Date.now()}-${randomPart}.jpg`;
}
