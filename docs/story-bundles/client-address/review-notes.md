# client-address — Review Notes

**The binding record for this story.** Per `agent-behavior.companion.md` §1, this file is the per-story ruling mechanism: **read FIRST on every re-run**, mirrored to Linear, and **never silently overriding an explicit NO**.

**Date:** 2026-08-14 (revision 2, + operator ruling **R10** applied, + **correction pass 2.1**, + **correction pass 2.2**) · **Seat:** planner · **Branch:** `feature/client-address-scoped-conversion` @ base `bff994868`
**Bundle:** `docs/story-bundles/client-address/` — `docs/sdd` is a symlink to a path off this machine and is **never** written.

> **Correction pass 2.2 (2026-08-14, post-verify, at `2ef831df9`) added §9–§12.** Sections 1–8 keep their numbers so nothing citing them breaks. **If you are converting the next sibling module, read [§9](#9-the-three-review-blockers) first** — three defects that every green gate in this repo passed. §10 records a standing record-staleness debt and the durable fix for it; §11 the control gaps handed off; §12 two CI gates the rules describe as mechanical that **do not exist in this repo**.

---

## 0. Reviewer verdict log

| Date | Reviewer | Verdict | Note |
| --- | --- | --- | --- |
| — | — | — | **No human reviewer verdict has been recorded on this story.** |

**Nothing in revision 2 overrides a reviewer NO, because none exists.** The planner seat pre-gates; it never emits the `actor:Human` review verdict (ADR-029, `agent-orchestration.companion.md` §2). This story is not moved to **Needs Review** by this seat.

---

## 1. Ruling ledger

### 1.1 Renumbering — revision 1's `OR-n` are re-issued as `R-n`

The operator's own brief numbers the rulings **R1–R8**. Revision 1 of this bundle numbered the same rulings `OR-1…OR-9`. They are re-issued under the operator's numbering; the mapping is recorded so no citation is orphaned.

| Revision 1 | Revision 2 | Subject |
| --- | --- | --- |
| OR-1 | **R1** | actor token is `ScopeActorTypes.CLIENT` |
| OR-2 | **R2** | staff cells dropped, recorded, not built |
| OR-3 | **R3** | in-tree consumers migrate here; submodules do not |
| OR-4 | **R4** | `useClientAddressServices` retired, not deprecated |
| OR-5 | **R5** | `default()` returns an ID |
| OR-6 | **R6** | `mapAddress` stays on the barrel |
| OR-7 | **R7** | schema-definition barrel exports stay |
| OR-8 | **R8** | the parity fixes that land (8a–8h) |
| OR-9 | **DELETED** | merge-conflict planning — see §2.1 |
| *(none)* | **R10** | **feedback stays in the module** — overturns this bundle's own design decision D-14. Landed after the first commit; applied in full at the follow-up commit. See §4.1. *(There is no R9 — the operator's numbering skips it; no ruling has been invented to fill the gap.)* |

### 1.2 Prior-pass rulings (`PR-1…PR-6`, dated 2026-08-10)

> **Honest provenance note.** No `review-notes.md` existed in this bundle before revision 2. `PR-1…PR-6` are **reconstructed from revision 1's own citations of them**, not read from a prior file. Where revision 1 quoted a prior ruling's content, it is recorded below verbatim; where it did not, that is stated rather than guessed.

| Ruling | Content (as cited by revision 1) | Status under R1–R8 |
| --- | --- | --- |
| **PR-1** | (a) schema definitions stay on the barrel; (b) a `@deprecated` re-export carve-out for `useClientAddressServices` | (a) **CARRIED** — R7 re-affirms it. (b) **SUPERSEDED by R4** — retired, not deprecated. Recorded, not silently applied. The carve-out already collapsed once under a type-check; a sunset re-export with no sunset is a second public surface, not a bridge. |
| **PR-2** | Remove the cosmetic `clientId` parameter from the manager signature | **CARRIED unchanged** — `design.md` D-3, task T-3a. |
| **PR-3 (item 7)** | Staged lock + `with_staged_imports: 1` (its rows C57 + C51) | **SUPERSEDED by R8g.** `IAddress` has no `staged_import` field (`packages/types/src/models/addresses.ts:5–26`, checked field by field); legacy's `isStaged` is a prop defaulting false that no address caller passes. Building it would be the advertised-but-absent defect this story closes. Row `N2`. |
| **PR-4** | **Content not recoverable.** Revision 1 cites the `PR-` series as a block but never quotes PR-4. | **UNKNOWN — flagged.** No ruling has been invented to fill the slot. If PR-4 carried a live constraint, the operator should restate it; otherwise the number is retired. |
| **PR-5** | `mapAddress` stays on the barrel; reading the exemplar's silence as a ban was the prior run's error | **CARRIED unchanged** — R6 re-affirms it. |
| **PR-6** | Narrowed the per-row half of PR-3's staged claim away from the type | **SUPERSEDED-BY-COMPLETION** — R8g removes the remainder, including the list-param injection. |

**No prior ruling is contradicted silently.** Each supersession is named at its ruling in `requirements.md` §4 and here.

---

