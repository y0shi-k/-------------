"use client";

type DeleteConfirmPanelProps = {
  confirmLabel?: string;
  disabled?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  target: string;
  title?: string;
  tone?: "danger" | "default";
};

export function DeleteConfirmPanel({
  confirmLabel = "削除する",
  disabled = false,
  message,
  onCancel,
  onConfirm,
  target,
  title = "削除確認",
  tone = "danger"
}: DeleteConfirmPanelProps) {
  return (
    <div className="delete-confirm-backdrop">
      <section className="delete-confirm-panel" data-tone={tone} role="alertdialog" aria-label={title} aria-modal="true">
        <div>
          <span>{title}</span>
          <h4>{target}</h4>
          <p>{message}</p>
        </div>
        <div className="delete-confirm-actions">
          <button className="secondary-button compact-button" type="button" disabled={disabled} onClick={onCancel} data-tooltip="操作をキャンセルして戻る">
            やめる
          </button>
          <button className={tone === "danger" ? "danger-button compact-button" : "primary-button compact-button"} type="button" disabled={disabled} onClick={onConfirm} data-tooltip="操作を確認して実行">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
