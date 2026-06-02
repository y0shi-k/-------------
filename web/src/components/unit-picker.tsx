"use client";

import { useEffect, useRef, useState } from "react";
import { COMMON_UNITS } from "@/lib/inventory/units";

type UnitPickerProps = {
  value: string;
  candidates?: readonly string[];
  onSelect: (unit: string) => void;
  ariaLabel?: string;
  eyebrow?: string;
};

export function UnitPicker({
  value,
  candidates = COMMON_UNITS,
  onSelect,
  ariaLabel = "単位",
  eyebrow = "UNIT"
}: UnitPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim();
  const filtered = candidates.filter((unit) => !normalizedQuery || unit.toLowerCase().includes(normalizedQuery.toLowerCase()));
  const canCreate = Boolean(normalizedQuery) && !candidates.some((unit) => unit.toLowerCase() === normalizedQuery.toLowerCase());

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const select = (unit: string) => {
    onSelect(unit);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="genre-picker unit-picker" ref={containerRef}>
      <div className="genre-field unit-field" onClick={() => setOpen(true)}>
        {value ? (
          <div className="genre-tags">
            <span className="genre-tag unit-tag">
              <span className="genre-tag-name">{value}</span>
              <button
                className="genre-tag-remove"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect("");
                }}
                aria-label={`${ariaLabel}を外す`}
              >
                ×
              </button>
            </span>
          </div>
        ) : null}
        <input
          className="genre-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const first = filtered[0];
              if (first) select(first);
              else if (canCreate) select(normalizedQuery);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={value ? "" : `${ariaLabel}を検索・追加`}
          aria-label={`${ariaLabel}を検索・追加`}
        />
        <button
          className="genre-icon-button genre-clear"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (query) setQuery("");
            else setOpen(false);
          }}
          aria-label="検索をクリア"
        >
          ×
        </button>
        <button
          className="genre-icon-button genre-add"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (normalizedQuery) select(normalizedQuery);
            else setOpen(true);
          }}
          aria-label={`${ariaLabel}を追加`}
        >
          ＋
        </button>
      </div>
      {open ? (
        <div className="genre-popover">
          <div className="genre-popover-head">
            <span className="genre-selected-count">
              <span className="genre-selected-check" aria-hidden="true">✓</span>
              {value ? value : "未選択"}
            </span>
            <span className="genre-popover-eyebrow">{eyebrow}</span>
          </div>
          <div className="genre-popover-list">
            {filtered.map((unit) => {
              const isSelected = value === unit;
              return (
                <button className="genre-option" data-selected={isSelected} type="button" key={unit} onClick={() => select(unit)}>
                  <span className="genre-option-check" data-on={isSelected} aria-hidden="true">
                    ✓
                  </span>
                  <span className="genre-option-name">{unit}</span>
                </button>
              );
            })}
            {canCreate ? (
              <button className="genre-option genre-option-create" type="button" onClick={() => select(normalizedQuery)}>
                <span className="genre-option-check genre-option-create-icon" aria-hidden="true">
                  ＋
                </span>
                <span className="genre-option-name">「{normalizedQuery}」を追加</span>
              </button>
            ) : null}
            {filtered.length === 0 && !canCreate ? <p className="genre-popover-empty">該当する単位はありません</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
