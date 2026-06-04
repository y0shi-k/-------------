#!/usr/bin/env python3
"""PreToolUse Hook: web/ ・ supabase/ の編集時にチケット先行起票を促す（1セッション1回）。

運用ルール（CLAUDE.md / AGENTS.md）では、非trivialなWeb版変更は実装前に
`/new-ticket` で TKT チケットを起票する。だが check_gates は「最後に artifact が
揃っているか」だけを見て順序を強制しないため、直接修正依頼だとチケットを飛ばしやすい。
この関所は、その忘れに編集の入口で気づかせるための soft reminder。

このフックは Edit|Write|MultiEdit の matcher から呼ばれ、編集対象が web/ または
supabase/ の現役ソースのとき、「対応するチケットが見当たらない」場合に
permissionDecision=ask（確認）を返す。判定不能時は介入しない（exit 0）。

設計上の2点（過去の誤発火・連発を是正）:
- A) チケットの認識を広げる。`/new-ticket` 直後の**未コミット**チケットだけでなく、
     直近コミットで触れた **open ステータス**（draft / spec_ready / implementation_ready /
     in_progress）のチケットも「進行中の作業あり」とみなす。これにより、別セッションで
     起票してコミット済みのチケットを実装する通常フローでは発火しない。
- B) 確認は**1セッションにつき最大1回**。PreToolUse はツール呼び出しごとに起動し状態を
     持たないため、stdin の session_id をキーに一時マーカーを置き、同一セッションの2回目
     以降は黙って通す（オートモード/acceptEdits を毎編集で潰さない）。
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile

# 監視対象（現役正本のソース）。これ以外の編集では発火しない。
WATCH_SEGMENTS = ("/web/", "/supabase/")
# 生成物・依存は対象外
IGNORE_SEGMENTS = ("/node_modules/", "/.next/", "/dist/", "/build/", "/.trash/")
# 「進行中（未完了）」とみなすチケットステータス。ready/completed/done/closed は終了側で除外。
OPEN_STATUSES = {"draft", "spec_ready", "implementation_ready", "in_progress", "in-progress", "wip"}
# 直近この件数のコミットで触れたチケットを「最近の作業」として参照する。
RECENT_COMMITS = 5
# 1セッション1回マーカーの置き場
MARKER_DIR = os.path.join(tempfile.gettempdir(), "claude_ticket_reminder")


def project_dir() -> str:
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()


def is_watched(path: str) -> bool:
    norm = "/" + path.replace("\\", "/").lstrip("/")
    if any(seg in norm for seg in IGNORE_SEGMENTS):
        return False
    return any(seg in norm for seg in WATCH_SEGMENTS)


def _git(args, cwd):
    """git をサブプロセス実行し stdout を返す。失敗時は None。"""
    try:
        out = subprocess.run(
            ["git", *args], cwd=cwd, capture_output=True, text=True, timeout=5
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if out.returncode != 0:
        return None
    return out.stdout


def _ticket_status(cwd: str, rel_path: str):
    """チケット md の front-matter `status:` を返す（小文字化）。読めなければ None。"""
    try:
        with open(os.path.join(cwd, rel_path), encoding="utf-8") as fh:
            head = fh.read(2000)
    except OSError:
        return None
    m = re.search(r"^status:\s*(\S+)", head, re.MULTILINE)
    if not m:
        return None
    return m.group(1).strip().strip('"').strip("'").lower()


def has_uncommitted_ticket(cwd: str) -> bool:
    """git status 上に未コミットの TKT チケット（新規/変更/ステージ）があれば True。"""
    out = _git(["status", "--porcelain", "--", "project-os/tickets/"], cwd)
    if out is None:
        return True  # git が使えなければ介入しない（誤ブロック回避）
    for line in out.splitlines():
        name = line[3:].strip() if len(line) > 3 else ""
        if "project-os/tickets/TKT-" in name and name.endswith(".md"):
            return True
    return False


def has_recent_open_ticket(cwd: str) -> bool:
    """直近コミットで触れた TKT チケットに open ステータスのものがあれば True。"""
    out = _git(["log", f"-{RECENT_COMMITS}", "--name-only", "--pretty=format:"], cwd)
    if out is None:
        return False
    paths = {
        line.strip()
        for line in out.splitlines()
        if line.strip().startswith("project-os/tickets/TKT-") and line.strip().endswith(".md")
    }
    return any(_ticket_status(cwd, rel) in OPEN_STATUSES for rel in paths)


def has_active_ticket(cwd: str) -> bool:
    """進行中の作業に対応するチケットがあるとみなせるか。"""
    return has_uncommitted_ticket(cwd) or has_recent_open_ticket(cwd)


def already_reminded_this_session(session_id: str) -> bool:
    """このセッションで既にリマインド済みなら True。未済なら印を残して False を返す。"""
    if not session_id:
        return False  # session_id 不明な環境ではデデュープ不可（従来どおり毎回確認）
    safe = hashlib.sha256(session_id.encode("utf-8")).hexdigest()[:16]
    marker = os.path.join(MARKER_DIR, safe)
    if os.path.exists(marker):
        return True
    try:
        os.makedirs(MARKER_DIR, exist_ok=True)
        with open(marker, "w", encoding="utf-8") as fh:
            fh.write(session_id)
    except OSError:
        return False  # 印を残せなくても確認自体は出す
    return False


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0

    tool_input = data.get("tool_input") or {}
    path = tool_input.get("file_path") or tool_input.get("path") or ""
    if not path or not is_watched(path):
        return 0

    cwd = project_dir()
    if has_active_ticket(cwd):
        return 0

    # ここまで来たら「web/ を触っているがチケットが見当たらない」状態。
    # セッション中の2回目以降は黙って通す（毎編集で確認しない）。
    if already_reminded_this_session(data.get("session_id") or ""):
        return 0

    reason = (
        "対応する TKT チケットが見当たりません（このセッションで最初の web/・supabase/ 編集）。"
        "このリポジトリでは、非trivialな変更は実装前に `/new-ticket` で起票する運用です"
        "（CLAUDE.md / AGENTS.md）。軽微な修正で起票不要、または直近の関連チケットに集約する"
        "場合は、このまま続行して構いません（この確認は今セッションでは再表示されません）。"
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": reason,
        }
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
