# Requirements — client custom field values

> Bundle for the PAIR: `client-custom-fields` (Module A) + `client-personal-details` (Module B).
> One branch, one MR: `worktree-client-custom-fields-scf`.
> Planner seat, full-depth SDD route. Write lane: `docs/sdd/**` only.

## 1. Job to be done

> **Let a consumer read and manage a client's custom field values at full parity with legacy vue-app + current headless.**

Delivered by the pair, in dependency order: **A converts first** (six modules already depend on
it — `auth` ×4 files, `account`, `basket-fields`, `utils/useFields.ts`, and B), **B second**,
consuming A's published contract.

The JTBD has two verbs and both must land:

| Verb | Who owns it | The rows that carry it |
| --- | --- | --- |
| **read** a client's custom field values | A (definitions + value semantics) + B (the client record's values) | AC-16, AC-40, AC-41 |
| **manage** (write, change, and **clear**) those values | A (request shape, coercion, image flush) + B (the `PUT clients/{id}` persist) | AC-23, AC-24, AC-45, AC-46, AC-47 |

Gate fields are evidence toward this JTBD, never the goal. Two contradictions surfaced during
oracle consultation are recorded in §7 — one of them (§7.1) shows the **read** verb is not
merely degraded today but wholly unimplemented, which forces the design ruling in `design.md` §5.

## 2. Oracles consulted

Per `.claude/rules/verify-parity-oracle.companion.md`, the oracle KIND here is **legacy
application + recorded acceptance**. "The real job" is what vue-app does — never the new
headless code's own tests, and never this plan's guess at structure.

| Oracle | Location | Role |
| --- | --- | --- |
| Legacy app | `/Users/dom/Documents/Upmind/vue-app` — see the provenance note below; **pin by SHA, not branch** | Primary. Capability + request-shape truth. |
| Actor × context matrix | ADR-001 | The axis of behavioural variation; one parity row per cell. |
| Current headless | this worktree, `packages/headless/src/modules/client-{custom-fields,personal-details}` | The delta being closed, never the oracle. |
| Reference conversion | `packages/headless/src/modules/client-email/` (READ-ONLY) | The shape to follow (R7). |

> **Oracle provenance — the branch moved during the run. Cite the SHA, not the branch.**
> The oracle is a **separate working checkout**, not a pinned worktree of this repo, and its branch
> changed mid-run:
>
> | | Branch | SHA |
> | --- | --- | --- |
> | Initial research citations | `feat/cancellation-logs-updates` | `62953d26fa` |
> | Late verification (AC-47 and after) | `feat/FE-3080-promotion-disqualifying-products` | `47fdeb0c05` (`47fdeb0c053219cff5ee9c8276c2a741c6554178`, HEAD dated 2026-08-06) |
>
> Both SHAs are still reachable locally, so either set of citations can be reproduced with
> `git show <sha>:<path>`. **Treat every legacy line number in this bundle as approximate and confirm
> against the cited SYMBOL** (the function, computed or template block named alongside it) rather than
> the line — a reviewer who checks out the branch *name* may land on a different tree. This is a
> reproducibility defect in the evidence, not a correctness one: the AC-47 citations were re-verified
> on `47fdeb0c05` by Review and independently by this seat. See §9, **L5**.
>
> `evidence/README.md` records the superseded branch name and needs the same correction; it is the
> verifier's artifact, so it is flagged for routing rather than edited here.

**The client×self oracle is a shared component pair, not an admin-only one.** Both
`src/views/admin/clients/client/profile/index.vue` **and**
`src/views/client/account/profile/index.vue` mount the same
`clientProfileBasicConfigurationComp` + `clientCustomFieldsComp`. The customer-area view passes
only `:client` — no `isDisabled`, no `staged_import`, no aggregate save orchestration — and the
forms gate their extra surface behind `v-if="isAdmin"` /
`<guard :if-client="true" :if-admin="guardFunctionalities">`. This is what makes the staff drops
in `dropped-capabilities.md` genuinely non-client-surface rather than convenient bookkeeping;
the evidence is cited per drop.

## 3. Scope

### 3.1 Cells — ADR-001

Per operator ruling **R1**: the **client actor is the only actor that resolves**. `staff` and
`guest` are `null as never` in every scope matrix, which makes `.as('staff')` a compile-time
error rather than an advertised-but-absent capability (the FE-2824 shape). Staff and guest
surfaces are declared, tracked drops — `dropped-capabilities.md`, dispositions in `parity.yaml`.

**The R1 trap, resolved:** the resolving cell is `ScopeActorTypes.CLIENT`, **not**
`ScopeActorTypes.SELF`. `SELF` is resolved to a concrete actor by the scope builder
(`scope/scope.builder.ts:274` → `resolveSelfActor`) *before* the module factory runs, so `SELF`
maps to `null as never` and `CLIENT` carries the context — exactly
`client-email.types.ts:51-56` and `:75-80`. A matrix that puts the context on `SELF` advertises
a cell that can never resolve.

**One resolving cell per composable — settled (conductor ruling, 2026-08-10).** An earlier draft of
this plan kept `client × on-behalf-of-client` In-scope on the premise that R7's identity seam needed
a second branch to stay live. That premise was wrong, and the reference disproves it:
`client-email` resolves the CLIENT actor to **exactly one** context in each of its two matrices —
`ClientEmailsContextTypes` and `ClientEmailContextTypes` are both **single-member** enums
(`client-email.types.ts:41-44`, `:66-69`) — and its `resolveClientId` seam is live regardless. What
keeps the seam honest is **resolving the id from the scope context instead of hardwiring the session
id**, not having two branches to choose between.

