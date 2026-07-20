# ADR 021: Testing Trophy, Agentic Workflow & Coverage Policy

**Date:** May 2026
**Status:** Accepted (Amended June 2026 — see [Amendments](#amendments))
**Authors:** Dominic da Costa
**Supersedes:** [ADR 013: Testing Strategy](./013-testing-strategy.md)
**Related:**

- [ADR 025: Co-located Cross-Module Journey Units](./025-colocated-journey-units.md) — gives the cross-module journey layer a physical home and journey-scoped replay (Amendment 1 below).
- [ADR 020: Gherkin Test Planning](./020-gherkin-test-planning.md) — the e2e planning layer this ADR incorporates.
- [ADR 007: Headless Architecture](./007-headless-architecture.md) — the module boundary that makes layered testing tractable.
- [ADR 005: XState State Management](./005-xstate-state-management.md) — machines are the primary unit-test target.

---

## Context

ADR 013 was written retroactively in January 2024. It described a four-layer stack (unit, component, e2e, visual) without opinion on what each layer should own, what coverage means, or how tests fit a development cycle. That was fine while a dedicated tester held the judgment. He left. Dom now owns e2e.

Five forces make the old ADR inadequate:

1. **The judgment is no longer external.** Layering decisions, mocking discipline, and slice-not-journey reasoning lived in one head. Reproducing them requires written policy, not a stack table.
2. **The e2e suite has accreted shortcut helpers** — `seedInvalidProduct`, `createOrder`, API-side seeding — that re-implement business logic in the test harness. These are *shadow implementations*: a parallel universe of the code that drifts from production. They cause *test-induced design damage* because the helper, not the module, becomes the contract under test.
3. **The FE-1365 regression run surfaced 97 failures**, several of them rooted in `seedInvalidProduct` no longer matching what the real `useBasket` module produces. The tests didn't catch a production bug; they caught their own divergence.
4. **The agentic dev pipeline needs test gates baked in.** Test discipline added after an agent ships code is theatre. The skill graph (`sdd`, `code-generate`, `verify-gateway`, `story-review`) must enforce coverage as an exit criterion, not a follow-up ticket.
5. **AI-authored e2e tests degrade on long journeys.** Agentic test authoring is more reliable when each test exercises a single slice of behaviour rather than a multi-step journey. Long journeys compound coherence drift in the agent's output and amplify flake on real failures. Source: handover (`tests/Playwright/docs/08-qa-handover.md:53,64`).

ADR 013 cannot carry this load. It is superseded.

---

## Decision

Adopt a **layered Testing Trophy** (integration-heavy) with each layer testing what only it can, an **agentic workflow** that produces tests as a dev exit criterion, and a **categorical coverage policy** tied to module migration.

### Layers, in priority order

| Layer | Tool | Scope | Size | Speed target |
| --- | --- | --- | --- | --- |
| **Unit** | Vitest + fixtures | Business logic in `headless` modules, XState transitions/guards/context, **composables (including scope-based composables)**, utilities | Largest suite, hundreds of tests | < 60s on PR push |
| **Integration** | Vitest + real API or contract-tested mock, recorded fixtures | API clients, contract drift, auth flows, response shapes | Mid-size, critical paths | < 5min on PR push |
| **E2E** | Playwright, Gherkin-anchored per [ADR 020](./020-gherkin-test-planning.md) | Real user journeys through the browser | Smallest, ~10–20 critical journeys | Cadence below |
| **Component / Visual / a11y** | Storybook + Vitest + axe (proposed per [ADR 022](./022-ui-testing-strategy.md)) | Per-organism stories, interactions, accessibility | Per package | Defined by ADR 022 when drafted |

**Assumption.** Layer-by-layer execution model in CI:

- **E2E** tests in CI run against the real staging API (current cadence preserved).
- **Integration** tests in CI replay recorded fixtures via MSW (deterministic, no staging dependency). A separate `:live` mode of the integration suite runs against real staging on a nightly cadence — this is the contract-drift detection signal, not part of PR gating.
- **Unit** tests have no network dependency; the HTTP layer is stubbed entirely.

The "real staging" trade-off (occasional API hiccups) is mitigated by the retry policy and applies only to the e2e layer in CI. Integration's `:live` job has its own flake-handling cadence per the nightly review process.

The Trophy shape is the health metric — integration is the broad dominant layer (Kent C. Dodds' Testing Trophy applied to a Vue 3 SPA whose value is wiring composables + XState reacting to network). Unit is narrow but present; integration is the bulk; e2e is intentionally smallest. The current shape is an ice-cream cone: many e2e, no unit. Inverting it is the multi-quarter task this ADR opens.

### App-layer testing scope

Apps (`apps/cart`, `apps/hosting`, `apps/velia`, etc.) are **deliberately thin**: no business logic, minimal custom components, consumption-only of `@upmind-automation/client-vue`. They are **NOT a target for unit/integration testing** — testing lives where the surface lives:

- `client-vue` and per-domain UI packages → component + a11y tests (see ADR 022).
- `headless` → unit + integration tests (this ADR).
- The **app boundary is guarded by TypeScript** — if `client-vue`'s re-exports drift, `pnpm typecheck` in the consuming app breaks the build. That's the contract test for this layer.
- E2E tests exercise the apps as users do — that's the only test layer that *runs through* the app code, and it tests the system end-to-end rather than the app surface specifically.

---

## Core principles

1. **A test must protect against an articulable production bug.** If you can't name the bug, delete the test.
2. **Test your code, not a parallel universe of it.** Tests use the same `headless` / `client-vue` modules production uses — for both assertions *and* setup. Seeding state via those modules (driving `useBasket` programmatically, calling `useOrders.create()`, etc.) is legitimate. The anti-pattern is **shadow implementations**: hand-rolled HTTP, hardcoded URLs, duplicated business logic that re-implements what `headless` already does (e.g. `seedInvalidProduct`'s hardcoded `currency_id` and bypassed validation). Shadow setup drifts from production; module-driven setup cannot. *Module-driven setup is legitimate only if it reaches a state a real user can reach via the UI in production. State only reachable via admin endpoints, debug-only methods, or direct database seeding is still shadow setup — even if technically calling a real module.*
3. **Mock settings, not data.** Mock brand flags, feature toggles, and config — not journey data. Test journey state is established via the real modules and real (staging) API. Source: handover (`tests/Playwright/docs/08-qa-handover.md:21-26`).
4. **The agent that writes the code must not write the assertions in its own tests.** Assertions come from Gherkin (already produced in spec, per ADR 020) or a separate skill invocation. Self-validation is tautology.
5. **Each layer tests what only that layer can test.** No duplication across layers.
6. **Tests are an exit criterion of dev, not a phase that comes later.** A module is not "done" until layer-appropriate tests exist.
7. **Trophy shape over time is the health metric.** Integration grows broadest; unit stays narrow and focused on logic; e2e stays flat or shrinks.

---

## Coverage policy

Categorical, not percentage-based. Percentage-of-lines is metric theatre — it rewards trivial tests on getters and punishes well-tested logic with complex inputs.

| Code surface | Required coverage |
| --- | --- |
| Every XState machine | Unit tests for transitions, guards, and data flow into context (per [`code-tests.md`](../../.agent/rules/code-tests.md)) |
| Every composable (including scope-based composables) | Unit tests covering returned reactive state, exposed methods, scope-resolution behaviour, and any derived/computed values |
| Every API client function | Integration tests covering the **behaviourally meaningful cases** — typically happy path + 401, plus 4xx and 5xx when the endpoint can produce them. Endpoints that cannot produce 4xx (parameterless GETs) or have no observable 5xx handling code should have their omission documented inline in the test file. Default reviewer assumption is full 4-case coverage; the burden of "explain the omission" is on the test author. |
| Every checkout-completing user journey | Exactly one e2e Gherkin scenario |
| Every bug fix | A regression test at the lowest layer that would have caught it |
| Every module migrated to `@next` | Layer-appropriate tests exist before the migration PR merges |

**Composables with both local logic AND external calls** (e.g. `useBasket.addProduct` — has computed state AND triggers an HTTP call): get BOTH a unit test (for the local logic — derived values, scope resolution, action dispatch) AND an integration test (for the external call flow — request shape, response handling, error propagation). The unit test mocks the network layer; the integration test exercises it via the module's **own co-located fixtures**.

> ⚠️ **"canonical fixture pool" is RETIRED post-[Amendment 1](#amendments) (June 2026).** There is no shared pool: every unit owns its fixtures, co-located with its tests (real-traffic, PII-gated). See [Amendment 1, Delta C](#amendments) and [ADR 025](./025-colocated-journey-units.md).

The last row is the load-bearing rule. **A module is not "migrated to `@next`" until layer-appropriate tests exist.** This couples test coverage to a migration cadence already underway, which is the only enforcement mechanism with teeth.

Explicitly **not** enforced: line-coverage percentage.

---

## Shortcut debt & retirement

The current e2e suite uses test-harness helpers (`seedInvalidProduct`, `createOrder`, hand-rolled HTTP seeding with hardcoded URLs and IDs) that re-implement business logic to skip slow UI paths. These are known debt: shadow implementations that bypass `headless` and drift from production. They are not removed today. Note the distinction: seeding state by driving the real `headless` modules (e.g. calling `useBasket` or `useOrders.create()` programmatically) is *not* debt — it's legitimate setup. Only the hand-rolled, module-bypassing variants count here.

**Retirement rule:** a shortcut helper is retired the moment the layer beneath covers what it was masking.

- Retire ahead of coverage → lose the coverage the shortcut was providing.
- Keep after coverage → the helper accretes forever and the shadow implementation outlives its purpose.

The audit (Step 2 below) inventories each shortcut and pins it to the unit or integration test that will replace it.

---

## Flakiness policy

**Retry policy:** the live config (`playwright.config.ts`) retries a failed test exactly once. The single retry absorbs occasional staging-API hiccups; it is **not** a flake-tolerance mechanism. A test that needs the retry to pass *consistently* is a flaky test by this ADR's definition. (If you find the live config diverges from this, fix the config to match — or revise this ADR.)

Non-negotiable. Flaky tests train the team to ignore failures, which is worse than no tests.

| Trigger | Action |
| --- | --- |
| **Flake once** | Root-cause investigation. Fix or quarantine. |
| **Flake twice** | Quarantine (skipped) with linked Linear issue. |
| **Quarantined > 30 days** | Deleted. |

The 30-day deadline is the forcing function. The number can be adjusted; the deadline itself cannot be removed.

**Trigger:** a test result with Allure status `flaky` (retried-pass) counts as one flake event. The first such event starts the investigation clock. A second `flaky` event for the same test within a 30-day window triggers quarantine (per the policy table above). Allure's flake history is the source of truth for counting events. (Wiring the history query is part of the `test-quarantine` tooling rollout — see Open items.)

**Mechanical enforcement (per Linear ticket — `test-quarantine` tooling — LIVE, see [`tests/quarantine/docs/14-quarantine-tooling.md`](../../tests/quarantine/docs/14-quarantine-tooling.md) and [`tests/quarantine/`](../../tests/quarantine/)):**

- Quarantined tests use a `@quarantine(<linear-id>, <delete-date>)` tag; a lint rule rejects bare `.skip` calls on tests in the regression suite that don't carry this tag. Run: `pnpm lint:quarantine` (CI: the `lint:quarantine` MR job).
- `pnpm test:quarantined --age` reports every quarantined test by age in days.
- `pnpm quarantine:flaky` queries Allure history for tests that flaked twice in a 30-day window (the quarantine trigger); emitted as a CI artefact.
- A weekly CI job (`pnpm quarantine:enforce`) auto-files a Linear issue at day 25 ("Quarantine expiring: <test name>") and auto-fails CI at day 30 unless the test is deleted or the tag is refreshed with a documented justification.
- The `test-quarantine` skill documents the canonical procedure for quarantining a test (file the issue, apply the tag with deadline, link the issue). Pairs with `test-triage`.

---

## CI strategy per layer

| Layer | When it runs | Target |
| --- | --- | --- |
| Unit | Every PR push | < 60s |
| Integration | Every PR push | < 5min |
| E2E (critical-journey subset, ~22 tests) | Merges into `develop` (current cadence — keep) | Existing |
| E2E (full) | Nightly + pre-release | Devops proposal |

The full e2e suite is too slow to gate every PR. The critical-journey subset is the gate; the full suite is the safety net.

**Aggregate ceiling: the full e2e suite must complete in under 30 minutes.** This ceiling disciplines every coverage decision — if a new test threatens the ceiling, it has to earn its place by replacing something or moving to a lower layer. Source: handover (`tests/Playwright/docs/08-qa-handover.md:15`).

**Visual regression runs on its own cadence and does NOT count toward the e2e 30-minute ceiling.** Visual regression's own runtime budget is set independently (see ADR 022 when finalised, or the existing Playwright visual config until then).

---

## Ownership model

| Role | Owns |
| --- | --- |
| **Dev team leads + test team leads (jointly)** | Unit + integration tests for code shipped by their teams. E2E suite + test framework. **Currently a single owner (Dom) — see note below.** |
| Individual devs | Unit + integration tests for code they ship. Non-negotiable in PR review. |
| — | No "single dedicated tester" role going forward — model is collaborative ownership across dev + test leadership. |

**SPOF note (time-bound).** Until test team leads are hired (recruitment in progress), Dom is the sole owner of the e2e suite and test framework. This is a known single-point-of-failure, matching the failure mode the ADR's own §Context names. The mitigation is the recruitment itself — not a separate rotation policy. Once test team leads are in place, ownership distributes across dev + test leadership jointly. Status of this transition is reviewed at each engineering review until ownership is plural.

---

## Agentic test workflow

The skill graph already contains the right primitives. This ADR sharpens how they compose. It does **not** introduce umbrella skills (`/spec`, `/implement`, `/verify`) — those would flatten an intentionally granular set of primitives, exactly as ADR 020 rejected a `@cucumber/cucumber` runner for an analogous reason.

### Plan

`/sdd` orchestrates:

1. `sdd-requirements` — user stories + AC
2. `sdd-design` — architecture, data model, technical approach
3. **`sdd-bdd`** (new) — produces Gherkin `.feature` files per ADR 020
4. `sdd-tasks` — atomic tasks, each tagged with the test layer(s) it must produce

Gherkin is produced in plan, before code. Assertions exist before implementation.

### Dev

Per task:

- `code-generate` — writes implementation
- `code-test-unit` — writes unit tests for that implementation
- **`code-test-integration`** (new) — writes integration tests where the task touches API/contract boundaries
- **`code-test-e2e`** (new) — writes Playwright `.spec.ts` files for `@layer-e2e` Gherkin scenarios

The pairing rule lives in `sdd-tasks.md` — see the **Test-Skill Pairing Rule** section there. Each skill remains independently invocable.

### Verify

- `verify-gateway` — payment-gateway-specific verification playbook
- `test-run-suite` — runs the regression subset (skill being renamed from `test-regression`)
- `test-triage` — diagnoses failures

Verify blocks progression to review. A failing layer is a failed exit criterion.

### Review

- `story-review` — sees only verified code. The reviewer does not re-run tests; the reviewer assesses design and behaviour against Gherkin.

### Document

- `story-docs`, `docs-module`, `docs-module-review`, `guide-create`
- Mostly derivation from code + Gherkin, not creative authoring

---

## Implementation sequencing

| Step | Action | Output |
| --- | --- | --- |
| 1 | Land this ADR | ✅ on merge |
| 2 | Audit existing e2e suite | Structured manifest in `tests/Playwright/audits/`. Each row carries: test file, current location, verdict (`delete` / `move-down-to-{unit,integration}` / `keep-at-e2e`), target module if applicable, target Linear ticket if a migration PR is filed, `executed: bool` flag. **Binding to PRs:** migration PRs (per Step 7) MUST include a "Retired tests" section in the PR description listing each audit-verdict test the migration covers. Updating the manifest's `executed: true` flag is part of the merge checklist. No CI check — PR review is the human gate. PR template tooling is folded into FE-2771's scope. |
| 3 | Capture audit verdicts as Gherkin scenarios in `tests/Playwright/features/<flow>/` | The move-down ones too, so the JTBD is preserved as scenarios feeding lower layers |
| 4 | Linear initiative + epics | Initiative: "Testing Trophy migration". Epics: Audit, Unit coverage (headless modules), Integration tests (API clients), E2E reshape, CI restructure. |
| 5 | Pilot the full vertical on ONE module | `auth` or `session` — both already started. Proves the playbook. |
| 6 | Document the playbook from Step 5 | `.agent/workflows/module-testing-playbook.md` |
| 7 | Roll forward, module-by-module | Riding on the `@next` migration. Modules are already being migrated agentically per-module. Testing migration = part of module migration. Same PR. |

> ⚠️ **SUPERSEDED by [Amendment 1](#amendments) (June 2026)** at Step 3: cross-module journey Gherkin/verdicts go to the co-located journey folder `tests/<surface>/<flow>/<slug>/`, NOT `tests/Playwright/features/<flow>/`. Single-surface move-downs may stay on the legacy path until lazily migrated. See [ADR 025](./025-colocated-journey-units.md).

Step 7 is the load-bearing logistical choice. Testing migration as a parallel programme would compete with `@next` for engineering attention. Bundling them removes the conflict.

---

## Alternatives considered

### A. Keep ADR 013 as-is

Rejected. ADR 013 is descriptive, not directive. It lists tools without opinion on what each layer owns, what coverage means, or how tests integrate with the agentic pipeline. It cannot direct the team in Dom's first quarter of e2e ownership.

### B. Full TDD across the board

Rejected as overkill. TDD has real value on green-field business logic. The monorepo is mostly brown-field, mid-migration to `@next`. "Tests as exit criterion of dev" captures most of TDD's regression-prevention benefit without the dogma cost. We can adopt TDD locally on hot modules without making it a workspace mandate.

### C. One umbrella `/test` skill

Rejected. Flattens the granular skill graph the same way ADR 020 rejected `@cucumber/cucumber` flattening Playwright's runner. Granular primitives compose; an umbrella skill freezes one composition into a wrapper that becomes either too prescriptive or too vague.

### D. Continue the ice-cream cone (current state — many e2e, no unit)

Rejected. Slow feedback (e2e is minutes; unit is milliseconds), brittle (UI, network, browser), expensive to maintain, and structurally incapable of catching logic bugs at the layer they live in. The FE-1365 regression run is the receipt.

### E. Testing Pyramid (classic shape — many unit, fewer integration, fewest e2e)

Considered, rejected in favour of the Trophy. The classic pyramid assumes most bugs are catchable at the unit layer. For a Vue 3 SPA whose value is *wiring* (composables + XState machines + network responses interacting), bugs disproportionately live at the integration layer. A pyramid suite would under-cover the wiring layer and over-invest in pure unit logic that XState's TypeScript already guards. The Trophy fits the shape of bugs in this codebase.

### F. `TESTING.md` + pilot first, codify ADRs after

Considered, rejected. Reasons:

1. ADRs 020/021/022 capture decisions that emerged from this session's debate against the FE-1365 regression and the audit findings — not speculation.
2. One `TESTING.md` cannot carry the interlinked decisions across pyramid/trophy shape, flakiness, ownership, Gherkin discipline, and the agentic workflow. Splitting into focused ADRs is structurally cleaner.
3. The pilot is explicitly Step 5 with an explicit amend-loop — if the pilot uncovers ADR-amending discoveries, amending an ADR is cheap and standard practice. The inverse order is preserved in practice.
4. The ADR system already supports iteration via amendments and contras (see other ADRs in this repo for the pattern). Writing ADRs up front gives agents a strong, scannable signal when there's contra to flag; agents tend to single ADRs out when reasoning about decisions.

The reviewer's preference is stylistic, not structural. Defending it transparently here is enough.

---

## Open items

- **Future enforcement of "test-writer ≠ code-writer":** the principle is currently enforced at skill-level (each `code-test-*` skill forbids reading the implementation source under test when authoring assertions). A mechanical enforcement path — separate subagent invocations in `agent-run` / `sdd-tasks`, refusing to combine code-writing and test-authoring memory — is a follow-up to evaluate once the agentic harness supports subagent isolation primitives. Tracked in Linear when scoped.
- **Future skill: `test-pin-regression`** — a regression-pinning skill that takes `<bug-id> + <fix-commit>` and asserts a test exists that catches the bug. Out of scope for current rollout; scoped when needed.
- **Mutation testing (Stryker on Vitest):** considered, deferred. Mutation testing earns its keep on mature, stable suites; we're building the suite from scratch. The active preventions of tautological tests are: Principle #3 (test-writer ≠ code-writer with skill-level rule), the `articulable production bug` filter, and PR review. If agentic tests become a measured quality concern (PR review repeatedly catches tautological agent-authored tests), evaluate Stryker on the `auth`/`session` modules at that point.

---

## Consequences

### Positive

1. **Fast feedback in the dev's flow.** Unit tests in <60s replace e2e runs in minutes.
2. **Named anti-patterns avoided.** Shadow implementations and test-induced design damage now have policy that rejects them in review.
3. **Scaling without a dedicated tester.** Distributed ownership + agentic enforcement removes the single-point-of-failure that retiring the tester role created.
4. **Each bug class lands at the appropriate layer.** Logic bugs at unit, contract bugs at integration, journey bugs at e2e.
5. **Coverage tied to module migration.** The `@next` cadence pulls testing forward without a separate programme.

### Negative

1. **Short-term cost of building unit + integration suites** while e2e debt is still in place. Two suites carried in parallel during the migration.
2. **Agentic enforcement requires skill updates** — new `sdd-bdd`, new `code-test-integration`, new `code-test-e2e`, pairing rule in `sdd-tasks.md`. Real engineering work, not a settings change.
3. **Discipline burden on PR reviewers.** Without a dedicated tester, reviewers enforce the layer-appropriate coverage rule. Slippage erodes the policy fast.

### Neutral

1. **Existing tests untouched until the audit informs verdicts.** No risk to current coverage during planning.
2. **Visual regression unchanged.** Screenshot tests continue as today.
3. **Reversible at the workflow layer.** The Trophy shape is the commitment; the specific skill names can be re-arranged without rewriting this ADR.

---

## Related Documents

- [ADR 022: UI Testing Strategy](./022-ui-testing-strategy.md) — proposed follow-up covering the Component / Visual / a11y row.
- [ADR 020: Gherkin Test Planning](./020-gherkin-test-planning.md) — the e2e planning layer this ADR incorporates.
- [ADR 013: Testing Strategy](./013-testing-strategy.md) — **superseded** by this ADR.
- [ADR 007: Headless Architecture](./007-headless-architecture.md) — the module boundary.
- [ADR 005: XState State Management](./005-xstate-state-management.md) — primary unit-test target.
- [`.agent/rules/code-tests.md`](../../.agent/rules/code-tests.md) — workspace test rules.
- [`.agent/workflows/code-test-unit.md`](../../.agent/workflows/code-test-unit.md) — unit-test skill.
- [`.agent/workflows/code-test-integration.md`](../../.agent/workflows/code-test-integration.md) — integration-test skill.
- [`.agent/workflows/code-test-e2e.md`](../../.agent/workflows/code-test-e2e.md) — e2e-test skill.

---

## Amendments

Append-only. The Decision, layers, coverage policy, and layer ownership above are **unchanged**; this amendment gives the cross-module journey layer a physical home and **retires the shared fixture pool in favour of per-unit co-located fixtures**. Full structural detail lives in [ADR 025: Co-located Cross-Module Journey Units](./025-colocated-journey-units.md). The inline `⚠️ SUPERSEDED` markers point here.

### Amendment 1 — Co-located cross-module journey units & journey-scoped replay (June 2026)

> **Home:** [ADR 025](./025-colocated-journey-units.md). Five deltas (A–E). Trophy shape, coverage policy, and the priority-ordered layer table are untouched.

**Delta A — Journeys outside `headless`; e2e + integration co-located.** EXTENDS the E2E row. A cross-module journey is a product-flow artefact, not a package's property, so it lives at `tests/<surface>/<flow>/<slug>/`, co-locating its `.spec.ts` AND its `.int.test.ts`. **Boundary rule (reviewer-applicable):** *co-location is for JOURNEYS (cross-module flows) only. Per-module API-client / contract-drift integration tests STAY in `<package>/src/.../__tests__/`. If a test names exactly one module, it is module-scoped and does not move.* This does not contradict §App-layer "testing lives where the surface lives" — a journey's surface IS the cross-module flow, whose home is `tests/`.

**Delta B — slice-not-journey RESTATED.** REINFORCES §Context force 5 and §Coverage policy "exactly one e2e Gherkin scenario per checkout-completing journey". Co-locating slices in one folder does NOT license a monster spec: the folder holds MULTIPLE sliced `.spec.ts` plus exactly ONE `smoke.spec.ts` (the full replay); the rest are action-slices. The journey's full breadth runs at the **integration** layer (one `.int.test.ts`, deterministic MSW replay). "One journey folder" ≠ "one journey test". FE-1365 is the receipt.

**Delta C — Co-located fixtures, no shared pool (mechanism change — flagged as such).** Whole-pool loading is **RETIRED** — it caused tied parameterless routes (e.g. `GET orders/current`) to serve the first-loaded body (silent wrong body, green test; confirmed in source). **Every unit now owns its fixtures, co-located with its tests** — a module under `__tests__/fixtures/`, a journey under its slug folder's `fixtures/`. Replay loads only that unit's directory, via a `recordingsDir` threaded through `loadAllFixtures → buildHandlers → startReplayServer`. **There is no central pool and no shared `cases/`**: if two units need the same recording, each owns a copy (duplication is intended). The bug is gone **by construction** — there is no pool to collapse. **Glossary:** "canonical pool" is retired — there is no pool; each unit holds its own canonical (real-traffic, PII-gated) fixtures, and `lint-fixtures.mjs` flags two fixtures on one route inside a unit lacking a distinguishing matcher. **Companion edit:** [`tests/fixtures/README.md`](../../tests/fixtures/README.md).

**Delta D — Module scope-matrix loop.** EXTENDS the §Coverage policy scope-composables row; links [ADR 001](./001-scope-based-composables.md). Each scope-bearing module exports a matrix const enumerating user-types; its scope test LOOPS the const (add a user-type → red). Lives in per-module `__tests__/`, **NOT** the journey folder — re-anchors the Delta-A boundary.

**Delta E — pointer hygiene.** §Implementation sequencing Step 3's `tests/Playwright/features/<flow>/` path is corrected to the co-located journey tree for cross-module verdicts; single-surface move-downs may stay on the legacy path until lazily migrated. Step 3 is amended, not redone.
