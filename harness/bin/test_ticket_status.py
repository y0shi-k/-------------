#!/usr/bin/env python3
"""ticket_status.py のユニットテスト（stdlib unittest）。

実行: python3 harness/bin/test_ticket_status.py

一時ディレクトリに擬似 ticket / spec を作り、モジュールのグローバル
（REPO_ROOT / TICKETS / SPECS）を差し替えて main() を呼ぶ。
一時 dir は git リポジトリではないため git mv は失敗し、通常 move に
フォールバックする（どちらの経路でも「移動」結果は同じ）。
"""
from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

_HERE = Path(__file__).resolve().parent
_SPEC = importlib.util.spec_from_file_location("ticket_status", _HERE / "ticket_status.py")
ts = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(ts)


TICKET_TMPL = """---
id: {tkt}-demo
title: デモ
status: {status}
related_specs:
{specs}
---

本文
"""

SPEC_TMPL = """---
id: {spec}
title: デモ仕様
status: spec_ready
---
"""


class TicketStatusTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.tickets = root / "project-os" / "tickets"
        self.specs = root / "project-os" / "specs"
        self.tickets.mkdir(parents=True)
        self.specs.mkdir(parents=True)
        # モジュールのグローバルを一時 dir に向ける
        self.patches = [
            mock.patch.object(ts, "REPO_ROOT", root),
            mock.patch.object(ts, "TICKETS", self.tickets),
            mock.patch.object(ts, "SPECS", self.specs),
        ]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in self.patches:
            p.stop()
        self.tmp.cleanup()

    def _make(self, tkt="TKT-0001", status="draft", specs=("SPEC-0001-demo",)):
        spec_lines = "\n".join(f"  - {s}" for s in specs)
        (self.tickets / f"{tkt}-demo.md").write_text(
            TICKET_TMPL.format(tkt=tkt, status=status, specs=spec_lines), encoding="utf-8"
        )
        for s in specs:
            (self.specs / f"{s}.md").write_text(SPEC_TMPL.format(spec=s), encoding="utf-8")

    def _run(self, tkt, status):
        with mock.patch.object(sys, "argv", ["ticket_status.py", tkt, status]):
            return ts.main()

    def test_complete_moves_ticket_and_spec(self):
        self._make()
        rc = self._run("TKT-0001", "completed")
        self.assertEqual(rc, 0)
        self.assertFalse((self.tickets / "TKT-0001-demo.md").exists())
        self.assertTrue((self.tickets / "completed" / "TKT-0001-demo.md").exists())
        self.assertTrue((self.specs / "completed" / "SPEC-0001-demo.md").exists())
        # status が更新されている
        moved = (self.tickets / "completed" / "TKT-0001-demo.md").read_text(encoding="utf-8")
        self.assertIn("status: completed", moved)

    def test_in_progress_updates_status_without_move(self):
        self._make(status="draft")
        rc = self._run("TKT-0001", "in_progress")
        self.assertEqual(rc, 0)
        p = self.tickets / "TKT-0001-demo.md"
        self.assertTrue(p.exists())  # 移動していない
        self.assertFalse((self.tickets / "completed").exists())
        self.assertIn("status: in_progress", p.read_text(encoding="utf-8"))
        # spec も動かない
        self.assertTrue((self.specs / "SPEC-0001-demo.md").exists())

    def test_idempotent(self):
        self._make()
        self.assertEqual(self._run("TKT-0001", "completed"), 0)
        # 2回目もエラーにならず、completed/ に留まる
        self.assertEqual(self._run("TKT-0001", "completed"), 0)
        self.assertTrue((self.tickets / "completed" / "TKT-0001-demo.md").exists())

    def test_reopen_moves_back(self):
        self._make()
        self._run("TKT-0001", "completed")
        rc = self._run("TKT-0001", "draft")
        self.assertEqual(rc, 0)
        # ticket はトップ階層へ戻る
        self.assertTrue((self.tickets / "TKT-0001-demo.md").exists())
        self.assertFalse((self.tickets / "completed" / "TKT-0001-demo.md").exists())
        self.assertIn("status: draft", (self.tickets / "TKT-0001-demo.md").read_text(encoding="utf-8"))

    def test_missing_ticket_returns_1(self):
        rc = self._run("TKT-9999", "completed")
        self.assertEqual(rc, 1)

    def test_multiple_specs_all_move(self):
        self._make(specs=("SPEC-0001-demo", "SPEC-0002-demo"))
        self._run("TKT-0001", "completed")
        self.assertTrue((self.specs / "completed" / "SPEC-0001-demo.md").exists())
        self.assertTrue((self.specs / "completed" / "SPEC-0002-demo.md").exists())

    def test_heading_style_front_matter(self):
        """古い ticket（# 見出しの後に --- が始まる形式）でも status 更新・移動できる。"""
        (self.specs / "SPEC-0001-demo.md").write_text(SPEC_TMPL.format(spec="SPEC-0001-demo"), encoding="utf-8")
        (self.tickets / "TKT-0001-demo.md").write_text(
            "# TKT-0001-demo.md\n\n---\nticket_id: TKT-0001\n"
            "related_specs:\n  - SPEC-0001-demo.md\n"  # .md 付きの混在も再現
            "status: completed\n---\n\n## 目的\n本文\n",
            encoding="utf-8",
        )
        self.assertEqual(self._run("TKT-0001", "completed"), 0)
        self.assertTrue((self.tickets / "completed" / "TKT-0001-demo.md").exists())
        self.assertTrue((self.specs / "completed" / "SPEC-0001-demo.md").exists())

    def test_empty_list_related_specs(self):
        """related_specs: [] は spec 無しとして扱い、ticket だけ移動する。"""
        (self.tickets / "TKT-0001-demo.md").write_text(
            "---\nid: TKT-0001-demo\nstatus: completed\nrelated_specs: []\n---\n\n本文\n",
            encoding="utf-8",
        )
        self.assertEqual(self._run("TKT-0001", "completed"), 0)
        self.assertTrue((self.tickets / "completed" / "TKT-0001-demo.md").exists())
        self.assertFalse((self.specs / "completed").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