So: **`client × self` is the only resolving cell**, in both modules and in all four composables.
`client × on-behalf-of-client` is dispositioned **`NOT-SUPPORTED`** — the oracle exhibits no
client-acting-for-another-client capability for either surface (evidence of absence in
`parity.yaml`), so no Linear drop is manufactured for it. Every context type names the **entity being
addressed, never its owner** — `client-email`'s own convention
(`ClientEmailContextTypes.EMAIL = "email"`, "the context names the ENTITY, not its owner: the
owning client falls through the same `resolveClientId` seam"). Consequently `.for('client', id)`
exists nowhere in this pair: the actor-retarget is not a named affordance, which is what keeps the
`NOT-SUPPORTED` disposition honest rather than advertised-but-absent. Matrices in `design.md` §2.2
and §3.2; the ruling and its evidence are preserved in `parity.yaml` → `open_tensions[T1]` as
**resolved**.

### 3.2 Module A — `packages/headless/src/modules/client-custom-fields/`

Variant **hybrid**: a query-backed definitions collection plus a machine-backed per-field IMAGE
value editor (the machine is `system-upload`'s existing one, consumed — never re-implemented).

A owns, per **R2**:
- the custom-field **definitions** collection at full `ICustomField` fidelity;
- the **value-semantics contract** — schema generation, uischema generation, per-type coercion,
  required-rule derivation kept narrowable, enum/options handling;
- the custom-field **image value flow**.

A takes contract ownership of `useFieldsSchemaParser` / `useFieldsUischemaParser` /
`useFieldsModelParser` **by re-export, not relocation** (**R4**) — the files stay at
`packages/headless/src/utils/useFields.ts` because `auth/auth.schemas.register.ts` and
`basket-fields/basket-fields.utils.ts` import them and both are outside this run's scope.
`auth/` and `basket-fields/` are not touched.

A **consumes** `system-upload` for the image POST (**R5**) — `system-upload.services.ts:50-51`
already implements `clients/fields/{field_id}/image` and `clients/fields/images`. A owns the
IMAGE *wiring*, not the endpoint.

`mapCustomFieldValue` **relocates into A** from `client-personal-details.mappers.ts:87-106`
(**R2**); it is not barrel-exported today and both call sites are inside B.

### 3.3 Module B — `packages/headless/src/modules/client-personal-details/`

Variant **hybrid**: read half + `dataManagerMachine`-backed editor half. B **keeps
`PUT clients/{id}`** — the profile persist, including the `custom_fields` body key — and
**consumes A's contract** rather than re-deriving value semantics.

### 3.4 Out of scope

- Any edit to `client-email/`, `client-email-history/`, `client-address/`, `client-phone/`,
  `client-company/` (read-only reference).
- Any edit to `packages/headless/**/*.machine.ts` or `**/machines/**` (**R6**). `revert()` is a
  module-level call to `input(baseModel)`; no machine event is added. Verified: `dataManagerMachine`
  exposes `REFRESH`, `SET`, `CLEAR`, `UPDATE` and no `REVERT`
  (`data-manager/data-manager.machine.ts:26-35,93,108-113,195-200`).
- Any edit to `auth/`, `basket-fields/`, `session-store/` (see §7.1 for why the session-store
  route was rejected rather than taken).
- Staff and guest surfaces — `dropped-capabilities.md`.

## 4. The seam contract A publishes and B consumes

Full signatures in `design.md` §4. At requirements level, eleven items:

| Id | A publishes | B consumes for |
| --- | --- | --- |
| A-1 | `CustomField` — definition model at full `ICustomField` fidelity | schema/uischema lookups, read-only projection |
| A-2 | `CustomFieldModel` — the **code-keyed** value record type (the existing empty stub, filled in — `design.md` §0) | the model's `customFields` branch and the request body |
| A-3 | `useCustomFieldsSchema(fields)` (re-export, R4) | `useSchema`'s `customFields` sub-schema |
| A-4 | `useCustomFieldsUischema(fields, i18nKey)` (re-export, R4) | `useUischema`'s custom-field controls |
| A-5 | `useCustomFieldsModel(fields, values)` (re-export, R4) | model seeding |
| A-6 | `mapCustomFieldValue(value, field)` — per-type read coercion (relocated per R2) | value projection |
| A-7 | `mapCustomFieldValuesToRequest(model, baseModel)` — dirty diff, `""`→`null`, code-keyed, empty-diff signal | the `custom_fields` body key |
| A-8 | `resolveFieldByValue(value)` — prefers the **embedded** `ICustomFieldValue.field` | field lookup without A's collection being loaded |
| A-9 | `mapCustomFieldValues(values)` — `ICustomFieldValue[]` → code-keyed record | baseModel seeding |
| A-10 | bounded, error-settling readiness + `service.isAvailable` | B's own readiness, without a poll inside an XState service |
| A-11 | `flushImages()` — dirty IMAGE values become hashes in the code-keyed model, ordered BEFORE the PUT | pre-save step |

## 5. Acceptance criteria

Every AC carries a literal, executable behavioural **Read-back:** — the observable a proving test
asserts. An AC whose read-back names a structure (a filename, an export, a label) rather than a
capability is not planable; none below do. Read-backs run within the standing 30-minute ceiling,
EN / targeted specs, per ADR-021.

**No AC in this bundle is identity-retargeting work.** The A7 clause of
`.claude/rules/verify-reality-check.companion.md` binds to a `.for('client', id)` call — which does
not exist in this pair, because `client × on-behalf-of-client` is `NOT-SUPPORTED` (§3.1) and every
context names an entity rather than an actor. The seam is instead asserted by AC-25 (the
addressability gate) and AC-30 (read and write resolve the SAME id from the ONE seam). If the
retarget cell is ever brought in scope, the A7 read-back — request URL retarget **and** auth
identity transport, never the response payload alone — becomes mandatory for it.

Ids are a single numeric series so `@AC-<n>` tags are machine-checkable by each module's
traceability test. Ranges are disjoint per module: **A = AC-1..AC-25 + AC-27**,
**B = AC-30..AC-57 + AC-59..AC-62 + AC-63**. AC-63 was added after the run closed (a parity
defect the operator found by hand); its id is out of sequence by design, so the gap between AC-62 and
it is not a numbering error.

### 5.1 Module A — definitions collection

**AC-1 — definitions are read from the brand-scoped catalogue.**
`GET custom_fields?filter[object_type]=client&brand_id=<target client's brand>&limit=0&order=order`.
*Read-back:* the recorded outbound request line for a loaded collection carries exactly those four
query params — assert `order=order` literally, and assert **no** `sort` param is present; a fixture
with 8 definitions yields `data.value.length === 8`.

> **Corrected against the oracle (2026-08-10).** An earlier draft of this AC demanded
> `sort=order:asc`. That was a **planner invention** — no oracle sends it. Legacy sends
> `order: "order"` (`customFields.vue:261-267`, the `params` block of `getCustomFields`), and the
> prover's **recorded live capture** shows `order=order&offset=0` succeeding against the real API.
> Per `.claude/rules/verify-parity-oracle.companion.md`, legacy wins over the plan. Recorded here
> rather than silently rewritten so the trail survives — a fabricated request param that reached an
> AC is exactly the class of defect the oracle discipline exists to catch, and it was caught by a
> recorded capture, not by review.

**AC-2 — `brand_id` is sent, and is the TARGET CLIENT's brand, not the session brand.**
Legacy sends `client.brand_id` and re-fetches on brand change
(`customFields.vue:219` `brandId: { handler: "getCustomFields" }`).
*Read-back:* with a target client whose `brand_id` differs from `useBrand()`'s session brand, the
outbound request's `brand_id` equals the **client's**; changing the resolved brand issues a second
request under a different cache key and `data.value` re-resolves to the new brand's definitions.
The **retarget** half is proven on the outbound wire per the A7 clause
(`.claude/rules/verify-reality-check.companion.md`): `.as(CLIENT).for(VALUES, targetId)` addresses
`clients/<targetId>`, on the **session's own** bearer, with **no acting-as header** — an entity
retarget, never an actor swap — and the session client's own id is never addressed. Negative control:
`client-custom-fields.session-hardwired-id.must-fail.patch`, which deletes the `VALUES` arm of
`resolveClientId`, flips this AC RED.

> **⚠️ Lesson for every module in this tranche — a single declared actor does not imply a single
> addressable identity.**
>
> It is tempting to reason that because only one actor resolves (`client`), there is only one identity
> in play, so the FE-2824 retarget mutant cannot go red and the control is "structurally unavailable".
> **That reasoning is wrong, and it was recorded as fact in this bundle before the prover disproved
> it.** If the matrix pairs that actor with an **entity context carrying an id** — here
> `[ScopeActorTypes.CLIENT]: ClientCustomFieldsContextTypes.VALUES` — then
> `.as(CLIENT).for(VALUES, someOtherId)` compiles and **genuinely retargets the request**. The
> identity seam has a live second path whether or not any spec walks it.
>
> The trap is that `.as('self')` leaves `scopeContext` **`undefined`**, so `resolveClientId` takes the
> session arm — which is byte-identical to what a session-hardwiring mutant produces. A suite whose
> every spec is `.as(SELF)` therefore **cannot see** the difference, the mutant stays green, and the
> gap reads as "no second identity exists" rather than "nobody exercised the second identity".
>
> **The rule:** wherever an actor is paired with an id-carrying entity context, the retarget path must
> be **exercised by at least one spec** and its mutant certified red. Otherwise the identity seam goes
> unproven while every gate stays green — the FE-2824 shape wearing a different hat. Applies to
> Module B's `PROFILE` context and to A's `FIELD` context on exactly the same terms. Full record:
> `dropped-capabilities.md` §5 and `parity.yaml` → row `A-client-self` → `negative_control_record`.

**AC-3 — definitions are ordered by `order` ascending, CLIENT-SIDE.**
*Read-back:* a fixture whose rows are returned in a scrambled `order` yields
`map(data.value, 'order')` strictly ascending.

The ordering requirement is real and legacy backs it: `customFieldsView.vue:89-91` sorts the mapped
fields with `orderBy(this.mappedFields, ["order", "asc"])` **after** the fetch. The request-param
half of this AC's original read-back (`sort=order:asc`) is deleted as a planner invention — see
AC-1. Requesting `order=order` (AC-1) does not relieve the module of sorting client-side: the
collection must not rely on server ordering, and this AC is the one that proves it. Being fixed in
code.

**AC-4 — full-fidelity definition mapping.** `hidden`, `user_only`, `editable`,
`display_contexts`, `order` all exist on `ICustomField`
(`packages/types/src/models/brands.ts:146-171`) and are unmapped today
(`client-custom-fields.types.ts:44-56`).
*Read-back:* for a fixture definition with `hidden:true, user_only:true, editable:false, order:3,
display_contexts:{invoice:true,order_form:false}`, the mapped `CustomField` exposes all five with
those values; no mapped field is `undefined`.

**AC-5 — every `ICustomField` permission flag is mapped, and `isReadOnly` / `isDisabled` both derive from `client_readonly`.**

`hidden`, `user_only` and `editable` exist on `ICustomField`
(`packages/types/src/models/brands.ts:146-171`) and were unmapped before this run. They are now
mapped as `isHidden`, `isUserOnly` and `isEditable` — **factual passthroughs of wire data**.

**`isEditable` gates nothing.** For the `client × self` actor, both `isReadOnly` and `isDisabled`
derive from `client_readonly` and therefore **never diverge**. Oracle, verified at vue-app SHA
`ea310f5a42e32b7ae1255c223b77918ef0594286`:

- The client-side disable expression is `customFields.vue:43-44` —
  `:disabled="isDisabled || isProcessing || !canManage || isReadOnly(field)"`.
- `isDisabled` there is a **parent-driven cross-panel processing lock**, dropped as staff scope
  (`dropped-capabilities.md` D13); `isProcessing` is transient local save state; `canManage` is
  `isClient || $userCan('update_client')` (`clientCustomFieldsForm.vue:10`, prop default `true` at
  `customFields.vue:176`), so it is **always true** for a client on their own profile; and
  `isReadOnly(field)` is `field.client_readonly && this.isClient`
  (`customFields.vue:273-275`).
- For `client × self` the whole expression therefore reduces to **`client_readonly`**.
- **`editable` appears NOWHERE in either file** — zero hits in `customFields.vue` and
  `clientCustomFieldsForm.vue` at that SHA. It gates nothing in the oracle.

*Read-back:* for a definition with **`editable: false` and `client_readonly: false`** — the input
that separates the oracle rule from the fabricated one — assert `isDisabled === false` **and**
`isEditable === false`: the field stays **editable by the consumer** while `isEditable` faithfully
reports the wire value. Then assert, across every definition in the fixture regardless of `editable`,
that **`isDisabled === isReadOnly`** and that both equal `client_readonly`. Assert `isHidden`,
`isUserOnly` and `isEditable` each equal their wire field. Finally assert **no consumer-visible
behaviour branches on `isEditable`** — it is data, not a gate. Negative control:
`fabricated-editable-gate` must flip this AC RED.

> **⚠️ Amended 2026-08-13 — this AC previously specified a distinction that does not exist, and it
> is the second instance of L4. Read this before "restoring" a divergence.**
>
> The earlier AC-5 was titled "`isReadOnly` and `isDisabled` no longer collapse to the same flag" and
> its read-back **required them to differ**: "a definition with `client_readonly:false,
> editable:false` yields `isReadOnly === false` and `isDisabled === true`… The two flags differ for at
> least one fixture row." That divergence was **fabricated**. Note what that means: the AC's own
> preamble — "Today both read `client_readonly`" — was describing the **correct** behaviour, and the
> AC instructed the implementation to break it.
>
> **The fabrication chain: one unmeasured claim propagated through THREE artefacts before any of them
> was checked against the oracle.** The conductor's Code-A dispatch asserted "`isReadOnly` and
> `isDisabled` are different things" without establishing what `isDisabled` should be;
> `isDisabled: !raw.editable` was written to satisfy that claim; **this AC was written to specify
> it**; and a test was written to assert it. All three agreed with each other, and none agreed with
> vue-app. **Mutual agreement between spec, code and test is not evidence when they share an author
> upstream** — they were three restatements of one unverified sentence, not three independent checks.
>
> **Why no gate caught it:** the brand's two original definitions both carry `editable: true`, so
> `!editable` and `client_readonly` produced identical results on every recorded fixture — the fifth
> instance in this run of a fixture sitting where both implementations agree (§9, **L6**).
>
> **How it surfaced:** the operator added a TEXT definition with `editable: false`. `!editable` made
> it `isDisabled`, `ClientProfile.vue:10`'s `v-if="!profileField.meta?.isDisabled"` hid the **Edit**
> link, and the field became **unfillable**. Attribution: the originating claim was the conductor's;
> this planner turned it into a specification without asking what witnessed it. Full record:
> `parity.yaml` → row `A-client-self` → `post_gate_defects` **PG-2**; the fix's own reasoning is at
> `client-custom-fields.mappers.ts:51-85`.

**AC-6 — readiness is bounded and settles on error. (JTBD-critical.)** Today `isReady()` is an
uncapped 100 ms `setInterval` that resolves only on `meta.isAvailable`, never on error, never
cleared (`useClientCustomFields.ts:39-48`) — and B awaits it INSIDE an XState service
(`client-personal-details.services.ts:38`), so an unbounded wait hangs B's manager in `loading`
forever.
*Read-back:* three separate assertions, each settling within the spec's own timeout with no fake
timers left running — (a) definitions request rejects 500 → `isReady()` resolves `false`;
(b) session never authenticates → `isReady()` resolves `false` (does not hang);
(c) after `isReady()` settles, no interval or watcher remains (spy on `clearInterval` / the
watcher's stop handle, or assert the module's own teardown counter returns to zero).

**AC-7 — `invalidate()` is restored and scoped to A's own key.** Commented out today
(`useClientCustomFields.ts:163`).
*Read-back:* `invalidate()` then a re-read issues exactly one new `custom_fields` request; a
sibling query registered under `["client"]` alone issues **zero** new requests (the invalidation
is not over-broad).

**AC-8 — client-side definition filtering matches legacy.** Legacy filters the loaded list
in-memory (`customFields.vue:205-215`).
*Read-back:* with 8 loaded definitions and a filter of `{ type: 3 }`, the exposed filtered list
contains exactly the SELECT rows and issues **no** new network request.

**AC-9 — empty state and count.** The customer-area view hides the whole panel on a zero count
(`views/client/account/profile/index.vue:18,24`).
*Read-back:* an empty definitions fixture yields `meta.isEmpty === true` and a count of `0`; a
3-row fixture yields `isEmpty === false` and count `3`.

**AC-10 — `CustomFieldModel` is a real value model.** Today an empty stub
(`client-custom-fields.types.ts:9-13`).
*Read-back:* the type is the code-keyed value record and a round trip
`mapCustomFieldValues(fixtureValues)` → `mapCustomFieldValuesToRequest(model, {})` preserves every
code key present in the fixture (assert on keys, not on the type).

### 5.2 Module A — value semantics

**AC-11 — schema generation is owned by A and required rules stay narrowable.**
*Read-back:* `useCustomFieldsSchema(fields)` for a required NUMBER field yields
`properties.<code>.type === "number"` and `<code>` present in `required`; for a non-required one,
`type` includes `"null"` and `<code>` is absent from `required`. B's `useSchema` then narrows
`required` to the `filterFields` subset and the narrowed array still contains only codes that were
required upstream.

**AC-12 — uischema generation is owned by A.**
*Read-back:* `useCustomFieldsUischema(fields)` emits one `Control` per definition with
`scope === "#/properties/customFields/properties/<code>"`, and an IMAGE definition's control
carries `options.type === "image"` with
`options.field.field_type === "client_custom_field"` and `options.field.field_id === <id>`.

**AC-13 — model parsing is owned by A.**
*Read-back:* `useCustomFieldsModel(fields, {})` seeds every definition's code with its `value` or
`default`, and a code already present in `values` is not overwritten.

**AC-14 — per-type coercion covers all 8 types and never emits a stringified nullish.** Legacy
types: TEXT 1, PASSWORD 2, SELECT 3, SELECT_RADIO 4, TEXTAREA 5, DATE 6, NUMBER 7, IMAGE 8
(`packages/types/src/data/enums/customFields.ts:10-18`). Today DATE is a documented no-op TODO
(`client-personal-details.mappers.ts:93-94`), `String(value)` yields `"undefined"` / `"null"`, and
`Number(undefined)` yields `NaN` (`:104`, `:91`).
*Read-back:* a table-driven spec over all 8 types asserts — DATE coerces to
`BACKEND_DATETIME_FORMAT`; SELECT_RADIO with no value coerces to `false`; NUMBER with `undefined`
yields `undefined` (never `NaN`); TEXT/TEXTAREA/PASSWORD/SELECT with `undefined` or `null` yield
`undefined` (never the strings `"undefined"` / `"null"`); IMAGE passes its hash through unchanged.
Assert the literal absence of `"undefined"` and `"NaN"` in the produced values.

**AC-15 — enum/options handling, including the null option for non-required fields.**
*Read-back:* a non-required SELECT with options `["a","b"]` yields `enum === [null,"a","b"]`; the
same field marked required yields `enum === ["a","b"]`; duplicate and empty option values are
dropped.

**AC-16 — `resolveFieldByValue` prefers the EMBEDDED definition. (JTBD `read`.)** Legacy reads
`fieldObj.field.code` off the value itself (`clientCustomFieldsForm.vue:92-94`, after requesting
`custom_fields.field`); `ICustomFieldValue.field` is typed at `brands.ts:173-178`.
*Read-back:* given a value carrying an embedded `field` and **A's collection deliberately not
loaded** (zero definitions requests issued), `resolveFieldByValue(value)` still returns the
definition and the value projects to its coerced form. Assert the definitions request count is 0.

**AC-17 — read-only display projection.**
*Read-back:* a SELECT value projects to its option **label** (not its raw value); a checkbox value
projects to the yes/no string; an IMAGE value projects to an object carrying a download URL and a
preview source.

### 5.3 Module A — image value flow (R5)

**AC-18 — IMAGE upload runs through `system-upload` and exposes upload state.** Legacy tracks
`isUploading` and a real byte-level `progress` per field
(`customFields.vue:129-130,375-383,417-433`).
*Read-back:* during an in-flight upload the field's `isUploading` is `true` and `progress` is `0`;
once the upload settles successfully `isUploading` is `false` and `progress` is `100`. `progress` is
a **binary `0`/`100`** signal (not-started-or-in-flight / complete) — assert exactly those two
values and **assert no intermediate value is ever observed**. The outbound POST URL is
`clients/fields/<field_id>/image` — assert A issues **no** POST of its own beyond the one
`system-upload` makes (one request total).

> **PARTIAL DELIVERY, declared. Incremental progress is NOT delivered.** An earlier revision of this
> read-back required `progress` to advance "from `0` toward `100`". Nothing in this run builds that,
> and nothing in this run *can*:
>
> 1. the upload transport is `query`'s `doFetch`, which calls the **native `fetch()`**
>    (`query/query.services.ts:50`) — `fetch` exposes no upload-progress hook;
> 2. `system-upload`'s machine defines a `PROGRESS` event handler
>    (`system-upload.machine.ts:75`) but **nothing anywhere in `packages/headless/src` dispatches
>    it** — verified: zero senders;
> 3. `useUpload()`'s return type does not expose the machine's `progress` context field at all, so
>    even a dispatched event would be unreadable by a consumer.
>
> Real byte-level progress needs XHR or streams inside `query` / `system-upload`, both **outside this
> run's write scope** (R5). The developer implemented an honest binary signal and **explicitly
> rejected** interpolating a fake incrementing value on a timer — the right call, since a fabricated
> percentage is indistinguishable from a real one to a consumer, which is worse than an honest
> binary. That reasoning is filed as a `@decision` at
> `client-custom-fields/useClientCustomFieldImage.meta.ts:5-33`.
>
> **Legacy DOES have byte-level progress** (axios `onUploadProgress`, `customFields.vue:375-383`), so
> this is a genuine **parity gap**, not a non-requirement. It is recorded as one in
> `dropped-capabilities.md` §6 with the fix location named — **narrowed openly, never silently**. The
> requirement's intent stays visible above so a reader can see what legacy does, what we deliver, and
> why they differ. No downstream doc or review may describe incremental progress as delivered.

**AC-19 — the image error key is rewritten to `custom_fields.<code>`.** Legacy rewrites the
API's `image` key onto the field's code (`customFields.vue:399-400`).
*Read-back:* an upload rejected with the API's real 422 envelope —

```
{ code, data: null, message, origin: { data: [ { instancePath: "/image", propertyName: "image", … } ] } }
```

— surfaces on the module's error state under the key `custom_fields.<code>`, carrying that entry's
message. Assert the rewrite keys off **`origin.data[].propertyName === "image"`** (equivalently
`instancePath === "/image"`), that the resulting key is `custom_fields.<code>` for the field that was
uploading, and that a consumer never has to read `origin.data` itself to find the field it belongs to.

> **Corrected against a recorded capture (2026-08-10).** The earlier read-back specified
> `error.data.image = ["too large"]` — legacy's **axios** error shape, carried over from
> `customFields.vue:399-400` where `error.response.data.error.data.image` is what gets rewritten.
> This API does not produce that shape: the recorded 422 puts field errors in an **array** under
> `origin.data`, each entry naming its field via `propertyName` / `instancePath`, with top-level
> `data: null`. The **requirement is unchanged and still genuinely unimplemented** — only the assumed
> envelope was wrong. Keying off a shape the API never emits would have produced a test that passes
> against a fixture nobody can record.

**AC-20 — IMAGE download URL and preview.**
*Read-back:* a field whose value is a stored hash exposes a non-empty download URL and preview
source derived from that hash; clearing the value empties both.

**AC-21 — images flush BEFORE the profile PUT, and the hash lands in the value model.** Legacy
order is `await uploadCustomImages(); await updateCustomFields();`
(`clientCustomFieldsForm.vue:109-110`), and the upload's returned value is written into
`custom_fields[code]` (`customFields.vue:389`).
*Read-back:* on a save with one dirty IMAGE, the recorded request sequence is
`POST clients/fields/<id>/image` **then** `PUT clients/{id}`, in that order, and the PUT body's
`custom_fields.<code>` equals the hash the POST returned. Assert on request ORDER, not just
presence.

**AC-22 — only changed images upload.** Legacy filters to images whose hash differs from the
current model value (`customFields.vue:349-356`).
*Read-back:* with two IMAGE fields, one dirty and one untouched, exactly **one** POST is issued.

### 5.4 Module A — request shape, identity, surface

**AC-23 — the `custom_fields` request body is an object keyed by CODE. (S-1 / R3.)** Both oracles
agree: legacy sends `{ custom_fields: this.customFieldsValues }` where the values object is keyed
by `fieldObj.field.code` (`clientCustomFieldsForm.vue:93,131-136`), and current headless does the
same (`client-custom-fields.services.ts` / `client-personal-details.mappers.ts:116`). The
foundation doc claiming an array of `{field_id, value}` is **wrong**
(`packages/headless/src/modules/client/docs/foundation.md:111`, `:1050`, `:1057`).
*Read-back:* the recorded `PUT clients/{id}` body's `custom_fields` is a JSON **object** whose keys
are field codes — assert `Array.isArray(body.custom_fields) === false` and that its keys equal the
dirty field codes.

**AC-24 — `""` coerces to `null` so a value can be CLEARED. (JTBD `manage`.)** Legacy
`mapValues(differences, v => v === "" ? null : v)` (`clientCustomFieldsForm.vue:78-80`).
*Read-back:* editing a populated field to the empty string produces a PUT whose
`custom_fields.<code>` is JSON `null` (present, not omitted); re-reading afterwards yields an empty
value.

**AC-25 — the addressability predicate is single-sourced and gates the wire.**
*Read-back:* an unauthenticated scope issues **zero** requests and `meta.isAvailable === false`;
a forced `refresh()` on that scope rejects with the typed not-authenticated error rather than
producing a 401 request. `meta.isAvailable` and the request gate flip together in the same tick.

**AC-27 — the barrel is the only public surface.** Today `index.ts:1-3` uses `export *`.
*Read-back:* importing `client-custom-fields.services` / `.mappers` / `.schemas` from outside the
module fails the module-visibility lint, the barrel exports no `*`, and each internal file's line 1
carries the `@internal` marker.

### 5.5 Module B — read half

**AC-30 — the read half resolves its target client through the identity seam, not the session
singleton.** Today the read path is a `computed` over `useActiveSession().useContext().activeUser`
(`usePersonalDetails.ts:39-42`) and the write path hardwires
`sessionId` (`client-personal-details.services.ts:89,94`) — the FE-2824 shape. Legacy takes the id
as a caller argument (`store/modules/data/clients/index.ts:316-327`).
*Read-back:* `.for('profile', id)` — the **entity** context, not an actor retarget — makes both the
read request URL and the subsequent PUT URL carry that same `id`, resolved by the ONE seam; with no
context, both carry the session client's id. Assert the read URL and the write URL are the same
`clients/<id>` in both configurations, so read and write cannot address different clients. Assert
additionally that the read returns values while `activeUser.customFields` is `undefined`, which is
what proves the read is a query and not the old session projection.

**AC-31 — the read half is a real query with settled and error states.**
*Read-back:* a 500 on the read yields `meta.hasError === true` and a populated `error`, and
`isReady()` resolves `false` — with no unbounded wait (see AC-40).

**AC-32 — projected fields carry real permission metadata: custom fields from `client_readonly`, natives uniformly editable.**

*Read-back:* for a **`client_readonly: true`** custom field the projected entry reports
`isReadOnly === true` **and** `isDisabled === true`; for a `client_readonly: false` custom field both
are `false`. **All four native entries** (`firstName`, `lastName`, `publicName`, `language`) report
`isReadOnly === false` and `isDisabled === false` **in every case** — assert this holds even in the
same fixture as a read-only custom field, which is the real, oracle-witnessed asymmetry: custom-field
flags vary with `client_readonly`, native flags are constant for this actor. Also assert
`isCustomField` distinguishes the two groups and that `isRequired` on a custom field equals its
definition's `required`.

Oracle for the native constant, verified at vue-app SHA
`ea310f5a42e32b7ae1255c223b77918ef0594286` — the four native inputs share one disable expression,
`:disabled="isDisabled || isStaged || isProcessing || !canUpdate"`
(`clientProfileBasicConfigurationForm.vue:53-55` firstname, `:69-71` lastname, `:86-88` public_name,
`:102-104` language), and **for `client × self` every term in it is out of scope or transient**:
`isDisabled` is the cross-panel processing lock (dropped, D13), `isStaged` the staged-import lock
(dropped, D8), `canUpdate` is `$userCan("update_client")` (dropped staff gate, D7 — the client branch
of `<guard :if-client="true" :if-admin="…">` at `:3` does not consult it), and `isProcessing` is local
save state, not a field permission. **The oracle exposes no per-native-field permission flag**, so
`false` is the correct projection — not a placeholder.

> **Amended 2026-08-13 — same fabricated-divergence shape as AC-5, found by the sweep that AC-5's
> correction prompted.** The earlier read-back required "native fields report the values the module
> actually derives, and **at least one projected field differs from another in these flags**". Two
> defects in one sentence:
>
> 1. **"the values the module actually derives"** takes its expectation from the implementation — §9
>    **L3** exactly.
> 2. **"at least one projected field differs from another"** demanded a divergence *within* the flag
>    set with no oracle citation for it — §9 **L4**/**L6**. Worse, the AC's premise called the
>    hardcoded `isReadOnly:false, isDisabled:false` on natives a defect (G-13). Verified against the
>    oracle above: for `client × self` that projection is **correct**, because every gate legacy
>    applies to a native input belongs to a dropped staff cell. The AC was pushing the implementation
>    toward inventing a native permission flag the oracle does not have.
>
> The genuine content is retained and sharpened: **custom-field** entries must carry their
> definition's real flags rather than hardcoded `false`, and the custom-vs-native asymmetry is
> asserted — because *that* difference is witnessed.

**AC-33 — the collection exposes the language ID the model holds, not the display name.** Today
the collection emits the language NAME (`client-personal-details.mappers.ts:62`) while the model
holds the ID (`client-personal-details.types.ts:11`).
*Read-back:* for a client whose `language` is `<id>`, the projected `language` entry carries
`<id>` as its value and the human-readable name as its display/title — the value round-trips
through `input()` unchanged.

**AC-34 — the language list is the TARGET CLIENT's brand's list.** Today `useBrand()` supplies
the session brand's languages (`usePersonalDetailsManager.ts:49`).
*Read-back:* with a target client on brand X and a session on brand Y (different language sets),
the schema's `language.enum` equals brand X's language ids.

**AC-35 — an unknown current language survives as a disabled option, labelled by NAME.** Legacy
keeps a `langDoesNotExist` fallback option whose **value** is the client's language id
(`clientProfileBasicConfigurationForm.vue:111`) but whose **label** is `missingLanguageName` — the
language's name, resolved from the FULL language list rather than the brand-restricted one, falling
back to `""` (`:244-248`, `:113`).
*Read-back:* a client whose `language` id is absent from the brand list still gets a
**disabled** option carrying that **id as its value** and the language's **human-readable name as
its label**, resolved from the full language list; `input()` does not silently blank the field.
Assert the label is **not** the raw id — a UUID must never reach the rendered label.

> **Amended (2026-08-11).** The earlier read-back said the fallback "renders **that id**", which
> would have specified a raw UUID in the display. That is the same defect class the verifier caught
> on the main language field (raw UUID rendered where legacy renders the name), and the oracle is
> explicit: the id is the option's `value`, `missingLanguageName` is what the user sees. AC-33 already
> had this split right (id as value, name as display/title); this AC now matches it.

**AC-63 — the read surface enumerates the brand's DEFINITIONS and left-joins the client's values. (Post-gate parity defect; id out of sequence because it was added after the run closed.)**

Legacy is **definition-driven**, verified at vue-app SHA `ea310f5a42e32b7ae1255c223b77918ef0594286`
(pin by SHA, not branch — §2):

- The client profile page mounts `customFields.vue` — the combined read/edit surface. **Not**
  `customFieldsView.vue`, which is invoice/order-only.
- It fetches the brand's definitions with
  `filter[object_type]=client&brand_id=…&limit=0&order=order` (`customFields.vue:265-267`).
- It renders **every** definition returned: the template's loop is
  `v-for="(field, index) in filteredCustomFields"` (`customFields.vue:10`) — over definitions, never
  over values — joining a value in where one exists.
- **No visibility filter is applied.** `clientCustomFieldsForm.vue:4-22` mounts `<custom-fields>`
  passing **no `filters` prop**, and the prop's default is `null` (`customFields.vue:183-186`), so
  `filteredCustomFields` (`:204-215`) short-circuits to the unfiltered list. **Do not add a
  `hidden` / `user_only` filter to this surface** — the oracle does not have one, and "helpfully"
  adding one is the failure this citation exists to prevent.
- `client_readonly` affects the **edit** surface only: `isReadOnly(field)`
  (`customFields.vue:273-274`) appears solely in `:disabled` bindings and in the required-asterisk
  expression, never in a `v-if`. It **never hides a row**.

*Read-back:* **for a client whose `custom_fields` is EMPTY** — the input that separates the two
implementations — the read surface still renders **one row per brand definition**, each carrying the
type's empty value, plus the four native rows. Concretely, with a definitions fixture of N
definitions and a client record whose `custom_fields` is `[]`: assert `data.value` has
`4 + N` entries; assert the N custom-field rows' codes equal the definitions' codes; assert a
`GET custom_fields?filter[object_type]=client&brand_id=…&limit=0&order=order` **was issued** (the
value-driven implementation issued none at all); and assert the custom-field rows appear in the
definitions' own `order`. Then repeat with a client that *has* values and assert the same `4 + N`
shape with the values joined in — the two cases together are the proof, because the second alone
cannot distinguish definition-driven from value-driven rendering.

Additional assertions:

- **Natives unaffected:** the four native rows (`firstName`, `lastName`, `publicName`, `language`)
  render identically in both cases, before the custom-field rows.
- **Degrades, never blanks:** when the definitions load **fails**, the four native rows still render
  and the failure is reachable via `useContext().error` — assert both. A definitions failure must not
  blank the profile.
- **Empty definition set:** zero definitions yields the four native rows and no custom-field rows
  (the consumer renders its own empty state — legacy's `#noResults` slot,
  `clientCustomFieldsForm.vue:15-21`, is keyed to the **definitions** list being empty, never to the
  values being empty).

**What the fix must PRESERVE — enumeration and resolution are different needs, and both exist:**

- `resolveFieldByValue`'s **embedded-definition preference** (AC-16, seam A-8) still short-circuits
  for a value that carries its own `field` — that path must not be removed in favour of the
  definitions collection, and AC-16's "collection deliberately not loaded" read-back still holds.
- A value whose `field_id` is **not** among the returned definitions still renders, via its embedded
  field. Assert it: a client record carrying a value for a definition absent from the brand's current
  catalogue produces a row for it. (Delivered as the `remainderFields` pass —
  `client-personal-details.mappers.ts:162-165`, keyed off a `definedFieldIds` set — alongside the
  definition-driven map at `:212-213`.)

> **Why this shipped through six gates, 13 certified mutants, and a PRESENT verify.** The prior
> implementation reduced over `record.customFieldValues` — **value-driven** — so a client with zero
> value entries got zero rows, and the module never learned which definitions the brand has (it
> issued no `GET /custom_fields` at all). **Every recorded fixture was captured against a staging
> client that had entries for both of this brand's definitions**, and against that data
> value-driven and definition-driven rendering are **byte-identical**. No assertion in the bundle
> covered the read surface *enumerating* definitions: AC-30 covers the identity seam and that the
> read is a query; AC-17 covers projecting a value that exists; §5.2's "seeds every definition's
> code" is the **editor's** model seeding, not the read surface. The fork is visible only on a client
> with an empty `custom_fields[]`, and no fixture held one.
>
> **The operator found it by opening a different client in the running app, in about a minute.** See
> §9, lesson **L6** — this is the fourth instance of the same family, and the reason L6 is written as
> a habit rather than another instance.

### 5.6 Module B — write half (the JTBD's own verb)

**AC-45 — the update body is diff-only, and an empty diff is a no-op. (G-3, JTBD-critical.)**
Today the whole model is sent every time (`client-personal-details.mappers.ts:108-120`). Legacy
diffs against the initial form (`clientProfileBasicConfigurationForm.vue:261-269`) and
short-circuits an empty diff (`:395` `if (_.isEmpty(this.formValues)) return Promise.resolve();`).
*Read-back:* (a) changing only `firstName` produces a PUT body whose keys are exactly
`["firstname"]`; (b) calling save with nothing dirty issues **zero** requests and resolves
successfully.

**AC-46 — a custom-field value can be CLEARED. (G-4, JTBD-critical.)** Today
`omitBy(data.customFields, isNil)` strips the very nulls that clear
(`client-personal-details.mappers.ts:116`).
*Read-back:* clearing a populated custom field produces a PUT whose
`custom_fields.<code>` is present and JSON `null`; assert the key IS in the body (`'code' in
body.custom_fields === true`) and its value is `null`.

**AC-47 — a native field can be cleared and falsy values are never silently dropped. (G-5.)**
Today `omitBy({...}, isEmpty)` kills `""`, `false` and `0`
(`client-personal-details.mappers.ts:109,117`).
*Read-back:* setting `publicName` to `""` produces a PUT containing **exactly** `public_name: ""` —
the empty string, **not** `null`, and never omitted; a `false` and a `0` custom-field value both
appear in the body.

**The clear value is split by field kind, and the oracle decides each:**

| Field kind | Cleared value on the wire | Oracle |
| --- | --- | --- |
| **Native** (`firstname`, `lastname`, `public_name`) | `""` | `clientProfileBasicConfigurationForm.vue:260-269` — `formValues()` is `omitBy(this.form, (v, k) => this.initForm()[k] === v)`. The predicate omits **unchanged** keys and **never transforms a value**, so a blanked input reaches the wire as `""`. |
| **Custom field** (`custom_fields.<code>`) | `null` | `clientCustomFieldsForm.vue:78-80` — `mapValues(differences, fieldValue => fieldValue === "" ? null : fieldValue)`. The `""`→`null` normalisation exists **only** here — verified as the single occurrence across both forms. |

Corroborated verbatim by the recorded captures: `put-clients-id-case-native-falsy.json` request body is
`{"public_name": ""}`; `put-clients-id-case-clear-custom-field.json` is
`{"custom_fields": {"age": null}}` (both under
`client-personal-details/__tests__/fixtures/`). AC-46 governs the custom-field half and already names
`null` unambiguously.

> **Amended (2026-08-11): the either/or is removed, and it is why this slipped.** The earlier
> read-back accepted `""` **or** `null` for natives — "one of the two, asserted explicitly". That is a
> spec that **cannot be violated**: the code shipped `null`, a test asserted `null`, it passed, and the
> only recorded capture for that case had recorded `""`. **MSW replays its stubbed response regardless
> of the request body**, so a green integration test against a genuinely recorded fixture proved
> nothing about the request it appeared to prove. An either/or read-back is the AC-level form of a
> control that cannot go red (§9, **L2**) — the latitude, not the assertion, was the defect.

> **⚠️ AC-46 and AC-47 were once declared delivered while broken end-to-end. Read this before
> proving them. (Review blocker 1, 2026-08-11.)**
>
> The clear path shipped **writing an empty PUT body that reported success**. The chain:
> `compactDeep` (`utils/isDeepEmpty.ts:27` — `if (isString(value)) return !isEmpty(value)`) treats
> `""` as non-meaningful and **omits the key entirely**, so a cleared field reached the mapper
> **absent** rather than as `""`/`null`; `mapIProfileFields` then set `diff.firstname = undefined`;
> the empty-diff short-circuit did not fire because `Object.keys(diff).length === 1`; and
> `JSON.stringify` dropped the `undefined`. Net effect: `PUT {}`, HTTP 200, nothing changed, green
> suite. Both of these ACs are `jtbd_carried_must_fix` rows — the JTBD's own verb — and both were
> certified.
>
> **Why every existing control missed it.** The unit tests **hand-built** the model they fed to
> `mapIProfileFields` — an input shape the real pipeline **cannot produce**, because `compactDeep`
> strips it upstream first. The mutants mutated `mapIProfileFields` itself, so they went red against
> those same hand-built models and stayed **green about the actual defect**: nothing was testing that
> anything real ever *reaches* the mapper.
>
> **So prove these two ACs from the consumer surface inward** — drive `input()` / `update()` on the
> composable with a cleared field and assert on the **recorded outbound request body**, never on a
> mapper called with a hand-authored argument. A mapper-level unit test is fine as a *supplement*; it
> is not evidence for AC-46 or AC-47. See §9, lesson L2.

**AC-48 — `document_language_id` is sent only when the interface language changed. (G-6.)** Today
it is sent unconditionally (`client-personal-details.mappers.ts:115`). Legacy sets it only on
change (`clientProfileBasicConfigurationForm.vue:265-266`).
*Read-back:* changing only `firstName` produces a body with **no** `document_language_id` key;
changing the language produces a body carrying both `interface_language_id` and
`document_language_id`, equal to each other.

**AC-49 — the body carries only the client-surface keys.** Legacy's diff baseline picks `email`
so a stale email never re-submits (`clientProfileBasicConfigurationForm.vue:344-350`), and
`number` / `created_at` / `notifications_disabled` are admin-only (`:125-163`, inside
`v-if="isAdmin"`).
*Read-back:* a save of every editable client-surface field produces a body whose key set is a
subset of `{firstname, lastname, public_name, interface_language_id, document_language_id,
custom_fields}` — assert `email`, `number`, `created_at` and `notifications_disabled` are each
absent.

**AC-50 — `revert()` restores the base model without a machine change. (G-12 / R6.)**
*Read-back:* after two dirty edits, `revert()` leaves `model` deep-equal to `baseModel` and
`meta.isDirty === false`; the machine's event list is unchanged (no `REVERT` event exists) and the
revert is observably a `SET`-shaped transition through `available.checking`.

**AC-51 — validation is typed and rejects with the field errors.** Today `validate` is typed
`Partial<any>` (`client-personal-details.services.ts:153`).
*Read-back:* clearing a required custom field makes `update()` reject before any request is issued
(assert request count 0) with the AJV error list reaching the consumer's `errors` keyed by the
field's schema path.

**AC-52 — invalidation after save is scoped, and the mutation key matches the query key.** Today
`invalidateQueryByKey(["client"], {exact:false})` is over-broad and the `mutationKey` does not
match the `queryKey` (`client-personal-details.services.ts:28,93,99`).
*Read-back:* a successful save issues exactly one refetch of this module's own key; a query
registered under an unrelated `["client", "somethingElse"]` key issues zero refetches.

### 5.7 Module B — lifecycle, wiring, surface

**AC-40 — B's readiness never waits inside an XState service, and is bounded. (G-15/G-16.)** Today
`loadLookups` awaits A's unbounded poll (`client-personal-details.services.ts:38`) and `isReady`
uses `waitFor(..., {timeout: Infinity})` (`usePersonalDetailsManager.ts:90`).
*Read-back:* with the definitions request failing, `isReady()` resolves `false` and the machine
leaves `loading` (assert its state is not `loading` after settle); no `Infinity` timeout remains
and the spec completes without hitting its own timeout.

**AC-41 — a cold boot resolves late without losing the target. (JTBD `read`.)**
*Read-back:* constructing the composable before the session resolves, then resolving it, produces
exactly one read request against the resolved client id, and `data` populates; constructing after
resolution also produces exactly one. No request is issued with `undefined` in the URL — assert no
recorded URL contains the substring `undefined`.

**AC-42 — no unmanaged side effect and no swallowed rejection. (G-17/G-22.)** Today an async
executor swallows rejections (`usePersonalDetails.ts:29-33`) and a bare
`sessionReady().then()` fires an unmanaged send (`usePersonalDetailsManager.ts:75-82`).
*Read-back:* a rejected session readiness surfaces as a resolved `false` from `isReady()` **and**
produces no unhandled rejection (assert the spec's unhandled-rejection hook records none); after
`stop()`, a late session resolution sends nothing (assert zero further requests and no state
transition).

**AC-43 — the manager is callable bare. (G-21.)** Today the destructured parameter has no `= {}`
(`usePersonalDetailsManager.ts:39-45`).
*Read-back:* calling the manager with no argument constructs and reaches a settled state rather
than throwing.

**AC-44 — no direct `vue-i18n` import remains. (G-23 / ADR-028.)** Today
`usePersonalDetailsManager.ts:3` imports `vue-i18n` directly — the straggler named by path in
`docs/adr/028-headless-vanilla-core-split.md:36,83`.
*Read-back:* a grep-shaped assertion in the module's own surface spec finds zero
`from "vue-i18n"` imports under the module, and a translated error message still arrives through
the `system-localisation` wrapper (assert the message text, so the swap is behaviour-preserving).
ADR-028's straggler list is updated in the same change.

**AC-53 — `parse()` does real work or is honestly absent. (G-18.)** Today it is a no-op over ~30
commented-out lines (`client-personal-details.services.ts:114-150`).
*Read-back:* `input()` with a model containing an out-of-schema key yields a `model` with that key
removed, proving the parse step ran; the commented block is gone.

**AC-54 — the client-id gate holds the machine until an id exists. (G-25.)**
*Read-back:* the machine constructed with no client id **stays in `subscribing`** and issues
**zero** requests; the moment an id arrives it transitions to `loading` and fires **exactly once
from its own read path**. Scope the count to **this machine's own read** — B's
`["client", <id>, "record"]` cache entry — **not** to every `GET clients/<id>` observed on the wire.
Assert both states, and assert the count against B's own key only.

> **Amended (2026-08-11): the unscoped "exactly one request" was wrong.** It counted every
> `GET clients/<id>` on the wire, so it could only ever pass where a single one of the two read paths
> ran — an artefact of the surface under test, not a property of this machine.
>
> **The mechanism, verified from source (this is what the scoping rests on — not a request count).**
> Two modules read the same resource under **two distinct cache keys**, so their reads **cannot be
> shared**: A resolves `brand_id` through `useQuery().get` with `queryKey: ["client", id, "record"]`
> (`client-custom-fields.services.ts:185`), and `get()` **appends a `{locale}` segment** because that
> read does not pass `withoutLocale` (`query/useQuery.ts:262`); B's reactive `loadProfile()` uses a raw
> `vueUseQuery` key **without** it. Different keys, different entries — and always were.
>
> **Why they are not merged, and must not be:** `useQuery` applies `select` **inside** `queryFn`
> (`query/useQuery.ts:1012-1017`), so an entry stores the **selected** projection, not the raw
> response. A shared key would be **poisoned by whichever fetch won the race** — A's bare `brand_id`
> string into B's `select: mapProfile`, or B's full `IClient` where A expects a brand id. Module A
> **rejected** byte-identical keys on exactly this basis, calling it "UNSAFE, not just unrealised"
> (`client-custom-fields.services.ts:149-165`).
>
> **So the count is scoped to this machine's own read path on purpose.** A sibling module's
> independent read is not this machine's request and must not be counted against it — an assertion
> over every GET makes a correct, deliberate design look like a regression, and pressures a future
> reader into collapsing the two entries into one poisoned one.
>
> **How many reads a real boot issues is CONTESTED and deliberately not asserted here.** The verifier
> **measured one** at the browser network layer (`evidence/07-gaps-and-limits.md` **G3**); AC-54's own
> integration spec observed two; an earlier revision of this note claimed "two per boot" on a figure
> that was **reported, not measured**. Settling it needs a count at the **service seam**, not the
> network — deferred to post-commit verification. Tracked as `dropped-capabilities.md` §6 (**G-P2**);
> see §9 lesson **L4**. Do not quote a per-boot number until G3 is settled.

> **Amended: the guard-name clause is deleted (2026-08-10).** The earlier read-back required "a
> snapshot of the config's guard keys contains no `hasSubscription`". That is **unsatisfiable without
> regressing three other ACs**, and Module B's developer flagged it rather than building around it.
>
> The key name is **dictated by protected core**: `data-manager/data-manager.machine.ts:25` is
> `always: { target: "loading", cond: "hasSubscription" }`, so the machine looks up that exact string
> and a `withConfig({ guards })` override only binds under it. Rename it in the module and the
> override silently stops applying — the machine falls through to its own default at
> `data-manager.machine.ts:265-266`, which is `hasSubscription: (_context, _event) => true`,
> **unconditionally true**. `subscribing` would then take its `always` transition immediately and fire
> `loadLookups` with **no client id**, i.e. an unaddressed request on every construction — regressing
> AC-40, AC-41 and AC-42.
>
> The mandated R7 reference keeps the key for the same reason
> (`client-email/useClientEmailManager.machine.ts:86`), and `**/*.machine.ts` is protected core
> (R6) — so the name cannot be changed at its source either. G-25's complaint (a guard called
> `hasSubscription` when it guards a client id) is therefore a **naming defect owned by the shared
> machine, not by this module**; it is recorded, not worked around. Worth a follow-up issue against
> `data-manager` at the operator's discretion. What this AC can and does hold the module to is the
> behaviour the guard exists to produce.

**AC-55 — names no longer collide or diverge. (G-26.)** Today a lowercase type alias
`usePersonalDetailsManager` shadows the const (`usePersonalDetailsManager.ts:255-257`) and
`UseProfileDetails` / `useProfileDetails*` diverge from the module name.
*Read-back:* the module's public type names are `UsePersonalDetails` / `UsePersonalDetailsManager`
(PascalCase, no shadowing) and a consumer can annotate a variable with each without a type/value
resolution error.

**AC-56 — docstrings describe THIS module. (G-27.)**
*Read-back:* the module's own surface spec asserts no docstring in the module mentions phone,
address or basket.

**AC-57 — the empty stub and the missing `@internal` marker are gone. (G-28/G-29.)**
*Read-back:* `client-personal-details.utils.ts` either carries real used code or does not exist,
and every internal file's line 1 carries `@internal` (asserted by the module-visibility lint, not
by eye).

