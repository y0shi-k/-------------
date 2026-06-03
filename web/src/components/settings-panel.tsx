"use client";

import { useState } from "react";
import { AiUsageMeter } from "@/components/ai-usage-meter";
import { GeminiApiKeyPanel } from "@/components/gemini-api-key-panel";
import { LogoutButton } from "@/components/logout-button";
import { useShellAiUsage } from "@/components/web-mode-shell";

type SettingsPanelProps = {
  userEmail: string;
  onClose: () => void;
};

export function SettingsPanel({ userEmail, onClose }: SettingsPanelProps) {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const { aiUsageSummary } = useShellAiUsage();

  return (
    <section className="settings-panel" aria-label="設定・連携">
      <header className="settings-panel-header">
        <div>
          <span className="eyebrow">SETTINGS</span>
          <h2>設定・連携</h2>
          <p>Gemini APIキー・AI残り回数・アカウントをここでまとめて管理します。</p>
        </div>
        <button className="secondary-button compact-button settings-close-button" type="button" onClick={onClose}>
          戻る
        </button>
      </header>

      <section className="settings-section" aria-label="Gemini APIキー">
        <div className="settings-section-heading">
          <h3>Gemini APIキー</h3>
          <p>この端末のブラウザにのみ保存し、AI実行時だけサーバーへ送ります。</p>
        </div>
        <GeminiApiKeyPanel apiKey={geminiApiKey} id="settings-gemini-api-key" onChange={setGeminiApiKey} />
      </section>

      <section className="settings-section" aria-label="本日のAI残り回数">
        <div className="settings-section-heading">
          <h3>本日のAI残り回数</h3>
          <p>1日あたりの上限に対する残り回数です。日付が変わるとリセットされます。</p>
        </div>
        <AiUsageMeter summary={aiUsageSummary} variant="panel" />
      </section>

      <section className="settings-section" aria-label="アカウント">
        <div className="settings-section-heading">
          <h3>アカウント</h3>
          <p>ログイン中のアカウントとログアウトはこちらから操作します。</p>
        </div>
        <div className="settings-account">
          <span className="settings-account-email">{userEmail}</span>
          <LogoutButton />
        </div>
      </section>
    </section>
  );
}
