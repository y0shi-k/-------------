#!/usr/bin/env python3
"""PreToolUse Hook: web/ ・ supabase/ の編集時にチケット先行起票を促す。

運用ルール（CLAUDE.md / AGENTS.md）では、非trivialなWeb版変更は実装前に
`/new-ticket` で TKT チケットを起票する。だが check_gates は「最後に artifact が
揃っているか」だけを見て順序を強制しないため、直接修正依頼だとチケットを飛ばしやすい。

このフックは Edit|Write|MultiEdit の matcher から呼ばれ、編集対象が web/ または
supabase/ の現役ソースのとき、git 上で「未コミットの TKT チケット（新規/変更）」が
無ければ permissionDecision=ask（確認）を返す。`/new-ticket` で先に起票していれば
未追跡ファイルとして検出され、発火しない。判定不能時は介入しない（exit 0）。
"""
import json
import os
import subprocess
import sys

# 監視対象（現役正本のソース）。これ以外の編集では発火しない。
WATCH_SEGMENTS = ("/web/", "/supabase/")
# 生成物・依存は対象外
IGNORE_SEGMENTS = ("/node_modules/", "/.next/", "/dist/", "/build/", "/.trash/")


def project_dir() -> str:
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()


def is_watched(path: str) -> bool:
    norm = "/" + path.replace("\\", "/").lstrip("/")
    if any(seg in norm for seg in IGNORE_SEGMENTS):
        return False
    return any(seg in norm for seg in WATCH_SEGMENTS)


def has_active_ticket(cwd: str) -> bool:
    """git status 上に未コミットの TKT チケット（新規/変更/ステージ）があれば True。"""
    try:
        out = subprocess.run(
            ["git", "status", "--porcelain", "--", "project-os/tickets/"],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return True  # git が使えなければ介入しない（誤ブロック回避）
    if out.returncode != 0:
        return True
    for line in out.stdout.splitlines():
        # 例: "?? project-os/tickets/TKT-0157-foo.md" / " M project-os/tickets/..."
        name = line[3:].strip() if len(line) > 3 else ""
        if "project-os/tickets/TKT-" in name and name.endswith(".md"):
            return True
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

    reason = (
        "対応する TKT チケット（未コミット）が見つかりません。"
        "このリポジトリでは、非trivialな web/・supabase/ の変更は実装前に "
        "`/new-ticket` で起票する運用です（CLAUDE.md / AGENTS.md）。"
        "軽微な修正で起票不要と判断する場合や、直近の関連チケットに集約する場合は、"
        "このまま続行して構いません。"
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
