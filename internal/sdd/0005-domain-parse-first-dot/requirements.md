---
type: sdd-requirements
title: domain-parse-first-dot — requirements
description: The domains page loads when the basket holds a wildcard ccTLD.
tags: [sdd, domain, dac, hotfix]
spec: internal/specs/0005-domain-parse-first-dot.md
story: FE-3580
generated: {by: planner/opus, at: 2026-10-30T00:00:00Z}
verified: []
sources: []
stage: draft
---

# Feature Specification: domain-parse-first-dot

**Input**: tracker issue FE-3580. The repo spec is [0005](../../specs/0005-domain-parse-first-dot.md). Where the two disagree, the spec wins.

## Parity Scope

- Actors: [guest, client]
- Contexts: [order-domains]

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The domains page loads with a .bd domain in the basket (Priority: P1)

As a buyer with `upmindtesting.bd` in the basket, I want the domains page to load, so that I can finish my order.

#### Acceptance Criteria

- [ ] **AC1** When `parseDomain` receives each input of the spec baseline table, it must return the before column on the current code.
  - Read-back: `pnpm --filter @upmind-automation/headless exec vitest run -t "@AC1"`
- [ ] **AC2** When `parseDomain` receives each input of the spec baseline table, it must return the after column.
  - Read-back: `pnpm --filter @upmind-automation/headless exec vitest run -t "@AC2"`
- [ ] **AC3** When the DAC machine receives a basket that holds `upmindtesting.bd`, the machine must hold a basket row with SLD `upmindtesting` and TLD `.bd`.
  - Read-back: `pnpm --filter @upmind-automation/headless exec vitest run -t "@AC3"`
- [ ] **AC4** When the DAC machine receives a basket item that does not parse, the machine must drop the item and keep the other rows.
  - Read-back: `pnpm --filter @upmind-automation/headless exec vitest run -t "@AC4"`

### Edge Cases

- `shop.example.com` changes from SLD `example` to SLD `shop`. The spec accepts this change.

## Requirements *(mandatory)*

The acceptance criteria above are the requirements.

## Success Criteria *(mandatory)*

- **SC-001**: The headless unit suite passes.
- **SC-002**: The domain e2e specs pass.

## Assumptions

- Out of scope: removing the `psl` package. `useCookies` still uses it.
