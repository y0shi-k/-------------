#!/usr/bin/env python3
"""harness/*.json を読み、git diff から required_evals を自動判定し、未閉の phase gate を報告する。

使い方:
    harness/bin/check_gates.py [TKT-xxxx]

TKT を省略した場合、git ブランチ名から TKT-xxxx を推定する。
Canvas版 app.html は凍結・参照専用のため、reference eval は判定対象外（active のみ）。
終了コード: すべての必須 gate が閉じていれば 0、未閉があれば 1。
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
HARNESS = REPO_ROOT / "harness"
ARTIFACTS = REPO_ROOT / "project-os" / "artifacts"
TICKETS = REPO_ROOT / "project-os" / "tickets"
SPECS = REPO_ROOT / "project-os" / "specs"


# --- minimal front-matter parser -----------------------------------------
def parse_front_matter(text: str) -> dict:
    """`---` で囲まれた簡易 YAML front-matter をパース（scalar と list のみ対応）。"""
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
            key, val = m_kv.group(1), m_kv.group(2).strip()
            cur_key = key
            fm[key] = val if val != "" else []
    return fm


def headings(text: str) -> set[str]:
    return {m.strip() for m in re.findall(r"^#{1,6}\s+(.*)$", text, flags=re.M)}


def is_example(value) -> bool:
    """テンプレ未編集の example 値かどうか。"""
    s = " ".join(value) if isinstance(value, list) else str(value)
    return "example" in s.lower() or "TKT-0000" in s or "SPEC-0000" in s


# --- git diff -------------------------------------------------------------
# active eval が関心を持つのは実コードの変更のみ。harness/docs/.agents/.claude の編集で
# regex（'auth' 等）が誤マッチしないよう、blob はソースパスに限定する。
SOURCE_PREFIXES = ("web/", "supabase/", "scripts/", "package.json")


def _is_source(path: str) -> bool:
    return any(path == p or path.startswith(p) for p in SOURCE_PREFIXES)


def collect_diff() -> tuple[list[str], str]:
    """変更パス一覧（全体）と diff テキスト（ソースパスに限定）を返す。"""
    paths: list[str] = []

    porcelain = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "status", "--porcelain"],
        capture_output=True, text=True,
    ).stdout
    for line in porcelain.splitlines():
        if not line.strip():
            continue
        path = line[3:].strip()
        if " -> " in path:  # rename
            path = path.split(" -> ")[-1]
        paths.append(path)

    blob_parts: list[str] = []
    blob_parts.append(
        subprocess.run(
            ["git", "-C", str(REPO_ROOT), "diff", "HEAD", "--", "web", "supabase", "scripts", "package.json"],
            capture_output=True, text=True,
        ).stdout
    )
    # 未追跡のソースファイル本文も regex 照合対象に含める
    untracked = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "ls-files", "--others", "--exclude-standard"],
        capture_output=True, text=True,
    ).stdout.splitlines()
    for rel in untracked:
        if not _is_source(rel):
            continue
        fp = REPO_ROOT / rel
        try:
            if fp.is_file() and fp.stat().st_size < 2_000_000:
                blob_parts.append(fp.read_text(encoding="utf-8", errors="ignore"))
        except OSError:
            pass

    return paths, "\n".join(blob_parts)


# --- eval matching --------------------------------------------------------
def match_evals(evals: list[dict], paths: list[str], blob: str) -> list[dict]:
    """eval が match する条件: paths_any（対象パス）AND diff_regex_any（内容シグナル）。

    どちらか一方しか定義されていない場合は、その条件のみで判定する
    （未定義の条件は True 扱い）。両方あるときは AND なので、
    「web/ を触っただけで全 Web eval が発火」する過剰マッチを防げる。
    """
    matched = []
    for ev in evals:
        if ev.get("status") != "active":
            continue
        rules = ev.get("match_rules", {})
        paths_any = rules.get("paths_any", [])
        regex_any = rules.get("diff_regex_any", [])

        paths_ok = (not paths_any) or any(p in cp for p in paths_any for cp in paths)
        regex_ok = True
        if regex_any:
            regex_ok = False
            for rx in regex_any:
                try:
                    if re.search(rx, blob):
                        regex_ok = True
                        break
                except re.error:
                    continue

        if paths_ok and regex_ok:
            matched.append(ev)
    return matched


# --- gate checks ----------------------------------------------------------
def find_one(directory: Path, prefix: str) -> Path | None:
    if not directory.is_dir() or not prefix:
        return None
    # completed/ サブフォルダへ移動済みの ticket / spec も拾うため再帰探索する。
    hits = sorted(directory.rglob(f"{prefix}*.md"))
    return hits[0] if hits else None


def check_gate(gate: dict, tkt: str) -> tuple[bool, str]:
    """gate 定義に従い (closed, reason) を返す。"""
    gid = gate["id"]
    art_dir = ARTIFACTS / tkt

    # ticket / spec ベースの gate
    if gid == "spec_ready":
        ticket = find_one(TICKETS, tkt)
        if not ticket:
            return False, f"ticket {tkt} が project-os/tickets/ に無い"
        fm = parse_front_matter(ticket.read_text(encoding="utf-8"))
        specs = fm.get("related_specs") or []
        if not specs or is_example(specs):
            return False, "ticket の related_specs が未設定（example のまま）"
        for sp in specs:
            spec_prefix = sp.split("-")[0] + "-" + sp.split("-")[1] if sp.count("-") >= 1 else sp
            spec_file = find_one(SPECS, sp) or find_one(SPECS, spec_prefix)
            if not spec_file:
                return False, f"related_spec {sp} が project-os/specs/ に無い"
            sfm = parse_front_matter(spec_file.read_text(encoding="utf-8"))
            acc = sfm.get("acceptance") or []
            if not acc or is_example(acc):
                return False, f"{sp} の acceptance が未定義（example のまま）"
        return True, "spec と acceptance あり"

    if gid == "implementation_ready":
        ticket = find_one(TICKETS, tkt)
        if not ticket:
            return False, f"ticket {tkt} が無い"
        fm = parse_front_matter(ticket.read_text(encoding="utf-8"))
        for field in gate.get("required_ticket_fields", ["owner_role", "required_evals"]):
            val = fm.get(field)
            if not val or is_example(val):
                return False, f"ticket の {field} が未設定（example のまま）"
        return True, "owner_role と required_evals あり"

    # artifact ベースの gate
    artifact_name = gate.get("artifact")
    if not artifact_name:
        return True, "判定基準なし（スキップ扱い）"
    art_path = art_dir / artifact_name
    if not art_path.exists():
        return False, f"{artifact_name} が未作成（{art_dir.relative_to(REPO_ROOT)}/）"

    text = art_path.read_text(encoding="utf-8")

    if artifact_name.endswith(".json"):
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return False, f"{artifact_name} が不正な JSON"
        status = data.get("status", "")
        allowed = gate.get("allowed_statuses", ["pass", "passed"])
        if status not in allowed and status not in ("pass", "passed"):
            return False, f"{artifact_name} の status={status!r}（許可: {allowed or ['pass']}）"
        for field in gate.get("required_fields", []):
            if field not in data:
                return False, f"{artifact_name} に {field} が無い"
        return True, f"{artifact_name} status={status}"

    # markdown front-matter artifact
    fm = parse_front_matter(text)
    for field in gate.get("required_front_matter", []):
        if field not in fm or (isinstance(fm[field], (str, list)) and not fm[field] and field != "status"):
            return False, f"{artifact_name} の front-matter に {field} が無い"
    allowed = gate.get("allowed_statuses")
    if allowed and fm.get("status") not in allowed:
        return False, f"{artifact_name} の status={fm.get('status')!r}（許可: {allowed}）"
    hs = headings(text)
    missing = [s for s in gate.get("required_sections", []) if s not in hs]
    if missing:
        return False, f"{artifact_name} に必須セクションが無い: {', '.join(missing)}"
    return True, f"{artifact_name} OK"


# --- main -----------------------------------------------------------------
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

    evals = json.loads((HARNESS / "change_evals.json").read_text(encoding="utf-8"))["evals"]
    gates = {g["id"]: g for g in json.loads((HARNESS / "phase_gates.json").read_text(encoding="utf-8"))["gates"]}

    paths, blob = collect_diff()
    matched = match_evals(evals, paths, blob)

    print("=== check-gates ===")
    print(f"TKT: {tkt or '(未指定・ブランチから推定不可)'}")
    print(f"変更パス: {len(paths)} 件")
    if matched:
        print("該当 active eval:")
        for ev in matched:
            danger = "🔴危険" if ev.get("danger") else "🟢"
            print(f"  - {ev['id']} {danger}  ({ev['change_scope']})")
    else:
        print("該当 active eval: なし（docs/harness 等の変更の可能性）")
        print("→ 既定の軽量プロセス（verify.json + report.md）を推奨。")

    # 必須 gate を集約
    required_tags: list[str] = []
    for ev in matched:
        for t in ev.get("phase_gate_tags", []):
            if t not in required_tags:
                required_tags.append(t)
    # active eval が1つでも該当すれば、最低限 verify+report は必須
    if matched:
        for t in ("verify_passed", "report_ready"):
            if t not in required_tags:
                required_tags.append(t)

    if not required_tags:
        print("\n必須 gate: なし")
        return 0

    if not tkt:
        print("\n⚠ TKT 未指定のため artifact gate を判定できない。`check_gates.py TKT-xxxx` を指定。")
        return 1

    print(f"\n必須 gate ({len(required_tags)}):")
    open_gates = []
    for tag in required_tags:
        gate = gates.get(tag)
        if not gate:
            print(f"  ? {tag}: 定義が phase_gates.json に無い")
            continue
        closed, reason = check_gate(gate, tkt)
        mark = "✅" if closed else "❌"
        print(f"  {mark} {tag}: {reason}")
        if not closed:
            open_gates.append((tag, reason))

    if open_gates:
        print("\n🚧 未閉の gate と次アクション:")
        hints = {
            "spec_ready": "`/new-ticket` で spec を作り acceptance を書く",
            "implementation_ready": "ticket に owner_role と required_evals を設定",
            "verify_passed": "`/verify {TKT}` を実行",
            "manual_smokes_done": "`/finalize {TKT}` で manual-smokes.md を作成・記入",
            "review_ready": "`/finalize {TKT}` で review.md を作成・記入",
            "report_ready": "`/finalize {TKT}` で report.md を作成・記入",
        }
        for tag, _ in open_gates:
            print(f"  - {tag}: {hints.get(tag, '対応 artifact を作成').replace('{TKT}', tkt)}")
        return 1

    print("\n✅ すべての必須 gate が閉じている。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
