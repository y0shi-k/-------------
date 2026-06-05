#!/usr/bin/env python3
"""ticket の status を更新し、完了時に completed/ サブフォルダへ移動する。

使い方:
    harness/bin/ticket_status.py <TKT-xxxx> <new_status>

挙動:
    - front-matter の `status:` を <new_status> に更新する。
    - <new_status> が completed/done のとき:
        ticket を project-os/tickets/completed/ へ移動し、
        ticket の related_specs に挙がる SPEC を project-os/specs/completed/ へ移動する。
    - それ以外の status で、対象が completed/ 配下にある場合（再オープン）:
        トップ階層へ戻す。
    - ファイル名は一切変更しない（id とファイル名の一致を保つ）。
    - 冪等。既に目的の場所・status なら無変更。

注意:
    SPEC が複数 ticket に跨る場合、完了側の処理で completed/ へ移ることがある。
    探索は再帰（rglob）で行うため completed/ 配下でも見つかり、機能影響はない。

移動は git mv を用い履歴を保持する。git 管理外なら通常の move にフォールバックする。
終了コード 0=成功 / 1=対象 ticket が見つからない・引数不正。
"""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
TICKETS = REPO_ROOT / "project-os" / "tickets"
SPECS = REPO_ROOT / "project-os" / "specs"
COMPLETED_STATUSES = {"completed", "done"}


# --- minimal front-matter parser -----------------------------------------
def parse_front_matter(text: str) -> dict:
    """`---` で囲まれた簡易 YAML front-matter をパース（scalar と list のみ）。

    古い ticket は `# 見出し` の後に front-matter が始まるため、1行目固定ではなく
    最初に現れる `---` から次の `---` までを front-matter として扱う。
    """
    fm: dict = {}
    lines = text.splitlines()
    try:
        start = next(i for i, ln in enumerate(lines) if ln.strip() == "---")
    except StopIteration:
        return fm
    cur_key = None
    for line in lines[start + 1:]:
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


def update_status_text(text: str, new_status: str) -> str:
    """front-matter 内の最初の `status:` 行のみ new_status に置き換えて返す（非破壊）。"""
    lines = text.splitlines(keepends=True)
    in_fm = False
    for i, line in enumerate(lines):
        stripped = line.rstrip("\n")
        if stripped.strip() == "---":
            if not in_fm:
                in_fm = True
                continue
            break  # front-matter 終端
        if in_fm and re.match(r"status:\s*", stripped):
            newline = "\n" if line.endswith("\n") else ""
            lines[i] = f"status: {new_status}{newline}"
            return "".join(lines)
    return text  # status 行が無ければそのまま


# --- file move ------------------------------------------------------------
def git_move(src: Path, dst: Path) -> None:
    """git mv で移動。失敗（未追跡等）なら通常の move にフォールバック。"""
    dst.parent.mkdir(parents=True, exist_ok=True)
    res = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "mv", str(src), str(dst)],
        capture_output=True, text=True,
    )
    if res.returncode != 0:
        shutil.move(str(src), str(dst))


def find_one(base: Path, prefix: str) -> Path | None:
    """base 配下（completed/ 含む）から prefix で始まる .md を1つ探す。"""
    if not base.is_dir() or not prefix:
        return None
    hits = sorted(base.rglob(f"{prefix}*.md"))
    return hits[0] if hits else None


def move_into_completed(path: Path, base: Path) -> Path:
    """path を base/completed/ へ移動して新 path を返す。既に completed/ 配下なら無変更。"""
    completed_dir = base / "completed"
    if path.parent == completed_dir:
        return path
    dst = completed_dir / path.name
    git_move(path, dst)
    return dst


def move_out_of_completed(path: Path, base: Path) -> Path:
    """再オープン: completed/ 配下なら base 直下へ戻す。それ以外は無変更。"""
    if path.parent != base / "completed":
        return path
    dst = base / path.name
    git_move(path, dst)
    return dst


def spec_ids_from_ticket(fm: dict) -> list[str]:
    specs = fm.get("related_specs") or []
    if isinstance(specs, str):
        # `related_specs: []` のような空リスト記法は空として扱う。
        specs = [] if specs.strip() in ("", "[]") else [specs]
    out = []
    for s in specs:
        s = s.strip()
        # related_specs は `.md` 付き/無しが混在するため正規化する。
        if s.endswith(".md"):
            s = s[:-3]
        if s and "example" not in s.lower() and "SPEC-0000" not in s:
            out.append(s)
    return out


def main() -> int:
    if len(sys.argv) < 3:
        print("usage: ticket_status.py <TKT-xxxx> <new_status>", file=sys.stderr)
        return 1
    tkt, new_status = sys.argv[1], sys.argv[2].strip()

    ticket = find_one(TICKETS, tkt)
    if not ticket:
        print(f"❌ ticket {tkt} が project-os/tickets/ に見つからない", file=sys.stderr)
        return 1

    text = ticket.read_text(encoding="utf-8")
    fm = parse_front_matter(text)

    # 1) status 更新（変化がある場合のみ書き込み）
    if fm.get("status") != new_status:
        ticket.write_text(update_status_text(text, new_status), encoding="utf-8")
        print(f"status: {fm.get('status')} → {new_status}")
    else:
        print(f"status: {new_status}（変更なし）")

    completing = new_status in COMPLETED_STATUSES

    # 2) 移動
    if completing:
        new_path = move_into_completed(ticket, TICKETS)
        if new_path != ticket:
            print(f"moved: {ticket.relative_to(REPO_ROOT)} → {new_path.relative_to(REPO_ROOT)}")
        for sp in spec_ids_from_ticket(fm):
            spec_file = find_one(SPECS, sp) or find_one(SPECS, "-".join(sp.split("-")[:2]))
            if not spec_file:
                print(f"  ⚠ related_spec {sp} のファイルが見つからない（スキップ）")
                continue
            sp_new = move_into_completed(spec_file, SPECS)
            if sp_new != spec_file:
                print(f"  spec moved: {spec_file.relative_to(REPO_ROOT)} → {sp_new.relative_to(REPO_ROOT)}")
    else:
        # 再オープン: ticket が completed/ にあれば戻す（spec は据え置き）
        new_path = move_out_of_completed(ticket, TICKETS)
        if new_path != ticket:
            print(f"reopened: {ticket.relative_to(REPO_ROOT)} → {new_path.relative_to(REPO_ROOT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
