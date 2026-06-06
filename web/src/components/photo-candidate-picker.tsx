"use client";

import type { CookingPhotoCandidate } from "@/lib/photos/use-cooking-photo-candidates";

type PhotoCandidatePickerProps = {
  candidates: CookingPhotoCandidate[];
  error: string | null;
  loading: boolean;
  onClose: () => void;
  onSelect: (candidate: CookingPhotoCandidate) => void;
  title: string;
};

function formatCandidateDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日付不明";
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric" }).format(date);
}

export function PhotoCandidatePicker({ candidates, error, loading, onClose, onSelect, title }: PhotoCandidatePickerProps) {
  return (
    <div className="modal-backdrop photo-candidate-backdrop" role="dialog" aria-modal="true" aria-labelledby="photo-candidate-heading">
      <section className="canvas-modal photo-candidate-modal">
        <button className="modal-close-button" type="button" onClick={onClose} aria-label="閉じる">
          ×
        </button>
        <h3 id="photo-candidate-heading">{title}</h3>
        {loading ? <p className="photo-candidate-empty">候補を読み込み中です。</p> : null}
        {error ? <p className="photo-candidate-error">{error}</p> : null}
        {!loading && !error && candidates.length === 0 ? (
          <p className="photo-candidate-empty">過去の完成写真はまだありません。新しく撮影すると次回から候補に出ます。</p>
        ) : null}
        {!loading && !error && candidates.length > 0 ? (
          <div className="photo-candidate-grid" aria-label="過去の完成写真候補">
            {candidates.map((candidate) => (
              <button className="photo-candidate-item" key={candidate.id} type="button" onClick={() => onSelect(candidate)}>
                {candidate.signedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 非公開Storageの署名付きURLを表示する。
                  <img alt={`${formatCandidateDate(candidate.createdAt)} の完成写真`} src={candidate.signedUrl} />
                ) : (
                  <span>表示不可</span>
                )}
                <small>{formatCandidateDate(candidate.createdAt)}</small>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
