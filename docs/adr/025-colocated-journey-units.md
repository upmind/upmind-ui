# ADR 025: Co-located Cross-Module Journey Units (Test Platform)

**Date:** June 2026
**Status:** Accepted
**Authors:** Dominic da Costa
**Related:**

- [ADR 021: Testing Trophy, Agentic Workflow & Coverage Policy](./021-testing-pyramid-and-agentic-workflow.md) — the trophy shape and coverage policy this ADR gives a physical home to. Amended (Amendment 1) to redirect its location clauses here.
- [ADR 020: Gherkin Test Planning](./020-gherkin-test-planning.md) — the `.feature` planning artefact, now co-located in the journey folder. Amended (Amendment 1) to redirect its `.feature` location clause here.
- [ADR 007: Headless Architecture](./007-headless-architecture.md) — the module boundary that defines "single-module" vs "cross-module".
- [ADR 001: Scope-Based Composables](./001-scope-based-composables.md) — the source of the per-module scope matrix the module-level loop iterates.
- Linear: **FE-2773** (integration Vitest project), **FE-2775** (fixture infrastructure rebuild), **FE-2774** (`@next` migration) — the test-platform stream this restructure rides on.

---

## Context

A clean-up of one journey's fixtures grew into a re-think of how the monorepo organises **cross-module journey tests** and the fixtures that feed them. A design council ran twice; the owner locked six structural decisions; the council then designed the concrete implementation against them.

ADR 021 set the trophy *shape* (integration-heavy) and the coverage *policy*, and ADR 020 set Gherkin as the planning artefact. Neither says **where a cross-module journey physically lives**, how the two test runners (Vitest, Playwright) discover its files, or how fixture replay is scoped. The landed work answered those questions ad hoc:

1. **Cross-module journey integration tests had no home.** The one real journey on disk (`guest-buys-paid-product`, which drives `useSession` + `useBasket` + `useBasketCurrency` + `useProductCatalogue`) was sitting in `packages/headless/src/modules/basket/__tests__/` — a false address: a four-module flow filed under one module.
2. **A journey's artefacts were scattered.** Its `.feature` lived under `tests/Playwright/features/<flow>/`, its `.spec.ts` slices under `tests/Playwright/e2e/e2e-tests/<flow>/`, its integration test under a module, and its recordings under `tests/fixtures/recordings/journeys/<slug>/`. Deleting a journey meant chasing four trees.
3. **MSW replay had a confirmed silent-correctness bug.** `buildHandlers()` loads the *whole* fixture pool; `groupBy` collapses two journeys' parameterless `GET orders/current` into one route; `matchScore` ties at 0 for both, so `maxBy` serves the **first-loaded** body — wrong body, no error, green test. Verified in source (`msw-handlers.ts`, `index.ts`). The bug is dormant only because there is currently one journey; the second overlapping journey triggers it.
4. **The per-actor scope matrix had no enforceable test pattern.** `BASKET_SCOPE_MATRIX` existed only as a JSDoc example, not an iterable const, so "add a user-type" did not mechanically demand a test.

This ADR records the structural decision that resolves all four: **a cross-module journey becomes a self-contained unit, in its own folder, outside `headless`.**

---

## Decision

A **cross-module journey** is a self-contained unit living **outside the package-under-test**, at `tests/<surface>/<flow>/<slug>/`. The folder holds everything that journey needs — its Gherkin, its sliced e2e specs, its one integration test, its alias map, its replay setup, and its own recordings. `rm -rf <slug>/` removes the journey with **zero dangling references**.

### The six locked decisions

1. **Cross-module journeys live OUTSIDE `headless`.** A flow driving auth + basket + orders is not a property of any one module; it is a product-flow artefact, and its home is `tests/`.
2. **e2e + integration co-habit one folder**, separated only by runner: Playwright globs `*.spec.ts`; Vitest globs `*.int.test.ts`. The file-suffix contract is what keeps the two runners off each other's files.
3. **Tree is `tests/<surface>/<flow>/<slug>/`**, slug surface-first.
4. **`.feature` is co-located** in the journey folder; the journey folder is a self-contained unit (delete = zero side-effects).
5. **Every unit owns its fixtures.** A module or a journey loads **only its own co-located fixtures**. There is **no shared/global pool and no `cases/`** — if two units need the same recording, each owns its own copy (duplication is intended). Replay loads the unit's directory; nothing is shared.
6. **Module scope coverage is tested by looping the module's exported scope-matrix const** (`*_SCOPE_MATRIX`), and this stays in the module's `__tests__/`.

