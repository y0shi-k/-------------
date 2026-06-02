import type { SupabaseClient } from "@supabase/supabase-js";

// AI 利用機能。SQL 関数の check 制約と一致させる。
export type AiUsageFeature = "recipe_generation" | "ingredient_scan";

// consume_ai_usage の戻り値。上限値はサーバー（SQL関数）が単一管理する。
export type ConsumeAiUsageResult = {
  ok: boolean;
  event_id?: string;
  reason?: "feature_limit" | "total_limit" | "unauthorized" | "invalid_feature";
  remaining_feature?: number;
  remaining_total?: number;
};

type AiUsageCounter = {
  used: number;
  limit: number;
  remaining: number;
};

// get_ai_usage_summary の戻り値。UI の残り表示はこれを使う（上限値をハードコードしない）。
export type AiUsageSummary = {
  ok: boolean;
  reason?: string;
  recipe_generation: AiUsageCounter;
  ingredient_scan: AiUsageCounter;
  total: AiUsageCounter;
};

type SummaryClient = Pick<SupabaseClient, "rpc">;

const emptyCounter: AiUsageCounter = { used: 0, limit: 0, remaining: 0 };

// サマリ取得に失敗してもUIを壊さないためのフォールバック。残り0扱いはしない。
const fallbackSummary: AiUsageSummary = {
  ok: false,
  recipe_generation: { ...emptyCounter },
  ingredient_scan: { ...emptyCounter },
  total: { ...emptyCounter }
};

export async function consumeAiUsage(
  supabase: SummaryClient,
  feature: AiUsageFeature
): Promise<ConsumeAiUsageResult> {
  const { data, error } = await supabase.rpc("consume_ai_usage", { p_feature: feature });

  if (error || !data || typeof data !== "object") {
    return { ok: false };
  }

  return data as ConsumeAiUsageResult;
}

export async function refundAiUsage(supabase: SummaryClient, eventId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("refund_ai_usage", { p_event_id: eventId });
  if (error) return false;
  return data === true;
}

export async function getAiUsageSummary(supabase: SummaryClient): Promise<AiUsageSummary> {
  const { data, error } = await supabase.rpc("get_ai_usage_summary");

  if (error || !data || typeof data !== "object") {
    return fallbackSummary;
  }

  return data as AiUsageSummary;
}
