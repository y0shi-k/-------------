"use client";

import { type ReactNode, useMemo, useState } from "react";

type ModeId = "ingredients" | "recipes" | "cooking";

type Mode = {
  id: ModeId;
  label: string;
  eyebrow: string;
  icon: string;
  shortLabel: string;
  status: string;
};

type WebModeShellProps = {
  userEmail: string;
  inventoryCount: number;
  recipeCount: number;
  mealCount: number;
  historyCount: number;
  childrenByMode: {
    ingredients: ReactNode;
    recipes: ReactNode;
    cooking: ReactNode;
  };
};

export function WebModeShell({
  userEmail,
  inventoryCount,
  recipeCount,
  mealCount,
  historyCount,
  childrenByMode
}: WebModeShellProps) {
  const [activeMode, setActiveMode] = useState<ModeId>("ingredients");
  const modes = useMemo<Mode[]>(
    () => [
      {
        id: "ingredients",
        label: "食材管理",
        eyebrow: "ALL STORAGE",
        icon: "III",
        shortLabel: "食材",
        status: `在庫 ${inventoryCount}件`
      },
      {
        id: "recipes",
        label: "献立・レシピ",
        eyebrow: "RECIPE COLLECTION",
        icon: "CAL",
        shortLabel: "献立",
        status: `レシピ ${recipeCount}件 / 献立 ${mealCount}件`
      },
      {
        id: "cooking",
        label: "料理・記録",
        eyebrow: "COOKING RECORD",
        icon: "REC",
        shortLabel: "記録",
        status: `料理履歴 ${historyCount}件`
      }
    ],
    [historyCount, inventoryCount, mealCount, recipeCount]
  );
  const active = modes.find((mode) => mode.id === activeMode) ?? modes[0];
  const activeChildren = childrenByMode[active.id];

  return (
    <>
      <div className="canvas-status-bar" role="status" aria-live="polite">
        <strong>待機中</strong>
        <span>|</span>
        <span>{active.label}: {active.status}</span>
        <small>{userEmail}</small>
      </div>
      <h1 className="sr-only">料理レシピ・食材管理</h1>
      <p className="sr-only">{active.status}</p>

      <section className="mode-panel" aria-labelledby={`mode-title-${active.id}`}>
        {active.id === "ingredients" ? (
          <h2 className="sr-only" id={`mode-title-${active.id}`}>
            {active.label}
          </h2>
        ) : (
          <div className="mode-heading">
            <div>
              <h2 id={`mode-title-${active.id}`}>{active.label}</h2>
              <p className="eyebrow">{active.eyebrow}</p>
            </div>
          </div>
        )}
        {activeChildren}
      </section>

      <nav className="bottom-mode-nav" aria-label="スマホ主モード">
        {modes.map((mode) => (
          <button
            aria-current={mode.id === activeMode ? "page" : undefined}
            data-active={mode.id === activeMode}
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            type="button"
          >
            <span aria-hidden="true">{mode.icon}</span>
            <strong>{mode.label}</strong>
          </button>
        ))}
      </nav>
    </>
  );
}
