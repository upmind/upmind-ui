---
type: sdd-tasks
title: domain-parse-first-dot — tasks
description: The outcomes of FE-3580, in build order.
tags: [sdd, domain, dac, hotfix]
spec: internal/specs/0005-domain-parse-first-dot.md
story: FE-3580
generated: {by: planner/opus, at: 2026-10-30T00:00:00Z}
verified: []
sources: []
stage: draft
---

# Tasks: domain-parse-first-dot

## Phase 1: User Story 1 - The domains page loads with a .bd domain in the basket (P1)

- [ ] T01 [US1] prover — A baseline test pins the before column of the spec table, and it passes on the current code (AC1).
  - Reality Check: `pnpm --filter @upmind-automation/headless exec vitest run -t "@AC1"`
- [ ] T02 [US1] prover — A DAC machine test with `upmindtesting.bd` in the basket fails on the current code (AC3).
  - Reality Check: `pnpm --filter @upmind-automation/headless exec vitest run -t "@AC3"` exits non-zero before T04
- [ ] T03 [US1] prover — A DAC machine test pins today's basket rows for `.com` and `.co.uk` items, and it passes on the current code.
  - Reality Check: `pnpm --filter @upmind-automation/headless exec vitest run -t "dac basket"`
- [ ] T04 [US1] dev — `parseDomain` returns the after column of the spec table, with no `psl` call (AC2).
  - Reality Check: `pnpm --filter @upmind-automation/headless exec vitest run -t "@AC2"`
- [ ] T05 [US1] dev — The DAC machine drops a basket item that does not parse, and it holds no `parsed!` assertion (AC3, AC4).
  - Reality Check: `pnpm --filter @upmind-automation/headless exec vitest run -t "@AC3|@AC4"`
- [ ] T06 [US1] prover — The headless unit suite passes, T03 included.
  - Reality Check: `pnpm --filter @upmind-automation/headless exec vitest run`
- [ ] T07 [US1] prover — The domain e2e specs pass.
  - Reality Check: `pnpm playwright test domain-availability-checker domain-customers --project=chrome`

## Dependencies & Execution Order

- T01 to T03 run first, on the current code. They record the before state.
- T04 and T05 need T01 to T03.
- T06 and T07 run last.
