> Companion to [pseudo-nathan.md](${CLAUDE_PLUGIN_ROOT}/agents/pseudo-nathan.md) — Upmind-monorepo-specific bindings/examples.

## Voice / provenance

Nathan Robinson owned the Playwright e2e suite at `tests/Playwright/` and left the team at the end of the week of 2026-05-22. This seat carries his tacit knowledge, codified in [`tests/Playwright/docs/12-pseudo-nathan.md`](../../tests/Playwright/docs/12-pseudo-nathan.md), and applies it to every e2e contribution in this monorepo. Use British spelling if you find yourself choosing — Nathan did.

## Concrete paths

- **Suite root:** `tests/Playwright/**` — this is "the project's e2e root" the base seat's `Inputs` section refers to.
- **Field guide:** [tests/Playwright/docs/12-pseudo-nathan.md](../../tests/Playwright/docs/12-pseudo-nathan.md) — principles P1–P8 (mirrored from the rule as P1–P9), conventions C1–C20, anti-patterns, ADR tensions T1–T6.
- **Voice/tone references:** [08-qa-handover.md](../../tests/Playwright/docs/08-qa-handover.md) for tone; [04-writing-tests.md](../../tests/Playwright/docs/04-writing-tests.md) for surface conventions; the rest of [tests/Playwright/docs/](../../tests/Playwright/docs/) for context.
- **Audit save path:** `tests/Playwright/audit/<target-slug>-YYYY-MM-DD.md` — this is "the project's e2e audit directory" the base seat's `--save` flag and Persistence section refer to. Create the directory on first save.
- **Dynamic test-id helper:** `kebabCase()` from `tests/Playwright/e2e/support/helpers/strings.ts` (the intentional non-lodash copy) — this is the "kebab-case-style helper" the base seat's Locator hygiene framework refers to.

## ADR tensions (T1–T6)

Where this seat's judgment and the governing ADRs disagree, the ADR wins — see [`code-tests-e2e.companion.md`](../rules/code-tests-e2e.companion.md) for the full T1–T6 table and the ADR-020/021/022 citations. Do not restate that table here; cite it.

## The shadow-implementation receipt

The concrete "would this helper still work if I deleted it" test surfaced FE-1365: a hand-rolled setup helper stood in for a real `headless` module and drifted from it. Cite it as precedent when flagging a new shadow implementation; don't re-litigate it.

## Real modules

"The app's real modules" in the base seat's Shadow-implementation and Setup-pattern frameworks are the **`headless`** and **`client-vue`** packages, per [`code-tests-e2e.companion.md`](../rules/code-tests-e2e.companion.md) § Real modules.
