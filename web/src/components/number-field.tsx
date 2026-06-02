"use client";

import type { KeyboardEvent } from "react";

import { sanitizeDecimalInput, stepDecimalString } from "@/lib/format/numeric";

type NumberFieldProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  min?: number;
  step?: number;
  className?: string;
  id?: string;
  // 横幅の狭い行（レシピ材料など）では矢印ボタンを隠す。キーボード↑↓は常に有効。
  showSteppers?: boolean;
};

// 数量入力欄。type=text + inputMode=decimal にして全角→半角を正規化し、
// type=number で起きる日本語IME混入（全角数字が入る）を防ぐ。
// 上下矢印（1刻み）は独自のスピンボタンとキーボード↑↓で提供する。
export function NumberField({
  value,
  onChange,
  ariaLabel,
  placeholder,
  min = 0,
  step = 1,
  className,
  id,
  showSteppers = true
}: NumberFieldProps) {
  const applyStep = (direction: 1 | -1) => {
    onChange(stepDecimalString(value, step, direction, min));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      applyStep(1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      applyStep(-1);
    }
  };

  return (
    <span className={className ? `number-field ${className}` : "number-field"}>
      <input
        id={id}
        className="number-field-input"
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(sanitizeDecimalInput(event.target.value))}
        onKeyDown={handleKeyDown}
      />
      {showSteppers ? (
        <span className="number-field-steppers">
          <button type="button" tabIndex={-1} className="number-field-step" aria-label="1増やす" onClick={() => applyStep(1)}>
            <span aria-hidden="true">▲</span>
          </button>
          <button type="button" tabIndex={-1} className="number-field-step" aria-label="1減らす" onClick={() => applyStep(-1)}>
            <span aria-hidden="true">▼</span>
          </button>
        </span>
      ) : null}
    </span>
  );
}
