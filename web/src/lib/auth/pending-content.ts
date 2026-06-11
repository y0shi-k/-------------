import type { AccountStatus } from "@/lib/auth/account-status";

export type PendingContent = {
  title: string;
  lead: string;
};

// /pending 画面の文言を status から出し分ける純関数。
// approved は本来ここに来ない（middleware が `/` へ離脱させる）が、
// 念のため pending と同等の中立文言にフォールバックする。
export function getPendingContent(status: AccountStatus): PendingContent {
  if (status === "disabled") {
    return {
      title: "利用停止中",
      lead: "このアカウントは現在利用できません。ご不明な点は管理者にお問い合わせください。"
    };
  }

  return {
    title: "承認待ち",
    lead: "登録申請を受け付けました。管理者の承認が完了すると利用できるようになります。"
  };
}
