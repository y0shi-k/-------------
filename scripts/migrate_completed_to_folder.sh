#!/usr/bin/env bash
# 一度きりの移行: 既に完了している ticket（status: completed/done）と
# その related_specs を completed/ サブフォルダへ移動する。
#
# 使い方:
#   scripts/migrate_completed_to_folder.sh --dry-run   # 移動予定を表示するだけ
#   scripts/migrate_completed_to_folder.sh             # 実際に移動（git mv）
#
# - 進行中チケット・未完了スペックは触らない。
# - ファイル名・id は変更しない（移動のみ）。
# - コミットはしない。実行後 git status / git diff で差分を確認してから commit すること。
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

HELPER="harness/bin/ticket_status.py"

# 完了 ticket（トップ階層のみ。completed/ は対象外）を「TKT番号 ファイルパス」で列挙する。
# bash 3.2 互換のため mapfile は使わず while-read で配列に詰める。
COMPLETED=()
while IFS= read -r line; do
  [ -n "$line" ] && COMPLETED+=("$line")
done < <(python3 - <<'PY'
import re
from pathlib import Path

tickets = Path("project-os/tickets")
for f in sorted(tickets.glob("TKT-*.md")):
    text = f.read_text(encoding="utf-8")
    m = re.search(r"^status:\s*(\S+)", text, re.MULTILINE)
    status = m.group(1).strip().strip("\"'").lower() if m else ""
    if status in ("completed", "done"):
        m2 = re.match(r"(TKT-\d+)", f.name)
        if m2:
            # 既存の完了ラベル（completed/done）を保持して渡す
            print(f"{m2.group(1)} {status} {f.as_posix()}")
PY
)

echo "=== migrate_completed_to_folder ($([ "$DRY_RUN" = 1 ] && echo DRY-RUN || echo APPLY)) ==="
echo "完了 ticket: ${#COMPLETED[@]} 件"
echo ""

if [ "${#COMPLETED[@]}" -eq 0 ]; then
  echo "対象なし。終了。"
  exit 0
fi

for entry in "${COMPLETED[@]}"; do
  tkt="${entry%% *}"
  rest="${entry#* }"
  status="${rest%% *}"
  f="${rest#* }"
  if [ "$DRY_RUN" = 1 ]; then
    echo "[move] $f → project-os/tickets/completed/$(basename "$f")"
    python3 - "$f" <<'PY'
import re, sys
from pathlib import Path
text = Path(sys.argv[1]).read_text(encoding="utf-8")
m = re.search(r"^related_specs:\s*\n((?:\s*-\s*.*\n)+)", text, re.MULTILINE)
if m:
    for line in m.group(1).splitlines():
        v = line.strip().lstrip("-").strip()
        if v:
            print(f"        spec: {v}")
PY
  else
    python3 "$HELPER" "$tkt" "$status"
  fi
done

echo ""
if [ "$DRY_RUN" = 1 ]; then
  echo "→ dry-run のみ。実際に移動するには引数なしで再実行する。"
else
  echo '→ 移動完了。git status で rename 件数を確認し、問題なければ commit する（このスクリプトはコミットしない）。'
fi