**AC-59 — B consumes A's contract rather than re-deriving it. (R2.)**
*Read-back:* B's `custom_fields` body for a mixed edit is byte-identical to
`mapCustomFieldValuesToRequest(model, baseModel)` called directly from A; B contains no local
per-type coercion (asserted by the absence of a second coercion implementation reachable from B's
surface — flip A's coercion for one type in a must-fail patch and B's assertion must go RED).

**AC-60 — the client-side playground consumers keep working.**
`ClientProfile.vue:33,49` destructures `data, isReady`; `ClientProfileFieldsEdit.vue:34,66`
destructures `errors, meta, model, schema, uischema, update, input, clear, isReady, stop`.
*Read-back:* both pages render, `await isReady()` resolves, the profile list shows the client's
values, and an edit-then-apply on a custom field issues the PUT and returns to the profile page.

**AC-61 — the admin playground routes no longer advertise an unsupported cell.** See `design.md`
§8 for the ruling.
*Read-back:* navigating to `admin.account.profile` / `admin.account.profile.edit` does not mount a
`usePersonalDetails*` consumer that silently reads the session's own client while presenting as
staff — the route is absent, or renders the declared not-supported notice. Assert the rendered
outcome, not the route table.

**AC-62 — the glossary and the corrected foundation doc land with the code.**
*Read-back:* `docs/corpus/glossary.yaml` resolves a `custom field` term and a `personal details`
term (with `profile` as an alias) through the corpus lint; the three wrong request-shape claims in
`packages/headless/src/modules/client/docs/foundation.md` (`:111`, `:1050`, `:1057`) read as a
code-keyed object, while the correct READ-side claims (`:14`, `:73`, `:98-102`, `:282`, `:1049`,
`:1114`) are unchanged.

