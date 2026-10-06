# factory-module-gate fixtures

Known-bad and known-good cases for `etc/ci/lint/factory-module-gate.mjs`. A case is a commit, not a copied tree. The module is graded where it was built. So the fixture cannot drift from the incident, and ESLint never lints a copy.

| Case | Verdict | Isolates |
| ---- | ------- | -------- |
| `known-bad-1-mr616-affiliate` | RED at `gate-1`; gates 1, 2, 3, 4, 5 and 7 all RED | MR !616 (FE-3227) tip `91779b28e8`: 49 `async-discipline/no-promise-try-catch`, 3 `endpoint-ownership/*`, 47 capability `*.int.test.ts`, module-built `msw` handlers and an edited recording, 86 must-fail patches in the module root, a hand-rolled OAuth login in the recorder, and 68 paths outside the module (labs harness, ADR 032, i18n, docs corpus). |

## Replay a case

Run from the repo root. Keep the ref: the branch is unmerged, and this fixture depends on its tip.

```bash
git fetch origin 91779b28e8cadd6faf38034d3e486306da604ef4   # only when the commit is not local
git worktree add --detach .claude/worktrees/known-bad-616 91779b28e8
node etc/ci/lint/factory-module-gate.mjs \
  --root .claude/worktrees/known-bad-616 \
  --module packages/headless/src/modules/affiliate \
  --config eslint.config.mjs
git worktree remove .claude/worktrees/known-bad-616
```

`--config eslint.config.mjs` grades the old tree with today's rules: the question a fixture answers is "would today's gate stop this run?". Without it, the tree's own 2026-10-05 config still stops the run at `gate-1` on the three blocker-family rules, with gates 4 and 7 RED.

The expected verdict for each case is in its `fixture.json`.

## Provenance

Added 2026-10-06 for FE-3227 (G5), the incident that put the gate in the lane.
