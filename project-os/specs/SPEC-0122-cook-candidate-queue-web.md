---
id: SPEC-0122-cook-candidate-queue-web
title: 作りたい候補Web移植
status: spec_ready
scope:
  - web/
  - supabase/
  - candidate queue
constraints:
  - CSV移行前に保存形式を確定する
  - 候補理由を失わない
acceptance:
  - 作りたい候補を追加、表示、解除できる
  - 理由チップを表示できる
  - 候補から献立へ割り当てられる
related_tickets:
  - TKT-0122-cook-candidate-queue-web
---

# Summary

Canvas版の作りたい候補キューをWeb版へ移す。