## 6. Non-goals for the ACs above

- No AC grades a filename, an export list, or a label on its own. AC-27, AC-57 and AC-62 are
  structural in subject but their read-backs are enforced by a lint or a resolver, i.e. executable.
- No AC is satisfiable by the module's own test-mode divergence. The only sanctioned PROD-path
  divergence in this repo is the FE-2865 `useTestAttrs` carve-out; neither module uses it.

## 7. Contradictions surfaced (JTBD vs. what the code can do)

### 7.1 The read verb is not degraded — it is absent. `SessionUser.customFields` is never populated.

`session-store.types.ts:103` declares `customFields?: IClient["custom_fields"]`, but
`mapSessionUser` (`session-store.mappers.ts:53-88`) **never assigns it**, and `/self`'s `with`
list (`session-store.services.ts:41-58`) does not request `custom_fields` or
`custom_fields.field`. Therefore `activeUser.customFields` is **always `undefined`** today, which
means:

- `usePersonalDetails().data` projects every custom field through
  `mapCustomFieldValue(undefined, field)` → the default branch `String(undefined)` → the literal
  string **`"undefined"`** (`client-personal-details.mappers.ts:77,104`);
- `loadLookups`'s reduce over `client.value?.customFields || []` always yields `{}`
  (`client-personal-details.services.ts:39-56`), so the editor's `baseModel.customFields` is
  always empty and no existing value is ever shown.

