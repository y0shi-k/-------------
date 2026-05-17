---
ticket_id: TKT-0040-activity-statusbar-blur-exclude
status: passed
review_scope:
  - SPEC-0040-activity-statusbar-blur-exclude
  - TKT-0040-activity-statusbar-blur-exclude
---

# Review Record

## checked_diff_paths

- app.html
- project-os/specs/SPEC-0040-activity-statusbar-blur-exclude.md
- project-os/tickets/TKT-0040-activity-statusbar-blur-exclude.md
- project-os/artifacts/TKT-0040/verify.json
- project-os/artifacts/TKT-0040/manual-smokes.md
- project-os/artifacts/TKT-0040/report.md

## findings

- No blocking findings.
- Single-line change: `z-[55]` → `z-[90]` for `#activityStatusBar`.
- The new z-index `z-[90]` exceeds the highest blur overlay (`#purchaseConfirmOverlay` at `z-[75]`), ensuring the status bar remains unblurred across all known overlay scenarios.
- `pointer-events-none` remains intact, so the elevated z-index does not intercept user interactions.

## verdict

Passed.
