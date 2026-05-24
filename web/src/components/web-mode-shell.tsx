"use client";

import { type ReactNode, useMemo, useState } from "react";

type ModeId = "ingredients" | "recipes" | "cooking";

type Mode = {
  id: ModeId;
  label: string;
  shortLabel: string;
  status: string;
};

type WebModeShellProps = {
  userEmail: string;
  inventoryCount: number;
  stagingCount: number;
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
  stagingCount,
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
        shortLabel: "食材",
        status: `在庫 ${inventoryCount}件 / 登録待ち ${stagingCount}件`
      },
      {
        id: "recipes",
        label: "献立・レシピ",
        shortLabel: "献立",
        status: `レシピ ${recipeCount}件 / 献立 ${mealCount}件`
      },
      {
        id: "cooking",
        label: "料理・記録",
        shortLabel: "記録",
        status: `料理履歴 ${historyCount}件`
      }
    ],
    [historyCount, inventoryCount, mealCount, recipeCount, stagingCount]
  );
  const active = modes.find((mode) => mode.id === activeMode) ?? modes[0];
  const activeChildren = childrenByMode[active.id];

  return (
    <>
      <header className="app-topbar" aria-label="アプリ状態">
        <div>
          <p className="eyebrow">Stock Master</p>
          <h1>料理レシピ・食材管理</h1>
          <p className="lead">{userEmail} のデータだけを表示しています。</p>
        </div>
        <div className="status-strip" role="status" aria-live="polite">
          <span>現在</span>
          <strong>{active.label}</strong>
          <p>{active.status}</p>
        </div>
      </header>

      <nav className="mode-tabs" aria-label="主モード">
        {modes.map((mode) => (
          <button
            aria-current={mode.id === activeMode ? "page" : undefined}
            className="mode-tab"
            data-active={mode.id === activeMode}
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            type="button"
          >
            <span>{mode.shortLabel}</span>
            <strong>{mode.label}</strong>
          </button>
        ))}
      </nav>

      <section className="mode-panel" aria-labelledby={`mode-title-${active.id}`}>
        <div className="mode-heading">
          <div>
            <p className="eyebrow">Mode</p>
            <h2 id={`mode-title-${active.id}`}>{active.label}</h2>
          </div>
          <p>{active.status}</p>
        </div>
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
            <span>{mode.shortLabel}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
