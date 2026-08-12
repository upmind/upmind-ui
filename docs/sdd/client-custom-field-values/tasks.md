# Tasks — client custom field values

> Ordered. **Module A completes before Module B starts** — six modules already depend on A
> (`auth` ×4 files, `account`, `basket-fields`, `utils/useFields.ts`, and B), and B consumes A's
> published seam.
> Every task names its files (paths from the worktree root
> `/Users/dom/Documents/upmind-worktrees/client-custom-fields`) and its AC ids.
> Per ADR-021: **the seat that writes the code does not write its own assertions.** Tasks marked
> *(prover)* are the test seat's; tasks marked *(developer)* are the code seat's. A
> `*.must-fail.patch` is authored by the **developer** and verified blind by the **prover**
> (`agent-seat-separation.companion.md`).

## Legend

| Mark | Meaning |
| --- | --- |
| *(developer)* | code seat writes it |
| *(prover)* | test seat writes it; never reads implementation source to construct an assertion |
| *(docs)* | docs dispatch |
| *(bdd)* | separate BDD dispatch — authors the two **co-located** `.feature` files this plan deliberately did not write |
| **BLOCKS** | nothing downstream may start until this lands green |

---

## Phase 0 — environment (do first, once)

### T-0 — `docs/sdd` is a tracked symlink to a personal path — **operator decision, no seat acts**
**Do not act on this and do not restore the symlink** — the bundle must stay reachable for the rest
of the run. This entry exists to record the constraint, because it changes T-A11 and T-B14.

`docs/sdd` and `docs/plans` are **tracked symlinks** (git mode `120000`, confirmed via
`git ls-files -s`) pointing into `/Users/domdacosta/Dev/Upmind/agent-runner/docs/{sdd,plans}` — a
personal machine path committed to the repo. It exists on no machine here, so both dangle in every
worktree **and** in `/Users/dom/Documents/upmind-monorepo`. This planning pass replaced `docs/sdd`
with a real directory in order to write the bundle at the path the dispatch specified, so the
working tree carries a tracked deletion (` D docs/sdd`). **The operator decides that before the MR.**

