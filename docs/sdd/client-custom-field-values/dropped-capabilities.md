# Dropped capabilities — client custom field values

> **R8: Linear was unauthenticated in the planning session.** Every disposition in `parity.yaml`
> therefore reads `Dropped-with-Linear-issue: PENDING-OPERATOR-FILING`. No issue identifier is
> invented anywhere in this bundle.
>
> **Everything the operator needs is in this one file**, so the whole set can be filed in one pass.
> Each entry below is a paste-ready Linear issue: title, the capability, its legacy `file:line`
> evidence, and why it was dropped. After filing, replace the `Linear-ref:` placeholder in each
> entry **and** the matching row in `parity.yaml`.
>
> **Sign-off token for every drop in this file:** operator ruling **R1** (tier-1, this dispatch) —
> "Cells: `client×self` ONLY, for BOTH modules. Staff/guest surfaces are declared, tracked drops,
> mirroring READ-ONLY `client-email/`." No **core** cell (`A-client-self`, `B-client-self`) is
> dropped; see `parity.yaml` → `summary.core_cells_dropped: 0`.
>
> **Suggested Linear defaults** (from `plan.companion.md`): team **FE**, labels **["frontend"]**.
> Suggested parent: one epic, "Staff-acting-for-client profile & custom fields surface", with
> §1 and §2 as its children.

## Contents

| § | Set | Count |
| --- | --- | --- |
| 1 | Module A — `client-custom-fields` staff/guest drops | 4 |
| 2 | Module B — `client-personal-details` staff drops (D1–D13) | 13 |
| 3 | Cells with nothing to drop (`NOT-SUPPORTED`, no issue needed) | 6 |
| 4 | Non-capability notes (operator findings — §N3 and §N4 want a Linear issue) | 4 |
| 5 | **RETRACTED** — AC-2's negative control is authored and passing (was filed as an accepted cost; conductor error) | 0 |
| 6 | Parity gaps inside an IN-SCOPE cell — partial delivery, wanting a Linear issue | 2 |

**Not double-counted, on purpose:** the `client_readonly && isClient` read-only asymmetry is
**not** an independent drop — inside `client×self` that predicate is constant by construction, so
it is subsumed by A-D1. `with_staged_imports` and the staged-import definition variant are
likewise subsumed by A-D1 (their only locus is the admin surface). Stated here so a reader does
not file them twice.

---

## 1. Module A — `client-custom-fields`

### A-D1 — Staff reading and writing another client's custom field definitions and values

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Parity row:** `A-staff-onbehalf`
- **Cell:** staff × on-behalf-of-client

**Title:** `Staff: read and write another client's custom field values (deferred from the client-custom-fields conversion)`

**The capability.** A staff user, acting for a named client, reads the brand's client custom-field
definitions and that client's values, and writes new values — through the admin API surface rather
than the customer one.

**Legacy evidence.**
- `api/admin/custom_fields` — staff read of the definition catalogue.
- `api/admin/clients/{id}` — staff read of that client's `custom_fields` values.
- `src/views/admin/clients/client/profile/index.vue` — the admin consumer that mounts
  `clientCustomFieldsComp` for an arbitrary client.
- `src/components/app/global/client/clientCustomFieldsForm.vue:82-84` — `canUpdate()` →
  `$userCan("update_client")`, the staff write gate.
- `src/components/app/global/client/clientCustomFieldsForm.vue:128-137` — the write itself, taking
  `id: this.clientId` as an argument rather than the session's own id.

**Why it was dropped.** Operator ruling R1 scopes this conversion to the client actor only, exactly
as the `client-email` conversion did. The staff surface needs the admin API base path, the
`get_client` / `update_client` permission gates, and a staff session's acting-as identity transport
— none of which this pair builds. Deferring it keeps the client surface honest: with
`STAFF: null as never` in the scope matrix, `.as('staff')` is a **compile-time error** rather than
an advertised-but-absent capability (the FE-2824 shape).

**Subsumed into this issue (do not file separately).**
- The `client_readonly && isClient` read-only asymmetry — constant inside `client×self`.
- `with_staged_imports` and the staged-import definition variant — admin-surface only.

---