## 1.5 Correction pass 2.1 (2026-08-14, post-implementation) — what the bundle got WRONG

Three corrections landed **after** implementation, tests and one repair cycle. Each was found by a seat other than the one that wrote the claim, which is the point of seat separation. **No AC was deleted to make anything green, and no code was changed to rescue a claim.**

| # | Claim as written | Reality | What changed |
| --- | --- | --- | --- |
| **1** | `.as(STAFF)` / `.as(GUEST)` are **compile-time errors** (AC-33, AC-34) | **False.** Disproved by a real `ts.createProgram` probe run by the prover: `ScopeBuilderResult` (`scope.builder.ts:~184`) accepts every `ScopeActorTypes` and reads the matrix row only to decide whether `.for()` exists. | AC-33 / AC-34 **re-worded, not deleted** — the narrowed guarantee is real and proven green. §1.5.1 below. |
| **2** | AC-20 asserts the brand-config **request** names its keys | **Not deliverable in this story.** Blocked upstream; the test is legitimately RED. | Escalated as finding **F6**, parity row **`U1`**. §4.3 below. |
| **3** | T-1 files the e2e oracle under `__tests__/fixtures/` | **Wrong directory.** That is a typed v3 fixture pool. | Path corrected in row `C16` and T-1. §1.5.2 below. |

### 1.5.1 The AC-33 / AC-34 overclaim — withdrawn, in these words

The wording below is carried **verbatim** in `requirements.md` §4 + AC-33, `design.md` §1, `parity.yaml` `CELL-3`, `tasks.md` T-2b and `client-address.feature`, so that plan, code and tests cannot drift apart on it:

> `.as()` accepts every `ScopeActorTypes` at compile time; a `null as never` matrix row removes `.for(...)` for that actor and nothing else. What the type system enforces: `.as('staff'|'guest'|'self').for(ADDRESS, id)` do not compile, `.as('client').for(ADDRESS, id)` does, and `useClientAddressManager(undefined, { clientId })` is `TS2554`. Delivering a compile error on `.as('staff')` itself would require `scope.builder.ts` (protected core).

**The code was not changed to fit the claim.** `scope.builder.ts` is protected core and off-limits by **D-2 / NFR-4**; editing a shared machine to make a test's claim true is precisely what `code-xstate.md` forbids. So the **claim** is corrected.

**Two consequences a reviewer should weigh deliberately:**

1. **What keeps the staff cell honest is no longer a type error.** It is (a) the removal of `.for(...)`, so no staff caller can address an individual address through this module, and (b) the recorded `D1`–`D8` `Dropped-with-Linear-issue` rows. (b) was always the real safeguard; revision 2 leaned on (a) harder than the type system justified.
2. **`@ts-expect-error` would have been inert anyway.** `packages/headless/tsconfig.json` and `tsconfig.build.json` both exclude `**/__tests__/**`, so the originally-specified discriminator would never have been type-checked — a green test proving nothing, the FE-2824 shape in the test layer. The shipped proof is an executable `ts.createProgram` probe **with a live `CLIENT` control line**, so a probe that merely fails to resolve the module cannot pass.

### 1.5.2 The T-1 recording path — corrected to reality

The pre-migration e2e oracle is at `packages/headless/src/modules/client-address/__tests__/client-address.e2e-oracle.pre-migration.json`, **not** under `__tests__/fixtures/` as T-1 planned. `__tests__/fixtures/` is a **typed v3 fixture pool** that the MSW replay server loads as handlers and `ci/lint-fixtures.mjs` validates (`version: 3` required); a pre-migration request log is neither a handler nor a v3 fixture and would have broken the pool. **The plan is corrected to match reality, not the reverse** — parity row `C16` and task T-1 both now name the real path.

---

## 2. What revision 2 withdrew, and why

### 2.1 OR-9 (merge-conflict planning) — DELETED IN FULL

Revision 1 planned a take-theirs-then-reapply resolution against `feature/client-company-scoped-conversion`, tabulated an eight-file conflict set, and instructed the run not to pre-empt the merge.

**That branch is merged into this base (`bff994868`).** There is no conflict, no resolution to plan, and nothing to pre-empt. Every consequence revision 1 drew from it — including the "the company branch is based before the client-phone conversion, so it carries a phone-shaped regression risk" note and the `velia`/`hosting` "only unmigrated company consumers" flag — is **withdrawn**. `design.md` §9 is deleted; `requirements.md` OR-9 is deleted.

### 2.2 The ninth staff drop — WITHDRAWN, not re-labelled

Revision 1 carried `D3 = "a staff member's own Upmind-side profile addresses"` (a `staff × self` cell). Plan searched the oracle for it — `grep` over `src/views/admin` and `src/store/modules/data` in `repos/vue-app` @ `47fdeb0c` — and **found no such surface**.

The row is **withdrawn**. Its number is reused by a drop that *was* verified: `D8`, the `v-if="isAdmin"`-gated copy-to-clipboard affordance at `UAddress.vue:13–17`. Nine drops became **eight**. Recorded here rather than quietly renumbered, because a parity table that gains and loses rows without a record is exactly the paperwork a silent drop hides behind.

### 2.3 The consumer list — prediction replaced by measurement

