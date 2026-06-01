"use client";

import { createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState, useContext } from "react";

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

type ShellStatusMessage = {
  message: string;
  tone: "success" | "error" | "info";
};

type RecipeViewerOrigin = "recipes" | "cooking";

type ShellStatusContextValue = {
  clearPendingRecipe: () => void;
  pendingRecipeId: string | null;
  pendingRecipeOrigin: RecipeViewerOrigin;
  requestViewRecipe: (recipeId: string, origin?: RecipeViewerOrigin) => void;
  returnToMode: (modeId: ModeId) => void;
  showStatusMessage: (message: ShellStatusMessage) => void;
};

const ShellStatusContext = createContext<ShellStatusContextValue>({
  clearPendingRecipe: () => {},
  pendingRecipeId: null,
  pendingRecipeOrigin: "recipes",
  requestViewRecipe: () => {},
  returnToMode: () => {},
  showStatusMessage: () => {}
});

export function useShellStatusMessage() {
  return useContext(ShellStatusContext);
}

export function useShellNavigation() {
  const { clearPendingRecipe, pendingRecipeId, pendingRecipeOrigin, requestViewRecipe, returnToMode } =
    useContext(ShellStatusContext);
  return { clearPendingRecipe, pendingRecipeId, pendingRecipeOrigin, requestViewRecipe, returnToMode };
}

export function WebModeShell({
  userEmail,
  inventoryCount,
  recipeCount,
  mealCount,
  historyCount,
  childrenByMode
}: WebModeShellProps) {
  const [activeMode, setActiveMode] = useState<ModeId>("ingredients");
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const [pendingRecipeOrigin, setPendingRecipeOrigin] = useState<RecipeViewerOrigin>("recipes");
  const [statusMessage, setStatusMessage] = useState<ShellStatusMessage | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const showStatusMessage = useCallback((message: ShellStatusMessage) => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    setStatusMessage(message);
    statusTimer.current = setTimeout(() => setStatusMessage(null), 3000);
  }, []);
  const requestViewRecipe = useCallback((recipeId: string, origin: RecipeViewerOrigin = "recipes") => {
    setActiveMode("recipes");
    setPendingRecipeId(recipeId);
    setPendingRecipeOrigin(origin);
  }, []);
  const clearPendingRecipe = useCallback(() => {
    setPendingRecipeId(null);
    setPendingRecipeOrigin("recipes");
  }, []);
  const returnToMode = useCallback((modeId: ModeId) => {
    setActiveMode(modeId);
  }, []);
  const shellContextValue = useMemo(
    () => ({
      clearPendingRecipe,
      pendingRecipeId,
      pendingRecipeOrigin,
      requestViewRecipe,
      returnToMode,
      showStatusMessage
    }),
    [clearPendingRecipe, pendingRecipeId, pendingRecipeOrigin, requestViewRecipe, returnToMode, showStatusMessage]
  );
  const statusLabel = statusMessage
    ? statusMessage.tone === "success"
      ? "完了"
      : statusMessage.tone === "error"
        ? "エラー"
        : "通知"
    : "待機中";
  const statusText = statusMessage?.message ?? `${active.label}: ${active.status}`;

  useEffect(() => () => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
  }, []);

  return (
    <ShellStatusContext.Provider value={shellContextValue}>
      <div className="canvas-status-bar" data-tone={statusMessage?.tone ?? "idle"} role="status" aria-live="polite">
        <strong>{statusLabel}</strong>
        <span>|</span>
        <span className="canvas-status-text">{statusText}</span>
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
    </ShellStatusContext.Provider>
  );
}