### A-D2 — Staff uploading a custom-field image on a client's behalf

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Parity row:** `A-staff-onbehalf`
- **Cell:** staff × on-behalf-of-client

**Title:** `Staff: upload a client custom-field image on that client's behalf`

**The capability.** Staff uploads an image value for a client custom field of type IMAGE, against
the admin endpoint, with progress and the field-scoped error key.

**Legacy evidence.**
- `POST api/admin/clients/fields/{fieldId}/image` — the admin upload endpoint.
- `src/components/app/global/customFields/customFields.vue:364-390` — `uploadImage`, dispatching
  `uploadCustomFieldImage` with `fieldId` and an `onUploadProgress` handler.
- `src/components/app/global/customFields/customFields.vue:399-400` — the
  `image` → `custom_fields.<code>` error-key rewrite the staff path shares.

**Why it was dropped.** Same as A-D1 (R1). The **client** path for this capability **is** delivered
by this run (AC-18..AC-22) and consumes `system-upload`'s existing
`clients/fields/{field_id}/image` route (`system-upload.services.ts:48-52`); only the admin-base
variant is deferred.

---

### A-D3 — Admin custom-field definition CRUD and reorder

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Parity row:** `A-staff-self`
- **Cell:** staff × self

**Title:** `Admin: create, edit, delete and reorder client custom-field definitions`

**The capability.** A staff user authors the brand's client custom-field catalogue — creating and
editing definitions (type, name, required, options, visibility flags) and reordering them.

**Legacy evidence.**
- `src/views/admin/settings/customClientFields/index.vue` — the definition-management view.
- `src/views/admin/settings/customFields/index.vue` and
  `src/components/app/admin/customFields/customFieldsListing.vue` — the listing and editor.
- `PUT api/admin/custom_fields/order` — the reorder endpoint.

**Why it was dropped.** Out of the JTBD entirely, not merely out of this cell. The JTBD is a
consumer reading and managing **a client's values**; authoring the brand's field catalogue is a
different job with a different audience and a different API surface. This run's module reads the
catalogue and never writes it.

---

### A-D4 — Guest custom-field image upload against a basket/guest token

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Parity row:** `A-guest-self`
- **Cell:** guest × self

**Title:** `Guest: upload a client custom-field image using a basket/guest token`

**The capability.** During registration or a basket flow, a guest (no client session yet) uploads
an image for a client custom field, authenticating with the guest/basket access token instead of a
client token.

**Legacy evidence.**
- `src/components/app/global/customFields/customFields.vue:348` —
  `async uploadCustomImages(isGuest = false)`.
- `src/components/app/global/customFields/customFields.vue:384` —
  `isGuest ? { guestToken: this.guestAccessToken } : {}`.
- `src/components/app/global/auth/clientAuth/clientAuthRegisterFields.vue` and
  `src/components/app/global/baskets/basket/shared/basketFields.vue` — the guest consumers.

**Why it was dropped.** R1 scopes the run to the client actor. The guest variant belongs to the
registration and basket-fields flows, and **R4 explicitly keeps `basket-fields/` untouched** — the
shared parsers it imports stay where they are. Delivering a guest arm here would mean building the
guest token transport for a surface this run does not own.

---

## 2. Module B — `client-personal-details` (D1–D13)

All thirteen sit in parity row **`B-staff-onbehalf`** (staff × on-behalf-of-client). They may be
filed as thirteen issues, or as one issue with thirteen checkboxes; the evidence below is per
capability either way.

**Verified before dropping** (this is what makes them non-client-surface rather than convenient
bookkeeping): the customer-area view `src/views/client/account/profile/index.vue:9-14` passes
**only** `:client` — no `isDisabled`, no `staged_import`, no aggregate save orchestration — and the
shared form gates its extra surface behind `v-if="isAdmin"`
(`clientProfileBasicConfigurationForm.vue:125-163`) or the `:if-admin` branch of
`<guard :if-client="true" :if-admin="guardFunctionalities">` (`:3`).