Revision 1's inventory was a prediction ("13 migration targets") built against base `39521e4a5`. Revision 2 measured it on `bff994868`:

- **13 invocation sites in 8 files** are ruled in scope (R3 part 1) — the operator's own list, confirmed line-for-line by grep.
- **`apps/velia` and `apps/hosting` moved OUT** by operator ruling (R3 part 2). Revision 1 had them **in** scope as rows `C3`/`C4` with tasks T-14/T-15. Those rows and tasks are **deleted**; the sites are now row `C21`, disposition `Dropped-with-Linear-issue`, with the handoff in §3.
- **Seven derived fan-out targets** (`C14`–`C20`) were found that revision 1 did not enumerate: the four `Manage` value-pass sites, the `unified` integration-test mock, the i18n keys, the eslint ledger, and two verify-only groups. Each is a consequence of the same edit, checked one-for-one against `client-company`'s own fan-out per R3 part 3 — **not** scope creep.

---

## 3. ⚠ OPERATOR HANDOFF — two items are OWED

### 3.1 `apps/velia` and `apps/hosting` will not type-check after merge

**Do not soften this. It is repeated verbatim in `requirements.md` R3, `tasks.md` T-27 and `parity.yaml` row `C21`.**

Both are git submodules with their own remotes (`.gitmodules`: `velia-checkout.git`, `hosting.com-checkout.git`), and operator ruling R3 part 2 puts them out of scope for this branch. The operator lands a follow-up commit; the precedent is monorepo commit `39521e4a5`, *"point hosting/velia at their scoped client-phone consumers"*.

**After this branch merges, `apps/velia/src/router/funnels/engine/services.ts` and `apps/hosting/src/router/funnels/engine/services.ts` will not type-check until that follow-up lands.**

They break in **two** ways at once:

1. `useClientAddresses()` at `:135` no longer returns the flat surface — **the compiler catches this**.
2. `defaultAddress()?.id` at `:155` silently yields `undefined` under **R5** — **the compiler does NOT catch this**, because `string | undefined` flows into `addressId` exactly as `Address | undefined ?. id` did.

**The follow-up must fix both.** Fixing only the signature leaves a live, type-clean, wrong-behaviour bug in two production checkout funnels.

### 3.2 Ten distinct Linear references are OWED and UNFILED — across TWELVE rows

`parity.yaml` carries **twelve** `Dropped-with-Linear-issue` rows, owing **ten distinct issues**. **`CELL-3` and `CELL-7` are the two ADR-001 actor×context cells whose dropped capabilities ARE `D1`–`D8`** — they share those rows' references and owe nothing of their own. No capability is missing from the list below.

**This distinction is operational, not pedantic.** An operator who files ten issues and stops has still left `CELL-3` and `CELL-7` reading `OWED — unfiled`, because their `dropped_ref` fields are separate strings that must each be back-filled with the D-row reference they inherit. **Filing ten issues requires twelve edits.**

The ten distinct owed issues are `D1`–`D8` (the staff capability, ruling R2), `C21` (the submodule funnels, ruling R3 part 2) and `U1` (the brand-config request, finding **F6**, added by correction pass 2.1 — **blocked upstream, not dropped by choice**; see §4.3). **No Linear issue reference was supplied to this run, and none has been invented.** Every one of the twelve rows files its reference as the literal string `OWED — unfiled`.

| Row | Capability owed a Linear issue |
| --- | --- |
| `D1` | Staff read/write another client's addresses via `api/admin/clients/{id}/addresses` |
| `D2` | Acting AS a client (impersonation) while managing their addresses — the FE-2824 shape verbatim |
| `D3` | The `list_client_addresses` staff gate |
| `D4` | The `create_client_address` staff gate |
| `D5` | The `update_client_address` staff gate |
| `D6` | The `delete_client_address` staff gate |
| `D7` | The per-client admin cache scope (`$client_{id}` / `$client_{id}_selector`) |
| `D8` | The staff-only copy-to-clipboard affordance |
| `C21` | The velia / hosting funnel-engine migration *(an operator follow-up commit, not necessarily a Linear story)* |
| `U1` | `ensureBrandConfig` never refetches, so a widened brand-config key set never reaches the wire — **finding F6, §4.3. Blocked upstream, not a chosen drop.** |
| `CELL-3` | *(no distinct issue)* — the ADR-001 `client / staff-acting-for-client` cell; its dropped capabilities are `D1`–`D8`. **Back-fill with those references; do not file a new one.** |
| `CELL-7` | *(no distinct issue)* — the ADR-001 staff-context cell; likewise `D1`–`D8`. **Back-fill, do not file.** |

**The bundle cannot be signed off with these unfiled without that being a conscious operator choice.** A `Dropped-with-Linear-issue` row whose reference never arrives degrades into a silent drop wearing paperwork.

---

## 4. Escalations — decisions the operator may want to overturn

Raised one at a time, each with the alternative stated and the cost of each side named. **None is deferred on effort grounds.**

### 4.1 D-14 — feedback ownership — **RAISED, OVERTURNED, APPLIED** ✅

