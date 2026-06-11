import type { AccountRole, AccountStatus } from "@/lib/auth/account-status";

// 管理画面で扱う profiles 行（admin RLS で全行 select 可・TKT-0228）。
export type AdminProfile = {
  id: string;
  email: string;
  status: AccountStatus;
  role: AccountRole;
  approved_at: string | null;
  created_at: string;
};

// admin の操作（status 遷移）。role/email は変更対象外（本チケットスコープ外）。
export type AdminAction = "approve" | "reject" | "disable" | "reactivate";

// 操作ごとに profiles へ送る更新列。**status / approved_at / approved_by のみ**。
// role・email は決して送らない（RLS は列単位制御不可のため UI/コードで抑止）。
export type ProfileStatusUpdate = {
  status: AccountStatus;
  approved_at: string | null;
  approved_by: string | null;
};

// 操作 → 更新列のマッピング。承認/再有効化は approved_at/approved_by を記録し、
// 拒否/無効化は approved_* をクリアして disabled にする。
export function buildStatusUpdate(action: AdminAction, adminId: string, now: string): ProfileStatusUpdate {
  switch (action) {
    case "approve":
    case "reactivate":
      return { status: "approved", approved_at: now, approved_by: adminId };
    case "reject":
    case "disable":
      return { status: "disabled", approved_at: null, approved_by: null };
  }
}