> **Honest framing for D1 and D2 — please keep this in the issue text.** These two are
> **advertised-but-broken today**, not working capabilities being taken away. Current headless
> hardwires the session's own id: `client-personal-details.services.ts:89` reads
> `const { sessionId: clientId } = useActiveSession().useContext()` and `:94` builds
> `useUrl(\`clients/${clientId.value}\`)`. So when staff "edits a client" today, the PUT targets
> **the staff user's own** id. Dropping the cell removes a broken claim; it does not remove a
> working feature.

### D1 — Staff reads another client's profile

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: read another client's personal details (currently advertised but broken)`
- **Legacy evidence:** `src/store/modules/data/clients/index.ts:20-29,122-132` (the admin read
  action, taking an id argument); consumer `src/views/admin/clients/client/profile/index.vue:4-13,100-102`.
- **Why dropped:** R1. Also broken today — see the framing note above.

### D2 — Staff writes another client's profile

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: update another client's personal details (currently advertised but broken)`
- **Legacy evidence:** `src/store/modules/data/clients/index.ts:316-327` (update takes `id` as an
  argument); `src/store/modules/data/index.ts:340`; call site
  `clientProfileBasicConfigurationForm.vue:394-401`.
- **Why dropped:** R1. Also broken today — the PUT currently targets the staff user's own id.

### D3 — Admin-only field: client `number`

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: edit a client's client-number on the profile form`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:125-139` (inside
  `<template v-if="isAdmin">`); baseline pick at `:350`.
- **Why dropped:** R1, and it is genuinely not client-surface — the field renders only when
  `isAdmin`.

### D4 — Admin-only field: `created_at` ("client since")

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: edit a client's created-at date (required, min 1971-01-01, seconds zeroed)`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:142-153` (admin-only date picker,
  `:is-required="true"`, `:after-date="afterDate"`); `:270-272` (`afterDate` =
  `"1971-01-01 00:00:00"`, the earliest the backend accepts); `:353-355` (the baseline zeroes
  seconds via `setSeconds(0)` then formats to `BACKEND_DATETIME_FORMAT`).
- **Why dropped:** R1; admin-only render gate.

### D5 — Admin-only field: `notifications_disabled`

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: toggle a client's email-notifications-disabled flag`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:156-162` (admin-only checkbox);
  baseline pick at `:349`.
- **Why dropped:** R1; admin-only render gate.

### D6 — Read permission gate `get_client`

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: gate profile READ on the get_client permission`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:3`
  (`<guard :if-client="true" :if-admin="guardFunctionalities">`); `:273-278`
  (`guardFunctionalities() { return ["get_client"]; }`); `:288-289` (`contentIsAvailable`).
- **Why dropped:** R1. Note the shape: for the **client** actor the guard is unconditional
  (`:if-client="true"`), so there is no client-surface permission gate to lose. This is also the
  capability that **would earn a services arm** if the staff cell were ever brought in scope —
  recorded in `parity.yaml` → `arms.services.cites`.

### D7 — Write permission gate `update_client`

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: gate profile WRITE on the update_client permission`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:279-281`
  (`canUpdate() { return this.$userCan("update_client"); }`) plus every `:disabled="… || !canUpdate"`
  expression on the form (e.g. `:135-137`, `:148-151`, `:158-161`).
- **Why dropped:** R1. Same arm note as D6 (services + meta).

### D8 — Staged-import lock

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: lock the profile form for a staged-import client`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:254-256`
  (`return !!this.client?.staged_import;`) and every `isStaged` disable expression;
  admin view `src/views/admin/clients/client/profile/index.vue:29,36,42`.
- **Why dropped:** R1, and it is not client-surface — the customer-area view passes no
  `staged_import` signal at all (`views/client/account/profile/index.vue:9-14`).

### D9 — Unverified banner + resend verification

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: unverified-client banner with resend-verification action`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:19-38` (the banner, gated
  `v-if="isAdmin && clientIsNotVerified"`, with the resend link gated on
  `$userCan('request_verification_client_email')`); `:249-253`; `:408-428` (`resendVerification`);
  `POST api/admin/clients/resend_verification`; store action
  `src/store/modules/data/clients/index.ts:171-187`.
- **Why dropped:** R1; the banner's own render gate is `isAdmin`.

