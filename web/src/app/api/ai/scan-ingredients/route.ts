import { NextResponse } from "next/server";
import {
  buildGeminiIngredientScanRequest,
  GEMINI_INGREDIENT_SCAN_MODEL,
  parseGeminiIngredientResponse,
  toInventoryInsert
} from "@/lib/ai/ingredient-scan";
import { consumeAiUsage, refundAiUsage } from "@/lib/ai/usage";
import { fetchAccountStatus } from "@/lib/auth/account-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ScanRequest = {
  geminiApiKey?: unknown;
  photoId?: unknown;
  photoIds?: unknown;
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
  forbidden:
    "原因: このアカウントはまだ利用が承認されていません。影響: AI解析を実行できません。修正方法: 管理者の承認をお待ちください。",
  missingApiKey:
    "原因: ユーザー自身のGemini APIキーが未入力です。影響: AI解析を実行できません。修正方法: Gemini APIキーを入力してから再度お試しください。",
  photoNotFound:
    "原因: 解析対象の写真が見つかりませんでした。影響: AI解析を実行できません。修正方法: 写真を撮り直して保存してください。",
  downloadFailed:
    "原因: 非公開Storageから写真を読み出せませんでした。影響: AI解析を実行できません。修正方法: ログイン状態と写真の保存状態を確認してください。",
  geminiFailed:
    "原因: Gemini APIの解析に失敗しました。影響: 食材候補を作成できません。修正方法: 時間を置いて再度解析してください。",
  featureLimit:
    "原因: 本日の食材写真解析の上限に達しました。影響: 今日は食材写真解析を実行できません。修正方法: 明日再度お試しください。",
  totalLimit:
    "原因: 本日のAI利用の合計上限に達しました。影響: 今日はAI機能を実行できません。修正方法: 明日再度お試しください。"
};

function limitErrorMessage(reason: string | undefined) {
  return reason === "total_limit" ? ERROR_MESSAGES.totalLimit : ERROR_MESSAGES.featureLimit;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ScanRequest | null;
  const photoIds = normalizePhotoIds(body);
  const apiKey = typeof body?.geminiApiKey === "string" ? body.geminiApiKey.trim().slice(0, 300) : "";

  if (photoIds.length === 0) {
    return errorResponse(ERROR_MESSAGES.invalidRequest, 400);
  }

  if (!apiKey) {
    return errorResponse(ERROR_MESSAGES.missingApiKey, 400);
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(ERROR_MESSAGES.unauthorized, 401);
  }

  // middleware に加えた多層防御。承認済み以外は AI route を実行させない。
  if ((await fetchAccountStatus(supabase, user.id)) !== "approved") {
    return errorResponse(ERROR_MESSAGES.forbidden, 403);
  }

  const items: Array<ReturnType<typeof toInventoryInsert>> = [];
  const errors: string[] = [];

  for (const photoId of photoIds) {
    const result = await scanOnePhoto({ apiKey, photoId, supabase, userId: user.id });
    if (result.ok) {
      items.push(...result.items.map((item) => toInventoryInsert(item, user.id)));
    } else {
      errors.push(result.error);
    }
  }

  if (items.length === 0) {
    const firstError = errors[0] ?? ERROR_MESSAGES.geminiFailed;
    const status = statusFromError(firstError);
    return errorResponse(firstError, status);
  }

  if (errors.length === 0) {
    return NextResponse.json({ items });
  }

  return NextResponse.json({ items, failedCount: errors.length, errors: errors.slice(0, 3) });
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function normalizePhotoIds(body: ScanRequest | null) {
  const ids = Array.isArray(body?.photoIds)
    ? body.photoIds
    : typeof body?.photoId === "string"
      ? [body.photoId]
      : [];

  return [...new Set(ids.map((id) => (typeof id === "string" ? id.trim() : "")).filter(Boolean))].slice(0, 8);
}

async function scanOnePhoto({
  apiKey,
  photoId,
  supabase,
  userId
}: {
  apiKey: string;
  photoId: string;
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  userId: string;
}) {
  const { data: photo, error: photoError } = await supabase
    .from("photos")
    .select("id,user_id,bucket_id,storage_path,usage_type,content_type")
    .eq("id", photoId)
    .eq("user_id", userId)
    .eq("usage_type", "ingredient_scan")
    .single();

  if (photoError || !photo) {
    return { ok: false as const, error: ERROR_MESSAGES.photoNotFound };
  }

  // Gemini送信前（写真ダウンロード前）に原子的に1回分を予約する。超過時はStorage I/Oを行わない。
  const reservation = await consumeAiUsage(supabase, "ingredient_scan");
  if (!reservation.ok || !reservation.event_id) {
    return { ok: false as const, error: limitErrorMessage(reservation.reason) };
  }

  const eventId = reservation.event_id;
  const metadata = photo as PhotoMetadata;
  const { data: file, error: downloadError } = await supabase.storage
    .from(metadata.bucket_id)
    .download(metadata.storage_path);

  // 写真取得失敗時は予約を返金して当日枠を消費しない。
  if (downloadError || !file) {
    await refundAiUsage(supabase, eventId);
    return { ok: false as const, error: ERROR_MESSAGES.downloadFailed };
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

  // 通信失敗（Geminiが処理する前）は予約を返金して当日枠を消費しない。
  if (!geminiResponse.ok) {
    await refundAiUsage(supabase, eventId);
    return { ok: false as const, error: ERROR_MESSAGES.geminiFailed };
  }

  // ok応答後のparse失敗はGoogle quotaを実際に消費しているため消費したままにする。
  const parsed = parseGeminiIngredientResponse(await geminiResponse.json());
  if (!parsed.ok) {
    return { ok: false as const, error: parsed.error };
  }

  return { ok: true as const, items: parsed.items };
}

function statusFromError(error: string) {
  if (error === ERROR_MESSAGES.photoNotFound) return 404;
  if (error === ERROR_MESSAGES.downloadFailed) return 500;
  if (error === ERROR_MESSAGES.geminiFailed) return 502;
  if (error === ERROR_MESSAGES.featureLimit || error === ERROR_MESSAGES.totalLimit) return 429;
  return 422;
}
