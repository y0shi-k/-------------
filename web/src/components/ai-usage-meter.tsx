"use client";

import type { AiUsageSummary } from "@/lib/ai/usage";

type AiUsageMeterProps = {
  summary: AiUsageSummary | null;
  // 強調する機能。該当機能の残り0なら理由文を出す（panel variant のみ有効）。
  feature?: "recipe_generation" | "ingredient_scan";
  // "panel"（既定）: ラベル・注記あり。"statusbar": ラベル・注記なし、バッジのみ。
  variant?: "panel" | "statusbar";
};

function reasonText(summary: AiUsageSummary, feature?: AiUsageMeterProps["feature"]) {
  if (summary.total.remaining <= 0) {
    return "本日のAI合計上限に達しました。明日再度お試しください。";
  }
  if (feature && summary[feature].remaining <= 0) {
    const label = feature === "recipe_generation" ? "AIレシピ生成" : "食材写真解析";
    return `本日の${label}の上限に達しました。明日再度お試しください。`;
  }
  return "";
}

export function AiUsageMeter({ summary, feature, variant = "panel" }: AiUsageMeterProps) {
  if (!summary || !summary.ok) {
    return null;
  }

  const recipe = summary.recipe_generation;
  const scan = summary.ingredient_scan;
  const total = summary.total;
  const isStatusbar = variant === "statusbar";
  const exhausted =
    !isStatusbar && (total.remaining <= 0 || (feature ? summary[feature].remaining <= 0 : false));
  const message = exhausted ? reasonText(summary, feature) : "";

  return (
    <div
      className="ai-usage-meter"
      data-variant={variant}
      role="status"
      aria-label="本日のAI利用残り回数"
    >
      {!isStatusbar && <span className="ai-usage-meter-label">本日のAI残り</span>}
      <span className="ai-usage-badge ai-usage-badge-recipe" data-empty={recipe.remaining <= 0}>
        レシピ {recipe.remaining}/{recipe.limit}
      </span>
      <span className="ai-usage-badge ai-usage-badge-scan" data-empty={scan.remaining <= 0}>
        写真 {scan.remaining}/{scan.limit}
      </span>
      <span className="ai-usage-badge ai-usage-badge-total" data-empty={total.remaining <= 0}>
        合計 {total.remaining}/{total.limit}
      </span>
      {exhausted && message ? <p className="ai-usage-meter-note">{message}</p> : null}
    </div>
  );
}
