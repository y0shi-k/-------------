"use client";

import { useEffect, useState } from "react";
import {
  clearUserGeminiApiKey,
  clearUserPaidGeminiApiKey,
  loadUserGeminiApiKeys,
  saveUserGeminiApiKey,
  saveUserPaidGeminiApiKey,
  type UserGeminiApiKeys
} from "@/lib/ai/user-gemini-api-key";

type GeminiApiKeyPanelProps = {
  apiKeys: UserGeminiApiKeys;
  disabled?: boolean;
  id: string;
  onChange: (apiKeys: UserGeminiApiKeys) => void;
};

export function GeminiApiKeyPanel({ apiKeys, disabled = false, id, onChange }: GeminiApiKeyPanelProps) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    onChange(loadUserGeminiApiKeys());
  }, [onChange]);

  function saveKey(kind: keyof UserGeminiApiKeys) {
    const trimmed = apiKeys[kind].trim();
    if (!trimmed) {
      setMessage("Gemini APIキーを入力してから保存してください。");
      return;
    }
    if (kind === "free") {
      saveUserGeminiApiKey(trimmed);
    } else {
      saveUserPaidGeminiApiKey(trimmed);
    }
    onChange({ ...apiKeys, [kind]: trimmed });
    setMessage("この端末のブラウザに保存しました。共有端末では使用後に削除してください。");
  }

  function deleteKey(kind: keyof UserGeminiApiKeys) {
    if (kind === "free") {
      clearUserGeminiApiKey();
    } else {
      clearUserPaidGeminiApiKey();
    }
    onChange({ ...apiKeys, [kind]: "" });
    setMessage(`保存済みの${kind === "free" ? "無料" : "有料"}Gemini APIキーを削除しました。`);
  }

  function updateKey(kind: keyof UserGeminiApiKeys, value: string) {
    onChange({ ...apiKeys, [kind]: value });
    setMessage("");
  }

  return (
    <section className="gemini-key-panel" aria-label="Gemini APIキー設定">
      <GeminiApiKeyField
        disabled={disabled}
        id={`${id}-free`}
        label="無料Gemini APIキー"
        status={apiKeys.free.trim() ? "入力済み" : "未入力"}
        value={apiKeys.free}
        onChange={(value) => updateKey("free", value)}
        onDelete={() => deleteKey("free")}
        onSave={() => saveKey("free")}
      />
      <GeminiApiKeyField
        description="料金が発生する可能性があります。無料API失敗時に選択した場合だけ使います。"
        disabled={disabled}
        id={`${id}-paid`}
        label="有料Gemini APIキー"
        status={apiKeys.paid.trim() ? "入力済み" : "未入力"}
        value={apiKeys.paid}
        onChange={(value) => updateKey("paid", value)}
        onDelete={() => deleteKey("paid")}
        onSave={() => saveKey("paid")}
      />
      <small>DBには保存しません。AI実行時だけサーバーへ送ります。</small>
      {message ? <p className="gemini-key-message">{message}</p> : null}
    </section>
  );
}

type GeminiApiKeyFieldProps = {
  description?: string;
  disabled: boolean;
  id: string;
  label: string;
  status: string;
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  onSave: () => void;
};

function GeminiApiKeyField({ description, disabled, id, label, status, value, onChange, onDelete, onSave }: GeminiApiKeyFieldProps) {
  return (
    <div className="gemini-key-field">
      <div className="gemini-key-heading">
        <div>
          <span>{label}</span>
          <strong>{status}</strong>
        </div>
        <button className="secondary-button compact-button" type="button" disabled={disabled || !value.trim()} onClick={onDelete} data-tooltip="端末に保存したAPIキーを削除">
          削除
        </button>
      </div>
      <label htmlFor={id}>
        {label}
        <input
          autoComplete="off"
          disabled={disabled}
          id={id}
          inputMode="text"
          onChange={(event) => onChange(event.target.value)}
          placeholder="Gemini APIキーを入力"
          type="password"
          value={value}
        />
      </label>
      <div className="gemini-key-actions">
        <button className="secondary-button compact-button" type="button" disabled={disabled || !value.trim()} onClick={onSave} data-tooltip="Gemini APIキーをこの端末のみに保存">
          この端末に保存
        </button>
        {description ? <small>{description}</small> : null}
      </div>
    </div>
  );
}