**A consumer cannot read a single custom-field value today.** This is the JTBD's first verb,
absent — not a coercion bug. It is why `design.md` §5 rules B's read half into a real query rather
than keeping the `computed` projection: the projection's source is structurally empty. The
rejected alternative (extend `/self`'s `with` list + the session mapper) is recorded there with
its reason.

### 7.2 R3's doc correction is narrower than stated, and correcting it wholesale would introduce a new error.

R3 names `foundation.md:104-112` and `:281-282`. Verified against the oracle: the **request**
shape claims are wrong — `:111` (`custom_fields?: Array<{field_id, value}>`), `:1050` (the mermaid
PUT body), `:1057` ("the supplied `field_id`s"). The **response/read** shape claims are *correct*
— `:14`, `:73`, `:98-102`, `:282`, `:1049`, `:1114` all describe the client record's
`custom_fields` array of `{field_id, value, field?}`, which is exactly what
`ICustomFieldValue` is (`brands.ts:173-178`) and exactly what legacy reads
(`clientCustomFieldsForm.vue:92-94`). R3's intent is implemented in full; the edit is scoped to
the three write-shape lines so the correction does not break the read-side documentation. Recorded
as task T-A9 in `tasks.md`.

## 8. Traceability

| Artifact | Path |
| --- | --- |
| Requirements | `docs/sdd/client-custom-field-values/requirements.md` (this file) |
| Design | `docs/sdd/client-custom-field-values/design.md` |
| Tasks | `docs/sdd/client-custom-field-values/tasks.md` |
| Parity + arms | `docs/sdd/client-custom-field-values/parity.yaml` |
| Drops (paste-ready) | `docs/sdd/client-custom-field-values/dropped-capabilities.md` |
| Verification evidence (verifier seat — **cross-reference, never duplicate**) | `docs/sdd/client-custom-field-values/evidence/` — 8 files; `07-gaps-and-limits.md` is the authority on open gaps, incl. **G3** (the G-P2 count tension) |
| A's feature (BDD dispatch) | `packages/headless/src/modules/client-custom-fields/__tests__/client-custom-fields.feature` — **26 scenarios** |
| B's feature (BDD dispatch) | `packages/headless/src/modules/client-personal-details/__tests__/client-personal-details.feature` — **29 scenarios; AC-63 owes a 30th** |

**The features are CO-LOCATED and are the SOLE source of truth.** There is no SDD copy: an earlier
draft of this plan created `docs/sdd/client-custom-fields/` and `docs/sdd/client-personal-details/`
as empty homes for them, and those directories are deleted (conductor ruling, 2026-08-10). Two
reasons: a duplicated feature is a second source of truth that can silently drift from the first, and
an SDD-tree copy is not reliably present in CI — `.gitignore:67` ignores `docs/sdd/*`, with **this bundle** re-included by the `!docs/sdd/client-custom-field-values/` negation at `:72` (operator ruling); every OTHER bundle stays ignored, so a test must never depend on that
path. (When the co-location ruling was taken, the whole tree was ignored; the negation came later and
does not change the ruling.)

The `.feature` files are authored by a separate BDD dispatch, not by this plan. Each module's
traceability test therefore reads **only** its co-located feature and enforces the AC↔test link in
both directions — see `tasks.md` T-A11 and T-B14 for the three assertions, and for the warning
against copying `client-email.traceability.test.ts:38-40,95-103`, whose SDD-source assertion cannot
pass in CI.

Scenario counts above are the feature files' totals. They are **not** required to equal the AC counts
(§5: 26 for A, 29 for B once AC-63's scenario lands) — one AC may be covered by more than one scenario, which is why B carries 29
scenarios over 28 ACs. What IS required is that the set of distinct `@AC-<n>` tags equals the module's
AC set exactly.

## 9. Lessons for the next converter — the proof and the production path must meet

Six defects in this run shared one root: **an artefact that looked like evidence but was never
checked against the thing it claimed.** L1–L3 are controls that never touched the path that ships;
L4 is a figure that was never measured; L5 is a reference that was never pinned; **L6 is the habit
that catches the whole class, and the one to keep if only one survives.** They are recorded together because the next converter will
meet the same family, and because each was caught by a *different* mechanism — none of them by the
green suite.

### L1 — A single declared actor does not imply a single addressable identity

If the scope matrix pairs the one resolving actor with an **entity context carrying an id**, the
retarget path is **live** and must be **exercised**. `.as('self')` leaves `scopeContext` `undefined`,
so the seam takes its session arm — byte-identical to what a session-hardwiring mutant produces. A
suite of only `.as(SELF)` specs therefore cannot see that mutant, and the gap reads as "no second
identity exists" rather than "nobody walked the second identity".

- **Full record:** AC-2; `dropped-capabilities.md` §5; `parity.yaml` → `negative_control_record`.
- **Caught by:** a prover writing the driving spec that this plan had wrongly declared impossible.

### L2 — A unit test that hand-builds an input its own pipeline cannot produce proves nothing about the pipeline

Corollary: **a mutant that only mutates the unit under test cannot detect that nothing feeds that
unit.** AC-46/AC-47 shipped an empty PUT that reported success — `compactDeep`
(`utils/isDeepEmpty.ts:27`) omitted the cleared key upstream, so the mapper was never reached with
the shape its own tests fed it by hand. Both mapper-level mutants went red against those hand-built
models and stayed **green about the real defect**.

- **The rule:** for any AC whose subject is a **wire effect**, the read-back drives the **consumer
  surface** and asserts the **recorded request**. Mapper-level unit tests supplement; they never
  certify.
- **Full record:** the AC-46/AC-47 call-out in §5.6.
- **Caught by:** code review — no test in the suite could see it.

### L3 — A contract derived from observation rather than from an AC certifies whatever the code does

If a test's expectation is written by reading the implementation's current output, it cannot fail for
the reason it exists. Derive the expectation from the **AC and the oracle**, then let the code
disagree.

- **Caught by:** review (the F5 finding).

### L4 — A confident claim from a coordinating seat is not evidence (twice: a figure, then a distinction)

The **conductor** reported "two identical profile GETs per boot". **This planner recorded it as an
accepted cost without asking what had measured it**, and it hardened into a parity-gap entry, a
`parity.yaml` field, and an AC's justification. Two further seats then reasoned from it. The only seat
that actually **counted** — the verifier, at the network layer — measured **one**, flagged the
conflict rather than reconciling it by argument, labelled its own explanation a hypothesis, and routed
the question to measurement at the service seam
(`evidence/07-gaps-and-limits.md` **G3**). The conductor then withdrew the figure as unmeasured.

Note the asymmetry that makes this cheap to internalise: the *mechanism* (two distinct cache keys, so
the reads cannot be shared) was verifiable from source in minutes and is solid. The *count* was never
verifiable from source at all — it depends on which paths run on a given surface. **The unverifiable
half is the half that got asserted.**

- **The rule:** a number in a spec carries its provenance — `MEASURED` (by whom, at which layer),
  `OBSERVED` (in which harness), or `REPORTED`. State the **mechanism** when only the mechanism is
  established, and let the count stay open rather than borrowing confidence from whoever said it
  first. Seniority of the source is not a measurement.
- **Full record:** `dropped-capabilities.md` §6 (G-P2), whose count table carries exactly those
  provenance labels; AC-54's amendment.
- **Caught by:** the verifier — the only seat that measured.

**Second instance (2026-08-13), and the worse one — a fabricated DISTINCTION, not just a wrong
number.** The conductor's Code-A dispatch asserted "`isReadOnly` and `isDisabled` are different
things" without establishing what `isDisabled` should be. Nothing measured it. What followed is the
part worth internalising:

1. `isDisabled: !raw.editable` was **written to satisfy the claim**;
2. **AC-5 was written to specify it** — titled "no longer collapse to the same flag", its read-back
   *requiring* the two flags to differ;
3. a **test was written to assert it**.

Three artefacts, mutually consistent, all green — and none of them agreed with vue-app, where
`editable` appears **nowhere** in either client-surface file. **Mutual agreement between spec, code
and test is not evidence when they share an author upstream.** They were three restatements of one
unverified sentence, not three independent checks. The convergence *felt* like corroboration, which
is exactly what made it invisible.

Sharpest detail: AC-5's own preamble — "Today both read `client_readonly`" — was describing the
**correct** behaviour, and the AC instructed the implementation to break it. A spec can be a vector
for a defect, not merely a place one hides.

- **The added rule:** an asserted **difference** needs a citation as much as an asserted value. Before
  specifying that two flags, values or paths diverge, cite the oracle line that makes them diverge —
  and if the two collapse for the actor in scope, **say so explicitly**, because "these are different
  things" is otherwise the easiest claim in the world to propagate.
- **Full record:** AC-5's amendment; `parity.yaml` → row `A-client-self` → `post_gate_defects` PG-2.
  The sweep it prompted found one more (AC-32) — see PG-2's `sweep_second_finding`.
- **Caught by:** the operator, adding a definition with `editable: false` and finding the field
  unfillable.

### L5 — An oracle citation needs a SHA, not a branch name

Every dispatch, `parity.yaml` and `evidence/README.md` recorded the oracle as
`/Users/dom/Documents/Upmind/vue-app` on `feat/cancellation-logs-updates`. By the time the late
citations were verified, that checkout was on `feat/FE-3080-promotion-disqualifying-products` — a
**separate working checkout whose branch moved mid-run**, not a pinned worktree of this repo. The
citations were still exact *on the tree actually present*, so nothing was wrong; but a reviewer
following the recorded branch name would have checked out a different tree and possibly missed the
line numbers entirely.

A branch name is a **moving pointer**; it looks like a pin and is not. This is L4's shape again — a
reference that borrowed confidence from its form rather than from what it actually resolved to.

- **The rule:** record the **SHA** alongside the branch for any oracle consulted, and treat legacy
  line numbers as **approximate** — confirm against the cited **symbol** (function, computed,
  template block), which survives a rebase, rather than the line, which does not.
- **Full record:** §2's oracle-provenance note (both SHAs, both citation vintages);
  `parity.yaml` → `meta.oracle`.
- **Caught by:** Review, noticing the recorded branch did not match the checkout in front of it.

### L6 — When an assertion passes, ask which OTHER implementation would also pass it

This is the habit that catches L2, L3, L5's siblings and the post-gate defect below, and it is the
one to internalise if only one survives.

**The habit.** For every assertion, name a **wrong** implementation. If that wrong implementation
would also pass, the assertion is describing **the fixture's data**, not the requirement. Then go find
the input that separates the two — and if no such input exists in the recorded fixtures, **the fixture
set is the gap**, not the assertion count.

**Four defects in this run were the same shape: a fixture sitting on the side of a fork where both
implementations agree.**

| Defect | The fork | Why the fixture hid it |
| --- | --- | --- |
| F5 — the editor's unseeded model | seeded vs unseeded | the field's value happened to be `null`, which is what an unseeded model also yields |
| The native clear value (AC-47) | `""` vs `null` | MSW replays its stubbed **response** regardless of the request body, so the request was never actually asserted |
| **AC-63** (the read surface) | **definition-driven vs value-driven** | **the staging client had entries for every definition, so both render identically** |
| L1's retarget control (AC-2) | context arm vs session arm | every spec called `.as(SELF)`, where the two arms return the same id |

Each had a **passing assertion that a wrong implementation would also have passed**. None was a
missing test in the "we forgot to write one" sense — the tests existed, ran, and were green.

**Recorded fixtures are necessary but NOT sufficient.** All of these had genuine recorded captures;
two of them were re-captured during the run specifically to strengthen the evidence. A recording is
only as discriminating as the state of the system it was recorded against. **Provenance answers "is
this data real?"; it does not answer "does this data separate right from wrong?"** Those are different
questions and the second one has no automated gate in this pipeline.

**The AC-63 receipt, stated plainly: the operator found it by opening a different client in the
running app — about a minute.** Six gates, 13 certified mutants, a PRESENT verify and a
`blocker_count: 0` review all passed over a profile page that rendered **no custom fields at all** for
any client who had never answered one. That is not a criticism of the gates; it is the measurement of
what they cover. A gate confirms the assertions hold. **Only a human, or a fixture deliberately built
to disagree, asks whether the assertions were the right ones.**

- **The practical rule for the next converter:** for each AC, write down the input that would make a
  plausible wrong implementation fail. If you cannot name one, you do not yet have a read-back — you
  have a description. **Vary the DATA, not just the assertions**: an empty collection, a cleared
  value, a second identity, a client who has answered nothing.
- **Full record:** AC-63 and its call-out; `parity.yaml` → row `B-client-self` →
  `post_gate_defects` (PG-1).
- **Caught by:** the operator, by hand, in the running app — after the run had closed.

---

**Why these are one family.** Each is an artefact that agreed with something other than reality:
L1's control never ran the live path; L2's control ran a path production cannot reach; L3's control
took its expectation from the code itself; L4's figure took its authority from who said it; L5's
citation took its authority from looking like a pin. All five read as settled.

The generalisation worth carrying forward: **ask what would have to be true for this control to fail,
then check that the shipping path can actually produce that state.** If it cannot, the control is
decoration. L4's variant: **ask what measured this number** — and if the answer is "someone said so",
record the mechanism and leave the number open. L5's variant: **ask what this reference resolves to**
— and if it can resolve to something else tomorrow, pin it.

**The AC-level form of the same defect (L2's sibling), because it bit twice.** An either/or read-back
— "produces `X` **or** `Y`" — is a spec that **cannot be violated**. AC-47 carried one for the native
clear value and the ambiguity shipped: the code chose `null`, a test asserted `null`, the only recorded
capture held `""`, and the suite stayed green because MSW replays its stubbed response regardless of
the request body. **Where the oracle decides a value, the AC names that value.** Latitude in a
read-back is not flexibility; it is an assertion with the teeth removed. This is the correctness-coverage discipline of **ADR-021** and the anti-cosplay stance of
`.claude/rules/verify-cosplay.companion.md` — cited, not restated.
