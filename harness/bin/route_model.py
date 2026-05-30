#!/usr/bin/env python3
"""ticket の required_evals を読み、危険変更かどうかでモデル/エージェントを推奨する。

使い方:
    harness/bin/route_model.py [TKT-xxxx]

判定:
    required_evals のいずれかが change_evals.json で danger:true → impl-deep (Opus)
    それ以外 → impl-fast (Sonnet)
TKT 省略時は git ブランチ名から推定。required_evals 未設定や不明 eval は安全側（deep）に倒す。
終了コード 0。標準出力の末尾行に `AGENT=<name>` を出す（Skill が拾えるように）。
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
TICKETS = REPO_ROOT / "project-os" / "tickets"
CHANGE_EVALS = REPO_ROOT / "harness" / "change_evals.json"
LEGACY_EVALS = REPO_ROOT / "harness" / "legacy" / "canvas_evals.json"


def parse_front_matter(text: str) -> dict:
    fm: dict = {}
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return fm
    cur_key = None
    for line in lines[1:]:
        if line.strip() == "---":
            break
        m_item = re.match(r"\s+-\s+(.*)$", line)
        if m_item and cur_key is not None:
            fm.setdefault(cur_key, [])
            if isinstance(fm[cur_key], list):
                fm[cur_key].append(m_item.group(1).strip())
            continue
        m_kv = re.match(r"([A-Za-z0-9_]+):\s*(.*)$", line)
        if m_kv:
            cur_key = m_kv.group(1)
            val = m_kv.group(2).strip()
            fm[cur_key] = val if val != "" else []
    return fm


def find_ticket(tkt: str) -> Path | None:
    if not TICKETS.is_dir() or not tkt:
        return None
    hits = sorted(TICKETS.glob(f"{tkt}*.md"))
    return hits[0] if hits else None


def detect_tkt(arg: str | None) -> str | None:
    if arg:
        return arg
    branch = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "branch", "--show-current"],
        capture_output=True, text=True,
    ).stdout.strip()
    m = re.search(r"(TKT-\d{3,})", branch)
    return m.group(1) if m else None


def main() -> int:
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    tkt = detect_tkt(arg)

    evals = json.loads(CHANGE_EVALS.read_text(encoding="utf-8"))["evals"]
    danger_map = {e["id"]: bool(e.get("danger")) for e in evals}
    # legacy(Canvas)eval も既知として扱う。Canvas は凍結のため非危険・実装振り分けの対象外。
    # これにより、古い Canvas eval が残るチケットを「未知」と誤判定して deep に倒さずに済む。
    if LEGACY_EVALS.exists():
        for e in json.loads(LEGACY_EVALS.read_text(encoding="utf-8")).get("evals", []):
            danger_map.setdefault(e["id"], False)
    known = set(danger_map)

    print("=== route-model ===")
    print(f"TKT: {tkt or '(未指定・推定不可)'}")

    reason = ""
    agent = "impl-fast"
    model = "sonnet"

    ticket = find_ticket(tkt) if tkt else None
    if not ticket:
        agent, model = "impl-deep", "opus"
        reason = "ticket が見つからない。安全側で deep(Opus) を推奨。先に /new-ticket で作成を。"
    else:
        fm = parse_front_matter(ticket.read_text(encoding="utf-8"))
        req = fm.get("required_evals") or []
        if isinstance(req, str):
            req = [req]
        # example のままなら未設定扱い
        req = [r for r in req if r and "example" not in r.lower()]

        if not req:
            agent, model = "impl-deep", "opus"
            reason = "required_evals が未設定。安全側で deep(Opus)。ticket を埋めると正確に振り分く。"
        else:
            danger_hits = [r for r in req if danger_map.get(r)]
            unknown = [r for r in req if r not in known]
            if danger_hits:
                agent, model = "impl-deep", "opus"
                reason = f"危険 eval を含む: {', '.join(danger_hits)} → deep(Opus)"
            elif unknown:
                agent, model = "impl-deep", "opus"
                reason = f"未知の eval を含む: {', '.join(unknown)}（reference/Canvas の可能性）。安全側で deep(Opus)"
            else:
                agent, model = "impl-fast", "sonnet"
                reason = f"非危険 eval のみ: {', '.join(req)} → fast(Sonnet)"
            print(f"required_evals: {', '.join(req)}")

    print(f"判定理由: {reason}")
    print(f"推奨: {agent} ({model})")
    print(f"AGENT={agent}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
