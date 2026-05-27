import { NextResponse } from "next/server";
import {
  buildGeminiIngredientScanRequest,
  GEMINI_INGREDIENT_SCAN_MODEL,
  parseGeminiIngredientResponse,
  toInventoryInsert
} from "@/lib/ai/ingredient-scan";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ScanRequest = {
  photoId?: unknown;
};

type PhotoMetadata = {
  id: string;
  user_id: string;
  bucket_id: string;
  storage_path: string;
  usage_type: string;
  content_type: string | null;
};

const ERROR_MESSAGES = {
  invalidRequest:
    "原因: 写真IDが正しくありません。影響: AI解析を開始できません。修正方法: 写真を保存してから再度解析してください。",
  unauthorized:
    "原因: ログイン状態を確認できませんでした。影響: 写真を解析できません。修正方法: 再ログインしてから再度お試しください。",
  missingApiKey:
    "原因: Gemini APIキーがサーバーに設定されていません。影響: AI解析を実行できません。修正方法: web/.env.local またはVercel環境変数に GEMINI_API_KEY を設定してください。",
  photoNotFound:
    "原因: 解析対象の写真が見つかりませんでした。影響: AI解析を実行できません。修正方法: 写真を撮り直して保存してください。",
  downloadFailed:
    "原因: 非公開Storageから写真を読み出せませんでした。影響: AI解析を実行できません。修正方法: ログイン状態と写真の保存状態を確認してください。",
  geminiFailed:
    "原因: Gemini APIの解析に失敗しました。影響: 食材候補を作成できません。修正方法: 時間を置いて再度解析してください。"
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ScanRequest | null;
  const photoId = typeof body?.photoId === "string" ? body.photoId.trim() : "";

  if (!photoId) {
    return errorResponse(ERROR_MESSAGES.invalidRequest, 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return errorResponse(ERROR_MESSAGES.missingApiKey, 500);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(ERROR_MESSAGES.unauthorized, 401);
  }

  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("id,user_id,bucket_id,storage_path,usage_type,content_type")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .eq("usage_type", "ingredient_scan")
    .single();

  if (photoError || !photo) {
    return errorResponse(ERROR_MESSAGES.photoNotFound, 404);
  }

  const metadata = photo as PhotoMetadata;
  const { data: file, error: downloadError } = await supabase.storage
    .from(metadata.bucket_id)
    .download(metadata.storage_path);

  if (downloadError || !file) {
    return errorResponse(ERROR_MESSAGES.downloadFailed, 500);
  }

  const mimeType = metadata.content_type || file.type || "image/jpeg";
  const base64Image = Buffer.from(await file.arrayBuffer()).toString("base64");
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_INGREDIENT_SCAN_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(buildGeminiIngredientScanRequest(mimeType, base64Image))
    }
  );

  if (!geminiResponse.ok) {
    return errorResponse(ERROR_MESSAGES.geminiFailed, 502);
  }

  const parsed = parseGeminiIngredientResponse(await geminiResponse.json());
  if (!parsed.ok) {
    return errorResponse(parsed.error, 422);
  }

  return NextResponse.json({ items: parsed.items.map((item) => toInventoryInsert(item, user.id)) });
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
