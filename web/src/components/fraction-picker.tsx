"use client";

import { useEffect, useRef, useState } from "react";

import { parseQuantityInput } from "@/lib/format/numeric";
import { addCustomFraction, DEFAULT_FRACTIONS, getCustomFractions } from "@/lib/format/fraction-candidates";

type FractionPickerProps = {
  // 選んだ分数（"1/2" など）を返す。呼び出し側で整数部に足す。
  onSelect: (fractionLabel: string) => void;
  ariaLabel?: string;
};

// 入力文字列が「分子/分母」かつ 0 < 値 < 1 の真分数か判定する。
function isProperFraction(label: string): boolean {
  if (!/^\d+\/\d+$/.test(label)) {
    return false;
  }
  const parsed = parseQuantityInput(label);
  return parsed.ok && parsed.value > 0 && parsed.value < 1;
}

// 端数（分数）を候補から選ぶピッカー。単位ピッカーと同じポップオーバーUIで、
// 新しい分数を入れるとタグのように端末内へ記憶する。
export function FractionPicker({ onSelect, ariaLabel = "分数" }: FractionPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customs, setCustoms] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // マウント後に記憶済みの分数候補を読み込む（SSRとの不一致を避ける）。
  useEffect(() => {
    setCustoms(getCustomFractions());
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const candidates = [...DEFAULT_FRACTIONS, ...customs];
  const normalizedQuery = query.trim();
  const filtered = candidates.filter((fraction) => !normalizedQuery || fraction.includes(normalizedQuery));
  const canCreate = isProperFraction(normalizedQuery) && !candidates.includes(normalizedQuery);

  const select = (fraction: string) => {
    onSelect(fraction);
    setQuery("");
    setOpen(false);
  };

  const create = () => {
    addCustomFraction(normalizedQuery);
    setCustoms(getCustomFractions());
    select(normalizedQuery);
  };

  return (
    <div className="genre-picker fraction-picker" ref={containerRef}>
      <button
        type="button"
        className="fraction-trigger"
        aria-label={`${ariaLabel}を選ぶ`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">＋</span> 端数
      </button>
      {open ? (
        <div className="genre-popover fraction-popover" role="dialog" aria-label={`${ariaLabel}を選ぶ`}>
          <div className="genre-popover-head">
            <span className="genre-selected-count">端数を選ぶ</span>
            <span className="genre-popover-eyebrow">FRACTION</span>
          </div>
          <input
            className="genre-input fraction-input"
            value={query}
            autoFocus
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                const first = filtered[0];
                if (first) select(first);
                else if (canCreate) create();
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="分数を検索・追加（例 3/8）"
            aria-label="分数を検索・追加"
          />
          <div className="genre-popover-list">
            {filtered.map((fraction) => (
              <button className="genre-option" type="button" key={fraction} onClick={() => select(fraction)}>
                <span className="genre-option-name">{fraction}</span>
              </button>
            ))}
            {canCreate ? (
              <button className="genre-option genre-option-create" type="button" onClick={create}>
                <span className="genre-option-check genre-option-create-icon" aria-hidden="true">
                  ＋
                </span>
                <span className="genre-option-name">「{normalizedQuery}」を追加</span>
              </button>
            ) : null}
            {filtered.length === 0 && !canCreate ? <p className="genre-popover-empty">該当する分数はありません</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
