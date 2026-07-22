> Companion to the upmind-agent skill /sdd-review — Upmind-monorepo-specific bindings/overrides.

The base doctrine is authoritative; this file only supplies the repo values. The verdict transition label strings (`actor:*` / `skill:*` / `action:Review`), the status columns, and the `save_issue`-replaces-whole-set / non-agent-label (area · priority · provenance · releases) invariant are owned by [`agent-labels.companion.md`](../rules/agent-labels.companion.md) — do not restate them here.

## Tracker binding (generic verbs → Linear)

- **Tracker:** Linear (MCP connector `claude.ai Linear`). If unavailable, the VERDICT handoff cannot complete — surface that and stop; never fabricate the write.
- The base's generic verbs (Step 9b) bind to:
  - *read the issue* (`<ID>`, capture label set + identifier) → `get_issue(id: "<ID>")`
  - *update the issue with the computed label set and status Todo* → `save_issue(id, labels: [<computed set>], state: "Todo")` (read → recompute → write; `labels` replaces the whole set — see the label companion)
  - *post a tracker comment* → `save_comment(issueId, body)`

## Ticket-ID format

- IDs are `FE-XXXX` wherever the base writes `<ID>` — the SDD dir `docs/sdd/FE-XXXX/`, the compliance-gate glob `"docs/sdd/FE-XXXX"*`, the emoji-stamp `cd "docs/sdd/FE-XXXX"*` and folder renames (`FE-XXXX ✅` / `FE-XXXX 🔄`), and the `startsWith("FE-XXXX")` reference resolution.
- **Issue URL** (for tracker comments): `https://linear.app/upmind/issue/FE-XXXX`.
