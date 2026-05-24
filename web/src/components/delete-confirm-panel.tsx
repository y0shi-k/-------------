"use client";

type DeleteConfirmPanelProps = {
  disabled?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  target: string;
  title?: string;
};

export function DeleteConfirmPanel({ disabled = false, message, onCancel, onConfirm, target, title = "削除確認" }: DeleteConfirmPanelProps) {
  return (
    <section className="delete-confirm-panel" role="alertdialog" aria-label={title}>
      <div>
        <span>{title}</span>
        <h4>{target}</h4>
        <p>{message}</p>
      </div>
      <div className="delete-confirm-actions">
        <button className="secondary-button compact-button" type="button" disabled={disabled} onClick={onCancel}>
          やめる
        </button>
        <button className="danger-button compact-button" type="button" disabled={disabled} onClick={onConfirm}>
          削除する
        </button>
      </div>
    </section>
  );
}
