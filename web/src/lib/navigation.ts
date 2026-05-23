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
    description: "環境変数と接続確認は TKT-0102 で実施",
    status: "next"
  },
  {
    title: "在庫・レシピ機能",
    description: "認証とDBの安全設定後に順番に追加",
    status: "later"
  }
];
