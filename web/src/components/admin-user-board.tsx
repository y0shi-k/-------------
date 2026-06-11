"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import {
  type AdminAction,
  type AdminProfile,
  buildStatusUpdate
} from "@/lib/auth/admin-profiles";
import { homePath } from "@/lib/auth/routing";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type AdminUserBoardProps = {
  currentUserId: string;
  initialProfiles: AdminProfile[];
};

type Feedback = {
  message: string;
  tone: "success" | "error";
};

// 拒否・無効化は破壊的操作として確認パネルを挟む（承認・再有効化は即時）。
const confirmingActions: AdminAction[] = ["reject", "disable"];

const statusLabel: Record<AdminProfile["status"], string> = {
  pending: "申請中",
  approved: "利用中",
  disabled: "停止中"
};

const roleLabel: Record<AdminProfile["role"], string> = {
  member: "メンバー",
  admin: "管理者"
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function AdminUserBoard({ currentUserId, initialProfiles }: AdminUserBoardProps) {
  const [profiles, setProfiles] = useState<AdminProfile[]>(initialProfiles);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ action: AdminAction; profile: AdminProfile } | null>(null);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const pendingProfiles = useMemo(
    () =>
      profiles
        .filter((profile) => profile.status === "pending")
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [profiles]
  );
  const allProfiles = useMemo(
    () => [...profiles].sort((a, b) => a.email.localeCompare(b.email, "ja")),
    [profiles]
  );

  // RLS admin ポリシー経由で profiles を update する。送る列は status/approved_at/approved_by のみ。
  async function runAction(action: AdminAction, profile: AdminProfile) {
    if (profile.id === currentUserId) return; // 自己操作はそもそも UI に出さないが二重ガード。

    setPendingId(profile.id);
    setFeedback(null);

    const update = buildStatusUpdate(action, currentUserId, new Date().toISOString());

    const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);

    if (error) {
      setFeedback({ message: "更新に失敗しました。時間をおいて再度お試しください。", tone: "error" });
      setPendingId(null);
      return;
    }

    // イミュータブルに該当行のみ差し替える。
    setProfiles((current) =>
      current.map((item) => (item.id === profile.id ? { ...item, ...update } : item))
    );
    setFeedback({ message: `${profile.email} を更新しました。`, tone: "success" });
    setPendingId(null);
  }

  function handleAction(action: AdminAction, profile: AdminProfile) {
    if (confirmingActions.includes(action)) {
      setConfirming({ action, profile });
      return;
    }
    void runAction(action, profile);
  }

  function renderActions(profile: AdminProfile) {
    // 自分自身の行には操作ボタンを出さない（自己無効化・自己降格の抑止）。
    if (profile.id === currentUserId) {
      return <span className="admin-self-note">自分のアカウント</span>;
    }

    const busy = pendingId === profile.id;

    return (
      <div className="admin-row-actions">
        {profile.status === "pending" && (
          <>
            <button
              className="primary-button compact-button"
              type="button"
              disabled={busy}
              onClick={() => handleAction("approve", profile)}
              data-tooltip="この申請を承認する"
            >
              承認
            </button>
            <button
              className="danger-button compact-button"
              type="button"
              disabled={busy}
              onClick={() => handleAction("reject", profile)}
              data-tooltip="この申請を拒否する"
            >
              拒否
            </button>
          </>
        )}
        {profile.status === "approved" && (
          <button
            className="danger-button compact-button"
            type="button"
            disabled={busy}
            onClick={() => handleAction("disable", profile)}
            data-tooltip="このユーザーを利用停止にする"
          >
            無効化
          </button>
        )}
        {profile.status === "disabled" && (
          <button
            className="primary-button compact-button"
            type="button"
            disabled={busy}
            onClick={() => handleAction("reactivate", profile)}
            data-tooltip="このユーザーを再び利用可能にする"
          >
            再有効化
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="admin-board" aria-label="ユーザー管理">
      <header className="admin-board-header">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h2>ユーザー管理</h2>
          <p>新規申請の承認・拒否と、利用ユーザーの有効化／無効化をここで行います。</p>
        </div>
        <Link className="secondary-button compact-button" href={homePath} data-tooltip="アプリ本体へ戻る">
          アプリへ戻る
        </Link>
      </header>

      {feedback !== null && (
        <p className="admin-feedback" data-tone={feedback.tone} role="status" aria-live="polite">
          {feedback.message}
        </p>
      )}

      <section className="admin-section" aria-label="承認待ちの申請">
        <div className="admin-section-heading">
          <h3>承認待ちの申請（{pendingProfiles.length}）</h3>
          <p>メール確認を終え、承認を待っているユーザーです。</p>
        </div>
        {pendingProfiles.length === 0 ? (
          <p className="admin-empty">承認待ちの申請はありません。</p>
        ) : (
          <ul className="admin-list">
            {pendingProfiles.map((profile) => (
              <li className="admin-row" key={profile.id}>
                <div className="admin-row-main">
                  <span className="admin-row-email">{profile.email}</span>
                  <small className="admin-row-meta">申請日時: {formatDateTime(profile.created_at)}</small>
                </div>
                {renderActions(profile)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-section" aria-label="全ユーザー一覧">
        <div className="admin-section-heading">
          <h3>全ユーザー（{allProfiles.length}）</h3>
          <p>状態・権限と承認日時の一覧です。</p>
        </div>
        <ul className="admin-list">
          {allProfiles.map((profile) => (
            <li className="admin-row" key={profile.id}>
              <div className="admin-row-main">
                <span className="admin-row-email">{profile.email}</span>
                <small className="admin-row-meta">
                  <span className="admin-status-badge" data-status={profile.status}>
                    {statusLabel[profile.status]}
                  </span>
                  <span className="admin-role-badge" data-role={profile.role}>
                    {roleLabel[profile.role]}
                  </span>
                  <span>承認日時: {formatDateTime(profile.approved_at)}</span>
                </small>
              </div>
              {renderActions(profile)}
            </li>
          ))}
        </ul>
      </section>

      {confirming !== null && (
        <DeleteConfirmPanel
          title={confirming.action === "reject" ? "申請の拒否" : "ユーザーの無効化"}
          target={confirming.profile.email}
          message={
            confirming.action === "reject"
              ? "この申請を拒否すると、ユーザーはアプリ本体に入れません。後から再有効化できます。"
              : "このユーザーを無効化すると、次回アクセスから利用停止画面に切り替わります。後から再有効化できます。"
          }
          confirmLabel={confirming.action === "reject" ? "拒否する" : "無効化する"}
          disabled={pendingId === confirming.profile.id}
          onCancel={() => setConfirming(null)}
          onConfirm={() => {
            const target = confirming;
            setConfirming(null);
            void runAction(target.action, target.profile);
          }}
        />
      )}
    </section>
  );
}
