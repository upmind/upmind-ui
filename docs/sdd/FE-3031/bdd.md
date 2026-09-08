# BDD Scenarios: FE-3031

## Scope of this document

Per `.claude/skills/sdd-bdd.companion.md`, `/sdd-bdd` owns **cross-module e2e
journey** features only (`tests/features/<flow>/*.feature`, `@layer-e2e`). It does
**not** author a module's colocated business-logic feature.

**No `.feature` file is authored by this plan, for two independent reasons:**

1. **Write lane.** This Plan stage's write lane is `docs/sdd/**` only. `tests/features/**` is outside it, and the planner seat may not write there.
2. **Nothing in this story is a cross-module e2e journey inside scope.** The one candidate — a payment settling and the new row appearing — spans the payment flow, which is **PN-1, explicitly Out of Scope**. The half this module owns is the *refetch*, which is an outbound-request-contract assertion at the integration layer, not a journey.

The module's own colocated feature
(`packages/headless/src/modules/invoices/__tests__/invoices.feature`) is authored
by a **separate prover-seat dispatch** running `upmind-agent:test`'s BDD route,
from the 23-capability list in `design.md` §"The capability list the module
feature is derived from". This plan supplies that list; it does not write the
file.

---

## Feature file(s)

| File | Owner | Status |
|------|-------|--------|
| `tests/features/<flow>/*.feature` | `/sdd-bdd` (this chain) | **none authored** — no in-scope cross-module journey (see above) |
| `packages/headless/src/modules/invoices/__tests__/invoices.feature` | prover seat via `upmind-agent:test` | to be authored from `design.md` §capability list (C01-C23) |

---

## AC → proof-layer mapping

Every AC's proof layer, and why it sits there. All 13 map to a task in
`tasks.md` bearing a non-excluded Reality Check.

| AC | Capability | Layer | Why this layer |
|----|-----------|-------|----------------|
| AC1 | Unpaid-amount live re-read | integration | Asserts an outbound request contract (URL + currency param + a second request on currency change). Response-shape and request-count assertions are integration's job. |
| AC2 | Collection read with criteria, **and** the consolidatable count coexisting with it (`R04`) | integration | The wire query string is the assertion. The coexistence half needs two *distinct* observed requests plus the list's criteria surviving the count read — only an integration read-back can see both. |
| AC3 | Refetch after a payment outcome | integration | The journey's trigger is PN-1 (out of scope); the module owns the refetch, provable as a second outbound request. **See the broken-lane note below.** |
| AC4 | Assigned method + "none selected" | integration | The PATCH body's *key presence* is the assertion. |
| AC5 | Consolidation surface + bundle groups | integration | Wire → VM mapping against a recorded consolidation fixture. |
| AC6 | Large-bundle flag | integration | Needs the outbound `with_count=products` **and** the mapped derivation — both wire-adjacent. |
| AC7 | Credit notes as criteria preset + label precedence | integration | The category values in the query string, plus the label derivation. |
| AC8 | Pending + attempt age + awaiting-client | integration | Needs the gateway relation on the wire and the mapped discrimination. |
| AC9 | `next_charge_date` mapped | integration | Mapping against two recorded fixtures (present / absent). |
| AC10 | Unpaid existence, from a dedicated read | integration | The assertion is the dedicated request's own query string — `filter[status.code|in]` + `limit=1` — plus the derivation from the server total, not the row array. **Not** the literal token `count`: the oracle's `limit: "count"` sentinel cannot reach the wire (`requirements.md` AC10, "Oracle divergence"). |
| AC11 | `balance` ≠ `unpaidAmount` after consolidation | integration | Mapping against a recorded consolidated fixture. |
| AC12 | `client×client` retarget | integration | **The A7 clause** (`.claude/rules/verify-reality-check.companion.md`): identity-retargeting work must assert the request URL/filter retarget **and** the auth identity transport — which token was selected, which acting-as headers were sent. Only an integration read-back can see the outbound credential. |
| AC13 | Co-mingled row attribution | integration | Mapping against a recorded mixed-list page. |

