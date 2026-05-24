import { NextResponse } from "next/server";
import {
  buildGeminiRecipeRequest,
  GEMINI_RECIPE_MODEL,
  parseGeminiRecipeResponse
} from "@/lib/ai/recipe-generation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type RecipeAiRequest = {
  mode?: unknown;
  required?: unknown;
  optional?: unknown;
  sourceText?: unknown;
};

const ERROR_MESSAGES = {
  unauthorized:
    "原因: ログイン状態を確認できませんでした。影響: AIレシピを実行できません。修正方法: 再ログインしてから再度お試しください。",
  missingApiKey:
    "原因: Gemini APIキーがサーバーに設定されていません。影響: AIレシピを実行できません。修正方法: web/.env.local またはVercel環境変数に GEMINI_API_KEY を設定してください。",
  invalidRequest:
    "原因: AIレシピの入力が空です。影響: レシピ案を作れません。修正方法: 食材やレシピ本文を入力してください。",
  geminiFailed:
    "原因: Gemini APIのレシピ生成に失敗しました。影響: レシピ案を表示できません。修正方法: 時間を置いて再度お試しください。"
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RecipeAiRequest | null;
  const mode = body?.mode === "structure" ? "structure" : "generate";
  const required = typeof body?.required === "string" ? body.required.trim().slice(0, 1000) : "";
  const optional = typeof body?.optional === "string" ? body.optional.trim().slice(0, 1000) : "";
  const sourceText = typeof body?.sourceText === "string" ? body.sourceText.trim().slice(0, 5000) : "";

  if (!required && !optional && !sourceText) {
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

  const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_RECIPE_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify(buildGeminiRecipeRequest({ mode, required, optional, sourceText }))
  });

  if (!geminiResponse.ok) {
    return errorResponse(ERROR_MESSAGES.geminiFailed, 502);
  }

  const parsed = parseGeminiRecipeResponse(await geminiResponse.json());
  if (!parsed.ok) {
    return errorResponse(parsed.error, 422);
  }

  return NextResponse.json({ recipe: parsed.recipe });
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