**Raised** at revision 2 as the decision most worth overturning. **Overturned by operator ruling R10 (2026-08-14). Applied in full, in this bundle, at this commit.**

| | |
| --- | --- |
| **Revision 2 decided** | Strip `useFeedback` from `client-address.services.ts`; each consumer raises its own — following the merged `client-company` precedent. Rows `F1`/`F2` = `Absorbed-by`. |
| **R10 ruled** | **Feedback stays in the module.** The relocation is withdrawn in full — not softened, not partially applied. |

**The operator's three reasons, in priority order, recorded as the binding rationale:**

1. **Parity is the JTBD.** Both oracles raise this feedback. Headless raises it today (`client-address.services.ts:210, :220, :244, :254`); legacy raises it too — verified at Plan, `store/modules/data/clients/addresses.ts:134–186` (`confirmDelete` → `$toast.open({ message: i18n.t("_sentence.confirm.removal") })`) and `:187–216` (`makeDefault` → `$toast.open({ message: i18n.t("_.default_address_updated") })`). Moving the raise is a behaviour change measured against **both** oracles, and "full parity" does not license it.
2. **It is a silent-regression shape.** If any one of the eight consumer files failed to add toast handling, the user-visible feedback would simply disappear — **no type error, no failing test** — across eight files at once. That is the advertised-but-absent defect class inverted.
3. **`client-phone` — equally merged — still raises its own** (`client-phone.services.ts:303–350`). The tranche is split, and the parity-preserving side is also the side that costs nothing.

**Recorded as a deliberate divergence from the primary reference, with a general rationale.** `client-company` is the declared primary reference and it moved feedback out. We diverge, because **a placement choice does not inherit from a reference when the reference's own placement is itself a behaviour change against the oracle.** "Primary reference" settles shape, naming and layering; it does not settle a question the oracle already answers. Where reference and oracle disagree, the oracle wins — which is what `verify-parity-oracle.md` means by grading against an external source rather than against the newest sibling.

**What was patched (all of it, nothing partial):**

| Artefact | Change |
| --- | --- |
| `parity.yaml` `F1`, `F2` | `Absorbed-by` / `relocated` → **`Direct` / `existing`** — behaviour preserved, access path unchanged. Both now cite the legacy toast lines as oracle. |
| `parity.yaml` `C18` | `Direct`/`fixed`/T-23 → **`Not-supported-with-reason` / untouched-by-necessity**, verified by T-13. All four keys already exist in **all 28 locales** (measured). |
| `parity.yaml` `C14` | task refs `[T-22, T-23, T-24]` → `[T-22, T-24]` |
| `parity.yaml` counts | `absorbed_by: 2 → 0`; `not_supported_with_reason: 5 → 6` |
| `design.md` D-14 | Rewritten as the overturn record, with the three reasons and two **applied** knock-ons (D-13 adapters raise nothing; AC-14 corrected) |
| `requirements.md` §4 | New ruling **R10** with full rationale; §5 AC-14 and AC-40 corrected; §6.2 `C18` row rewritten |
| `client-address.feature` | AC-40 scenario re-tagged `@feedback` (was `@consumers`) and widened to cover set-default; AC-14 wording made module-side. **Count unchanged at 40.** |
| `tasks.md` | **T-6 inverted** (remove → PIN, with a four-path read-back); **T-23 DELETED** (tombstoned, number left vacant); T-13 absorbed the i18n verify; T-22a/T-24a gained an explicit "add NO feedback raise"; vetting table AC-14/AC-40 re-pointed at T-6b; a 13th negative control added |

**Two corrections R10 surfaced that are worth flagging on their own:**

- **AC-14 was asserting a contract this module does not have.** Revision 2 said a failed `remove` populates `useContext().error`. Measured at Plan: `useClientAddresses.ts:60` exposes `query.error` — the **list** query's error — while `remove`/`setDefault` failures are reported through the feedback raise. That AC only "worked" because D-14 was going to *create* the state surface it asserted. With D-14 withdrawn, AC-14 is corrected to the real behaviour rather than left asserting a contract nobody builds.
- **The i18n work was already zero.** Revision 2 planned to add an `error.*` counterpart "where missing". Measured: `error.client_address_update_failed` and `error.client_address_set_default_failed` already exist in **all 28** locales, alongside both `confirm.*` keys. Even under D-14 that task item was near-empty; under R10 it is gone entirely.

**Net effect: the story got smaller and its proof got stronger.** One task deleted, one inverted, zero i18n edits, and AC-40 moved from a consumer-side e2e (which would have proven one of eight consumers wired) to a module-side integration read-back (which catches a regression in any of them).

### 4.2 R5 — the tranche is now internally inconsistent on `default()`

**Not a blocker, and not a JTBD contradiction** — an id is losslessly convertible to the row via `getOne`, so no capability is lost. Raised because it is a fact about the tranche that a future reader will trip over:

| Module | `default()` returns | Status |
| --- | --- | --- |
| `client-phone` | the **row** (`useClientPhones.context.ts:90`) | merged |
| `client-email` | the **row** (`useClientEmails.context.ts:51`) | merged |
| `client-company` | the **id** (`useClientCompanies.context.ts:40–41, 69`) | merged |
| **`client-address`** | the **id** — bound by **R5** | this story |

