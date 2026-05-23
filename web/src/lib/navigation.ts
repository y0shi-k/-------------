export type SetupStepStatus = "ready" | "next" | "later";

export type SetupStep = {
  title: string;
  description: string;
  status: SetupStepStatus;
};

export const setupSteps: SetupStep[] = [
  {
    title: "Web版の器",
    description: "Next.js と TypeScript の基本構成を用意済み",
    status: "ready"
  },
  {
    title: "Supabase接続",
    description: "環境変数と安全な接続clientを TKT-0102 で準備",
    status: "ready"
  },
  {
    title: "在庫・レシピ機能",
    description: "DB設計と認証の安全設定後に順番に追加",
    status: "later"
  }
];
