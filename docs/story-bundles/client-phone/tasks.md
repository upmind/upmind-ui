# client-phone — Tasks

**Companion to:** [`requirements.md`](./requirements.md) · [`design.md`](./design.md) · [`parity.yaml`](./parity.yaml)
**Date:** 2026-08-08 · **Variant:** `hybrid` · **Cells:** `client × self`

Ordered build. Each task names its seat, its inputs, its bounded scope, and the read-back that closes it. `[blocked-by]` is a real prerequisite, not phase decoration.

**Standing constraints on every task below:**

- `packages/headless/src/modules/{client-email,client-email-history,client-address,client-company}/` are **BANNED** except the ruling-3 `.as(...)` lift in **T-5** and **T-6**. `client-email/` is read-only reference.
- `packages/headless/src/modules/{query,data-manager,scope}/**` are untouched. The `dataManagerMachine` is protected core — a disagreeing test presumes the **test** wrong (`code-xstate.companion.md`). Genuine machine evidence stops and asks the operator.
- Test-writer ≠ code-writer (ADR-021 / `agent-seat-separation.companion.md`). The **developer** authors `*.must-fail.patch` mutants; the **prover** applies them blind and verifies RED.
- SDD artefacts live at `docs/story-bundles/client-phone/`, **never** `docs/sdd/` (dangling symlink — `design.md` §9).

---

## Phase 0 — Capture the oracle's data

### T-1 · Author the fixture generator and capture the recorded corpus

**Seat:** prover · **Blocked-by:** — · **Parity:** X4 · **AC:** AC-30

This module has **zero baseline coverage** — no tests, no fixtures, no e2e. Every read-back downstream replays what this task captures, so it runs first and it runs against real staging.

1. Author `packages/headless/src/modules/client-phone/__tests__/client-phone.fixtures.ts` as a **mode (a) direct-API generator** (the `client-email.fixtures.ts` shape).
2. Run `pnpm fixtures:generate client-phone`. Credentials load from `packages/headless/.env.recording` — **it exists in-tree (350 bytes)**. If a capture fails, report the real failure; "no staging credentials" is not available as a reason (2026-08-05 receipt, `verify-cosplay.companion.md`).
3. Capture, at minimum:
   - `get-clients-id-phones.json` — a list with ≥3 rows including one `default`, one `can_delete: false`, one `verified: 0`
   - `get-clients-id-phones-case-page-1.json` / `-page-2.json` — pagination
   - `get-clients-id-phones-id.json` — the manager's per-record read (`loadOne`)
   - `post-clients-id-phones.json`, `put-clients-id-phones-id.json`
   - `put-clients-id-phones-id-case-set-default.json`
   - `delete-clients-id-phones-id.json`
   - `get-countries.json` — for `loadLookups`
   - at least one error capture for the C10/AC-9 read-back

**Read-back:** `pnpm lint:fixtures` passes (PII-masked, v3); `scope-based/no-hand-rolled-int-fixture` reports no `handRolled` and no `vestigialReplay`. Hand-authoring one and presenting it as recorded is cosplay.

**Do not** author any spec in this task — fixtures only.

---

## Phase 1 — The module

### T-2 · Types, matrices and the services factory

**Seat:** developer · **Blocked-by:** — · **Parity:** C1, C4, W3, W5, R1 · **AC:** AC-31, AC-32, AC-15

1. Extend `client-phone.types.ts` (the existing file — see `design.md` §0, the graph confirms the models already live there) with `ClientPhonesContextTypes`, `ClientPhoneContextTypes`, `CLIENT_PHONES_SCOPE_MATRIX`, `CLIENT_PHONE_SCOPE_MATRIX` (both with `SELF`/`STAFF`/`GUEST` = `null as never`), and the `ClientPhoneServices` / machine-services interfaces.
2. Rewrite `client-phone.services.ts` as `createClientPhoneServices(scopeActor, scopeContext)`:
   - `resolveClientId(scopeContext)` — the ONE identity seam (`design.md` §4). It compares the resolved **context**, never the actor, so `no-self-branch` stays clean.
   - `isAddressable(clientId)` — the ONE addressability predicate, exposed as `service.isAvailable`. **This replaces the `||` guards in `remove`/`setDefault`** — decision D-2, row W5.
   - add `loadOne(id)`; keep `queryKey = ["client","phones"]` with the client id as a **ref inside the key**.
   - `scopedServices(scopeActor, scopeContext)` with a `default:` case only (armless — `design.md` §7).
   - line-1 `/** @internal */`.