Two merged modules say row; two say id. R5 binds this module to the id. **The inconsistency is not introduced by this story**, but this story makes it 2–2 instead of 2–1, which is the point at which a convention stops being an outlier. If the operator wants one shape across the tranche, that is a separate story and this plan should not pre-empt it.

**The risk R5 carries is handled, not hand-waved:** ten in-scope expressions read `defaultAddress()?.id`, every one of them **still type-checks** after the change, and each therefore gets its own task with its own behavioural Reality Check (T-14…T-21, AC-37). `<tc>` exit 0 is explicitly rejected as sufficient proof for that AC.

### 4.3 F6 — AC-20's request-level read-back is blocked upstream — **ESCALATED · NEEDS ITS OWN STORY**

**Disposition: out of scope for this story. Not fixed here, not softened, not deleted. Parity row `U1` (`Dropped-with-Linear-issue`, reference `OWED — unfiled`). One test in the module's suite is legitimately RED and is to stay RED until the upstream story lands.**

**What was claimed.** AC-20's read-back ended "Assert the brand-config request was issued for that key"; AC-21 carried the same clause for `CLIENT_ALLOW_ADDRESS_UPDATE`. Both wire-level halves are consolidated in one integration test (`client-address.brand-config.int.test.ts`, "AC-20 names BOTH brand-config keys on the wire"). That test is the red one.

**Why it cannot pass — verified by the developer seat, not inferred:**

1. `ensureBrandConfig` (`packages/headless/src/modules/brand/brand.services.ts:137–142`) is `fetchBrandConfig(safekeys); await result.promise.value`. **Its own JSDoc says "the refetch below is what sends it" — and there is no refetch.** The doc describes a mechanism the function does not have.
2. The query is `queryKey: ["brand","config"]`, `staleTime: "static"`. In `@tanstack/query-core@5.90.12`, `isStaleByTime` returns `false` for `"static"` **even when `state.isInvalidated`** (`query.js:113–117`), so `useBrand().invalidate()` cannot force it either. There is no lever from outside.
3. Net: **the widened key set can never reach the wire.** The read-back observes **zero** `config/brand/values` requests — not "a request that forgot the keys". A weaker assertion would not have caught this; it is the strong one that surfaced it.

**What is NOT wrong — say this out loud, because the red test invites the opposite conclusion.** The `config` context member **does** expose both keys. The **value** arrives, and every behaviour that depends on it is delivered and **green**: AC-21's `lockCountry` (the country control carries `DISABLE` on an existing address and nothing on a new one under the *same* forbidding config, so the rule cannot be an always-on constant) and AC-20's `regionId`-required half. **No user-visible capability is missing.** What is missing is the request-level guarantee — that a session whose persisted config predates a key would still be answered for it. That residual exposure is upstream-owned and is exactly why this needs a story rather than a shrug.

**Why it is not fixed here, and why that is not effort-avoidance.** The fix belongs in the shared `brand` services (restore the refetch, or use a `staleTime` that `"static"` does not veto) — another module's surface, outside this story's boundary (NFR-8). The one client-address-local alternative was **nuking a shared persisted cache on form open**; the developer seat rejected it as a cross-boundary band-aid — a module reaching into shared cache state to satisfy its own assertion, with blast radius over every other `brand` consumer. **That judgement stands and this seat endorses it.** Effort is never a disposition; this is a boundary, not a budget.

**What the operator is being asked to decide:**

| Option | Cost |
| --- | --- |
| **File the upstream story** *(recommended)* | One `brand`-services story: restore the refetch `ensureBrandConfig`'s own doc already describes, with a read-back asserting a `config/brand/values` request carries the widened key set. Unblocks this AC and every other module that widens brand keys. |
| Leave it | The red test stands as the standing record of a real upstream defect. Acceptable only as a **conscious** choice — a red test with no filed issue decays into a test people learn to ignore. |
| Weaken AC-20 to drop the clause entirely | **Not recommended.** It would delete the only evidence anyone has that this defect exists. The clause is withdrawn *from this story's deliverable* and preserved *as a parity row*, which is the difference between recording and hiding. |

**No Linear ID has been invented for `U1`.** It joins `D1`–`D8` and `C21` in §3.2.

---

## 5. Observed and NOT fixed — recorded so it is not lost

### 5.1 Hazard Z8 — `client-company.schemas.ts:286–287` hands the renderer a raw scoped composable

```
useList: useClientPhones,
useMutate: useClientPhoneManager
```

Both are **scoped** composables (`client-phone/useClientPhones.ts:83` — `createScopedComposable`), so calling them bare returns a scope builder, not the flat `MinimalListComposable` shape `Manage.vue:106` expects. The whole options object is cast `as any` at `:262`, so **the compiler does not see it**; it fails at runtime. Every other site in the tree wraps phones in an adapter (`TabBusiness.vue:250`, `TabPersonal.vue:163`, `labs/.../Phones.vue:67`).

**This is a pre-existing client-phone / client-company defect of exactly the class this story's D-13 closes for addresses.** It is **not fixed here**: it is outside this story's scope (NFR-8 — the reference modules are read-only beyond their address call sites), and fixing it needs its own authorisation. Filed so it is not lost.

