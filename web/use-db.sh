#!/usr/bin/env bash
# どちらのDBに繋ぐかを切り替える。
#   ./use-db.sh hosted  → 本番(Supabase)に接続
#   ./use-db.sh dev     → 練習場(ローカル/OrbStack)に接続
#   ./use-db.sh         → 今どっちに繋いでいるか表示
set -euo pipefail
cd "$(dirname "$0")"

case "${1:-}" in
  hosted)
    cp .env.hosted.local .env.local
    echo "→ 本番(hosted)に切替えました。"
    ;;
  dev)
    cp .env.dev.local .env.local
    echo "→ 練習場(local)に切替えました。"
    ;;
  "")
    : # 表示のみ
    ;;
  *)
    echo "使い方: ./use-db.sh [hosted|dev]"
    exit 1
    ;;
esac

echo -n "現在の接続先: "
grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2-
echo "※ dev サーバ起動中なら、切替後に再起動（Ctrl+C → npm run dev）してください。"