3. Rename `mapper.ts` → `client-phone.mappers.ts`, add `@internal`. **No mapping change** (W1, W2) — `mapIPhone` still emits no `type` (decision D-1).
4. Add `@internal` to `client-phone.schemas.ts`. Schema content unchanged (M3).
5. **Delete** `client-phone.utils.ts` (a one-line comment, no members).

**Read-back:** `pnpm type-check` clean for the module; `scope-based/complete-layer-set` reports no `missingInternal`.

### T-3 · The collection half — `useClientPhones` + four layers

**Seat:** developer · **Blocked-by:** T-2 · **Parity:** C1–C16 · **AC:** AC-1 … AC-15

`useClientPhones.ts` (`createScopedComposable("client-phone", …)`) plus `.actions.ts` / `.context.ts` / `.meta.ts` / `.internals.ts`. Every layer factory takes `actorScope: ScopeActorTypes` **first** (`actor-scope-first`), unused ones named `_actorScope`.

- Mint the query **once** per scope, and the actions factory **once** per scope (filter state lives there).
- `meta.isAvailable` hands `service.isAvailable` straight through — do not re-derive it (C4).
- `isReady()` uses the settled-outcome pattern, not a `setInterval` poll (C5).
- `refresh()` wraps `refetch()` so it can reject (C12).
- Keep the feedback on `remove` / `setDefault` — **W6 is a deliberate divergence from the client-email reference**; this oracle raises feedback and the reference does not.
- Add `destroy()` (C16).

**Read-back:** the module type-checks and `complete-layer-set` passes for the collection.

### T-4 · The manager half — `useClientPhoneManager` + four layers + machine config

**Seat:** developer · **Blocked-by:** T-2 · **Parity:** M1–M15, R1 · **AC:** AC-16 … AC-28, AC-32

`useClientPhoneManager.ts` plus `.actions.ts` / `.context.ts` / `.meta.ts` / `.internals.ts` / `.machine.ts`.

- **Delete `actions.ts`**; its `setMeta` / `setSchemas` / `setModel` / `refreshContext` / `hasSubscription` move into `useClientPhoneManager.machine.ts` as the one typed `.withConfig(...)` payload, return type pinned to `Parameters<typeof dataManagerMachine.withConfig>[0]`.
- **Ruling 2 — remove the `clientId` option entirely** from the public signature (row R1, AC-32). `allowMultipleEdits` also leaves the signature: a scoped instance is always a persistent editor (M15).
- Scope context is `phone` — the entity, not its owner. `.fresh()` mints a unique key per call so two drafts are two interpreters (M15).
- Seed `clientId` from `service.clientId.value`; the late top-up **watches `service.clientId`**, never a second session read (M14).
- Interpreter id = the **scope key**, not the phone id.
- One actions instance per scope (the `input` debouncer lives there — M6).
- Fix `isNew` to read the context id, not `stateMatches(state,"model.id")` (M10).
- `add` service → `service.ensure` (find-or-create, M7). Manager raises **no** feedback.

**Read-back:** the module type-checks; `complete-layer-set`, `no-self-branch`, `no-cosplay-arm`, `require-decision` all clean.

### T-5 · The barrel

**Seat:** developer · **Blocked-by:** T-3, T-4 · **Parity:** X1, X2, R1 · **AC:** AC-29, AC-16

Rewrite `index.ts` as curated named re-exports, **no `export *`**. Exports: `useClientPhones` / `UseClientPhones`, `useClientPhoneManager` / `UseClientPhoneManager`, both matrices and both context enums, the public model types (`Phone`, `PhoneModel`, `PhoneContext`, `IPhoneData` — the last is consumed by `account.types.ts:14`), and the four sub-composable type exports per half.

**Removed from the barrel:** `useClientPhoneServices` (D-3), `usePhoneSchema`, `usePhoneUischema` (D-4).

**Read-back:** a grep of `index.ts` finds no `export *`; the surface test (T-8) enumerates the runtime exports against an explicit allow-list.

---

## Phase 2 — Importers (ruling 3 — narrow lift)

### T-6 · Update the 14 call sites to add `.as(...)` — and nothing else

**Seat:** developer · **Blocked-by:** T-5 · **Parity:** X1, X2, X3 · **AC:** AC-33

The **only** permitted edits, per ruling 3 and `design.md` §6:

1. add `.as(ScopeActorTypes.SELF)`;
2. move `isReady` to `.useActions()` and `default` / `data` to `.useContext()` — forced by the four-layer return shape, not a behaviour change;
3. re-route `ensure` from `useClientPhoneServices()` to `useClientPhones().as(SELF).useActions().ensure` — the one substantive line, named by ruling 3.

| File | Seam |
| --- | --- |
| `packages/headless/src/modules/client-company/client-company.services.ts:88` | `useClientPhones()` lookups |
| `packages/headless/src/modules/client-company/client-company.services.ts:306` | `ensure` re-route |
| `packages/headless/src/modules/basket-billing/unified/services.ts:46` | `useClientPhones()` lookups |
| `packages/headless/src/modules/basket-billing/unified/services.ts:143` | `ensure` re-route |
| `packages/headless/src/modules/basket-billing/unified/schemas.ts:76,129` | **T-6a below** |
| `packages/headless/src/modules/basket-billing/unified/__tests__/unified.int.test.ts:50-54` | `vi.mock` factory → the new seam |
| `packages/client-vue/src/modules/billing/components/TabBusiness.vue:44,75,119` | `{useList, useMutate}` pair |
| `packages/client-vue/src/modules/billing/components/TabPersonal.vue:50,79,123` | `{useList, useMutate}` pair |
| `packages/client-vue/src/modules/billing/components/BillingForm.vue:85,177,209` | collection |
| `packages/client-vue/src/modules/billing/components/BillingSummary.vue:141,190,197` | collection |
| `apps/cart/src/router/funnels/engine/services.ts:137` | `default: defaultPhone` — **runtime-critical, gates checkout billing** |
| `apps/cart-nuxt/app/funnels/engine/services.ts:137` | same |
| `playgrounds/labs/src/pages/account/profile/components/ClientPhones.vue:9,31,39` | `{useList, useMutate}` pair |
| `playgrounds/labs/src/pages/client/Phones.vue:8,24` | `{useList, useMutate}` pair |

**T-6a — the one escalation risk.** `unified/schemas.ts` composes the phone schema into a **larger** unified schema at module scope, where no manager instance exists — so D-4's "schema reaches consumers via `useContext()`" route does not fit it. Import the schema builder by its **deep internal path** with an `@internal` acknowledgement comment (one line, adds no public surface). **If the lint rules reject the deep path too, STOP and escalate to the operator — do NOT re-export `usePhoneSchema` / `usePhoneUischema` from the barrel.** Row X2 carries this.

**Read-back:** workspace `pnpm type-check` passes; `git diff` on `client-company/` and `basket-billing/` shows only edits of shapes 1–3 above. Any other hunk in those files is a ruling-3 breach.

---

## Phase 3 — Proof

### T-7 · Author the `.feature`

**Seat:** prover (BDD route) · **Blocked-by:** T-1 · **NOT this planner's artefact.**

One `@AC-n`-tagged scenario per AC in `requirements.md` §5, business language only, tagged `@module:client-phone @variant:hybrid @cell:client-self`. Colocated at `packages/headless/src/modules/client-phone/__tests__/client-phone.feature`, with the planner-side copy at `docs/story-bundles/client-phone/client-phone.feature`. Non-executable per ADR-020.

### T-8 · Unit + surface + traceability specs

**Seat:** prover · **Blocked-by:** T-5, T-7 · **AC:** AC-2, AC-16, AC-19, AC-29, AC-31, AC-32

- `client-phone.mappers.test.ts` — W1, W2, and the D-1 assertion that `mapIPhone`'s output has **no `type` key** while `mapPhone` maps `Phone.type`.
- `client-phone.schemas.test.ts` — the `required` array and the `phone_country_code` AJV keyword.
- `client-phone.surface.test.ts` — **the amputation guard.** Runtime exports against an explicit allow-list; `useClientPhoneManager` named explicitly; `useClientPhoneServices` / `usePhoneSchema` / `usePhoneUischema` asserted **absent**; no `export *`; the manager signature carries no `clientId`. Import `ScopeActorTypes` by its **deep path** (`../../scope/scope.types`), never through the scope barrel — the aggregator-barrel load-order hazard.
- `client-phone.traceability.test.ts` — two-way `@AC` ↔ test link, second feature path **`../../../../../../docs/story-bundles/client-phone/client-phone.feature`** (`design.md` §9). Do not reproduce the `docs/sdd` path.

### T-9 · Integration specs

**Seat:** prover · **Blocked-by:** T-1, T-5, T-7 · **AC:** AC-1 … AC-15, AC-17 … AC-28