### D10 — Cross-brand redirect guard

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: redirect when viewing a client outside the current brand`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:303-308`.
- **Why dropped:** R1. Structurally staff-only — a client can only ever be inside its own brand,
  so the guard has no client-surface meaning.

### D11 — Per-client brand-settings language list in org mode

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: language list from the target client's brand settings (org mode)`
- **Legacy evidence:** `clientProfileBasicConfigurationForm.vue:211-224,234-240,292-299,322-337`.
- **Why dropped:** R1 for the **org-mode / multi-brand staff** variant. Note the client-surface
  half of this **is** delivered: AC-34 requires the language enum to come from the target client's
  brand rather than `useBrand()`'s session brand, which is the current headless bug (G-11). Only the
  staff org-mode brand-settings fetch is deferred.

### D12 — Aggregate save/revert across profile + custom fields with a two-flag reload barrier

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: aggregate save/revert across the profile and custom-field panels`
- **Legacy evidence:** admin view `src/views/admin/clients/client/profile/index.vue:45-51,86-108,120-133`;
  form `clientProfileBasicConfigurationForm.vue:438-447`.
- **Why dropped:** R1, and it is not client-surface — the customer-area view mounts the two panels
  independently with no aggregate orchestration and no reload barrier
  (`views/client/account/profile/index.vue:9-25`). Per-panel save **and** per-panel `revert()` **are**
  delivered (AC-45, AC-50).

### D13 — `isDisabled` cross-panel processing lock

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Title:** `Staff: cross-panel processing lock while another panel saves`
- **Legacy evidence:** admin view `src/views/admin/clients/client/profile/index.vue:9,20,106-108`;
  form `clientProfileBasicConfigurationForm.vue:199` and the `isDisabled` prop at `:80`.
- **Why dropped:** R1, and not client-surface — the customer-area view passes no `isDisabled` prop
  (`views/client/account/profile/index.vue:9-14`), so the prop defaults to `false` for a client.
  Would earn a **meta** arm if the staff cell came in scope (`parity.yaml` → `arms.meta.cites`).

---

## 3. Cells with nothing to drop — `NOT-SUPPORTED`, no issue needed

These five carry a disposition but **no** issue: the oracle exhibits no capability in them, so
there is nothing to file. Evidence of absence is recorded rather than assumed.

| Parity row | Cell | Evidence of absence |
| --- | --- | --- |
| `A-guest-onbehalf` | guest × on-behalf-of-client | The guest paths carry a basket/lead token and no client id (`customFields.vue:384`); no legacy route lets a guest act on a **named** client's custom fields. |
| `B-staff-self` | staff × self | This module is a **client's** personal details. A staff user's own profile is a different resource (`admin/self`, `session-store.services.ts:66-76`) owned by a different surface. |
| `B-guest-self` | guest × self | A guest has no client profile; the form requires a client actor (`clientProfileBasicConfigurationForm.vue:3`, `:if-client="true"`). |
| `B-guest-onbehalf` | guest × on-behalf-of-client | No legacy surface lets a guest read or write a named client's profile. |
| `A-client-onbehalf` | client × on-behalf-of-client | No client-acting-for-another-client custom-fields surface exists. Where legacy lets a parent client reach a child client it **substitutes the session** — minting the child's own token (`auth.services.client.ts:72`, `clients/{id}/access_token`; the relationship is carried on `/self` as `actor.parent_client_config.parent_client`, `session-store.services.ts:41-58`) — which is `client × self` on another session, not a retargeted request. |
| `B-client-onbehalf` | client × on-behalf-of-client | No client-acting-for-another-client profile surface exists. The id-as-argument at `store/modules/data/clients/index.ts:316-327` is the **admin** store action, consumed only by `views/admin/clients/client/profile/index.vue` — that is the staff cell (D2). The customer-area view passes only the session's own `:client` (`views/client/account/profile/index.vue:9-14`). |

**Both client-onbehalf rows are additionally UNNAMEABLE, not merely undelivered.** No context type in
either module is `client` — A uses `custom_field_values` and `field`, B uses `profile` — so
`.for('client', id)` does not compile anywhere in this pair. That is what keeps `NOT-SUPPORTED`
honest rather than advertised-but-absent (the FE-2824 shape). Ruling and reasoning:
`parity.yaml` → `open_tensions[T1]` (**RESOLVED**, conductor, 2026-08-10).

---

## 4. Non-capability notes — no issue required unless the operator wants one

### N1 — `docs/sdd` and `docs/plans` are TRACKED symlinks to a personal machine path

Both are tracked at git mode **`120000`** (confirmed with `git ls-files -s docs/sdd docs/plans`) and
point at `/Users/domdacosta/Dev/Upmind/agent-runner/docs/{sdd,plans}`. A personal machine path is
committed to the repo; it exists nowhere here, so both dangle in every worktree and in
`/Users/dom/Documents/upmind-monorepo`. This planning pass replaced `docs/sdd` with a real directory
in order to write this bundle at the dispatched path, so the working tree carries a tracked deletion
(` D docs/sdd`). **The operator decides this before the MR — no seat acts on it, and the symlink is
not restored, because the bundle must stay reachable for the rest of the run** (`tasks.md` T-0).

**Evidence that this is already biting, not merely untidy: the reference module's traceability test
is RED in CI today.** `.gitignore:67` ignores `docs/sdd/*`, with **this bundle** re-included by the `!docs/sdd/client-custom-field-values/` negation at `:72` (operator ruling); every OTHER bundle stays ignored — and `client-email`'s own bundle is among the ignored, so it does not exist
in a clean CI checkout **regardless of the symlink**. Yet
`client-email.traceability.test.ts:38-40,95-103` reads
`docs/sdd/client-email/client-email.feature` **unconditionally** as its assertion #1 ("the co-located
feature carries every scenario the SDD source tags") — a `readFileSync` on a path CI never has. Two
independent defects stack here: a tracked personal-path symlink, and a test coupled to a gitignored
artefact.

This is why `tasks.md` **T-A11** and **T-B14** specify a CI-safe traceability shape for both new
modules — co-located feature as the single source of truth, both-direction AC↔test linkage, and the
hard count — and specify **no SDD-source assertion at all**, in any form. Worth a follow-up issue for
`client-email` itself at the operator's discretion; it is read-only reference for this run, so this
plan does not touch it.

### N2 — `ClientEmails.vue` was left on the pre-conversion flat API

`playgrounds/labs/src/pages/account/profile/components/ClientEmails.vue:15` calls
`useClientEmails()` **flat** — `const { isReady, default: defaultEmail, verify } = useClientEmails()`
— but `client-email` is now a scoped composable whose call returns a builder
(`useClientEmails.ts:80-83`). The file's last commits predate the conversion, so the
`client-email` run did not migrate its own playground consumer.

**Not this run's work** — `client-email/` is read-only reference and the page is not named by this
dispatch. Recorded because it is the same breakage class this pair is explicitly required to avoid
(AC-60), and a developer migrating `ClientProfile.vue` / `ClientProfileFieldsEdit.vue` in **T-B11**
will be working in the same directory. Worth a follow-up issue at the operator's discretion.


### N3 — `client-email` is latently exposed to the same module-load-order defect Module A hit

**Wants a Linear issue.** Pre-existing; outside this run's scope.

`client-email/useClientEmails.ts:80` registers with the scope registry **eagerly, at module top
level**:

```ts
export const useClientEmails = createScopedComposable<…>("client-email", createClientEmailsForScope);
```

Because that call runs at *import* time rather than at first use, any future module that is the
**first unmocked entrant** to `../scope` along an import path that reaches
`client-company/client-company.services.ts:9` (`import { useClientEmails } from "../client-email"`)
crashes on it. Module A hit exactly this defect during this run and now registers **lazily**, so A is
safe; `client-email` is one line from the same fix but is **do-not-modify** for this run.

**Likely wider than one module.** The other converted client modules in this tranche were built from
the same reference and probably share the eager-registration pattern — `client-email-history/`,
`client-address/`, `client-phone/`, `client-company/` are all worth checking in the same pass. The
fix is mechanical (defer the `createScopedComposable` call to first use); the risk of leaving it is a
crash that surfaces only when an unrelated module changes its import graph, which makes it very
expensive to diagnose at the point it appears.

**Suggested title:** `Scoped composables register eagerly at import time — latent module-load-order crash`

---

### N4 — The architectural root: `query/useQuery.ts` imports `../basket`

**Wants a Linear issue.** Pre-existing; outside this run's scope. **This is the root cause of N3's
whole class**, and fixing it removes the class for every scoped composable rather than one module at
a time.

`packages/headless/src/modules/query/useQuery.ts:10`:

```ts
import { useBasket, useBasketCurrency } from "../basket";
```

A **generic query layer** reaching into the **basket domain** is a layering inversion, and it is what
lets `../scope`'s transitive import walk re-enter the module graph. The concrete path, verified in
this worktree:

```
query/useQuery.ts:10            → ../basket
  basket-billing/unified/schemas.ts:6  → ../../client-company
    client-company/client-company.services.ts:9 → ../client-email   (N3's crash site)
  basket-fields/basket-fields.services.ts:3     → ../client-custom-fields
```

Every scoped composable that touches the query layer therefore transitively pulls in the basket
domain and, through it, sibling client modules. Breaking the `query → basket` edge — injecting the
basket currency/context the query layer needs, rather than importing the domain — removes the whole
re-entrancy class at once. N3's per-module lazy registration is the symptomatic fix; this is the
causal one.

**Suggested title:** `query/useQuery.ts imports ../basket — layering inversion behind the scoped-composable load-order class`

---

## 5. RETRACTED — AC-2's negative control is authored and passing

<a id="ac2-negative-control"></a>

**This section previously read "Accepted cost of the cell-scope decision — AC-2's negative control is
unavailable". That framing was WRONG and is retracted.** It was a **conductor error**, corrected by the
prover's evidence. No issue to file; nothing here is a cost of the cell-scope ruling. The retraction is
kept rather than deleted because the mistake is instructive.

**What was claimed.** That `client-custom-fields.session-hardwired-id.must-fail.patch` could never go
red: at `client × self`-only scope the scope-resolved client id and the session client id are the same
value, so hardwiring the session client could not change the outbound request, and therefore the
FE-2824 retarget mutant was "not observable at single-cell scope".

**Why that was false.** It conflated **one declared actor** with **one addressable identity**. The
matrix pairs the client actor with an **entity context that carries an id** —
`[ScopeActorTypes.CLIENT]: ClientCustomFieldsContextTypes.VALUES` (`design.md` §2.2) — so
`.as(CLIENT).for(VALUES, someOtherId)` **compiles and genuinely retargets**, and `resolveClientId`'s
`VALUES` arm returns that other id. This bundle's own `design.md` §2.2 transparency note already said
so ("a caller passing a *different* client's id would target that client's resource"), so the claim
contradicted the design it was filed against. The control was never unobservable — the path was simply
**unexercised**, because every spec called `.as(SELF)`, for which `scopeContext` is `undefined` and
`resolveClientId` always takes the session arm, which is byte-identical to what the mutant hardwires.

**What is true now.** The prover authored the driving spec and it works:

- `client-custom-fields.collection.int.test.ts:163-191` drives
  `.as(ScopeActorTypes.CLIENT).for(ClientCustomFieldsContextTypes.VALUES, targetId)`.
- The filed A7 read-back is on the **outbound wire**, never a response payload: the request URL carries
  the **target** id; `assertRetargetIdentityTransport` (`int-helpers.ts:372-382`) asserts the
  `Authorization` header is the **session's own** bearer and that **no acting-as header** is sent (an
  entity retarget, not an actor swap); and a further assertion proves the session client's own id was
  never addressed.
- Applying the mutant — which deletes exactly the `VALUES` arm of `resolveClientId` — collapses the URL
  back to the session client and flips that spec **RED** with
  `"No request addressed to the retargeted client …"`.

AC-2 is green on its success path **and** backed by a proven-red control. All five of module A's mutants
are certified red-for-the-right-reason. AC-2 was never softened and no substitute control was invented.

**The lesson, because it will recur across this tranche:** *a single declared actor does not imply a
single addressable identity.* Where the matrix pairs an actor with an entity context carrying an id, the
retarget path is **live** and must be **exercised** — otherwise the identity seam goes unproven while
every gate stays green, which is the FE-2824 shape wearing a different hat. Recorded for the seats at
`requirements.md` AC-2. Cross-ref: `parity.yaml` → row `A-client-self` → `negative_control_record`.


---

## 6. Parity gaps inside an in-scope cell — partial delivery

These are **not** dropped cells. The cell (`client × self`) is in scope and delivered; one capability
*within* it is narrowed against legacy. Recorded here because a narrowing that is not written down is
indistinguishable from a capability that was never noticed — and because the AC text was, for a period,
promising something the code did not do.

### G-P1 — Byte-level upload progress for IMAGE custom fields

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Parity row:** `A-client-self` (in scope — this is a partial, not a drop)
- **AC:** AC-18 — amended to the delivered binary behaviour, with the gap declared inline

**Title:** `IMAGE custom-field upload reports binary 0/100, not byte-level progress (no upload-progress hook in query/doFetch)`

**What legacy does.** Real byte-level progress per field, via axios's `onUploadProgress`: the handler
computes `Math.floor((progressEvent.loaded * 100) / progressEvent.total)` and pushes it into the field's
`progress` alongside `isUploading: true` (`customFields.vue:375-383`), rendered per field at
`:129-130` and read back at `:417-433`.

**What this run delivers.** An honest **binary** signal: `progress` is `100` once the upload completes,
else `0`, alongside a real `isUploading`
(`client-custom-fields/useClientCustomFieldImage.meta.ts:50`). No intermediate value is ever emitted.

**Why it cannot be closed from this run — three independent barriers, each verified:**

1. **No transport hook.** The upload goes through `query`'s `doFetch`, which calls the **native
   `fetch()`** (`query/query.services.ts:50`). `fetch` has no upload-progress callback.
2. **No event dispatch.** `system-upload`'s machine defines a `PROGRESS` handler
   (`system-upload.machine.ts:75`), but **nothing in `packages/headless/src` dispatches it** — a
   package-wide search returns zero senders. The handler is dead.
3. **No exposed field.** `useUpload()`'s return type does not surface the machine's `progress` context
   field, so even a dispatched event would be unreadable by a consumer.

**Named fix location.** Both owners are outside this run's write scope (**R5** — A consumes
`system-upload`, it does not modify it):

- `packages/headless/src/modules/query/query.services.ts` — `doFetch` (`:19-50`) must gain an
  upload-progress-capable path: **XHR** (`XMLHttpRequest.upload.onprogress`) or a **`ReadableStream`
  request body** with a counting transform. This is the root enabler; `fetch` alone cannot do it.
- `packages/headless/src/modules/system-upload/` — dispatch `PROGRESS` from the upload service as the
  transport reports bytes (`system-upload.services.ts`'s `upload`, `:144-156`), and expose the
  machine's `progress` context on `useUpload()`'s return (`useUpload.ts`).

Once both land, `useClientCustomFieldImage.meta.ts:50` becomes a pass-through of the real value and
AC-18's read-back can be restored to an advancing assertion. Until then the binary signal is the honest
maximum.

**Explicitly rejected, and worth preserving in the issue.** Interpolating a fake incrementing
percentage on a timer. A fabricated progress value is **indistinguishable from a real one to a
consumer**, which is worse than an honest binary signal — it manufactures confidence in a measurement
that does not exist. The developer's `@decision` recording this is at
`useClientCustomFieldImage.meta.ts:5-33`, and its docblock carries a standing instruction that docs and
review must not describe incremental progress as delivered.


### G-P2 — Two independently-keyed reads of the same profile resource (count contested)

- **Linear-ref:** `PENDING-OPERATOR-FILING`
- **Parity rows:** `A-client-self` and `B-client-self` (both in scope — a cost, not a drop)
- **AC:** AC-54 — its request count is scoped to B's own read path for this reason
- **Cross-reference, do not duplicate:** `evidence/07-gaps-and-limits.md` **G3** is the verifier's
  primary record of the count tension, with its raw observed counts.

**Title:** `Two independently-keyed reads of GET clients/{id} — unsafe to share while useQuery applies select inside queryFn`

**What is ESTABLISHED (verified from source).** Both modules read
`GET clients/{id}?with=custom_fields,custom_fields.field`, under **two distinct cache keys**, so the
two paths **cannot share a fetch**:

- Module A resolves `brand_id` through `useQuery().get` with
  `queryKey: ["client", id, "record"]` (`client-custom-fields.services.ts:185`), and `get()`
  **appends a `{locale}` segment** because this read does not pass `withoutLocale`
  (`query/useQuery.ts:262`).
- Module B's reactive `loadProfile()` uses a raw `vueUseQuery` key **without** that segment.

Different keys, different entries. **Consequence, stated without a count:** where both paths run, the
same profile resource is fetched **twice** rather than once — the reads cannot be deduped by the
cache. This is pre-existing in kind, not introduced by this run.

**What is NOT established: how many reads a real boot issues.**

| Source | Count | Status |
| --- | --- | --- |
| Verifier, browser network layer, one `/account/profile` load, both modules active | **1** | **MEASURED** — `evidence/07-gaps-and-limits.md` G3 |
| AC-54's integration spec | **2** | **OBSERVED** in the spec harness |
| "Two identical GETs per boot", as recorded in an earlier revision of this entry | **2** | **REPORTED, NOT MEASURED** — see attribution below |

**The discrepancy is unresolved, and is owed a measurement at the SERVICE SEAM** (counting call sites),
not at the network layer — where an in-flight dedupe or a warm `staleTime: DAY` entry can render a
second read invisible. Deferred to post-commit verification, per the verifier's routing. Note also
that the verifier's own suggested reconciliation — that a *shared* `["client", <id>, "record"]` key
collapsed the two reads — **is not supported by the keys as written**: A's effective key carries the
`{locale}` segment and B's does not, so whatever caused the observed collapse, it was not key
sharing. That mismatch is itself a reason the measurement is owed rather than settled by argument.

**Attribution, honestly.** The "two identical profile GETs per boot" figure originated with **the
conductor**, who has since stated plainly that it was **not measured**. This planner recorded it as an
accepted cost without asking what had measured it; two seats then reasoned from it; the verifier — the
only seat that actually counted — caught it. The module's own `@decision` also asserts "two
independent GET … per boot" in its `cost:` field
(`client-custom-fields.services.ts:166-171`), so the figure is carried in code comments too and
should be softened there when the measurement lands. See `requirements.md` §9, lesson **L4**.

**Why it is not fixed by sharing the key.** `useQuery` applies `select` **inside** `queryFn`
(`query/useQuery.ts:1012-1017`), so a cache entry stores the **selected** projection rather than the
raw response. A shared key would be **poisoned by whichever fetch won the race**: A's bare `brand_id`
**string** into B's `select: mapProfile`, or B's full `IClient` where A expects a brand id. Module A
**rejected making the keys byte-identical** on exactly this basis, calling it "UNSAFE, not just
unrealised" (`client-custom-fields.services.ts:149-165`). Two clean reads beat one corrupted entry.

**Named fix location.** Making the sharing safe is a `query`-layer change, outside this run's scope:

- `packages/headless/src/modules/query/useQuery.ts` — apply `select` **outside** `queryFn` (TanStack's
  own per-observer `select`, which runs on read), **or** cache one shared **raw** entry and let each
  consumer select from it. Either removes the poisoning hazard; only then can the two entries safely
  collapse into one.

**Do not restate the hazard in the issue — reference it.** Both modules already carry `@decision`
blocks documenting it: `client-custom-fields.services.ts:113-171` (A's own-keyed brand read and the
four rejected alternatives) and `client-personal-details.services.ts:117-126`, `:181`, `:223` (B's
hand-rolled key, the `"record"` segment, and the F5 record). The issue should link those rather than
duplicate the reasoning, so there is one source of truth.

**Cost, stated defensibly:** where both paths run, one extra read of the same profile resource that a
safe shared entry would have avoided. The per-boot count is contested and pending measurement — do not
quote a number until G3 is settled. Recorded so a future reader neither "optimises" it into the
poisoned-entry bug nor treats an unmeasured figure as established.
