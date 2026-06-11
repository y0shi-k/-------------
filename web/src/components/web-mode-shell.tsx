"use client";

import Link from "next/link";
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState, useContext } from "react";
import { AiUsageMeter } from "@/components/ai-usage-meter";
import { LogoutButton } from "@/components/logout-button";
import { SettingsPanel } from "@/components/settings-panel";
import { getAiUsageSummary, type AiUsageSummary } from "@/lib/ai/usage";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { applyUserSynonymGroupsFromStorage } from "@/lib/ingredients/user-synonyms";

export type ModeId = "ingredients" | "recipes" | "cooking";
export type InventoryShellLeaf = "inventory" | "shopping";
export type RecipeShellLeaf = "recipes" | "schedule";
export type CookingShellLeaf = "calendar" | "timeline" | "insights";
export type ShellLeafId = InventoryShellLeaf | RecipeShellLeaf | CookingShellLeaf;
export type ShellDesktopTarget =
  | { kind: "home" }
  | { kind: "settings" }
  | { group: ModeId; kind: "mode"; leaf: ShellLeafId };

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
  isAdmin?: boolean;
  inventoryCount: number;
  recipeCount: number;
  mealCount: number;
  historyCount: number;
  childrenByMode: {
    ingredients: ReactNode;
    recipes: ReactNode;
    cooking: ReactNode;
  };
  home?: ReactNode;
};

type ShellStatusMessage = {
  message: string;
  tone: "success" | "error" | "info";
};

type RecipeViewerOrigin = "recipes" | "cooking";

type ShellStatusContextValue = {
  aiUsageSummary: AiUsageSummary | null;
  clearPendingRecipe: () => void;
  pendingRecipeId: string | null;
  pendingRecipeOrigin: RecipeViewerOrigin;
  refreshAiUsage: () => Promise<void>;
  requestViewRecipe: (recipeId: string, origin?: RecipeViewerOrigin) => void;
  returnToMode: (modeId: ModeId) => void;
  showStatusMessage: (message: ShellStatusMessage) => void;
};

type ShellSubViewContextValue = {
  activeDesktopTarget: ShellDesktopTarget;
  selectedSubViews: {
    ingredients: InventoryShellLeaf;
    recipes: RecipeShellLeaf;
    cooking: CookingShellLeaf;
  };
  selectShellLeaf: (group: ModeId, leaf: ShellLeafId) => void;
};

const ShellStatusContext = createContext<ShellStatusContextValue>({
  aiUsageSummary: null,
  clearPendingRecipe: () => {},
  pendingRecipeId: null,
  pendingRecipeOrigin: "recipes",
  refreshAiUsage: async () => {},
  requestViewRecipe: () => {},
  returnToMode: () => {},
  showStatusMessage: () => {}
});

const ShellSubViewContext = createContext<ShellSubViewContextValue>({
  activeDesktopTarget: { group: "ingredients", kind: "mode", leaf: "inventory" },
  selectedSubViews: {
    ingredients: "inventory",
    recipes: "recipes",
    cooking: "timeline"
  },
  selectShellLeaf: () => {}
});

const shellLeafGroups = [
  {
    id: "ingredients",
    defaultLeaf: "inventory",
    leaves: [
      { id: "inventory", label: "在庫一覧", status: "食材の残量と期限" },
      { id: "shopping", label: "買い物リスト", status: "不足分の確認" }
    ]
  },
  {
    id: "recipes",
    defaultLeaf: "recipes",
    leaves: [
      { id: "recipes", label: "レシピ", status: "保存済みレシピ" },
      { id: "schedule", label: "献立スケジュール", status: "予定の確認" }
    ]
  },
  {
    id: "cooking",
    defaultLeaf: "timeline",
    leaves: [
      { id: "calendar", label: "カレンダー", status: "月ごとの記録" },
      { id: "timeline", label: "タイムライン", status: "最近の料理履歴" },
      { id: "insights", label: "インサイト", status: "振り返り" }
    ]
  }
] satisfies {
  id: ModeId;
  defaultLeaf: ShellLeafId;
  leaves: { id: ShellLeafId; label: string; status: string }[];
}[];

