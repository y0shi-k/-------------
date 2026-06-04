import "server-only";

import type { ItemCategory, StockItem } from "@/lib/inventory/types";

export type IngredientScanCandidate = {
  category: ItemCategory;
  name: string;
  quantity: number;
  unit: string;
  display_expires_on: string | null;
  effective_expires_on: string | null;
  storage_location: string;
  status_note: string;
  raw_text: string;
};

type GeminiPart = {
  text?: unknown;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

type RawIngredient = {
  category?: unknown;
  name?: unknown;
  quantity?: unknown;
  unit?: unknown;
  display_expires_on?: unknown;
  effective_expires_on?: unknown;
  storage_location?: unknown;
  status_note?: unknown;
};

export type GeminiScanResult =
  | { ok: true; items: IngredientScanCandidate[] }
  | { ok: false; error: string };

export const GEMINI_INGREDIENT_SCAN_MODEL = "gemini-3-flash-preview";

const MAX_CANDIDATES = 12;
const UNWANTED_NAME_PATTERNS = [
  /店$/,
  /店舗/,
  /住所/,
  /電話/,
  /tel/i,
  /合計/,
  /小計/,
  /消費税/,
  /税/,
  /レシート/,
  /領収/,
  /カード/,
  /現金/,
  /お釣/
];

export const INGREDIENT_SCAN_PROMPT = [
  "写真から食材または調味料だけを抽出してください。",
  "レシート、食材パッケージ、冷蔵庫内の写真を想定します。",
  "店舗名、住所、電話番号、合計金額、税額、決済情報、個人情報は結果に含めないでください。",
  "JSONだけを返してください。説明文やMarkdownは不要です。",
  "形式: {\"items\":[{\"category\":\"食材\",\"name\":\"牛乳\",\"quantity\":1,\"unit\":\"本\",\"display_expires_on\":null,\"effective_expires_on\":null,\"storage_location\":\"冷蔵庫\",\"status_note\":\"AI解析候補\"}]}",
  "categoryは必ず「食材」または「調味料」にしてください。",
  "数量が読み取れない場合は quantity を 1、unit を「個」にしてください。",
  "保存場所が分からない場合は storage_location を「その他」にしてください。"
].join("\n");

export function buildGeminiIngredientScanRequest(mimeType: string, base64Image: string) {
  return {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image
            }
          },
          {
            text: INGREDIENT_SCAN_PROMPT
          }
        ]
      }
    ],
    generationConfig: {
      response_mime_type: "application/json"
    }
  };
}

export function extractGeminiText(response: GeminiResponse): string {
  return (
    response.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim() ?? ""
  );
}

export function parseGeminiIngredientResponse(response: GeminiResponse): GeminiScanResult {
  const text = extractGeminiText(response);
  if (!text) {
    return {
      ok: false,
      error: "原因: AI解析結果が空でした。影響: 食材候補を作成できません。修正方法: 写真を撮り直して再度解析してください。"
    };
  }

  const jsonText = unwrapJsonText(text);
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      error: "原因: AI解析結果をJSONとして読めませんでした。影響: 食材候補を作成できません。修正方法: 別の写真で再度解析してください。"
    };
  }

  const rawItems = Array.isArray(parsed) ? parsed : readItemsArray(parsed);
  if (!rawItems) {
    return {
      ok: false,
      error: "原因: AI解析結果に食材候補がありませんでした。影響: 食材候補を作成できません。修正方法: 食材名が写るように撮り直してください。"
    };
  }

  const items = rawItems.map(normalizeIngredient).filter((item): item is IngredientScanCandidate => Boolean(item));

  if (items.length === 0) {
    return {
      ok: false,
      error: "原因: 食材として使える候補が見つかりませんでした。影響: 食材候補を作成できません。修正方法: 店舗情報ではなく食材名が写る写真を選んでください。"
    };
  }

  return { ok: true, items: items.slice(0, MAX_CANDIDATES) };
}

export function toStagingInsert(candidate: IngredientScanCandidate, userId: string): Omit<StockItem, "id" | "created_at" | "updated_at" | "image_storage_path"> & {
  raw_text: string;
} {
  return {
    user_id: userId,
    category: candidate.category,
    name: candidate.name,
    quantity: candidate.quantity,
    unit: candidate.unit,
    unit_conversion: null,
    display_expires_on: candidate.display_expires_on,
    effective_expires_on: candidate.effective_expires_on,
    storage_location: candidate.storage_location,
    status_note: candidate.status_note,
    source: "ai_photo",
    raw_text: candidate.raw_text
  };
}

export function toInventoryInsert(candidate: IngredientScanCandidate, userId: string): Omit<StockItem, "id" | "created_at" | "updated_at" | "image_storage_path"> {
  return {
    user_id: userId,
    category: candidate.category,
    name: candidate.name,
    quantity: candidate.quantity,
    unit: candidate.unit,
    unit_conversion: null,
    display_expires_on: candidate.display_expires_on,
    effective_expires_on: candidate.effective_expires_on,
    storage_location: candidate.storage_location,
    status_note: candidate.status_note,
    source: "ai_photo"
  };
}

function unwrapJsonText(text: string) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function readItemsArray(value: unknown): RawIngredient[] | null {
  if (!value || typeof value !== "object") return null;
  const items = (value as { items?: unknown }).items;
  return Array.isArray(items) ? items : null;
}

function normalizeIngredient(value: unknown): IngredientScanCandidate | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as RawIngredient;
  const name = cleanText(raw.name);

  if (!name || isUnwantedName(name)) return null;

  return {
    category: raw.category === "調味料" ? "調味料" : "食材",
    name,
    quantity: normalizeQuantity(raw.quantity),
    unit: cleanText(raw.unit) || "個",
    display_expires_on: normalizeDate(raw.display_expires_on),
    effective_expires_on: normalizeDate(raw.effective_expires_on),
    storage_location: cleanText(raw.storage_location) || "その他",
    status_note: cleanText(raw.status_note) || "AI解析候補",
    raw_text: JSON.stringify(raw)
  };
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 80) : "";
}

function normalizeQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(quantity) && quantity >= 0 ? quantity : 1;
}

function normalizeDate(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function isUnwantedName(name: string) {
  return UNWANTED_NAME_PATTERNS.some((pattern) => pattern.test(name));
}