### 5.2 The `useCollection().findOne` and readiness-poll hazards stay contained

- **Z1** — `findOne` cannot match a nested partial. Contained locally (D-11), mirroring `client-phone`. The shared helper serves six modules and a source fix needs its own authorisation.
- **Z2** — the shared `useSystem` / `useBrand` `isReady()` polls are uncapped. Bounded at **this module's** boundary only (D-10). The shared polls are protected-adjacent and untouched (NFR-4).

Both are recorded as containment decisions, not as fixes, so a later reader does not read the module's local wrapper as evidence the shared defect is gone.

---

## 6. Known-weaker proofs — named, not dressed up

The e2e suite runs **only against `apps/cart`** (`tests/Playwright/scripts/run-e2e.sh` boots the test-mode cart server on port 4000). Two consumer tasks therefore cannot have an independent runtime read-back **in this repo**:

| Task | Site | Proof used | Why it is the honest strongest available |
| --- | --- | --- | --- |
| **T-20b** | `apps/cart-nuxt/app/funnels/engine/services.ts` | `diff` against `apps/cart/src/router/funnels/engine/services.ts` exits 0 | **Verified at Plan: the two files are byte-identical today.** T-19b proves the behaviour on the cart twin; the diff proves cart-nuxt received the identical edit. |
| **T-21b, T-24b (labs half)** | `playgrounds/labs/**` | structural diff against the e2e-proven `client-vue` form + `pnpm --filter @upmind-automation/labs type-check` | `playgrounds/labs` has **no test harness** in this repo. The capability itself is proven by T-22b's e2e on the same adapter shape. |

**This is a limitation of the repo's harness coverage, not of the plan.** It is stated here so a reviewer weighs it deliberately. If the operator wants a real read-back for either, that is a harness story (a labs component-test setup, or a cart-nuxt e2e project) and is **not** silently absorbed into this one.

`packages/client-vue` also has **no test runner** (`package.json` scripts: build / type-check / lint / format only), which is why AC-39 and AC-40 are proven by **Playwright e2e** rather than by a component test. That is a genuine non-unit proof, not a workaround.

---

## 7. Standing halts

The run **stops and asks the operator** — it does not decide — if any of these occurs:

1. **A `variant=query` override arrives from any source.** It would amputate the entire manager surface, which is the 2026-08-05 client-email failure verbatim. A halt, never a narrowing (D-1).
2. **The developer seat's independent arms derivation disagrees with `parity.yaml`'s `arms:` block.** A mismatch halts the run; it is **not** reconciled toward the plan file.
3. **Genuine evidence that a headless machine is wrong.** A test disagreeing with `dataManagerMachine` presumes the **test** wrong first (`code-xstate.md`). Real machine evidence stops and asks (NFR-4).
4. **`client-company.schemas.ts:140–141`-class surprise** — if any cross-module caller turns out to *call* `useSchemaDefinitions` / `useUischemaDefinitions` in a shape T-8a's additive `config` parameter breaks. Verified at Plan that all four callers pass object literals into a `= {}` default, so this should not fire; if it does, R7 and the signature change have collided and it is **not** resolved by editing either side.
5. **A Linear reference is invented for any `D1`–`D8`, `C21` or `U1` row.** No ID is ever guessed (§3.2).
6. **AC-20's request-level read-back is made green from inside this module.** Editing shared `brand` services, or nuking the shared persisted config cache on form open, is a halt — not a fix (finding `F6`, §4.3). The red stays until the upstream story lands.

---

## 8. Gate self-report (planner seat)