Carry-forward (unchanged from ADR 021 / the council's standing rulings): **e2e stays SLICED** (never one monster spec per journey); the fixtures tool (`@upmind-automation/test-fixtures`) is **code-only** (loader + replay + lint — it owns no recordings); module `__tests__/` keeps unit + module-scoped (API-client / contract-drift) integration **and its own co-located fixtures**; **alias drift is solved by one shared base config**, not per-project alias copies.

### Folder tree

```
# A MODULE unit — tests AND fixtures co-located with the module
packages/headless/src/modules/<m>/__tests__/
  <m>.test.ts   <m>.int.test.ts                   # unit + module-scoped integration
  fixtures/*.json                                 # the module OWNS its fixtures (no shared pool)

# A JOURNEY unit — everything it needs in one deletable folder
tests/
  storefront/                                     # surface — created only when its first slug lands
    oneoff-checkout/                              # <flow> = <product>-<action>
      storefront-guest-oneoff-checkout-stripe/    # <slug> = the self-contained journey unit
        storefront-guest-oneoff-checkout-stripe.feature      # Gherkin (ADR 020), spec-only, not executed
        storefront-guest-oneoff-checkout-stripe.int.test.ts  # ONE Vitest integration test (drives the headless barrel)
        add-to-basket.spec.ts  pay-with-stripe.spec.ts  smoke.spec.ts   # Playwright slices; one smoke = full
        journey.ts                                           # defineJourney() alias map + SLUG const
        setup.ts                                             # startReplayServer({ recordingsDir: ./fixtures })
        fixtures/*.json                                      # the journey OWNS its fixtures (co-located)
    client-portal/  (coming soon — NOT pre-created)
    admin/          (coming soon — NOT pre-created)

  fixtures/                                       # the TOOL ONLY: @upmind-automation/test-fixtures — code, owns NO recordings
    index.ts  msw-handlers.ts  replay-server.ts  fixture-naming.mjs  types.ts  lint-fixtures.mjs  …
  vitest.base.ts                                  # single alias source, shared by ALL vitest projects
  vitest.journeys.config.ts                       # top-level journeys vitest project
  tsconfig.json                                   # thin tsconfig mirroring the alias paths for TS
  Playwright/                                     # legacy e2e suite — UNTOUCHED
```

Module-scoped (single-module) integration **stays** in `packages/headless/src/modules/<m>/__tests__/`. The boundary rule (below) decides which tree a test belongs in.

### Slug grammar

`<surface>-<who>-<product>-<action>[-<extras>][-<payment>]` — lowercase, hyphenated, fixed order, only-applicable parts, no underscores, no plurals, no filler.

- **surface** (always first): `storefront` | `client-portal` (slug prefix `portal`) | `admin`
- **who**: `guest` | `client` | `staff`
- **product**: `oneoff` | `subscription` | `domain` | `hosting` | `bundle` | …
- **action**: `checkout` | `renew` | `cancel` | `refund` | `upgrade` | `setup` | …
- **extras** (only when it adds/omits a recorded API call or changes a route body): `withaddress` | `withcoupon` | `trial` | `partial` | `3ds`
- **payment** (only when the fixture set differs by method): `stripe` | `wallet` | `banktransfer` | `paypal` | `offline`

**`<flow>` folder = the `<product>-<action>` segment** (mechanical, no judgement): `storefront-guest-oneoff-checkout-stripe` → flow `oneoff-checkout/`. **Disambiguation rule:** two journeys that branch on a different API call MUST diverge at `<extras>` or `<payment>`; if two candidate slugs collapse to the same string, the shorter one omitted a load-bearing segment and is wrong. The `.feature` Feature name **is** the slug — one vocabulary across all artefacts and both runners.

### Runner config

- **`tests/vitest.base.ts` — the ONLY alias source.** Exports `sharedAlias`: `@upmind-automation/headless` → `packages/headless/src/index.ts` (a FILE — the single-file public barrel, init-order safe); `@upmind-automation/test-fixtures` → `tests/fixtures` (a DIRECTORY — so `/replay-server`, `/msw-handlers` subpaths keep resolving; the tool has no `exports` map); `types`/`i18n` → their `/src`. Both the headless config and the journeys config import this — aliases cannot drift.
- **`packages/headless/vitest.config.ts`** replaces its local `const alias` with `import { sharedAlias }`. Existing behaviour unchanged; just centralised, plus the headless self-alias.
- **`tests/vitest.journeys.config.ts`** — NEW standalone project (not a workspace member): `plugins: [vue()]`, `resolve.alias: sharedAlias`, `root: tests/`, `include: ["**/*.int.test.ts"]`, `exclude: [...configDefaults.exclude, "**/*.spec.ts", "fixtures/**", "Playwright/**"]`, jsdom, **no global `setupFiles`** (replay is per-journey via each folder's `setup.ts`). The `**/*.spec.ts` exclude is load-bearing — `configDefaults` does not drop it, and Vitest would crash importing `@playwright/test`.
- **`playwright.config.ts`** widens `testDir` to `./tests` (was `./tests/Playwright/e2e/`), keeps `testMatch: "**/*.spec.ts"`, adds `testIgnore: ["**/node_modules/**", "tests/fixtures/**", "**/*.int.test.ts"]`. Legacy specs still match under the wider root; new slug specs match too. Verify post-change with `playwright test --list` (legacy count unchanged + new slug specs present).
- **`tests/tsconfig.json`** — NEW, mirrors the aliases as `paths` (incl. the `@upmind-automation/test-fixtures/*` wildcard, which TS needs explicitly even though Vite resolves subpaths against the directory alias automatically).
- **Root scripts:** `test:journeys` = `vitest run -c tests/vitest.journeys.config.ts`; `test:journeys:e2e` = `playwright test tests/storefront …`. **Wire `test:journeys` into the SAME CI stage as `pnpm -r test`** — the journeys vitest project is *outside* the per-package recursion, so a green `pnpm -r test` must never be mistaken for full coverage.

### Co-located fixtures — the bug fix by construction

Each test loads **only its own co-located fixtures**, via a `recordingsDir` the caller supplies (a module's `__tests__/fixtures/`, a journey folder's `fixtures/`). There is **no central pool and no shared `cases/`** to scope into.

- `loadAllFixtures({ recordingsDir })` — loads exactly that directory; the memo cache is keyed by `recordingsDir`.
- `buildHandlers` / `startReplayServer` — pass `recordingsDir` through; the `onUnhandledRequest` throw names the unit and hints where to record.

Why it kills the bug: the silent body-bleed came from loading the **whole pool** and collapsing two journeys' parameterless `GET orders/current` into one tied route, where `maxBy` served the first-loaded body. With each unit loading only its own directory there is no pool to collapse — the collision is **structurally impossible**, not merely guarded.

### Scope-matrix loop — stays in the module `__tests__/`

Per-actor coverage is a property of the package-under-test, **not** a product flow, so it does not move to the journey tree. Each scope-bearing module promotes its matrix to a real exported const (`export const BASKET_SCOPE_MATRIX = … satisfies ActorContextMatrix`). The scope test **iterates the const** with a compile-time `Record<Demanded, …>` (a missing actor is a TS error) plus a `describe.each(Object.keys(MATRIX))` runtime backstop. Iterating the const — not a hand-listed array — is what makes "add a user-type → red" mechanical.

### Boundary rule (reviewer-applicable)

> **Co-location is for JOURNEYS (cross-module flows) only.** Per-module API-client / contract-drift integration tests STAY in `<package>/src/.../__tests__/`. **If a test names exactly one module, it is module-scoped and does not move.** A journey's "surface" is the cross-module flow itself, whose home is `tests/` — this does not contradict ADR 021's "testing lives where the surface lives".

### e2e stays sliced

Co-locating slices in one folder does **not** license a monster spec. A journey folder holds MULTIPLE sliced `.spec.ts` plus exactly **one** `smoke.spec.ts` (the full-journey replay); the rest are action-slices. "One journey folder" ≠ "one journey test". The full breadth of a journey runs at the **integration** layer (one `.int.test.ts`, deterministic MSW replay), not as a long e2e — restating ADR 021 §Context force 5 and the FE-1365 receipt.

---

## Relationship to ADR 020 and ADR 021

This ADR is the **home** for the journey-unit structure. The two prior ADRs are amended only to **redirect their now-stale location clauses** here (see their Amendment 1 blocks):

- **ADR 020** — its `.feature` location (`tests/Playwright/features/<flow>/`) is superseded for cross-module journeys by the co-located journey folder. The spec-only, not-executable nature of `.feature` is unchanged; the escalation gate is unchanged (counts are now gathered per journey folder).
- **ADR 021** — its cross-module integration home, its "canonical pool" wording (now retired — per-unit co-located fixtures), and the slice-not-journey rule are all governed here. The trophy shape, coverage policy, and layer ownership in ADR 021 are unchanged. ADR 013 and ADR 001 are untouched.

---

## Alternatives considered

### A. Cross-module journeys live INSIDE `headless` (`src/__tests__/journeys/<flow>/`)

The council's round-1 design. Rejected by the owner (locked decision 1). A cross-module flow is not a property of the package; filing it under `headless/src` keeps the "false address" problem (just one level up from a module), couples the journey's recordings/specs/feature to the package tree, and makes `rm -rf <slug>/` impossible because the artefacts are spread across `headless` and `tests/`. The outside-headless tree is the only one where the journey is a deletable unit.

### B. A second Playwright `project` for the journey tree (vs widening `testDir`)

Rejected. Widening `testDir` to `./tests` + `testIgnore` is the simpler one-tree design; the legacy `tests/Playwright/e2e/**` specs still match under the wider root, so the 3-browser matrix is untouched. A dedicated project array entry adds config surface for zero discovery gain.

### C. Alias `@upmind-automation/test-fixtures` → `index.ts` (a FILE)

Rejected — verified live. Today's alias is the bare name → the *directory* `tests/fixtures`, and Node/Vite append the subpath, so `/replay-server` and `/msw-handlers` resolve. The tool's `package.json` has `main: "index.ts"` and **no `exports` map**; aliasing to `index.ts` would break every subpath import. The directory alias is kept. The only file alias is `@upmind-automation/headless` → its single-file barrel.

### D. Reuse the existing integration glob instead of a new vitest project

The round-1 design matched the journey int test with the existing `src/**/__tests__/**/*.int.test.ts` glob. Once journeys live *outside* `headless` (locked decision 1), that glob no longer reaches them — a top-level journeys project is required. It carries `vue()` and imports the same `sharedAlias`, so there is no alias divergence and no invented source export.

### E. A central fixture pool with shared, journey-neutral `cases/`

**Rejected** (this is the confusion an earlier draft of this ADR carried). Fixtures are **owned per unit and co-located** from the start — every module and every journey holds its own under the unit's `fixtures/`; there is no central pool and no shared `cases/`. The loader resolves a caller-supplied `recordingsDir`, not one root. Duplication of a recording across two units is intended, not a smell — it's what makes each unit a deletable whole and makes the body-bleed bug structurally impossible.

---

## Migration / pilot

Additive, ride-along `@next`. Each step independently green before the next. Pilot = the one real journey on disk, renamed to the convention: **`storefront-guest-oneoff-checkout-stripe`** under flow `oneoff-checkout/`.

1. **Tooling seam first.** Thread a `recordingsDir` through `loadAllFixtures` / `buildHandlers` / `startReplayServer` (cache keyed by `recordingsDir`); the loader loads exactly that directory — no central pool, no `{ journey }` name-scope. Add fixtures unit tests over synthetic dirs incl. an **isolation guard** (two dirs → each loads only its own).
2. **Shared base config.** Add `tests/vitest.base.ts`; point headless `vitest.config.ts` at `sharedAlias`. `pnpm --filter headless test` green.
3. **Journey project + tsconfig.** Add `tests/vitest.journeys.config.ts`, `tests/tsconfig.json`, and the `test:journeys` script (0 files → exits clean).
4. **Cut the pilot folder** with its **own `fixtures/`**: alias map → `journey.ts` (add `SLUG`); `setup.ts` calling `startReplayServer({ recordingsDir })`; the int test → `<slug>.int.test.ts`, imports switched to `@upmind-automation/headless` + `./journey`. `pnpm test:journeys` passes against the journey's own fixtures.
5. **Author `.feature` + sliced `.spec.ts`** (`add-to-basket`, `pay-with-stripe`, `smoke`).
6. **Playwright discovery.** Widen `testDir` + `testIgnore`; add the e2e scripts; verify `playwright test --list` (legacy unchanged + new slug specs).
7. **Guards + lint.** Headless-alias-resolves-to-src guard test; CI guard (a folder with a `.feature` has ≥1 `.int.test.ts` AND ≥1 `.spec.ts`); extend `lint-fixtures.mjs` (slug-shape regex, intra-journey dup-route, cases-are-v3). Promote each scope-bearing module's matrix const + add the loop test.
8. **Migrate existing module fixtures.** Move each module's fixtures (e.g. `query`'s) out of the old central `cases/` into the module's `__tests__/fixtures/`, and point its `setup.integration.ts` at that dir. No central pool remains.
9. **Land ADR amendments** (this ADR + the 020/021 redirects) with the pilot so docs match the tree.
10. **CI** — confirm both `test:journeys` (vitest) and the journeys e2e lane run in the pipeline before declaring the lock implemented.

---

## Top risks + mitigations

1. **Bare `@upmind-automation/headless` resolves to stale `dist`** (init-order-unsafe) in any tool that skips the shared base. → The base config is the only alias declaration; both vitest configs import it; root `tsconfig.json` maps headless→src. **Guard test** asserts the resolved headless module path ends `/src/index.ts`.
2. **Cross-journey cache poisoning** — a single global memo lets the first journey fill it and later scopes read it back, silently re-opening the bug. → `Map` keyed by `journey ?? "__all__"`; guard test (load A then B, assert B has zero A-fixtures).
3. **A misnamed file leaks between runners** (`.spec.ts` int test never runs its int half, or vice-versa). → Suffix contract + **CI guard**: every slug folder with a `.feature` has ≥1 `.int.test.ts` AND ≥1 collected `.spec.ts`.
4. **Playwright never discovers the new specs** (green-by-absence). → Widen `testDir` in the same change that cuts the first slug; `--list` diff = legacy + intended new only.
5. **A unit's fixtures dir missing/misnamed** (replay finds nothing, throws mid-flow). → `setup.ts` asserts its `recordingsDir` exists; the `onUnhandledRequest` throw names the unit and hints where to record.
6. **Co-location tempts a monster spec** (FE-1365 regression). → Exactly one `smoke.spec.ts` per folder; per-folder lint flags an oversized single spec or a folder with no slices besides `smoke`; review treats a second full-journey spec as a 🟠.
7. **Inconsistent human-authored slug.** → Slug-shape regex lint over `tests/*/*/*/` folder names; never pre-create empty surface dirs.

---

## Consequences

### Positive

1. **A journey is a deletable unit.** Feature, specs, int test, alias, setup, and recordings live in one folder. `rm -rf <slug>/` leaves zero dangling references.
2. **The silent MSW body-bleed bug is killed at the mechanism level**, not papered over with lint.
3. **One slug, one vocabulary.** The slug drives the folder name, the alias scope, the replay scope, and the `.feature` Feature name — they cannot drift.
4. **Discovery is mechanical.** Flow = `<product>-<action>`; surface-first slug; one shared alias source; suffix contract splits the runners.
5. **Scope coverage is compile-time enforced** by looping the matrix const.

### Negative

1. **Two runners over one tree** requires the suffix contract and a CI half-check to stay honest; a misnamed file is a silent gap without them.
2. **Existing module fixtures must migrate** out of the old central pool into each module — a one-time move per module, not an additive change.
3. **A test outside the per-package recursion** means `pnpm -r test` is no longer "all tests"; `test:journeys` must be wired into the same CI stage or coverage silently regresses.

### Neutral

1. **The legacy Playwright suite is untouched.** Widening `testDir` is additive; the 3-browser matrix and existing specs are unchanged.
2. **The fixtures tool stays code-only** (loader + replay + lint; it owns no recordings). Module integration tests **do change** — their fixtures move next to the module and replay loads them via `recordingsDir`. This is the deliberate restructure, not an additive opt.
3. **Reversible at the config layer.** The journey tree, the journeys vitest project, and the `testDir` widening can be unwound without touching production code.

---

## Amendment 1 — Post-implementation owner review (June 2026)

The initial implementation landed (FE-2934, commit `05c171727`), then an owner review revised the decisions below. **Where this amendment conflicts with the original Decision / Runner-config / Consequences sections above, this amendment governs.**

### A1.1 — Replay is the single consumption pattern (modules *and* journeys)

Confirmed against industry practice: mock at the network boundary (MSW + real recorded fixtures). Cherry-picking a fixture into a `vi.mock` (real data, no replay server) was weighed and **rejected** — lower fidelity (skips URL building, params, the fetch layer, error mapping) and brittle to service-layer refactors. One pattern everywhere.

### A1.2 — No faked BE data, anywhere

No test — unit **or** integration — may use mocked/imagined data standing in for a backend API response. All BE-API data is a **real capture, served by replay**. Non-*data* stubs (a fixed clock, a locale flag, a callback spy) are not BE data and remain allowed.

**Grandfathering:** the existing `brand` / `system` / `query` unit tests are **not** retrofitted under FE-2934 — they are converted when those modules move to scope-based composables (separate, later work). The rule binds new and converted code from now on.

### A1.3 — Fixtures are generated headlessly, not hand-recorded

Module (and, where practical, journey) fixtures come from an **automated, headless** step — direct real-API calls or a headless Playwright run — capturing real responses. No human record harness; never hand-written. **The generator's design is a separate issue** (reference: `auth.fixtures.ts` + `api-fixture-generator.ts` on `@next-legacy`). This ADR fixes only that fixtures are real captures, replayed.

### A1.4 — `tests/` holds only folders; journeys live under a `journeys/` wrapper

Supersedes the original tree (surfaces directly under `tests/`):

```text
tests/
  docs/        fixtures/        journeys/<surface>/<flow>/<slug>/        Playwright/
```

No functional files at the `tests/` root. Each folder is self-contained; the journeys vitest config + `tsconfig.json` live **inside** `tests/journeys/`.

### A1.5 — No shared alias base; each config declares its own

**Reverses** the original "alias drift is solved by one shared base config." `tests/vitest.base.ts` is **deleted**. The headless config carries only the `@upmind-automation/test-fixtures` alias; the journeys config carries `@upmind-automation/headless`→`/src/index.ts` (FILE) **and** `test-fixtures` (DIR). (Verified: nothing in `packages/headless/src` imports the bare `@upmind-automation/headless` specifier, so headless never needed a self-alias.)

### A1.6 — No standalone fixture-tool self-test

The cross-dir isolation-guard test is **removed**. The body-bleed bug is prevented **structurally** (each unit loads only its own co-located folder), and the loader is exercised by every real replay test.

### A1.7 — No guards, no journey CI (removed, not deferred)

The alias guard and the journey folder-shape guard are **deleted**; the journey CI lanes are **removed**. There will be **no dedicated CI for journeys**. Supersedes the original Runner-config CI bullet, risks #3/#6, and migration steps 7–8.

### Unchanged / reaffirmed

Locked decisions 1–5 stand (journeys outside `headless`; e2e + integration co-habit by suffix; surface-first slug; co-located **per-unit** fixtures with **no** central pool). Decision 6 (scope-matrix loop) stays **deferred** — no scope-bearing module exists on `@next` yet; it lands with the first one.
