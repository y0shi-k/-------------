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
    title: "自分だけログイン",
    description: "Supabase Authで本人だけがWeb版へ入れる導線を追加",
    status: "ready"
  },
  {
    title: "在庫と登録待ち",
    description: "手動追加から在庫確定までをWeb版で使えるようにする",
    status: "ready"
  }
];
