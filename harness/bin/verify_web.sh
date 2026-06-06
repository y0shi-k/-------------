#!/usr/bin/env bash
# Web版 verify: lint / typecheck / test / build + policy チェック。
# 結果を project-os/artifacts/<TKT>/verify.json に出力し、要約を標準出力する。
# 使い方: harness/bin/verify_web.sh [TKT-xxxx]
#   - Canvas版 app.html は凍結・参照専用のため対象外。
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

TKT="${1:-}"
WEB_DIR="$REPO_ROOT/web"
OVERALL="pass"

# --- npm steps ------------------------------------------------------------
LINT="skip"; TYPECHECK="skip"; TEST="skip"; BUILD="skip"

run_npm() { # $1=label var, $2=npm script
  local script="$2"
  echo "▶ npm run $script"
  if (cd "$WEB_DIR" && npm run "$script"); then
    printf -v "$1" "pass"; echo "  ✅ $script pass"
  else
    printf -v "$1" "fail"; OVERALL="fail"; echo "  ❌ $script fail"
  fi
}

if [ -d "$WEB_DIR" ]; then
  run_npm LINT lint
  run_npm TYPECHECK typecheck
  run_npm TEST test
  run_npm BUILD build
else
  echo "⚠ web/ が見つからない。npm steps をスキップ。"
fi

# --- policy checks --------------------------------------------------------
SCAN_DIRS=()
for d in web supabase scripts; do [ -d "$d" ] && SCAN_DIRS+=("$d"); done
GREP_EXCLUDES=(--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git)

POLICY_GAS="pass"; GAS_HITS=""
POLICY_SECRET="pass"; SECRET_HITS=""
POLICY_RLS="skip"; RLS_NOTE=""

if [ "${#SCAN_DIRS[@]}" -gt 0 ]; then
  # 1) GAS/Spreadsheet/Drive 依存が Web版に混入していないこと
  GAS_HITS="$(grep -rEn 'GAS_URL|executeGAS|SpreadsheetApp|DriveApp' "${GREP_EXCLUDES[@]}" "${SCAN_DIRS[@]}" 2>/dev/null || true)"
  [ -n "$GAS_HITS" ] && { POLICY_GAS="fail"; OVERALL="fail"; }

  # 2) 秘密の実値直書きが無いこと。
  #    許容: process.env.X への代入（env 設定）、テストのモック秘密（__tests__ / *.test.* / *.spec.*）。
  #    検出: 出荷コードに `KEY = "値"` / `KEY: "値"` の形でリテラルを直書きしているもの。
  SECRET_HITS="$(grep -rEn '(GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD)[[:space:]]*[:=][[:space:]]*["'\''][^"'\'' ]+' \
    "${GREP_EXCLUDES[@]}" --exclude-dir=__tests__ --exclude='*.test.ts' --exclude='*.test.tsx' --exclude='*.spec.ts' --exclude='*.spec.tsx' \
    "${SCAN_DIRS[@]}" 2>/dev/null | grep -v 'process\.env\.' || true)"
  [ -n "$SECRET_HITS" ] && { POLICY_SECRET="fail"; OVERALL="fail"; }
fi

# 3) Supabase migration に RLS と policy があること（ヒューリスティック・警告止まり）
if [ -d supabase/migrations ]; then
  if grep -riq 'enable row level security' supabase/migrations && grep -riq 'create policy' supabase/migrations; then
    POLICY_RLS="pass"
  else
    POLICY_RLS="warn"; RLS_NOTE="supabase/migrations に enable row level security / create policy が見当たらない。個人データを扱うなら要確認。"
  fi
fi

# 4) backlog.md「現在のフォーカス」の肥大化チェック（警告止まり・OVERALL に影響しない）
#    完了サマリの残留や長文化を検知する。完了は knowledge/changelog.md へ1行で移し、フォーカスは進行中のみに保つ。
POLICY_BACKLOG="skip"; BACKLOG_NOTE=""
BACKLOG_FILE="project-os/backlog.md"
if [ -f "$BACKLOG_FILE" ]; then
  FOCUS="$(awk '/^## 現在のフォーカス/{f=1;next} /^## /{f=0} f' "$BACKLOG_FILE")"
  DONE_CNT="$(printf '%s\n' "$FOCUS" | grep -c '完了' || true)"
  MAXLEN="$(printf '%s\n' "$FOCUS" | awk 'BEGIN{m=0}{if(length>m)m=length}END{print m+0}')"
  if [ "${DONE_CNT:-0}" -gt 2 ] || [ "${MAXLEN:-0}" -gt 800 ]; then
    POLICY_BACKLOG="warn"
    BACKLOG_NOTE="現在のフォーカスに「完了」行 ${DONE_CNT} 件 / 最長 ${MAXLEN} バイト。完了は knowledge/changelog.md へ1行移し、フォーカスは進行中のみ・各行を短く保つ。"
  else
    POLICY_BACKLOG="pass"
  fi
fi

# --- emit verify.json -----------------------------------------------------
export TKT OVERALL LINT TYPECHECK TEST BUILD POLICY_GAS POLICY_SECRET POLICY_RLS RLS_NOTE GAS_HITS SECRET_HITS REPO_ROOT
export POLICY_BACKLOG BACKLOG_NOTE

ARTIFACT_PATH=""
if [ -n "$TKT" ]; then
  ARTIFACT_DIR="$REPO_ROOT/project-os/artifacts/$TKT"
  mkdir -p "$ARTIFACT_DIR"
  ARTIFACT_PATH="$ARTIFACT_DIR/verify.json"
fi
export ARTIFACT_PATH

python3 - <<'PY'
import json, os, datetime

def lines(s):
    return [l for l in (s or "").splitlines() if l.strip()]

data = {
    "ticket_id": os.environ.get("TKT") or None,
    "scope": "web",
    "generated_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
    "status": os.environ["OVERALL"],
    "checks": {
        "lint": os.environ["LINT"],
        "typecheck": os.environ["TYPECHECK"],
        "test": os.environ["TEST"],
        "build": os.environ["BUILD"],
    },
    "policy": {
        "no_gas_dependency": os.environ["POLICY_GAS"],
        "no_hardcoded_secret": os.environ["POLICY_SECRET"],
        "supabase_rls_present": os.environ["POLICY_RLS"],
        "backlog_focus_lean": os.environ.get("POLICY_BACKLOG", "skip"),
    },
    "details": {
        "gas_hits": lines(os.environ.get("GAS_HITS")),
        "secret_hits": lines(os.environ.get("SECRET_HITS")),
        "rls_note": os.environ.get("RLS_NOTE") or "",
        "backlog_note": os.environ.get("BACKLOG_NOTE") or "",
    },
    "note": "Canvas版 app.html は凍結・参照専用のため verify 対象外。",
}

text = json.dumps(data, ensure_ascii=False, indent=2)
path = os.environ.get("ARTIFACT_PATH")
if path:
    with open(path, "w", encoding="utf-8") as f:
        f.write(text + "\n")
    print(f"\n📝 verify.json: {path}")
else:
    print("\n（TKT未指定のため verify.json は出力せず要約のみ）")

print("---- verify summary ----")
print(text)
PY

echo ""
if [ "$OVERALL" = "pass" ]; then
  echo "✅ VERIFY_PASSED"
  exit 0
else
  echo "❌ VERIFY_FAILED"
  exit 1
fi
