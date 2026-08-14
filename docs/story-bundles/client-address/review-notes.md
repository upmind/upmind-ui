# client-address — Review Notes

**The binding record for this story.** Per `agent-behavior.companion.md` §1, this file is the per-story ruling mechanism: **read FIRST on every re-run**, mirrored to Linear, and **never silently overriding an explicit NO**.

**Date:** 2026-08-14 (revision 2, + operator ruling **R10** applied) · **Seat:** planner · **Branch:** `feature/client-address-scoped-conversion` @ base `bff994868`
**Bundle:** `docs/story-bundles/client-address/` — `docs/sdd` is a symlink to a path off this machine and is **never** written.

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

### 3.2 Nine Linear references are OWED and UNFILED

`parity.yaml` carries **nine** `Dropped-with-Linear-issue` rows — `D1`–`D8` (the staff capability, ruling R2) and `C21` (the submodule funnels, ruling R3 part 2). **No Linear issue reference was supplied to this run, and none has been invented.** Every row files its reference as the literal string `OWED — unfiled`.

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
5. **A Linear reference is invented for any `D1`–`D8` or `C21` row.** No ID is ever guessed (§3.2).

---

## 8. Gate self-report (planner seat)

| Gate field | Value |
| --- | --- |
| `full_sdd_set_exists` | **true** — `requirements.md`, `design.md`, co-located `client-address.feature`, `tasks.md`, `parity.yaml`, `review-notes.md` |
| `undispositioned_parity_cell_count` | **0** — 8 cells, all dispositioned; machine-verified |
| `arms_block_present` | **true** — `services`/`actions`/`context`/`meta`/`schemas`, each `none`, each citing the rows that earn it |
| `jtbd_contradicted_drop_count` | **0** |
| `feature_scenario_count` | **40** — `@AC-1`…`@AC-40`, unique, no gaps |
| `consumer_migration_tasks` | **8 in-scope sites** (T-14…T-21) + **2** adapter tasks (T-22, T-24) + 1 handoff (T-27), each with its own Reality Check. *(Was 3 adapter tasks; T-23 deleted by R10.)* |

The planner seat **pre-gates**; it does not emit the review verdict. This story is not moved to **Needs Review** by this seat (ADR-029).