**No AC is deferred to unit.** Two behaviours are unit-shaped and are covered
*additionally*, never *instead*: the bundle grouping's fallback chain
(`contracts_product_id` → `contract_id` → trailing `null` group) and the
child-first attribution gate. Both also carry integration read-backs (AC5, AC13)
and negative controls (T16 mutants 2 and 5), so the unit spec accompanies the
proof and never constitutes it.

---

## Scenarios intentionally NOT written

| Behaviour | Reason |
|-----------|--------|
| A payment settling end-to-end and the row appearing | **PN-1, Out of Scope.** The module's half is AC3's refetch. |
| Triggering consolidation and observing the merged document | **CO-1/CO-2, Out of Scope.** The module serves the refetch target the POST invalidates; it does not trigger consolidation. This means the consolidation refetch is **not driveable end-to-end from the playground** without a forced-state preset — named here so the scenario lane does not discover it. |
| Any staff-actor read | Staff deprecated by operator ruling 2026-09-01. |
| Admin writes (cancel, credit, regenerate, recalculate) | `apiPath().admin`-bound (`oracle:279-542`), out of scope with the staff deprecation. |
| A "returns a four-layer object" / "the barrel exports X" assertion | **Structural, not a capability** — not planable (ADR-020: name a capability, not a structure). The four-layer shape is proven by the capabilities that ride on it, never asserted directly. |

---

## Finding: the `labs-nuxt` e2e lane is broken on `develop`

Surfaced while sizing AC3's read-back. **A baseline defect, not this run's** —
recorded so no downstream seat writes a read-back against it and no reviewer
mistakes a skip for a pass.

1. `playgrounds/labs-nuxt/playwright.config.ts:6` imports `./tests/e2e/browser-world`; `:7` imports `./tests/e2e/catalogs`.
2. `playgrounds/labs-nuxt/tests/` **does not exist** and is **not git-tracked** — `git ls-files playgrounds/labs-nuxt/tests` returns empty, and the directory is absent from both this worktree and the main checkout (`/Users/dom/Documents/upmind-monorepo/playgrounds/labs-nuxt/tests` → No such file or directory). It is not covered by `playgrounds/labs-nuxt/.gitignore`.
3. So `pnpm --filter @upmind-automation/labs-nuxt test:e2e` cannot resolve its own config imports.
4. Independently: `playwright.config.ts:44` sets `missingSteps: "skip-scenario"` — a scenario with no step definitions **skips** rather than fails. Deliberate (`:41-45` explains it: a module's feature legitimately holds not-yet-driveable scenarios), but it means **a green `test:e2e` run is not evidence a scenario executed.** Any e2e read-back in this repo must assert the scenario *ran*, not merely that the suite exited 0.
5. Note the coupling this creates: `playwright.config.ts:36-52` points the lane at **module-colocated** features with `featuresRoot: "../../"`, so `invoices.feature` (prover-authored) will be consumed by this lane once it is repaired.

**Consequence applied:** AC3's read-back was moved from the e2e lane to an
integration read-back asserting the second outbound request. Recorded in
`requirements.md` AC3 ("Why not e2e") and `tasks.md` T15.

---

## Reviewer guidance

> **🧪 Product / QA**
> - There is no `.feature` file to read for this story, and that is deliberate — both in-scope journeys' triggers (payment, consolidate POST) are excluded by the issue's own Out of Scope. The capability list to review is `design.md` §"The capability list the module feature is derived from" (C01-C23).
> - The one thing to push back on: if you believe a customer-visible journey in this story *is* in scope, say which — it would mean the Out of Scope needs revisiting, which is an operator decision, not a plan fix.

> **👩‍💻 Developers**
> - Every AC's proof is an **integration** read-back against **recorded** fixtures. Fixtures are recorded (T10), never hand-authored — the 2026-08-05 data-provenance receipt.
> - AC12 is the one that must assert the **auth identity transport**, not just the URL: which token went out, and that no acting-as header did. A response-payload assertion does not prove a retarget.
> - Do not add an e2e read-back until the `labs-nuxt` lane is repaired, and when it is, assert the scenario **ran** — `missingSteps: "skip-scenario"` makes a green exit code insufficient.
