#!/usr/bin/env python3
"""Stop Hook: 実装変更があるのに decisions.md を更新していない場合だけ、更新を促す。

毎ターン煩くならないよう、git の未コミット変更に web/ または supabase/ が含まれ、かつ
decisions.md が変更されていないときのみ systemMessage を出す（非ブロック）。
それ以外は何も出さず exit 0。

注: Stop イベントは hookSpecificOutput.additionalContext を受け付けない
（additionalContext は UserPromptSubmit / PostToolUse 用）。Stop で非ブロックの
お知らせを出す正しいフィールドは top-level の systemMessage。
"""
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    try:
        out = subprocess.run(
            ["git", "-C", str(REPO_ROOT), "status", "--porcelain"],
            capture_output=True, text=True, timeout=10,
        ).stdout
    except (subprocess.SubprocessError, OSError):
        return 0

    changed = [line[3:].strip() for line in out.splitlines() if line.strip()]
    if not changed:
        return 0

    work_changed = any(p.startswith("web/") or p.startswith("supabase/") for p in changed)
    decisions_touched = any("project-os/knowledge/decisions.md" in p for p in changed)

    if work_changed and not decisions_touched:
        msg = (
            "実装変更（web/ または supabase/）があります。重要な決定をしたなら、"
            "project-os/knowledge/decisions.md と project-os/backlog.md の更新を検討してください"
            "（/finalize でも追記できます）。"
        )
        print(json.dumps({"systemMessage": msg}, ensure_ascii=False))

    return 0


if __name__ == "__main__":
    sys.exit(main())
