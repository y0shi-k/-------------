"use client";

import { useEffect, useState } from "react";
import { clearUserGeminiApiKey, loadUserGeminiApiKey, saveUserGeminiApiKey } from "@/lib/ai/user-gemini-api-key";

type GeminiApiKeyPanelProps = {
  apiKey: string;
  disabled?: boolean;
  id: string;
  onChange: (apiKey: string) => void;
};

export function GeminiApiKeyPanel({ apiKey, disabled = false, id, onChange }: GeminiApiKeyPanelProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    onChange(loadUserGeminiApiKey());
  }, [onChange]);

  function saveKey() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setMessage("Gemini APIキーを入力してから保存してください。");
      return;
    }
    saveUserGeminiApiKey(trimmed);
    onChange(trimmed);
    setMessage("この端末のブラウザに保存しました。共有端末では使用後に削除してください。");
  }

  function deleteKey() {
    clearUserGeminiApiKey();
    onChange("");
    setMessage("保存済みのGemini APIキーを削除しました。");
  }

  return (
    <section className="gemini-key-panel" aria-label="Gemini APIキー設定">
      <div className="gemini-key-heading">
        <div>
          <span>Gemini APIキー</span>
          <strong>{apiKey.trim() ? "入力済み" : "未入力"}</strong>
        </div>
        <button className="secondary-button compact-button" type="button" disabled={disabled || !apiKey.trim()} onClick={deleteKey}>
          削除
        </button>
      </div>
      <label htmlFor={id}>
        ユーザー自身のAPIキー
        <input
          autoComplete="off"
          disabled={disabled}
          id={id}
          inputMode="text"
          onChange={(event) => {
            onChange(event.target.value);
            setMessage("");
          }}
          placeholder="Gemini APIキーを入力"
          type="password"
          value={apiKey}
        />
      </label>
      <div className="gemini-key-actions">
        <button className="secondary-button compact-button" type="button" disabled={disabled || !apiKey.trim()} onClick={saveKey}>
          この端末に保存
        </button>
        <small>DBには保存しません。AI実行時だけサーバーへ送ります。</small>
      </div>
      {message ? <p className="gemini-key-message">{message}</p> : null}
    </section>
  );
}
