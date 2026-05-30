#!/usr/bin/env python3
"""PreToolUse Hook: 凍結ファイル（Canvas版 app.html / 要件定義書.md）への編集をブロックする。

settings.json から Edit|Write|MultiEdit の matcher で呼ばれる。
stdin の hook JSON から tool_input.file_path を読み、凍結ファイルなら permissionDecision=deny。
それ以外は何も出力せず exit 0（通常の許可フローに委ねる）。
"""
import json
import os
import sys

# 凍結（参照専用）ファイルのベース名
FROZEN_BASENAMES = {"app.html", "要件定義書.md"}


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0  # 入力が読めなければ介入しない

    tool_input = data.get("tool_input") or {}
    path = tool_input.get("file_path") or tool_input.get("path") or ""
    if not path:
        return 0

    base = os.path.basename(path.rstrip("/"))
    # .bak や .trash 配下は対象外（凍結本体のみ保護）
    if "/.trash/" in path or base.endswith(".bak") or ".bak." in base:
        return 0

    if base in FROZEN_BASENAMES:
        reason = (
            f"{base} は凍結・参照専用です（Canvas版）。編集は禁止されています。"
            "編集対象は Web版（web/ + supabase/）のみ。"
            "意図的に解凍する場合は harness/bin/hook_guard_frozen.py と CLAUDE.md を見直してください。"
        )
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": reason,
            }
        }, ensure_ascii=False))
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