function defaultLeafForMode(modeId: ModeId): ShellLeafId {
  return shellLeafGroups.find((group) => group.id === modeId)?.defaultLeaf ?? "inventory";
}

export function useShellStatusMessage() {
  return useContext(ShellStatusContext);
}

export function useShellNavigation() {
  const { clearPendingRecipe, pendingRecipeId, pendingRecipeOrigin, requestViewRecipe, returnToMode } =
    useContext(ShellStatusContext);
  return { clearPendingRecipe, pendingRecipeId, pendingRecipeOrigin, requestViewRecipe, returnToMode };
}

export function useShellAiUsage() {
  const { aiUsageSummary, refreshAiUsage } = useContext(ShellStatusContext);
  return { aiUsageSummary, refreshAiUsage };
}

export function useShellSubView() {
  return useContext(ShellSubViewContext);
}

export function WebModeShell({
  userEmail,
  isAdmin = false,
  inventoryCount,
  recipeCount,
  mealCount,
  historyCount,
  childrenByMode,
  home
}: WebModeShellProps) {
  const [activeMode, setActiveMode] = useState<ModeId>("ingredients");
  const [activeDesktopTarget, setActiveDesktopTarget] = useState<ShellDesktopTarget>({
    group: "ingredients",
    kind: "mode",
    leaf: "inventory"
  });
  const [selectedSubViews, setSelectedSubViews] = useState<ShellSubViewContextValue["selectedSubViews"]>({
    ingredients: "inventory",
    recipes: "recipes",
    cooking: "timeline"
  });
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const [pendingRecipeOrigin, setPendingRecipeOrigin] = useState<RecipeViewerOrigin>("recipes");
  const [statusMessage, setStatusMessage] = useState<ShellStatusMessage | null>(null);
  const [aiUsageSummary, setAiUsageSummary] = useState<AiUsageSummary | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
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
  const isSettingsActive = activeDesktopTarget.kind === "settings";
  const isHomeActive = activeDesktopTarget.kind === "home" && Boolean(home);
  const selectShellLeaf = useCallback((group: ModeId, leaf: ShellLeafId) => {
    setActiveMode(group);
    setActiveDesktopTarget({ group, kind: "mode", leaf });
    setSelectedSubViews((current) => ({
      ...current,
      [group]: leaf
    }));
  }, []);
  const showStatusMessage = useCallback((message: ShellStatusMessage) => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
    setStatusMessage(message);
    statusTimer.current = setTimeout(() => setStatusMessage(null), 3000);
  }, []);
  const requestViewRecipe = useCallback((recipeId: string, origin: RecipeViewerOrigin = "recipes") => {
    selectShellLeaf("recipes", "recipes");
    setPendingRecipeId(recipeId);
    setPendingRecipeOrigin(origin);
  }, [selectShellLeaf]);
  const clearPendingRecipe = useCallback(() => {
    setPendingRecipeId(null);
    setPendingRecipeOrigin("recipes");
  }, []);
  const returnToMode = useCallback((modeId: ModeId) => {
    selectShellLeaf(modeId, selectedSubViews[modeId] ?? defaultLeafForMode(modeId));
  }, [selectShellLeaf, selectedSubViews]);
  const refreshAiUsage = useCallback(async () => {
    setAiUsageSummary(await getAiUsageSummary(supabase));
  }, [supabase]);

  const shellContextValue = useMemo(
    () => ({
      aiUsageSummary,
      clearPendingRecipe,
      pendingRecipeId,
      pendingRecipeOrigin,
      refreshAiUsage,
      requestViewRecipe,
      returnToMode,
      showStatusMessage
    }),
    [
      aiUsageSummary,
      clearPendingRecipe,
      pendingRecipeId,
      pendingRecipeOrigin,
      refreshAiUsage,
      requestViewRecipe,
      returnToMode,
      showStatusMessage
    ]
  );
  const statusLabel = statusMessage
    ? statusMessage.tone === "success"
      ? "完了"
      : statusMessage.tone === "error"
        ? "エラー"
        : "通知"
    : "待機中";
  const statusText =
    statusMessage?.message ?? (isHomeActive ? "ホーム: 今日の確認" : `${active.label}: ${active.status}`);
  const shellSubViewContextValue = useMemo(
    () => ({
      activeDesktopTarget,
      selectedSubViews,
      selectShellLeaf
    }),
    [activeDesktopTarget, selectedSubViews, selectShellLeaf]
  );

  useEffect(() => {
    void refreshAiUsage();
  }, [refreshAiUsage]);

  // クライアントマウント時にユーザー同義語辞書を localStorage から読み込みマッチングに反映する。
  // マッチングが走るのはモーダル操作時のため、このタイミングで間に合う。
  useEffect(() => {
    applyUserSynonymGroupsFromStorage();
  }, []);

  // PC（≥1024px）の初回はホームを初期表示にする。スマホ（<1024px）は食材管理起点のまま。
  // 初期 state は ingredients に据え置き、マウント後に PC のみ昇格する（SSR/ハイドレーション不整合とスマホ初期表示を回避）。
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setActiveDesktopTarget({ kind: "home" });
    }
  }, []);

  useEffect(() => () => {
    if (statusTimer.current) clearTimeout(statusTimer.current);
  }, []);

  return (
    <ShellStatusContext.Provider value={shellContextValue}>
      <ShellSubViewContext.Provider value={shellSubViewContextValue}>
        <div className="desktop-app-frame">
          <aside className="desktop-mode-nav" aria-label="PC主ナビ">
            <div className="desktop-nav-brand">
              <span aria-hidden="true" className="desktop-nav-logo">
                SM
              </span>
              <div>
                <strong>Stock Master</strong>
                <small>今日のごはん、なに作る?</small>
              </div>
            </div>

            <button
              aria-current={activeDesktopTarget.kind === "home" ? "page" : undefined}
              className="desktop-nav-home"
              data-active={activeDesktopTarget.kind === "home"}
              onClick={() => setActiveDesktopTarget({ kind: "home" })}
              type="button"
              data-tooltip="ホームダッシュボードを表示"
              data-tooltip-pos="bottom-right"
            >
              <span aria-hidden="true">HOME</span>
              <strong>ホーム</strong>
            </button>

            <div className="desktop-nav-groups">
              {modes.map((mode) => {
                const group = shellLeafGroups.find((item) => item.id === mode.id);
                const isGroupActive = activeDesktopTarget.kind === "mode" && activeDesktopTarget.group === mode.id;

                return (
                  <section className="desktop-nav-group" key={mode.id}>
                    <button
                      aria-current={isGroupActive ? "page" : undefined}
                      className="desktop-nav-group-button"
                      data-active={isGroupActive}
                      onClick={() => selectShellLeaf(mode.id, group?.defaultLeaf ?? defaultLeafForMode(mode.id))}
                      type="button"
                      data-tooltip={`${mode.label}に移動`}
                    >
                      <span aria-hidden="true">{mode.icon}</span>
                      <strong>{mode.label}</strong>
                    </button>
                    <div className="desktop-nav-leaves">
                      {group?.leaves.map((leaf) => {
                        const isLeafActive =
                          activeDesktopTarget.kind === "mode" &&
                          activeDesktopTarget.group === mode.id &&
                          activeDesktopTarget.leaf === leaf.id;

                        return (
                          <button
                            aria-current={isLeafActive ? "page" : undefined}
                            data-active={isLeafActive}
                            key={leaf.id}
                            onClick={() => selectShellLeaf(mode.id, leaf.id)}
                            type="button"
                            data-tooltip={`${leaf.label}を表示`}
                          >
                            <span>{leaf.label}</span>
                            <small>{leaf.status}</small>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <button
              aria-current={activeDesktopTarget.kind === "settings" ? "page" : undefined}
              className="desktop-nav-settings"
              data-active={activeDesktopTarget.kind === "settings"}
              onClick={() => setActiveDesktopTarget({ kind: "settings" })}
              type="button"
              data-tooltip="アプリ設定を表示"
            >
              <span aria-hidden="true">SET</span>
              <strong>設定</strong>
            </button>

            {isAdmin && (
              <Link className="desktop-nav-admin" href="/admin" data-tooltip="ユーザー管理画面を開く">
                <span aria-hidden="true">ADM</span>
                <strong>ユーザー管理</strong>
              </Link>
            )}
          </aside>

          <div className="desktop-workspace">
            <header className="desktop-topbar">
              <div className="desktop-topbar-title">
                <span className="eyebrow">{isHomeActive ? "WELCOME" : isSettingsActive ? "SETTINGS" : active.eyebrow}</span>
                <strong>{isHomeActive ? "ホーム" : isSettingsActive ? "設定" : active.label}</strong>
              </div>
              <div className="desktop-status-pill" data-tone={statusMessage?.tone ?? "idle"} role="status" aria-live="polite">
                <strong>{statusLabel}</strong>
                <span>{statusText}</span>
              </div>
              <div className="desktop-search-slot" role="search">
                <input aria-label="検索スロット" disabled placeholder="食材・レシピを検索" type="search" />
              </div>
              <AiUsageMeter variant="statusbar" summary={aiUsageSummary} />
              <div className="desktop-account">
                <small>{userEmail}</small>
                <LogoutButton />
              </div>
            </header>

            <div className="canvas-status-bar" data-tone={statusMessage?.tone ?? "idle"} role="status" aria-live="polite">
              <strong>{statusLabel}</strong>
              <span>|</span>
              <span className="canvas-status-text">{statusText}</span>
              <AiUsageMeter variant="statusbar" summary={aiUsageSummary} />
              <button
                aria-current={isSettingsActive ? "page" : undefined}
                className="canvas-status-account"
                data-active={isSettingsActive}
                onClick={() => setActiveDesktopTarget({ kind: "settings" })}
                type="button"
                data-tooltip="アカウント設定を表示"
                data-tooltip-pos="bottom-left"
              >
                {userEmail}
              </button>
            </div>
            <h1 className="sr-only">料理レシピ・食材管理</h1>
            <p className="sr-only">{active.status}</p>

            {home ? (
              <section className="mode-panel" aria-label="ホーム" hidden={!isHomeActive}>
                {home}
              </section>
            ) : null}
            {isSettingsActive ? (
              <section className="mode-panel" aria-label="設定">
                <SettingsPanel userEmail={userEmail} isAdmin={isAdmin} onClose={() => returnToMode(activeMode)} />
              </section>
            ) : null}
            {/* 3モードは常時マウントし hidden で切替える（アンマウントで各ボードの編集中stateが初期propsへ巻き戻るのを防ぐ） */}
            {modes.map((mode) => {
              const isModeVisible = !isHomeActive && !isSettingsActive && mode.id === active.id;

              return (
                <section
                  className="mode-panel"
                  aria-labelledby={`mode-title-${mode.id}`}
                  hidden={!isModeVisible}
                  key={mode.id}
                >
                  {mode.id === "ingredients" ? (
                    <h2 className="sr-only" id={`mode-title-${mode.id}`}>
                      {mode.label}
                    </h2>
                  ) : (
                    <div className="mode-heading">
                      <div>
                        <h2 id={`mode-title-${mode.id}`}>{mode.label}</h2>
                        <p className="eyebrow">{mode.eyebrow}</p>
                      </div>
                    </div>
                  )}
                  {childrenByMode[mode.id]}
                </section>
              );
            })}
          </div>
        </div>

        <nav className="bottom-mode-nav" aria-label="スマホ主モード">
          {modes.map((mode) => (
          <button
            aria-current={mode.id === activeMode ? "page" : undefined}
            data-active={mode.id === activeMode}
            key={mode.id}
            onClick={() => selectShellLeaf(mode.id, selectedSubViews[mode.id] ?? defaultLeafForMode(mode.id))}
            type="button"
            data-tooltip={`${mode.label}に移動`}
          >
            <span aria-hidden="true">{mode.icon}</span>
            <strong>{mode.label}</strong>
          </button>
          ))}
        </nav>
      </ShellSubViewContext.Provider>
    </ShellStatusContext.Provider>
  );
}