`collection.int.test.ts`, `manager.int.test.ts`, `mutations.int.test.ts`, `guard.int.test.ts`, `module.int.test.ts`, plus `int-helpers.ts` and `setup.integration.ts`. Every response body replays a T-1 fixture via `getFixtureBody` / `getFixture`.

**Every identity read-back asserts the request URL carried the session-resolved client id AND the request went out on the client session token** — never the response payload alone (`verify-reality-check.companion.md`). Scoped to EN / targeted specs within the 30-minute ceiling (ADR-021).

### T-10 · Negative controls

**Seat:** developer authors the mutants; prover applies blind and verifies RED · **Blocked-by:** T-8, T-9 · **AC:** AC-34

Six patches, per `design.md` §8.1: `manager-amputation`, `client-id-limb`, `scope-derived-id`, `feedback`, `parse-fallback`, `default-body`. A prover that reads module src to construct one has breached its diff-blindness — route the mutant to the developer.

**Read-back:** a green negative-control run for every new control (the `quarantine:enforce`-shaped lane). No Needs Review without it (`verify-negative-controls.companion.md`).

---

## Phase 4 — Record

### T-11 · File the Linear issues for every dropped capability

**Seat:** developer · **Blocked-by:** T-5 · **Parity:** R1, S1–S7, L1, L2, L3, L9

Twelve `Dropped-with-Linear-issue` rows carry `linear: TBD`. File one issue per row, citing the row id and the operator sign-off (2026-08-08, tier-1), and replace each `TBD` with the issue reference. **S6 (staff acting-as-client) is the FE-2824 shape verbatim** — its issue must record that a future restoration owes the A7 read-back: request-URL retarget **and** auth identity transport (which session token, which acting-as headers).

**Read-back:** `grep 'linear: TBD' docs/story-bundles/client-phone/parity.yaml` returns nothing.

### T-12 · Module docs set

**Seat:** documenter · **Blocked-by:** T-9 · **AC:** —

`packages/headless/src/modules/client-phone/docs/` — `foundation.md`, `README.md`, `usage.md`, `architecture.md`, `gotchas.md`, `CHANGELOG.md` (ADR-019 shape, the client-email set as the model). `README.md` and `usage.md` must state plainly that both composables support the client's own scope only and that `staff` / `guest` are **compile-time errors**, with a pointer to `parity.yaml` rows S1–S7 — the reference does exactly this at `client-email/docs/README.md:22`.

### T-13 · Glossary term

**Seat:** documenter · **Blocked-by:** T-12 · **AC:** —

`docs/corpus/glossary.json` has **no `phone` term** (confirmed at Research; `client-email` has none either, but `scope`, `basket`, `account`, `auth` do). Add one — kind `domain`, referents `@upmind-automation/headless!useClientPhones` and `!useClientPhoneManager` — then rebuild the corpus per `docs/corpus/build.mjs`.

### T-14 · Refresh the knowledge graph

**Seat:** developer · **Blocked-by:** T-6 · **AC:** —

Run `graphify update .` so the graph reflects the new file layout (per `CLAUDE.md`). The pre-conversion graph splits `useClientPhoneManager.ts` into community 2 and the rest into community 8; after the conversion the layer files should cluster with their halves.

---

## Task dependency graph

```
T-1  (fixtures) ──────────────┬──────────────► T-7 (.feature) ─┬─► T-8 (unit/surface/trace)
                              └──────────────────────────────► T-9 (integration)
T-2 (types+services) ─┬─► T-3 (collection) ─┐
                      └─► T-4 (manager) ────┴─► T-5 (barrel) ─► T-6 (importers) ─► T-14 (graph)
                                                     │
                                                     ├─► T-11 (Linear issues)
                                                     └─► T-8, T-9 ─► T-10 (negative controls)
                                                                        │
                                                              T-9 ─► T-12 (docs) ─► T-13 (glossary)
```

## Definition of done

- Every AC in `requirements.md` §5 has a passing read-back naming a real behaviour.
- `parity.yaml`: **0** undispositioned rows, **0** dropped rows without a signature, **0** `linear: TBD`.
- `arms:` derived as all-armless, and the developer's independent re-derivation at Code **matches**.
- Both composables reachable only through the barrel; the four data-layer files `@internal`.
- Workspace `pnpm type-check` green; all seven `scope-based/*` rules clean.
- Every negative control confirmed RED then reverted.
- **The JTBD holds:** a consumer can list, read, add, edit, delete and default a client's phone numbers, with the form half intact. A green gate set that has amputated the manager is a failure, not a pass.
