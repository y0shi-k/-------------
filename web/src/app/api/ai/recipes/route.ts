import { NextResponse } from "next/server";
import {
  buildGeminiRecipeRequest,
  GEMINI_RECIPE_MODEL,
  parseGeminiRecipeResponse
} from "@/lib/ai/recipe-generation";
import { consumeAiUsage, refundAiUsage } from "@/lib/ai/usage";
import { fetchAccountStatus } from "@/lib/auth/account-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RecipeAiRequest = {
  geminiApiKey?: unknown;
  mode?: unknown;
  required?: unknown;
  optional?: unknown;
  sourceText?: unknown;
};

const ERROR_MESSAGES = {
  unauthorized:
    "原因: ログイン状態を確認できませんでした。影響: AIレシピを実行できません。修正方法: 再ログインしてから再度お試しください。",
  forbidden:
    "原因: このアカウントはまだ利用が承認されていません。影響: AIレシピを実行できません。修正方法: 管理者の承認をお待ちください。",
  missingApiKey:
    "原因: ユーザー自身のGemini APIキーが未入力です。影響: AIレシピを実行できません。修正方法: Gemini APIキーを入力してから再度お試しください。",
  invalidRequest:
    "原因: AIレシピの入力が空です。影響: レシピ案を作れません。修正方法: 食材やレシピ本文を入力してください。",
  geminiFailed:
    "原因: Gemini APIのレシピ生成に失敗しました。影響: レシピ案を表示できません。修正方法: 時間を置いて再度お試しください。",
  featureLimit:
    "原因: 本日のAIレシピ生成の上限に達しました。影響: 今日はAIレシピ生成を実行できません。修正方法: 明日再度お試しください。",
  totalLimit:
    "原因: 本日のAI利用の合計上限に達しました。影響: 今日はAI機能を実行できません。修正方法: 明日再度お試しください。"
};

function limitErrorMessage(reason: string | undefined) {
  return reason === "total_limit" ? ERROR_MESSAGES.totalLimit : ERROR_MESSAGES.featureLimit;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RecipeAiRequest | null;
  const mode = body?.mode === "structure" ? "structure" : "generate";
  const required = typeof body?.required === "string" ? body.required.trim().slice(0, 1000) : "";
  const optional = typeof body?.optional === "string" ? body.optional.trim().slice(0, 1000) : "";
  const sourceText = typeof body?.sourceText === "string" ? body.sourceText.trim().slice(0, 5000) : "";
  const apiKey = typeof body?.geminiApiKey === "string" ? body.geminiApiKey.trim().slice(0, 300) : "";

  if (!required && !optional && !sourceText) {
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

  // Gemini送信前に原子的に1回分を予約する。上限超過時はGeminiへ送らない。
  const reservation = await consumeAiUsage(supabase, "recipe_generation");
  if (!reservation.ok || !reservation.event_id) {
    return errorResponse(limitErrorMessage(reservation.reason), 429);
  }

  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_RECIPE_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify(buildGeminiRecipeRequest({ mode, required, optional, sourceText }))
  });

  // 通信失敗（Geminiが処理する前）は予約を返金して当日枠を消費しない。
  if (!geminiResponse.ok) {
    await refundAiUsage(supabase, reservation.event_id);
    return errorResponse(ERROR_MESSAGES.geminiFailed, 502);
  }

  // ok応答後のparse失敗はGoogle quotaを実際に消費しているため消費したままにする。
  const parsed = parseGeminiRecipeResponse(await geminiResponse.json(), { mode, sourceText });
  if (!parsed.ok) {
    return errorResponse(parsed.error, 422);
  }

  return NextResponse.json({ recipe: parsed.recipe });
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