**The consequence that changes two tasks:** `.gitignore:67` ignores `docs/sdd/*`, with **this bundle** re-included by the `!docs/sdd/client-custom-field-values/` negation at `:72` (operator ruling); every OTHER bundle stays ignored — so an SDD
bundle **does not exist in a clean CI checkout at all** — independently of the symlink. Any
traceability assertion that reads an SDD-tree feature copy unconditionally therefore cannot pass in
CI. That is one of the two reasons the features in this pair are **co-located only** (T-A13, T-B16)
and the per-module SDD dirs are deleted. `client-email`'s own test does exactly that
(`client-email.traceability.test.ts:38-40,95-103`, assertion #1 "the co-located feature carries every
scenario the SDD source tags"), which means **the reference module's traceability test is red in CI
today**. T-A11 and T-B14 specify the CI-safe shape; do not copy that assertion. Recorded as evidence
in `dropped-capabilities.md` §N1.

- **Files:** `docs/sdd` (tracked symlink), `docs/plans` (tracked symlink), `.gitignore:65-72`
- **ACs:** none (constraint only — informs T-A11 and T-B14)

---

## Phase A — Module A: `client-custom-fields` **BLOCKS all of Phase B**

### T-A1 — types, scope matrices, and the services contract *(developer)*
Rewrite the module's type surface. Two matrices + two context enums per `design.md` §2.2; fill in
the **existing** `CustomFieldModel` stub as the code-keyed value record (do not mint a parallel
`CustomFieldValues` — `design.md` §0); widen `CustomField` to full `ICustomField` fidelity;
declare `ClientCustomFieldsServices` and alias the platform `ListQuery` (never
`ReturnType<typeof localServiceFn>`).

- **Files:** `packages/headless/src/modules/client-custom-fields/client-custom-fields.types.ts`
- **ACs:** AC-4, AC-5, AC-10
- **Watch:** the matrix key that carries the context is `ScopeActorTypes.CLIENT`; `SELF`, `STAFF`
  and `GUEST` are all `null as never` (R1). Putting the context on `SELF` advertises a cell that can
  never resolve. **Each matrix carries exactly ONE context, and it names the ENTITY being addressed
  — never its owner and never an actor.** There is no `client` context type in this pair, so
  `.for('client', id)` must not compile: `client × on-behalf-of-client` is `NOT-SUPPORTED`
  (`parity.yaml`), and a context named after the owner would turn that row into an
  advertised-but-absent capability — the FE-2824 shape.

### T-A2 — services: identity seam, addressability, definitions query *(developer)*
`resolveClientId(scopeContext)` branching on the resolved **context type**; `isAddressable()` as
the single predicate exposed via `service.isAvailable`; `loadList` issuing
`GET custom_fields?filter[object_type]=client&brand_id=<resolved client's brand>&limit=0&order=order`
with the id **ref** in the query key, `enabled` + `guard` on the predicate, and the URL re-pointed
in the `guard`.

**`order=order`, NOT `sort=order:asc`.** The latter was a planner invention corrected against the
oracle and a recorded live capture (`requirements.md` AC-1; legacy at `customFields.vue:261-267`).
Send no `sort` param. Server ordering is still not trusted — sort client-side per AC-3.

- **Files:** `packages/headless/src/modules/client-custom-fields/client-custom-fields.services.ts`
- **ACs:** AC-1, AC-2, AC-3, AC-8, AC-25
- **Watch:** `brand_id` comes from the client this seam resolved, **not** `useBrand()`'s session
  brand (`customFields.vue:219`). Line 1 keeps `/** @internal */`.

### T-A3 — mappers: full-fidelity definition + value semantics *(developer)*
`mapCustomField` (all five previously-unmapped `ICustomField` members; `isReadOnly` and
`isDisabled` stop collapsing); **relocate** `mapCustomFieldValue` here from
`client-personal-details.mappers.ts:87-106` (R2) and make it real for all 8 types — DATE to
`BACKEND_DATETIME_FORMAT`, SELECT_RADIO default `false`, no `NaN`, no `"undefined"` / `"null"`
strings; `mapCustomFieldValues`; `mapCustomFieldValuesToRequest` (dirty diff, `""`→`null`,
code-keyed object, `undefined` for an empty diff); `mapCustomFieldDisplay`; the image error-key
rewrite.

- **Files:** `packages/headless/src/modules/client-custom-fields/client-custom-fields.mappers.ts`;
  delete `mapCustomFieldValue` from
  `packages/headless/src/modules/client-personal-details/client-personal-details.mappers.ts`
- **ACs:** AC-4, AC-5, AC-14, AC-17, AC-23, AC-24
- **Watch:** the request shape is an **object keyed by CODE** (R3, verified at
  `clientCustomFieldsForm.vue:93,131-136`). No `omitBy(..., isNil)` and no
  `omitBy(..., isEmpty)` on the value record — those are exactly G-4 and G-5.

### T-A4 — schemas: the R4 re-export seam *(developer)*
`client-custom-fields.schemas.ts` re-exports the three shared parsers as `useCustomFieldsSchema`
/ `useCustomFieldsUischema` / `useCustomFieldsModel` (contract ownership **by re-export, not
relocation**) plus A's own narrowing helpers. Fix `utils/useFields.ts` only where AC-14 requires
(DATE + nullish handling).

- **Files:** `packages/headless/src/modules/client-custom-fields/client-custom-fields.schemas.ts`
  (new); `packages/headless/src/utils/useFields.ts` (minimal edit)
- **ACs:** AC-11, AC-12, AC-13, AC-15
- **Watch:** **do not move `utils/useFields.ts`, and do not touch `auth/` or `basket-fields/`**
  (R4) — `auth/auth.schemas.register.ts` and `basket-fields/basket-fields.utils.ts` import it.
  Re-export from this leaf file, never from `index.ts` into a path `useFields.ts` imports
  (`design.md` §4 watch item).

### T-A5 — collection composable + four layers *(developer)*
`useClientCustomFields` via `createScopedComposable`; query minted **once per scope**; one actions
instance per scope (filter state lives there); `context` / `meta` / `internals` lazy. `invalidate`
restored and scoped to A's own key. `meta.isAvailable` handed straight through from
`service.isAvailable` — never re-derived.

- **Files:** `packages/headless/src/modules/client-custom-fields/useClientCustomFields.ts`,
  `useClientCustomFields.actions.ts`, `useClientCustomFields.context.ts`,
  `useClientCustomFields.meta.ts`, `useClientCustomFields.internals.ts`
- **ACs:** AC-7, AC-8, AC-9, AC-16, AC-25

### T-A6 — bounded, error-settling readiness **BLOCKS B** *(developer)*
Replace the uncapped 100 ms `setInterval` (`useClientCustomFields.ts:39-48`) with the
settled-outcome pattern (`design.md` §2.5): `addressableOutcome()` + a **self-stopping** watch,
folding in the query's error state. Must settle on error, settle on unaddressable, and leave no
timer or watcher behind.

- **Files:** `packages/headless/src/modules/client-custom-fields/useClientCustomFields.actions.ts`
- **ACs:** AC-6
- **Watch:** this is the JTBD-critical row. B awaits this **inside an XState service**
  (`client-personal-details.services.ts:38`), so an unbounded wait hangs B's manager in `loading`
  forever. Do not "fix" it by shortening the interval.

### T-A7 — IMAGE value editor over `system-upload` *(developer)*
`useClientCustomFieldImage` scoped `.for('field', id)`, wrapping `useUpload(field)`. Project
`isUploading` + `progress` — **`progress` is a binary `0`/`100` signal, not an advancing percentage**
(`query`'s `doFetch` uses native `fetch()` with no upload-progress hook; `system-upload`'s `PROGRESS`
event has zero dispatchers; `useUpload()` does not expose the machine's progress field — all three
outside this run's scope per R5). **Do not fabricate an incrementing value on a timer.** File the
narrowing as a `@decision` on the meta layer; the gap is AC-18 + `dropped-capabilities.md` §6 (G-P1); rewrite the `image` error key to `custom_fields.<code>`; derive
download URL + preview; implement `flushImages()` (seam A-11) so only **dirty** images upload and
the returned hash lands in the code-keyed model.

- **Files:** `packages/headless/src/modules/client-custom-fields/useClientCustomFieldImage.ts`,
  `useClientCustomFieldImage.actions.ts`, `useClientCustomFieldImage.context.ts`,
  `useClientCustomFieldImage.meta.ts`, `useClientCustomFieldImage.internals.ts`
- **ACs:** AC-18, AC-19, AC-20, AC-21, AC-22
- **Watch:** **A does not implement the POST** (R5) — `system-upload.services.ts:48-52` already
  owns `clients/fields/{field_id}/image`. **No `.machine.ts` file in this module at all**; the
  machine is `system-upload`'s (R6).

### T-A8 — barrel + `@internal` markers *(developer)*
Curated named exports only, no `export *` (today `index.ts:1-3`). Publish exactly the A-1..A-11
seam plus the two matrices, the two context enums, and the sub-composable type exports. Line-1
`@internal` on `services` / `mappers` / `schemas`.

- **Files:** `packages/headless/src/modules/client-custom-fields/index.ts`
- **ACs:** AC-27

### T-A9 — correct the wrong request-shape claims in `modules/client/docs/foundation.md` *(developer)*
R3's doc correction, **scoped to the three write-shape lines**: `:111`
(`custom_fields?: Array<{field_id, value}>`), `:1050` (the mermaid PUT body), `:1057` ("the
supplied `field_id`s"). Each becomes the code-keyed object the oracle actually sends.

- **Files:** `packages/headless/src/modules/client/docs/foundation.md`
- **ACs:** AC-62
- **Watch:** **do NOT change** `:14`, `:73`, `:98-102`, `:282`, `:1049`, `:1114` — those describe
  the **read** shape (`ICustomFieldValue`: `{field_id, value, field?}`) and are **correct**.
  Rewriting them would introduce a new error. See `requirements.md` §7.2.

### T-A10 — A's must-fail mutants *(developer authors, prover verifies blind)*
One unified diff per JTBD-critical invariant, mutating **production** source so a colocated
assertion flips RED:
`client-custom-fields.code-keyed-shape.must-fail.patch` (make the request body an array),
`client-custom-fields.clear-value.must-fail.patch` (restore `omitBy(..., isNil)`),
`client-custom-fields.readiness-unbounded.must-fail.patch` (restore the uncapped interval),
`client-custom-fields.image-order.must-fail.patch` (flush images after the PUT),
`client-custom-fields.session-hardwired-id.must-fail.patch` (delete the `VALUES` arm of
`resolveClientId` so it always returns the session client — **AC-2 goes RED**).

**All five are authored and certified red-for-the-right-reason.** The retarget mutant needs a spec that
actually exercises the retarget path: every other spec calls `.as(SELF)`, for which `scopeContext` is
`undefined` and `resolveClientId` already takes the session arm — byte-identical to what the mutant
hardwires, so those specs cannot see it. The driving spec is
`client-custom-fields.collection.int.test.ts:163-191`, which calls
`.as(ScopeActorTypes.CLIENT).for(ClientCustomFieldsContextTypes.VALUES, targetId)` and files the A7
read-back on the outbound wire (target id in the URL, session's own bearer, no acting-as header).

> An earlier revision of this task said this control was "structurally unavailable" and removed it.
> **That was wrong and is retracted** — see `dropped-capabilities.md` §5 and `parity.yaml` → row
> `A-client-self` → `negative_control_record`. A single declared actor does not imply a single
> addressable identity: the matrix's live `CLIENT → VALUES` cell makes the retarget real, so the control
> was unexercised, not unobservable.

- **Files:** `packages/headless/src/modules/client-custom-fields/__tests__/*.must-fail.patch`
- **ACs:** AC-2, AC-6, AC-21, AC-23, AC-24
- **Watch:** the **prover** applies each blind, confirms the intended assertion goes RED, reverts.
  A prover that reads module source to construct one of these has breached diff-blindness.

### T-A11 — A's tests *(prover)*
Unit: mappers, coercion table over all 8 types, schema/uischema narrowing, display projection.
Integration: definitions request URL + params + ordering, readiness settling (all three branches of
AC-6), the addressability gate (zero requests + typed rejection), image POST ordering vs the PUT,
error-key rewrite, invalidation scope. Surface: barrel shape, `@internal`, no `vue-i18n`.

**`client-custom-fields.traceability.test.ts` — exactly THREE assertions, all over the CO-LOCATED
feature.** `packages/headless/src/modules/client-custom-fields/__tests__/client-custom-fields.feature`
(**26 scenarios**) is the **sole** source of truth. There is no SDD copy and no
`docs/sdd/client-custom-fields/` directory.

1. every non-`@todo` scenario has **≥1 sibling spec** naming its `AC-<n>` (in a `describe` or `it`
   title);
2. every AC a test names **is** a scenario the feature actually tags (the reverse direction —
   coverage never silently falls);
3. the **hard count** — the set of distinct `@AC-<n>` tags has **26** members, matching this module's
   AC set exactly, and no member has an empty proving-file list.

**Read no path outside `__tests__/`.** In particular, **do not copy
`client-email.traceability.test.ts:38-40,95-103`** — its assertion #1 ("the co-located feature carries
every scenario the SDD source tags") `readFileSync`s `docs/sdd/client-email/client-email.feature`
unconditionally, and `.gitignore:67` ignores `docs/sdd/*`, with **this bundle** re-included by the `!docs/sdd/client-custom-field-values/` negation at `:72` (operator ruling); every OTHER bundle stays ignored — so that path is not reliably present in a
clean CI checkout. That assertion is why the reference module's own traceability test is red in CI;
see `dropped-capabilities.md` §N1. No skip-if-absent variant either: this bundle's module dirs are
deleted, so such a branch could never execute, and an assertion that can never run is a check in name
only.

Note on the count: distinct AC tags (26) may be fewer than total scenarios if one AC carries more than
one scenario. Assert on the **distinct tag set** against the AC set, not on a raw scenario count.

- **Files:** `packages/headless/src/modules/client-custom-fields/__tests__/**`
- **ACs:** AC-1..AC-25, AC-27
- **Watch:** fixtures are **recorded**, never hand-authored and presented as recorded
  (`verify-cosplay.companion.md`, the 2026-08-05 data-provenance receipt). The capture path and
  credentials are in-repo; use them.

### T-A12 — A's docs *(docs)*
ADR-019 shape. No `docs/sdd/**` link and no SDD-tree provenance in the module docs
(`docs-modules.companion.md` §SDD tree).

- **Files:** `packages/headless/src/modules/client-custom-fields/docs/**`
- **ACs:** none (documentation)

### T-A13 — A's feature file *(bdd)*
Declarative Gherkin, `@AC-<n>` tags matching `/@AC-(\d+)/`, ids drawn from AC-1..AC-25 + AC-27.
Written **CO-LOCATED ONLY** — one file, one source of truth. **26 scenarios.**

- **Files:** `packages/headless/src/modules/client-custom-fields/__tests__/client-custom-fields.feature`
- **ACs:** AC-1..AC-25, AC-27 (26 ACs)
- **Watch:** there is **no** SDD copy and no `docs/sdd/client-custom-fields/` directory — do not write
  one. A duplicated feature is a second source of truth that drifts, and an SDD-tree copy is not
  reliably present in CI (`.gitignore:67` ignores `docs/sdd/*`, with **this bundle** re-included by the `!docs/sdd/client-custom-field-values/` negation at `:72` (operator ruling); every OTHER bundle stays ignored). Do not let the planner's AC list and the
  feature's tag set diverge — T-A11 enforces both directions, and the distinct tag set must have
  exactly 26 members.

---

## Phase B — Module B: `client-personal-details` (starts only after Phase A is green)

### T-B1 — types, matrices, and the name-collision fix *(developer)*
Scope matrix + context enum (`design.md` §3.2). Rename `FieldsModel` → `ProfileModel` and
`FieldsContext` → `ProfileContext` — both currently collide with `basket-fields.types.ts:6,11`
(graph-verified, `design.md` §0). `ProfileContext = DataManagerContext<ProfileModel>`. Declare
`ClientPersonalDetailsServices`, the list-query alias, and the machine-services map. Kill the
lowercase type alias shadowing the const.

- **Files:** `packages/headless/src/modules/client-personal-details/client-personal-details.types.ts`
- **ACs:** AC-55

### T-B2 — services: identity seam, addressability, and the read **query** *(developer)*
`resolveClientId` + `isAddressable` as in A. Replace the `computed` over `activeUser` with
`loadProfile`: `GET clients/{id}?with=custom_fields,custom_fields.field`, id **ref** in the key,
`enabled` + `guard` on the predicate, mapped through `select`. This is `design.md` §3.3's
`@decision` — reproduce that block verbatim above the query.

- **Files:** `packages/headless/src/modules/client-personal-details/client-personal-details.services.ts`
- **ACs:** AC-30, AC-31, AC-41
- **Watch:** this is the fix for the **absent read verb**: `SessionUser.customFields` is declared
  (`session-store.types.ts:103`) and never assigned (`session-store.mappers.ts:53-88`), so the old
  projection could never show a value. **Do not** "fix" it by extending `session-store` — that
  alternative is recorded as rejected.

### T-B3 — services: `loadLookups`, `parse`, `validate` *(developer)*
`loadLookups` consumes A's bounded readiness (safe to await inside the XState service **only**
because T-A6 landed) and seeds `baseModel.customFields` through A-9/A-8, preferring the embedded
definition. `parse` does real work or is removed — no 30-line commented block. `validate` typed
against `ProfileContext`, not `Partial<any>`.

- **Files:** `packages/headless/src/modules/client-personal-details/client-personal-details.services.ts`
- **ACs:** AC-40, AC-51, AC-53

### T-B4 — mappers: the diff-only write path **JTBD-critical** *(developer)*
`mapIProfileFields(model, baseModel) => Partial<IClient> | undefined`. Diff key by key;
`undefined` for an empty diff; `document_language_id` only on language change; `custom_fields`
from A-7; key set closed to the six client-surface keys. Delete `mapCustomFieldValue` (moved to A
in T-A3) and import it from A. Fix the language NAME/ID mismatch and the hardcoded permission
flags in `mapProfileFields`.

- **Files:** `packages/headless/src/modules/client-personal-details/client-personal-details.mappers.ts`
- **ACs:** AC-32, AC-33, AC-45, AC-46, AC-47, AC-48, AC-49, AC-59
- **Watch:** **delete both `omitBy` calls** (`:109`, `:116-118`). They are the entirety of G-4 and
  G-5: they strip the `null` that clears a custom field and the `""` / `false` / `0` that clear or
  set a native one. Emptiness is decided by the **diff**, never by a value predicate. Without this
  task the pair returns green while failing the JTBD's own verb.

### T-B5 — schemas: consume A's contract, fix the language list *(developer)*
`useSchema` / `useUischema` consume A-3/A-4 (no local re-derivation). Language enum comes from the
**target client's** brand, not `useBrand()`'s session brand. Keep the unknown-language fallback as
a disabled option. `filterFields` narrowing preserved, including the `required` narrowing.

- **Files:** `packages/headless/src/modules/client-personal-details/client-personal-details.schemas.ts`
- **ACs:** AC-11 (narrowing side), AC-34, AC-35

### T-B6 — read half: composable + four layers *(developer)*
`usePersonalDetails` via `createScopedComposable`; query minted once per scope; readiness via the
settled-outcome pattern (no async executor, no swallowed rejection).

- **Files:** `packages/headless/src/modules/client-personal-details/usePersonalDetails.ts`,
  `usePersonalDetails.actions.ts`, `usePersonalDetails.context.ts`, `usePersonalDetails.meta.ts`,
  `usePersonalDetails.internals.ts`
- **ACs:** AC-30, AC-31, AC-42

### T-B7 — manager half: composable, four layers, machine config *(developer)*
`usePersonalDetailsManager` via `createScopedComposable`, callable bare. `withConfig` payload moves
into `usePersonalDetailsManager.machine.ts` (**config only** — no machine, no new event, R6).
`clientId` seeded from `service.clientId.value` and topped up by a **self-stopping** watch — the
unmanaged `sessionReady().then()` goes. `isReady` gets a real timeout, never `Infinity`. Add `revert()` = `input(baseModel)`. Delete
`actions.ts` and `client-personal-details.utils.ts`.

**Do NOT rename the `hasSubscription` guard.** An earlier draft of this task said to; that is
withdrawn. `data-manager/data-manager.machine.ts:25` names the key in
`always: { target: "loading", cond: "hasSubscription" }`, so a `withConfig` override binds only under
that exact string. Rename it and the override silently stops applying, the machine falls back to its
own default (`:265-266`, `hasSubscription: () => true`), and `subscribing` fires `loadLookups` with no
client id — an unaddressed request on every construction, regressing AC-40/41/42. The key is dictated
by protected core (R6) and the R7 reference keeps it
(`client-email/useClientEmailManager.machine.ts:86`). Keep the key; document why in a comment. AC-54
now asserts the behaviour only.

- **Files:** `packages/headless/src/modules/client-personal-details/usePersonalDetailsManager.ts`,
  `usePersonalDetailsManager.actions.ts`, `usePersonalDetailsManager.context.ts`,
  `usePersonalDetailsManager.meta.ts`, `usePersonalDetailsManager.internals.ts`,
  `usePersonalDetailsManager.machine.ts`; **delete**
  `packages/headless/src/modules/client-personal-details/actions.ts`,
  `packages/headless/src/modules/client-personal-details/client-personal-details.utils.ts`
- **ACs:** AC-40, AC-42, AC-43, AC-50, AC-54, AC-57
- **Watch:** R6 — `dataManagerMachine` has no `REVERT` and gains none. `revert()` is a `SET`
  carrying `baseModel`.

### T-B8 — discharge the ADR-028 straggler *(developer)*
Replace the direct `vue-i18n` import (`usePersonalDetailsManager.ts:3`) with the
`system-localisation` wrapper, and update ADR-028's straggler list — the file is named by path at
`docs/adr/028-headless-vanilla-core-split.md:36,83` ("the 2 files importing vue-i18n directly").
After this change only `utils/useMoney.ts` remains.

- **Files:** `packages/headless/src/modules/client-personal-details/usePersonalDetailsManager.ts`,
  `docs/adr/028-headless-vanilla-core-split.md`
- **ACs:** AC-44

### T-B9 — write path wiring: invalidation, mutation key, image pre-flush *(developer)*
Scope invalidation to this module's own key with a matching `mutationKey`; await A-11
`flushImages()` **before** the PUT; short-circuit an empty diff with zero requests; keep the
locale side effect.

- **Files:** `packages/headless/src/modules/client-personal-details/client-personal-details.services.ts`,
  `usePersonalDetailsManager.actions.ts`
- **ACs:** AC-21, AC-45, AC-52

### T-B10 — barrel, `@internal`, docstrings *(developer)*
Curated named exports, no `export *`. Line-1 `@internal` on `services` / `mappers` / `schemas` /
`machine`. Rewrite every docstring copied from phone / address / basket.

- **Files:** `packages/headless/src/modules/client-personal-details/index.ts` and every file in
  the module
- **ACs:** AC-55, AC-56, AC-57

### T-B11 — playground consumers *(developer)*
Migrate `ClientProfile.vue` and `ClientProfileFieldsEdit.vue` to the four-layer scoped surface
(`.as('self')` → `.useContext()` / `.useActions()` / `.useMeta()`). **Delete** the two admin routes
and both `profile/admin/*` pages, with their nav entries — the ruling and its reasoning are
`design.md` §8.

- **Files:** `playgrounds/labs/src/pages/account/profile/components/ClientProfile.vue`,
  `playgrounds/labs/src/pages/account/profile/components/ClientProfileFieldsEdit.vue`;
  **delete** `playgrounds/labs/src/pages/account/profile/admin/Profile.vue`,
  `playgrounds/labs/src/pages/account/profile/admin/Edit.vue`, and the two route entries in
  `playgrounds/labs/src/pages/account/admin/routes.ts:14-45`
- **ACs:** AC-60, AC-61
- **Watch:** `ClientEmails.vue:15` still calls `useClientEmails()` flat — left stale by the
  `client-email` conversion. **Out of scope here**; do not silently fix it, do not silently break
  it further. Recorded in `dropped-capabilities.md` §4 for the operator.

### T-B12 — glossary terms *(docs)*
Add a `custom field` term and a `personal details` term (with `profile` as an alias) to
`docs/corpus/glossary.yaml`, which today has 24 terms and neither — `profile` exists only as an
alias inside the `client` entry (`:189`).

- **Files:** `docs/corpus/glossary.yaml`
- **ACs:** AC-62

### T-B13 — B's must-fail mutants *(developer authors, prover verifies blind)*
`client-personal-details.diff-only.must-fail.patch` (send the whole model),
`client-personal-details.clear-custom-field.must-fail.patch` (restore `omitBy(..., isNil)`),
`client-personal-details.falsy-native.must-fail.patch` (restore `omitBy(..., isEmpty)`),
`client-personal-details.session-hardwired-id.must-fail.patch` (put `sessionId` back in the URL —
**requires a driving spec that calls `.for(PROFILE, targetId)`**; a suite of only `.as(SELF)` specs
cannot see this mutant, because `.as('self')` leaves `scopeContext` undefined and `resolveClientId`
already takes the session arm. See the lesson at `requirements.md` AC-2 — a single declared actor does
not imply a single addressable identity),
`client-personal-details.readiness-infinity.must-fail.patch` (restore `timeout: Infinity`),
`client-personal-details.seam-bypass.must-fail.patch` (re-derive coercion locally instead of via A).

- **Files:** `packages/headless/src/modules/client-personal-details/__tests__/*.must-fail.patch`
- **ACs:** AC-30, AC-40, AC-45, AC-46, AC-47, AC-59

### T-B14 — B's tests *(prover)*
Unit: diff mapper (every branch of AC-45..AC-49), profile projection, schema narrowing.
Integration: read URL + `with` params, read URL and write URL carrying the **same** seam-resolved id
(AC-30), PUT body shape for each of clear-custom-field / clear-native / falsy / language-change /
empty-diff, image-then-PUT ordering, invalidation scope, readiness settling with a failing lookup,
bare construction, post-`stop()` silence. Surface: barrel, `@internal`, no `vue-i18n`, no
foreign-module docstrings.

**`client-personal-details.traceability.test.ts` — exactly THREE assertions, the same shape as
T-A11**, over the **sole** source of truth
`packages/headless/src/modules/client-personal-details/__tests__/client-personal-details.feature`
(**29 scenarios**). No SDD copy, no `docs/sdd/client-personal-details/` directory:

1. every non-`@todo` scenario has ≥1 sibling spec naming its `AC-<n>`;
2. every AC a test names is a scenario the feature actually tags;
3. the hard count — the set of distinct `@AC-<n>` tags has **28** members, matching this module's AC
   set exactly, and no member has an empty proving-file list.

B's feature carries **29 scenarios over 28 ACs** — one AC is covered by two scenarios, which is fine
and is exactly why assertion 3 counts the **distinct tag set** rather than raw scenarios. Read no path
outside `__tests__/`; do not reproduce `client-email.traceability.test.ts:38-40,95-103`'s
unconditional read of the gitignored SDD path (`dropped-capabilities.md` §N1), and add no
skip-if-absent variant — the dirs are deleted, so it could never execute.

- **Files:** `packages/headless/src/modules/client-personal-details/__tests__/**`
- **ACs:** AC-30..AC-57, AC-59..AC-62
- **Watch:** recorded fixtures only. The PUT-body assertions must assert **key presence and JSON
  `null`**, not just a value — `'code' in body.custom_fields === true` is what distinguishes
  "cleared" from "omitted", and omitting is the bug.

### T-B15 — B's docs *(docs)*
ADR-019 shape, no SDD-tree leakage.

- **Files:** `packages/headless/src/modules/client-personal-details/docs/**`
- **ACs:** none

### T-B16 — B's feature file *(bdd)*
Declarative Gherkin, `@AC-<n>` tags from AC-30..AC-35, AC-40..AC-57, AC-59..AC-62. Written
**CO-LOCATED ONLY** — one file, one source of truth. **29 scenarios over 28 ACs** (one AC carries two
scenarios).

- **Files:** `packages/headless/src/modules/client-personal-details/__tests__/client-personal-details.feature`
- **ACs:** AC-30..AC-35, AC-40..AC-57, AC-59..AC-62 (28 ACs)
- **Watch:** no SDD copy and no `docs/sdd/client-personal-details/` directory — do not write one. The
  distinct `@AC-<n>` tag set must have exactly 28 members (T-B14 assertion 3); the extra scenario is a
  second case for one AC, not a 29th AC.

---

## Phase C — close-out

### T-C1 — file the drops in Linear *(operator)*
`dropped-capabilities.md` carries every drop from both modules as a paste-ready issue body.
Linear was unauthenticated in the planning session (R8), so every disposition reads
`Dropped-with-Linear-issue: PENDING-OPERATOR-FILING`. File them in one pass, then replace the
placeholders in `parity.yaml` and in each issue body's `Linear-ref:` line.

- **Files:** `docs/sdd/client-custom-field-values/parity.yaml`,
  `docs/sdd/client-custom-field-values/dropped-capabilities.md`
- **ACs:** none

### T-C2 — *(no action — closed)* the R1 tension is resolved
`parity.yaml` → `open_tensions[T1]` is **RESOLVED** by the conductor ruling of 2026-08-10: strictly
one resolving cell per composable (`client × self`); `client × on-behalf-of-client` is
`NOT-SUPPORTED` in both modules; every context names the entity, never the owner; and the two
retarget acceptance criteria (formerly numbered twenty-six and fifty-eight) are deleted, their ids
retired rather than reused. Nothing is left for a seat to do here. The entry is kept so the reasoning — and the
reference evidence that overturned the planner's premise — survives in the bundle.

- **ACs:** none

---

## Dependency graph

```
T-0 (env)
  |
  v
T-A1 -> T-A2 -> T-A3 -> T-A4 -> T-A5 -> T-A6* -> T-A7 -> T-A8 -> T-A9
                                          |
                              T-A10 -> T-A11 -> T-A12 -> T-A13
                                          |
                                    [Phase A green]
                                          |
                                          v
T-B1 -> T-B2 -> T-B3 -> T-B4* -> T-B5 -> T-B6 -> T-B7 -> T-B8 -> T-B9 -> T-B10 -> T-B11 -> T-B12
                                                                    |
                                                        T-B13 -> T-B14 -> T-B15 -> T-B16
                                                                    |
                                                                  T-C1, T-C2

*  T-A6 and T-B4 are the two JTBD-critical tasks. If either is deferred, the pair ships green
   while failing the JTBD — T-A6 hangs B's manager in `loading`, T-B4 leaves "manage" unable to
   clear a value.
```

## AC coverage check

Every AC in `requirements.md` §5 is named by at least one task above.

| Module | ACs | Covered by |
| --- | --- | --- |
| A | AC-1..AC-25, AC-27 — **26 ACs** | T-A1..T-A11, T-A13 |
| B | AC-30..AC-35, AC-40..AC-57, AC-59..AC-62 — **28 ACs** | T-B1..T-B14, T-B16 |

54 ACs are defined in total — 26 for Module A, 28 for Module B. The numbering leaves two deliberate gaps between the two modules'
disjoint ranges (after Module A's last id, and between Module B's read-half and write-half groups)
so a `@AC-<n>` tag is unambiguous about which module owns it. No id in either gap exists; a feature
file or test naming one is a mistake, and each module's traceability test will say so in both
directions.
