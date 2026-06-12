"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AiUsageMeter } from "@/components/ai-usage-meter";
import { GeminiApiKeyPanel } from "@/components/gemini-api-key-panel";
import { LogoutButton } from "@/components/logout-button";
import { useShellAiUsage } from "@/components/web-mode-shell";
import type { UserGeminiApiKeys } from "@/lib/ai/user-gemini-api-key";
import {
  applyStockCardBgIntensity,
  applyStockLabelBg,
  DEFAULT_INTENSITY,
  DEFAULT_LABEL_BG_ALPHA,
  DEFAULT_LABEL_BG_COLOR,
  getStockCardBgIntensity,
  getStockLabelBgAlpha,
  getStockLabelBgColor,
  MAX_INTENSITY,
  MIN_INTENSITY,
  setStockCardBgIntensity,
  setStockLabelBgAlpha,
  setStockLabelBgColor,
} from "@/lib/ui/stock-card-background";
import {
  formatUserSynonymGroups,
  loadUserSynonymGroups,
  parseUserSynonymGroups,
  saveUserSynonymGroups,
} from "@/lib/ingredients/user-synonyms";

type SettingsPanelProps = {
  userEmail: string;
  isAdmin?: boolean;
  onClose: () => void;
};

export function SettingsPanel({ userEmail, isAdmin = false, onClose }: SettingsPanelProps) {
  const [geminiApiKeys, setGeminiApiKeys] = useState<UserGeminiApiKeys>({ free: "", paid: "" });
  const [bgIntensity, setBgIntensity] = useState(DEFAULT_INTENSITY);
  const [labelColor, setLabelColor] = useState(DEFAULT_LABEL_BG_COLOR);
  const [labelAlpha, setLabelAlpha] = useState(DEFAULT_LABEL_BG_ALPHA);
  const [synonymText, setSynonymText] = useState("");
  const [synonymFeedback, setSynonymFeedback] = useState<string | null>(null);
  const { aiUsageSummary } = useShellAiUsage();

  // 端末に記憶された「食材カード背景の濃さ・文字背景」を読み込む。
  useEffect(() => {
    setBgIntensity(getStockCardBgIntensity());
    setLabelColor(getStockLabelBgColor());
    setLabelAlpha(getStockLabelBgAlpha());
    setSynonymText(formatUserSynonymGroups(loadUserSynonymGroups()));
  }, []);

  // スライダー操作で即時にプレビュー（CSS変数）と保存を反映する。
  const handleBgIntensityChange = (value: number) => {
    const next = setStockCardBgIntensity(value);
    setBgIntensity(next);
    applyStockCardBgIntensity(next);
  };

  const handleLabelColorChange = (value: string) => {
    const next = setStockLabelBgColor(value);
    setLabelColor(next);
    applyStockLabelBg(next, labelAlpha);
  };

  const handleLabelAlphaChange = (value: number) => {
    const next = setStockLabelBgAlpha(value);
    setLabelAlpha(next);
    applyStockLabelBg(labelColor, next);
  };

  const handleSaveSynonyms = () => {
    const groups = parseUserSynonymGroups(synonymText);
    saveUserSynonymGroups(groups);
    // textarea を正規化済みテキストで更新する（余分な空行・空語を除去した状態）
    setSynonymText(formatUserSynonymGroups(groups));
    setSynonymFeedback(`${groups.length} グループを保存しました（無効な行は無視）`);
  };

  return (
    <section className="settings-panel" aria-label="設定・連携">
      <header className="settings-panel-header">
        <div>
          <span className="eyebrow">SETTINGS</span>
          <h2>設定・連携</h2>
          <p>Gemini APIキー・AI残り回数・アカウントをここでまとめて管理します。</p>
        </div>
        <button className="secondary-button compact-button settings-close-button" type="button" onClick={onClose} data-tooltip="設定を閉じて戻る">
          戻る
        </button>
      </header>

      <section className="settings-section" aria-label="Gemini APIキー">
        <div className="settings-section-heading">
          <h3>Gemini APIキー</h3>
          <p>この端末のブラウザにのみ保存し、AI実行時だけサーバーへ送ります。</p>
        </div>
        <GeminiApiKeyPanel apiKeys={geminiApiKeys} id="settings-gemini-api-key" onChange={setGeminiApiKeys} />
      </section>

      <section className="settings-section" aria-label="食材カードの背景写真">
        <div className="settings-section-heading">
          <h3>食材カードの背景写真</h3>
          <p>登録写真がある食材カードの背景の濃さ（写真の透過の割合）を調整します。この端末にのみ保存します。</p>
        </div>
        <div className="settings-bg-intensity">
          <label htmlFor="settings-bg-intensity">背景写真の濃さ</label>
          <input
            id="settings-bg-intensity"
            type="range"
            min={MIN_INTENSITY}
            max={MAX_INTENSITY}
            step={5}
            value={bgIntensity}
            onChange={(event) => handleBgIntensityChange(Number(event.target.value))}
            aria-describedby="settings-bg-intensity-hint"
          />
          <div className="settings-bg-intensity-scale" aria-hidden="true">
            <span>うすい</span>
            <span>{bgIntensity}%</span>
            <span>濃い</span>
          </div>
          <p id="settings-bg-intensity-hint" className="settings-bg-intensity-hint">
            濃くすると写真がはっきり見え、うすくすると背景色寄りになり文字が読みやすくなります（既定 {DEFAULT_INTENSITY}%）。
          </p>
        </div>

        <div className="settings-bg-intensity">
          <label htmlFor="settings-label-bg-color">文字ラベルの背景色</label>
          <div className="settings-label-bg-row">
            <input
              id="settings-label-bg-color"
              type="color"
              value={labelColor}
              onChange={(event) => handleLabelColorChange(event.target.value)}
            />
            <span className="settings-label-bg-color-value">{labelColor}</span>
          </div>
        </div>

        <div className="settings-bg-intensity">
          <label htmlFor="settings-label-bg-alpha">文字背景の濃さ</label>
          <input
            id="settings-label-bg-alpha"
            type="range"
            min={0}
            max={100}
            step={5}
            value={labelAlpha}
            onChange={(event) => handleLabelAlphaChange(Number(event.target.value))}
            aria-describedby="settings-label-bg-hint"
          />
          <div className="settings-bg-intensity-scale" aria-hidden="true">
            <span>透明</span>
            <span>{labelAlpha}%</span>
            <span>不透明</span>
          </div>
          <p id="settings-label-bg-hint" className="settings-bg-intensity-hint">
            食材名や日付の背後に敷く背景プレートの濃さです。文字色は背景色に合わせて自動調整します（既定 {DEFAULT_LABEL_BG_ALPHA}%）。
          </p>
        </div>
      </section>

      <section className="settings-section" aria-label="食材名の同義語辞書">
        <div className="settings-section-heading">
          <h3>食材名の同義語辞書</h3>
          <p>
            静的辞書にない表記ゆれ（家庭ごとの呼び方）を登録できます。
            1行に1グループ、語は「＝」「=」「、」「,」のいずれかで区切ってください。
            この端末にのみ保存されます。
          </p>
        </div>
        <div className="settings-synonym-editor">
          <textarea
            aria-label="ユーザー同義語辞書"
            rows={6}
            value={synonymText}
            onChange={(event) => {
              setSynonymText(event.target.value);
              setSynonymFeedback(null);
            }}
            placeholder={"かしわ＝鶏肉\n万願寺とうがらし、万願寺\nチキン＝鶏肉"}
          />
          <div className="settings-synonym-actions">
            <button
              className="primary-button compact-button"
              type="button"
              onClick={handleSaveSynonyms}
              data-tooltip="入力内容を保存してマッチングに即時反映"
            >
              保存
            </button>
            {synonymFeedback !== null && (
              <span className="settings-synonym-feedback" role="status" aria-live="polite">
                {synonymFeedback}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="settings-section" aria-label="本日のAI残り回数">
        <div className="settings-section-heading">
          <h3>本日のAI残り回数</h3>
          <p>1日あたりの上限に対する残り回数です。日付が変わるとリセットされます。</p>
        </div>
        <AiUsageMeter summary={aiUsageSummary} variant="panel" />
      </section>

      {isAdmin && (
        <section className="settings-section" aria-label="ユーザー管理">
          <div className="settings-section-heading">
            <h3>ユーザー管理</h3>
            <p>新規申請の承認・拒否や、利用ユーザーの有効化／無効化を行います。</p>
          </div>
          <div className="settings-account">
            <Link className="primary-button compact-button" href="/admin" data-tooltip="ユーザー管理画面を開く">
              管理画面を開く
            </Link>
          </div>
        </section>
      )}

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
