import "server-only";

import type { RecipeFormValues, RecipeIngredientFormValues } from "@/lib/recipes/types";

export const GEMINI_RECIPE_MODEL = "gemini-3-flash-preview";

export type AiRecipeResult =
  | { ok: true; recipe: RecipeFormValues }
  | { ok: false; error: string };

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

type RawRecipe = {
  name?: unknown;
  genre?: unknown;
  source?: unknown;
  prep_steps?: unknown;
  steps?: unknown;
  ingredients?: unknown;
};

type RawIngredient = {
  item_type?: unknown;
  type?: unknown;
  name?: unknown;
  amount?: unknown;
  unit?: unknown;
};

export function buildGeminiRecipeRequest(input: { mode: "generate" | "structure"; required: string; optional: string; sourceText: string }) {
  const prompt =
    input.mode === "structure"
      ? [
          "次のレシピ本文をWebアプリに保存しやすいJSONへ構造化してください。",
          "説明文やMarkdownは不要です。JSONだけを返してください。",
          ingredientTypeRule(),
          recipeJsonSchema(),
          `本文:\n${input.sourceText}`
        ].join("\n\n")
      : [
          "次の条件から家庭料理のレシピ案を1つ作ってください。",
          "必須食材は必ず使い、任意食材は合う場合だけ使ってください。",
          "説明文やMarkdownは不要です。JSONだけを返してください。",
          ingredientTypeRule(),
          recipeJsonSchema(),
          `必須食材:\n${input.required || "指定なし"}`,
          `任意食材:\n${input.optional || "指定なし"}`,
          `補足:\n${input.sourceText || "なし"}`
        ].join("\n\n");

  return {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      response_mime_type: "application/json"
    }
  };
}

export function parseGeminiRecipeResponse(response: GeminiResponse): AiRecipeResult {
  const text = extractGeminiText(response);
  if (!text) {
    return { ok: false, error: "原因: AIの返答が空でした。影響: レシピ案を表示できません。修正方法: 条件を変えて再度お試しください。" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(unwrapJsonText(text));
  } catch {
    return { ok: false, error: "原因: AIの返答をJSONとして読めませんでした。影響: レシピ案を表示できません。修正方法: もう一度実行してください。" };
  }

  const recipe = normalizeRecipe(parsed);
  if (!recipe) {
    return { ok: false, error: "原因: AIの返答にレシピ名や材料が不足しています。影響: レシピ案を表示できません。修正方法: 条件を少し具体的にしてください。" };
  }

  return { ok: true, recipe };
}

function ingredientTypeRule() {
  return '材料の item_type は、醤油・味噌・塩・砂糖・酢・油・みりん・酒・だし・コンソメ・スパイス等の調味料は "調味料"、それ以外の具材は "食材" にしてください。';
}

function recipeJsonSchema() {
  return '形式: {"name":"レシピ名","genre":["和食"],"source":"AI提案","ingredients":[{"item_type":"食材","name":"玉ねぎ","amount":1,"unit":"個"},{"item_type":"調味料","name":"醤油","amount":15,"unit":"ml"}],"prep_steps":["切る"],"steps":["炒める"]}';
}

function extractGeminiText(response: GeminiResponse): string {
  return (
    response.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim() ?? ""
  );
}

function unwrapJsonText(text: string) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function normalizeRecipe(value: unknown): RecipeFormValues | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as RawRecipe;
  const name = cleanText(raw.name);
  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map(normalizeIngredient).filter((item): item is RecipeIngredientFormValues => Boolean(item))
    : [];

  if (!name || ingredients.length === 0) return null;

  return {
    name,
    genre: normalizeStringList(raw.genre).join(", "),
    source: cleanText(raw.source) || "AI提案",
    prep_steps: normalizeStringList(raw.prep_steps).join("\n"),
    steps: normalizeStringList(raw.steps).join("\n"),
    ingredients
  };
}

function normalizeIngredient(value: unknown): RecipeIngredientFormValues | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as RawIngredient;
  const name = cleanText(raw.name);
  if (!name) return null;
  const amount = normalizeAmount(raw.amount);
  return {
    item_type: raw.item_type === "調味料" || raw.type === "調味料" ? "調味料" : "食材",
    name,
    amount: amount || "1",
    unit: cleanText(raw.unit) || "個"
  };
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 160) : "";
}

function normalizeAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return String(value);
  if (typeof value === "string") return value.trim().slice(0, 20);
  return "";
}

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanText).filter(Boolean).slice(0, 20);
}