| Gate field | Value |
| --- | --- |
| `full_sdd_set_exists` | **true** — `requirements.md`, `design.md`, co-located `client-address.feature`, `tasks.md`, `parity.yaml`, `review-notes.md` |
| `undispositioned_parity_cell_count` | **0** — 8 cells, all dispositioned; machine-verified. Unchanged by correction pass 2.1 (no cell row was added or re-dispositioned; `CELL-3`'s *reason* text was corrected, its disposition was not) |
| `arms_block_present` | **true** — `services`/`actions`/`context`/`meta`/`schemas`, each `none`, each citing the rows that earn it |
| `jtbd_contradicted_drop_count` | **0** — **including `U1`**: no in-cell behaviour of the JTBD is lost, because the config *value* reaches the form and both dependent rules are green (§4.3). The dropped item is the request-level guarantee |
| `feature_scenario_count` | **40** — `@AC-1`…`@AC-40`, unique, no gaps. Unchanged by correction pass 2.1: AC-33 / AC-34 were **re-worded**, never removed |
| `rows_total` | **100** — was 99; `U1` added by correction pass 2.1 |
| `dropped_refs_owed` | **10 distinct issues across 12 rows** — `D1`–`D8`, `C21`, `U1`; plus `CELL-3` / `CELL-7`, which share `D1`–`D8`'s references and owe no issue of their own. All twelve rows read `OWED — unfiled`, so **filing ten issues takes twelve edits** (§3.2). **No ID invented** |
| `known_red_read_backs` | **1** — AC-20's request-level half (finding `F6`, row `U1`). Legitimately red, blocked upstream, escalated in §4.3. Not to be softened or "fixed" from inside this module |
| `consumer_migration_tasks` | **8 in-scope sites** (T-14…T-21) + **2** adapter tasks (T-22, T-24) + 1 handoff (T-27), each with its own Reality Check. *(Was 3 adapter tasks; T-23 deleted by R10.)* |

The planner seat **pre-gates**; it does not emit the review verdict. This story is not moved to **Needs Review** by this seat (ADR-029).

---

## 9. The three review blockers

**Three review rounds found three real defects. All three are fixed and verified at `2ef831df9`; the final suite is 123 tests / 122 passed / 1 failed (AC-20/F6 only, the escalated upstream halt), 19 negative controls, type-check and lint clean, verdict PRESENT.**

They are recorded here because they were the run's most valuable output and otherwise live only in agent transcripts. **Every one of them was invisible to a green suite.** Each is a shape, not a typo — someone converting the next sibling module should check for the same shapes rather than trusting a green run.

### 9.1 B1 — the form model reverted to its pre-edit values after a successful save *(two rounds)*

**Symptom.** Edit an existing address, change a field, save. The save succeeds — right PUT, right url, right diff body, server persists, machine reaches `processed`. Then the form snaps back to the values it opened with.

**Root cause — in the shared machine, fixed in the module.** The shared `dataManagerMachine` takes `processed → available` under `allowMultipleEdits` (which this manager always sets) and re-enters `available.checking.parsing`. That re-entry arrives on a **data-less `xstate.after(wait)#processed` event**, so `parse` ran `defaultsDeep(undefined, baseModel)` and re-derived the entire model from the form-open clone. `baseModel` legitimately never moves (parity L3), so the saved values were overwritten by the snapshot every time.

**Fix.** `?? cloneDeep(model)` in the module's own `parse`, so a data-less re-entry parses the *current* model rather than the form-open one. **No protected core was touched** — the shared machine's behaviour is correct for its own contract; the module was relying on an event carrying data that this transition does not carry (`code-xstate.md`: the test/consumer is presumed wrong before the machine).

**Why it took two rounds.** The first fix was **correct but incomplete**. It repaired the model; it did not repair the *meta*. The display strings (`title` / `description`) are derived separately, and a save could leave a correct model beside a description composed from the pre-edit address. Round two closed the meta half. **A partially-correct fix to a reversion bug looks exactly like a complete one from the model assertion alone.**

**Why no gate caught it.** Every gate that measures *shape* passed: the PUT body, url and method are unchanged; the save resolves; the machine reaches `processed`; the collection refetches (invalidation is upstream of the resolve and fires either way). Even reading the saved value back **off the collection** stays green, because the collection refetches from the server, which has the new value. Only an assertion on the value the save **resolves** — and on `useContext().model` — discriminates. Both halves now carry controls: `saved-model-shape` (the model) and `saved-meta` (the derived strings), and the pair is deliberately complementary.

### 9.2 B2 — clearing a region on a country change never reached the API

**Symptom.** Change an address's country to one where the existing region does not belong. Client side is entirely correct: `parse` refetches the new country's regions, re-resolves `country`, clears `model.address.regionId`, the form control is right, `country_id` is on the wire, the PUT succeeds. The server keeps the **old** country's region on an address now sitting in a new country — persisted inconsistent data.

**Root cause.** The diff correctly kept the key (`isEqual(previousRegionId, undefined)` is false; the field really did move) but valued it `undefined`, and `parseData`'s `JSON.stringify` drops every `undefined`-valued key before the body is sent. The cleared field simply evaporated between the model and the wire.

**Fix, and the placement that matters.** The coercion to explicit `null` sits at the **mapper**, *not* at `parse`. This is the load-bearing detail: a `null` in the **model** fails the schema's `enum` validation and **wedges the machine**. The clearance must happen below the model, on the way out. Control: `region-clear`.

**Generalisable shape.** *Any* "clear a field" capability in this tranche crosses a `JSON.stringify` boundary that silently deletes `undefined`. A model-level clear is not a wire-level clear, and only a **request-body** read-back can tell them apart.

### 9.3 B3 — the B2 fix changed the CREATE body

**Symptom.** The B2 fix was correct for UPDATE and wrong for CREATE: it sent `"region_id": null` on create, where the recorded oracle **omits the key entirely**.

**Root cause.** The coercion had been placed where both paths ran through it.

**Fix.** Moved into `mapIAddressDataDiff` **below the `if (!baseData) return next` early return** — the line that distinguishes create from update. Create returns before the diff logic and is now byte-identical to the oracle again.

**Generalisable shape.** A fix aimed at the diff path silently rides along into the create path when it is placed above that early return. **A create/update pair needs its body asserted on both sides of the fix, against the recorded oracle** — B3 was found only because the create body's *keys* are read back, not partial-matched (`be73c0187`). A partial match would have passed a body carrying an extra `null` key.

---

## 10. Standing record-staleness debt — 5 of 19 control headers

**Five negative-control headers carry measurements taken against earlier trees.** They are accurate about *what* they mutate and *which capability* they defend; their **numbers** are stale.

| Control | Claims | Measures |
| --- | --- | --- |
| `manager-amputation` | 5 tests | **10** |
| `diff-payload` | 3, "no collateral" | **5** |
| `manager-create-amputation` | "exactly the two AC-24 tests" | **4** |
| `find-one` | string lookups "route to the same helper either way" | the **case-insensitive** lookup does flip |
| `session-hardwired-read` | "flips NOTHING" | flips the **AC-2** scope-vs-session read |

**All five err safe.** Four **understate collateral** — the mutant is more powerful than its header claims, so no capability is left unguarded by the discrepancy. One (`session-hardwired-read`) **understates its own power**: it was authored when no discriminating fixture existed and now has one. **None conceals a missing capability, and none of the 19 controls fails to flip.**

### 10.1 Why they are NOT being fixed in this run

**Every `*.must-fail.patch` file lives under `packages/`.** The verifier's `verifiedSha b8549ef82` stamp covers everything under that tree. Editing one header — a pure comment change, flipping nothing — would **invalidate the stamp and restart the whole verify cycle** for a set of corrections that are all safe-side and none of which changes a verdict.

**This is a deliberate deferral with a stated reason, not an oversight.** It is recorded here so the next reader finds the discrepancy already known and triaged rather than discovering it as a fresh finding. The fix belongs in the next tree that touches those files for a substantive reason.

### 10.2 The durable fix, already demonstrated

Three controls authored in this run — `region-clear`, `saved-meta`, `saved-model-shape` — already carry the shape that prevents this class:

> **Pin the claim to the commit it was measured at, and state the RADIUS separately from the absolute counts.**

`saved-model-shape` is the worked example: *"Measured blast radius, suite at `be73c0187`: 4 … Under the mutant the module suite runs 118 passed / 5 failed."* The **radius (4) is durable** — it is a property of the mutant. The **absolute counts move with the suite** and are therefore pinned to a commit rather than to "HEAD". A header written this way goes stale *visibly* (the sha no longer matches) instead of silently, and the number a reader actually needs stays true. **Adopt this shape for every new control; it costs one clause.**

---

## 11. Control gaps — explicit handoff list

Five gaps, triaged. **None is an unguarded capability that a mutant would have caught and did not** — four are missing-mutant-only or structurally unreachable, one is a named-but-unauthored file.

| Gap | Status |
| --- | --- |
| **AC-32** | **Missing-mutant only.** The read-back exists and asserts; no control proves it can go red. |
| **AC-10** | **Missing-mutant only.** As above. |
| **AC-36** | **Missing-mutant only.** As above. |
| **AC-9** | **Half unreachable through the published surface.** `limit=0` means page 2 cannot be requested at all, so the pagination half has no reachable read-back from the module's own API. Authoring a mutant would not close it — the gap is in the surface, not the control. |
| **create-body shape** (`create-region-key`) | **Named but UNAUTHORED.** `region-clear`'s mutant leaves the create body **byte-identical by design** (it sits below the `if (!baseData) return next` early return, §9.3), so it cannot defend the create-body shape. **B3 is therefore a real defect with a read-back but no negative control.** This is the most substantive of the five. |

**The honest ranking for whoever picks these up:** `create-region-key` first — it is the only one guarding a capability that has already regressed once. The three missing-mutant gaps are ordinary debt. AC-9's half needs a surface change or an explicit "not reachable, not claimed" ruling, not a patch file.

---

## 12. Two CI gates named in the rules DO NOT EXIST in this repo

**`ci/lint-plan-compliance.mjs` and `ci/lint-scope-purity.mjs` are both absent. There is no `ci/` directory in this repository at all.**

Both are referenced as mechanical enforcement by rules this bundle is written against, and both have companion files in `.claude/rules/` supplying machine-readable bindings for them:

| Gate | Cited by | Bindings supplied at |
| --- | --- | --- |
| `ci/lint-plan-compliance.mjs` | the parity-oracle rule — reads the tracker name for drop-disposition messages | `verify-parity-oracle.companion.md` → "Gate bindings", `issue-tracker: Linear` |
| `ci/lint-scope-purity.mjs` | the reality-check rule — enforces the `useTestAttrs` carve-out (FE-2865) | `verify-reality-check.companion.md` → "Gate bindings", `carveout` / `homes` / `extensions` |

**Both reviewer and verifier verified those rows BY HAND on this story.** The manual checks passed — this is not an unverified claim — but they are **manual**, non-reproducible, and carry no CI signal.

**Why this is recorded and not fixed here.** Writing either gate is out of this story's lane (it would be `ci/` source, not bundle) and out of its scope. The point of the record is the mismatch itself: **the rules describe these as gates, so a reader reasonably assumes a machine is enforcing them.** No machine is. Until one exists, every `Dropped-with-Linear-issue` disposition and every scope-purity row in this tranche rests on a human having looked — including the twelve `OWED — unfiled` rows in §3.2, which no gate will ever flag as unfiled.

**Recommendation:** treat this as an operator-facing infrastructure gap for the tranche, not a per-story item. Two conforming companion binding blocks already exist and are waiting for their consumers.
