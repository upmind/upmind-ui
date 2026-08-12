# Design — client custom field values

> Reads with `requirements.md`. Conversion shape is `client-email/` (READ-ONLY reference, R7).
> No file under `packages/headless/**/*.machine.ts` or `**/machines/**` is edited (R6).

## 0. Graphify citations for every name this design mints (U12)

Queried `graphify-out/graph.json` (10,057 nodes, regenerated in this worktree 2026-08-10) before
naming anything. Result per name — **consume what exists, mint only what does not**:

| Name in this design | Graph result | Ruling |
| --- | --- | --- |
| `CustomFieldModel` | **EXISTS** — `client-custom-fields.types.ts:9` (the empty stub) | **Consume, do not mint.** The code-keyed value record fills this existing node rather than adding a parallel `CustomFieldValues`. AC-10 |
| `CustomField` | EXISTS — `client-custom-fields.types.ts:20` | consume, widen to full `ICustomField` fidelity (AC-4) |
| `ProfileField` | EXISTS — `client-personal-details.types.ts:34` | consume unchanged |
| `FieldsModel` | EXISTS **TWICE** — `basket-fields.types.ts:6` **and** `client-personal-details.types.ts:7` | a live cross-module name collision. Renamed to `ProfileModel` (**0 nodes** — no duplicate minted) which resolves it. AC-55 |
| `FieldsContext` | EXISTS **TWICE** — `basket-fields.types.ts:11` **and** `client-personal-details.types.ts:16` | same collision. Renamed to `ProfileContext` (**0 nodes**) |
| `ClientCustomFieldsServices`, `ClientPersonalDetailsServices` | 0 nodes for either; the **pattern** exists — `ClientEmailServices`, `ClientAuthServices` (`auth.services.client.ts:314`), `GuestAuthServices`, `StaffAuthServices` | mint, following the established `<Module>Services` contract-type pattern |
| `ClientCustomFieldsContextTypes`, `ClientCustomFieldContextTypes`, `ClientPersonalDetailsContextTypes` | 0 nodes; pattern exists — `ClientEmailsContextTypes` / `ClientEmailContextTypes` (`client-email.types.ts:41,66`), `AccountContextTypes`, `AuthContextTypes` | mint, following the pattern |
| `*_SCOPE_MATRIX` consts | 0 nodes for these names; pattern exists — 6 in tree (`ACCOUNT_`, `AUTH_`, `CLIENT_EMAILS_`, `CLIENT_EMAIL_`, `SESSION_` ×2) | mint, following the pattern |
| `resolveFieldByValue`, `flushImages`, `mapCustomFieldValues`, `mapCustomFieldValuesToRequest`, `mapCustomFieldDisplay` | **0 nodes each** — no existing implementation to consume | mint |
| `mapCustomFieldValue` | EXISTS — `client-personal-details.mappers.ts:87` | **relocate, do not re-mint** (R2) |
| `resolveClientId`, `isAddressable` | EXIST only in `client-email.services.ts:76,95` — module-private, no shared utility to consume | mint one per module, same shape (the graph shows no shared predicate/seam utility exists) |
| `ListQuery` | EXISTS — `query/query.types.ts:272` | **consume the platform type.** `ClientEmailListQuery` (`client-email.types.ts:134`) is the aliasing precedent; never `ReturnType<typeof localServiceFn>` |
| `DataManagerContext` | EXISTS — `data-manager/data-manager.types.ts:9` | consume |
| `UploadContext`, `useUpload` | EXIST — `system-upload.types.ts:11`, `useUpload.ts:28` | consume (R5); `CustomFieldImage*` names are 0 nodes and are minted only as A's projection over them |
| `ClientEmailErrorCapture`, `ClientEmailManagerMachineServices` | EXIST as the per-module precedent for those two helper types | mint the equivalents per module, same pattern |

`graphify-out/GRAPH_REPORT.md` has no coverage of either target module, so the per-name query above
is the whole of the available graph evidence.

## 1. Shape being followed (R7)

`client-email/` establishes the conversion shape and this pair follows all of it:

- **Shared per module:** `index.ts`, `<module>.types.ts`, `<module>.services.ts`,
  `<module>.mappers.ts`, `<module>.schemas.ts`.
- **Per composable:** `use<X>.ts` + `use<X>.actions.ts` + `use<X>.context.ts` + `use<X>.meta.ts` +
  `use<X>.internals.ts`.
- **`.machine.ts` on the machine-backed half only**, and it holds a `withConfig` **payload**
  (actions / guards / services) for the SHARED `dataManagerMachine` — never a machine definition,
  never a new event. `useClientEmailManager.machine.ts` is the precedent.
- **Curated named exports from `index.ts` — no `export *`.** Both target modules violate this
  today (`client-custom-fields/index.ts:1-3`, `client-personal-details/index.ts:1-3`).
- **`services` / `mappers` / `schemas` / `machine` each carry a line-1 `@internal` marker.**
- **ONE identity seam** — `resolveClientId(scopeContext)` branching on the resolved **context**,
  never on `ScopeActorTypes.SELF` (variance law clause 4).
- **ONE addressability predicate** — `isAddressable()`, exposed reactively as
  `service.isAvailable`, read by every layer rather than re-derived.

### 1.1 The R6 boundary, stated precisely

`dataManagerMachine` exposes `REFRESH`, `SET`, `CLEAR`, `UPDATE` and **no `REVERT`**
(`data-manager/data-manager.machine.ts:26-35,93,108-113,195-200`). `revert()` is therefore a
module-level function that calls `input(baseModel)` — a `SET` carrying the base model, which
re-enters `available.checking` and re-validates, matching legacy's
`this.form = _.cloneDeep(this.initialForm)` (`clientCustomFieldsForm.vue:138-141`,
`clientProfileBasicConfigurationForm.vue:391-393`). No machine event is added and no sign-off token
is requested.

`usePersonalDetailsManager.machine.ts` is a **new** file whose name matches the protected glob by
convention. It contains only the `withConfig` payload; it defines no machine and mutates no shared
one. Verified: `.claude/settings.json` carries no `permissions.deny` block, so nothing blocks its
creation at tool-call time — which is exactly why the boundary is written down here rather than
left to a gate (`agent-behavior.companion.md` §5).

## 2. Module A — `client-custom-fields/`

### 2.1 File plan

| File | Purpose | New/Changed |
| --- | --- | --- |
| `index.ts` | curated named exports; the module's ONLY public surface; no `export *` | rewrite |
| `client-custom-fields.types.ts` | two scope matrices + context enums; `CustomField`; `CustomFieldModel`; `CustomFieldImageContext`; `ClientCustomFieldsServices`; `ClientCustomFieldsListQuery` (alias of the platform `ListQuery`) | rewrite |
| `client-custom-fields.services.ts` | `@internal`. `resolveClientId`, `isAddressable`, `loadList`, `resolveFieldByValue`, `validate`, `refresh`, `queryKey` | rewrite |
| `client-custom-fields.mappers.ts` | `@internal`. `mapCustomField`, `mapCustomFieldValue` (relocated per R2), `mapCustomFieldValues`, `mapCustomFieldValuesToRequest`, `mapCustomFieldDisplay`, the image error-key rewrite | rewrite |
| `client-custom-fields.schemas.ts` | `@internal`. The re-export seam for the three shared parsers (R4) + A's own narrowing helpers | new |
| `useClientCustomFields.ts` | the query-backed definitions collection (scoped) | rewrite |
| `useClientCustomFields.actions.ts` | `isReady`, `refresh`, `invalidate`, `filters`, `destroy` | new |
| `useClientCustomFields.context.ts` | `data`, `error`, `pagination`, `findOne`, `getOne`, `resolveFieldByValue` | new |
| `useClientCustomFields.meta.ts` | `isLoading`, `isEmpty`, `hasError`, `isAvailable`, `count` | new |
| `useClientCustomFields.internals.ts` | `actorScope`, raw `query` | new |
| `useClientCustomFieldImage.ts` | the machine-backed per-field IMAGE value editor (scoped `.for('field', id)`) | new |
| `useClientCustomFieldImage.actions.ts` | `upload`, `remove`, `flush`, `isReady`, `destroy` | new |
| `useClientCustomFieldImage.context.ts` | `value`, `hash`, `downloadUrl`, `preview`, `errors` | new |
| `useClientCustomFieldImage.meta.ts` | `isUploading`, `progress`, `hasError`, `isComplete`, `isAvailable` | new |
| `useClientCustomFieldImage.internals.ts` | `actorScope`, the `useUpload` handle | new |
| `docs/` (ADR-019 shape) | authored by the docs dispatch, not here | new |
| `__tests__/` | authored by the prover seat, not here | new |

**No `useClientCustomFields.machine.ts` and no `useClientCustomFieldImage.machine.ts`.** The image
half's machine is `system-upload`'s existing interpreter, reached through `useUpload()` — A adds no
machine file at all. This is the strictest reading of R6 and it costs nothing, because `useUpload`
already owns check → upload → error as machine states (`useUpload.ts:28-36`). Its `PROGRESS` state
exists but is never driven — see the binary-progress row in §2.6.

### 2.2 Scope matrices

Two matrices, one per composable — the two halves scope on different things and cannot share one
(`client-email.types.ts:41-83` is the precedent). **Exactly one resolving cell per composable
(`client × self`), exactly one context per matrix, and every context names the ENTITY being
addressed — never its owner, and never an actor.**

Graphify citation for the two enums minted here (`graphify-out/graph.json`, 10,057 nodes,
2026-08-10): `ClientCustomFieldsContextTypes` **0 nodes**, `ClientCustomFieldContextTypes`
**0 nodes**, `custom_field_values` **0 nodes** — nothing to consume; the naming pattern consumed is
`ClientEmailsContextTypes` / `ClientEmailContextTypes` (`client-email.types.ts:41,66`), and
`graphify-out/GRAPH_REPORT.md` has no coverage of this module. Full per-name table in §0.

```ts
/**
 * Context types for the definitions/values COLLECTION — WHICH client's custom-field
 * value set is being addressed. The context names the ENTITY (the value set), not its
 * owner: there is no `client` context type here, so `.for('client', id)` does not exist
 * and the actor-retarget cell stays unnameable (parity.yaml A-client-onbehalf).
 */
export enum ClientCustomFieldsContextTypes {
  VALUES = "custom_field_values"
}
export const CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]:   null as never,   // resolved by the builder BEFORE this module runs
  [ScopeActorTypes.STAFF]:  null as never,   // dropped — parity.yaml A-staff-*
  [ScopeActorTypes.CLIENT]: ClientCustomFieldsContextTypes.VALUES,
  [ScopeActorTypes.GUEST]:  null as never    // dropped — parity.yaml A-guest-*
} as const;

/**
 * Context types for the per-field IMAGE editor — WHICH field's image is being edited.
 * Mirrors `ClientEmailContextTypes.EMAIL` exactly: the owning client falls through the
 * same `resolveClientId` seam as every other call.
 */
export enum ClientCustomFieldContextTypes {
  FIELD = "field"
}
export const CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]:   null as never,
  [ScopeActorTypes.STAFF]:  null as never,
  [ScopeActorTypes.CLIENT]: ClientCustomFieldContextTypes.FIELD,
  [ScopeActorTypes.GUEST]:  null as never
} as const;
```

The image half's context names the **entity** (the field), so `resolveClientId` falls through to the
session for a `FIELD` context — the same reasoning `client-email.services.ts:70-74` records for
`.for('email', id)`. The collection's `VALUES` context carries the id of the value set being read,
which for a client's own custom fields **is** that client's id; `resolveClientId` resolves it from
the scope context, which is what keeps the seam honest (§2.3).

> **Stated plainly, so a reviewer does not have to infer it.** A `VALUES` (or B's `PROFILE`) context
> id equals the owning client's id, so a caller passing a *different* client's id would target that
> client's resource and receive a 403 from the API. That is exactly the property `client-email`'s
> `.for('email', id)` already has — an entity id is an entity id, and authorization is the API's job.
> What this design removes is the **named actor-retarget affordance** `.for('client', id)`: nothing
> in either module advertises acting *as* one client *for* another. That is the difference between
> `NOT-SUPPORTED` (this plan) and advertised-but-absent (the FE-2824 shape).

### 2.3 Identity seam (one, shared by both halves)

```ts
function resolveClientId(scopeContext?: ScopeContext) {
  const { activeUser } = useActiveSession().useContext();
  return computed(() =>
    scopeContext?.type === ClientCustomFieldsContextTypes.VALUES
      ? scopeContext.id
      : activeUser.value?.id
  );
}
```

Branches on the resolved **context type**, never on the actor and never on `SELF`. It is the only
place `activeUser` is read in the module; every request-issuing function takes its id from here. The
`FIELD` context (the image half) deliberately falls through to the session — a field context names
the entity, not its owner — and the field id itself is resolved by a sibling
`resolveFieldId(scopeContext)`. Definitions are brand-scoped rather than client-scoped, so `brand_id`
is derived from the client this seam resolved (AC-2) — never from `useBrand()`'s session brand, and
never from a `brandId` scope field (`scope.types.ts:80` is explicit that brand is a filter, **not**
a context, which is why no matrix here has a brand context type).

### 2.4 Addressability predicate (one)

```ts
function isAddressable(clientId?: string): boolean {
  const { isAuthenticated } = useActiveSession().useMeta();
  return isAuthenticated.value && !!clientId;
}
```

Exposed as `service.isAvailable` and read by `meta.isAvailable`, by the list query's `enabled`, and
by its `guard` — one predicate, so the flag a consumer renders and the gate the wire enforces
cannot drift (`client-email.services.ts:86-99`, `useClientEmails.meta.ts:43`).

### 2.5 Bounded, error-settling readiness (AC-6, the JTBD-critical row)

The current poll (`useClientCustomFields.ts:39-48`) is replaced by client-email's settled-outcome
pattern (`useClientEmails.actions.ts:54-80`), **not** by a shorter interval:

- `addressableOutcome()` returns `true` when `service.isAvailable`, `false` when the session has
  **initialised without** an addressable client or has **stopped settling without** initialising,
  and `undefined` only while the session is genuinely still settling.
- `isReady()` resolves the settled outcome immediately when one exists, otherwise waits on a
  `watch` over `[service.isAvailable, isSessionInitialised, isSessionSettling]` **that stops
  itself**, then folds in the query's own error state so a 500 resolves `false`.

Readiness reads the store's own outcome rather than awaiting the session's `isReady()`, because
that resolves only on INITIALISED — a failed boot would leave it pending forever. This is what
makes B's `loadLookups` safe to await inside an XState service (AC-40).

### 2.6 IMAGE flow — `system-upload` consumption plan (R5)

A does **not** implement the POST. `system-upload.services.ts:48-52` already routes
`ImageObjectTypes.CLIENT_CUSTOM_FIELD` to `clients/fields/{field_id}/image` (and
`clients/fields/images` when no field id), and `useUpload(field)` already interprets the upload
machine with per-instance state.

A's image half wraps it and owns exactly the four things legacy owns above the POST:

| A owns | Legacy evidence | Mechanism |
| --- | --- | --- |
| `isUploading` + `progress` per field | `customFields.vue:129-130,375-383,417-433` | projected from `useUpload().meta` onto `useClientCustomFieldImage.meta`. **`progress` is binary `0`/`100`** — `useUpload()` does **not** expose the machine's `progress` context field, `system-upload`'s `PROGRESS` event has zero dispatchers, and `query`'s `doFetch` uses native `fetch()` (no upload-progress hook). Byte-level progress is a declared parity gap: `requirements.md` AC-18, `dropped-capabilities.md` §6 (G-P1) |
| `image` → `custom_fields.<code>` error-key rewrite | `customFields.vue:399-400` | in `client-custom-fields.mappers.ts`, applied where the upload's error lands in the module's error state |
| download URL + preview | legacy read-only projection; `useUpload().src` | `useClientCustomFieldImage.context` derives both from the stored hash |
| ordering: images flush BEFORE the profile PUT, hash lands in the model | `clientCustomFieldsForm.vue:109-110`; value written at `customFields.vue:389` | `flushImages()` (seam A-11) resolves only once every dirty IMAGE value in the model is a hash; B awaits it before issuing the PUT |

The `options.field` payload `useFieldsUischemaParser` already emits for IMAGE
(`utils/useFields.ts:167-175`: `field_type: "client_custom_field"`, `field_id`) is exactly
`useUpload`'s `field` argument — the two already fit, so nothing is minted to bridge them.

### 2.7 The `custom_fields` request shape (S-1 / R3) — settled from the oracle

Verified directly in the oracle, not taken on trust:

- `clientCustomFieldsForm.vue:92-93` — values are read into the form keyed by
  `fieldObj.field.code`, off the **embedded** definition.
- `clientCustomFieldsForm.vue:70-81` — `customFieldsValues` is a dirty diff against `initialForm`,
  then `mapValues(v => v === "" ? null : v)`.
- `clientCustomFieldsForm.vue:128-137` — `if (_.isEmpty(this.customFieldsValues)) return
  Promise.resolve();` then `data: { custom_fields: this.customFieldsValues }` — an **object keyed
  by code**.

Current headless agrees. The foundation doc's array-of-`{field_id,value}` claim is wrong for the
**request** only; see `requirements.md` §7.2 for the exact three lines corrected and the read-side
lines deliberately left alone.

## 3. Module B — `client-personal-details/`

### 3.1 File plan

| File | Purpose | New/Changed |
| --- | --- | --- |
| `index.ts` | curated named exports; no `export *` | rewrite |
| `client-personal-details.types.ts` | two scope matrices + context enum; `ProfileModel` (was `FieldsModel`); `ProfileField`; `ProfileContext` = `DataManagerContext<ProfileModel>` (was `FieldsContext`); `ClientPersonalDetailsServices`; `ClientPersonalDetailsListQuery`; the machine-services map type | rewrite |
| `client-personal-details.services.ts` | `@internal`. `resolveClientId`, `isAddressable`, `loadProfile` (query), `loadLookups`, `parse`, `validate`, `update`, `refresh`, `queryKey` | rewrite |
| `client-personal-details.mappers.ts` | `@internal`. `mapProfile`, `mapProfileFields`, `mapIProfileFields` (diff-only). **`mapCustomFieldValue` deleted — imported from A** | rewrite |
| `client-personal-details.schemas.ts` | `@internal`. `useSchema` / `useUischema`, consuming A's A-3/A-4 | rewrite |
| `usePersonalDetails.ts` | the query-backed read half (scoped) | rewrite |
| `usePersonalDetails.actions.ts` | `isReady`, `refresh`, `invalidate`, `destroy` | new |
| `usePersonalDetails.context.ts` | `data`, `error`, `customFields`, `findOne`, `getOne` | new |
| `usePersonalDetails.meta.ts` | `isLoading`, `isEmpty`, `hasError`, `isAvailable` | new |
| `usePersonalDetails.internals.ts` | `actorScope`, raw `query` | new |
| `usePersonalDetailsManager.ts` | the `dataManagerMachine`-backed editor half (scoped) | rewrite |
| `usePersonalDetailsManager.actions.ts` | `input`, `update`, `revert`, `clear`, `isReady`, `destroy` | new (absorbs `actions.ts`) |
| `usePersonalDetailsManager.context.ts` | `context`, `model`, `baseModel`, `schema`, `uischema`, `fields`, `errors` | new |
| `usePersonalDetailsManager.meta.ts` | `isAvailable`, `isLoading`, `isValid`, `isDirty`, `hasErrors`, `showErrors`, `isProcessing`, `isComplete` | new |
| `usePersonalDetailsManager.internals.ts` | `actorScope`, `actorRef`, `send`, `state` | new |
| `usePersonalDetailsManager.machine.ts` | the `withConfig` payload only (actions / guards / services). See §1.1 | new |
| `actions.ts` | **deleted** — split into the per-composable layers above (also fixes G-29's missing marker by deletion) | delete |
| `client-personal-details.utils.ts` | **deleted** — a 1-line empty stub today (G-28) | delete |

### 3.2 Scope matrices

Graphify citation for the enum minted here (`graphify-out/graph.json`, 2026-08-10):
`ClientPersonalDetailsContextTypes` **0 nodes**, `ProfileContextTypes` **0 nodes** — nothing to
consume; the pattern consumed is `ClientEmailContextTypes` (`client-email.types.ts:66`).
`graphify-out/GRAPH_REPORT.md` has no coverage of this module. Full table in §0.

```ts
/**
 * Context types for BOTH halves — WHICH profile is being read/edited. The context names
 * the ENTITY (the profile), not its owner, per `ClientEmailContextTypes.EMAIL`. There is
 * no `client` context type, so `.for('client', id)` does not exist and the actor-retarget
 * cell stays unnameable (parity.yaml B-client-onbehalf: NOT-SUPPORTED).
 */
export enum ClientPersonalDetailsContextTypes {
  PROFILE = "profile"
}
export const PERSONAL_DETAILS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]:   null as never,
  [ScopeActorTypes.STAFF]:  null as never,   // dropped — D1..D13
  [ScopeActorTypes.CLIENT]: ClientPersonalDetailsContextTypes.PROFILE,
  [ScopeActorTypes.GUEST]:  null as never
} as const;
```

**Corrected from an earlier draft.** That draft gave both halves a `CLIENT = AccessRoleTypes.CLIENT`
context on the reasoning that "the entity the manager edits **is** the client" — which named the
owner twice and, worse, made `.for('client', id)` compile while the parity row said the cell was not
supported. The reference's convention is the fix: the manager's context names the **entity being
edited** (`ClientEmailContextTypes.EMAIL = "email"`, with its docblock stating "the context names the
ENTITY, not its owner: the owning client falls through the same `resolveClientId` seam"). A client
has exactly one profile, so `PROFILE` is a single-member enum and `.fresh()` is meaningless here.

Two named matrices are still exported — one per composable — so a later divergence is not a breaking
change; today both reference the same const.

`.as('staff')` is a **compile-time error** with `STAFF: null as never`; `ScopeBuilderResult`
collapses to `T` for an actor whose contexts are `never` (`scope.builder.ts:185-193`), which is why
`.as('self')` keeps working with `SELF: null as never` — the builder resolves SELF to a concrete
actor at `scope.builder.ts:274` before the matrix is consulted. `session-store`'s all-`never` matrix
(`session-store.types.ts:16-21`) is the in-tree proof this typing works.

### 3.3 The variant caveat, ruled (required by the dispatch)

**Ruling: B's read half becomes a genuine query collection.**
`GET clients/{id}?with=custom_fields,custom_fields.field`, mapped through `select`, minted once per
scope — the same construction as `client-email.services.ts:118-131`. So **"hybrid" means the same
thing in both modules**: a query-backed collection plus a machine-backed editor.

```ts
/**
 * @decision B's read half is a query, not a projection over the session store
 *
 * what:   `usePersonalDetails` reads `GET clients/{id}` with
 *         `with=custom_fields,custom_fields.field`, replacing the `computed` over
 *         `useActiveSession().useContext().activeUser` at usePersonalDetails.ts:39-42.
 *
 * why:    1. The projection's source is structurally empty. `SessionUser.customFields` is
 *            DECLARED (session-store.types.ts:103) and NEVER ASSIGNED — `mapSessionUser`
 *            (session-store.mappers.ts:53-88) does not set it, and `/self`'s `with` list
 *            (session-store.services.ts:41-58) does not request custom fields. So
 *            `activeUser.customFields` is always `undefined`, every value projects through
 *            `String(undefined)` to the literal string "undefined"
 *            (client-personal-details.mappers.ts:77,104), and the editor's
 *            `baseModel.customFields` is always `{}` (client-personal-details.services.ts:39-56).
 *            The JTBD's READ verb is ABSENT, not degraded (requirements.md §7.1). No amount of
 *            coercion fixing reaches it.
 *         2. A `computed` over the session singleton cannot be retargeted, so the identity seam
 *            would be a lie on the read half while the write half claimed one — the FE-2824 shape
 *            in a new coat.
 *         3. `custom_fields.field` embeds the definition on each value, which is what makes
 *            `resolveFieldByValue` (A-8) work with A's collection unloaded — it removes the
 *            A-collection load-order coupling entirely, and it is what legacy does
 *            (store/modules/data/clients/index.ts:149-150, consumed at
 *            clientCustomFieldsForm.vue:92-94).
 *         4. It deletes the readiness-stall join: the read half gets TanStack's own settled and
 *            error states instead of awaiting A's poll inside an XState service (AC-40).
 *         5. `clients/{id}` is already addressed with the client's own token by this very module's
 *            PUT (client-personal-details.services.ts:94, `withAccessToken: true`), so the read is
 *            on a path the client actor demonstrably reaches.
 *
 * cost:   a second fetch of a record the session store already holds. Mitigated by keying the
 *         query `[...queryKey, { client: clientId }]` with a `staleTime`, so a remount is
 *         cache-warm; the session store remains the session's own source of truth and is not
 *         replaced.
 *
 * rejected: (a) KEEP THE PROJECTION over `activeUser` — rejected: its source field is never
 *           populated, so it cannot deliver the JTBD at all, and it forecloses the identity seam.
 *           (b) EXTEND `/self` — add `actor.custom_fields,actor.custom_fields.field` to the `with`
 *           list and map `customFields` in `mapSessionUser` — rejected: `session-store/` is a
 *           shared module outside this run's scope with four `auth` files and the whole boot path
 *           depending on it, and it would fetch every client's custom fields on every boot for
 *           every consumer, including guests who never open a profile. It is the right fix for a
 *           session-store story, not for this pair.
 */
```

### 3.4 Identity seam and addressability

Identical in shape to §2.3 / §2.4, with `ClientPersonalDetailsContextTypes.PROFILE` as the branch —
the profile entity's id **is** the client id, so `resolveClientId` returns it from the scope context
and falls back to the session's own client when no context is given. Both halves share this one seam,
which is what makes AC-30's read-back (read URL and write URL carry the same id) executable.
The manager seeds its machine context's `clientId` from `service.clientId.value` and tops it up late
through a **self-stopping** `watch` on `service.clientId` (`useClientEmailManager.ts:105-109`) —
never a second `useActiveSession()` read, and never the unmanaged `sessionReady().then()` at
`usePersonalDetailsManager.ts:75-82` (AC-42).

### 3.5 The write path

`mapIProfileFields` becomes a **diff** mapper, `(model, baseModel) => Partial<IClient> | undefined`:

1. Diff `model` against `baseModel` key by key — legacy's `omitBy(form, (v,k) => init[k] === v)`
   (`clientProfileBasicConfigurationForm.vue:261-266`). `undefined` is returned for an empty diff so
   the caller short-circuits with zero requests (legacy `:395`) — AC-45.
2. `document_language_id` is added **only** when `interface_language_id` changed (legacy `:265-266`)
   — AC-48.
3. `custom_fields` comes from A's `mapCustomFieldValuesToRequest(model.customFields,
   baseModel.customFields)` (seam A-7): dirty-only, `""`→`null`, code-keyed object — AC-23, AC-24.
4. **No `omitBy(..., isEmpty)` and no `omitBy(..., isNil)` anywhere on the body.** Those two calls
   (`client-personal-details.mappers.ts:109,116-118`) are the whole of G-4 and G-5: they strip the
   `null` that clears a custom field and the `""` / `false` / `0` that clear or set a native one.
   Emptiness is decided by the **diff**, never by a value predicate — AC-46, AC-47.
5. The key set is closed to `{firstname, lastname, public_name, interface_language_id,
   document_language_id, custom_fields}` — AC-49.
6. Images flush first via A-11, so a dirty IMAGE's hash is already in the model when the diff runs
   — AC-21.

`update()` then invalidates this module's own key only, with a `mutationKey` that matches the
`queryKey` (AC-52), and keeps the existing locale side effect
(`client-personal-details.services.ts:100-108`), which is correct legacy parity
(`clientProfileBasicConfigurationForm.vue:403-406`).

## 4. The seam contract — signatures

Published by A's `index.ts`, consumed by B. This is the whole of what crosses the boundary; B
imports nothing else from A and never reaches into A's `@internal` files.

| Id | Signature | Notes |
| --- | --- | --- |
| A-1 | `type CustomField` | full `ICustomField` fidelity: `id, code, name, type, options, order, meta{isRequired, isReadOnly, isDisabled, isHidden, isUserOnly, isEditable, showOnOrderForm, showOnInvoice, displayContexts}` |
| A-2 | `type CustomFieldModel = Record<CustomField["code"], unknown>` | the **existing** stub node filled in (§0) — the code-keyed value record: the S-1 request shape and the model's `customFields` branch |
| A-3 | `useCustomFieldsSchema(fields?: CustomField[]): JsonSchema7` | re-export of `useFieldsSchemaParser` (R4 — files stay in `utils/useFields.ts`) |
| A-4 | `useCustomFieldsUischema(fields?: CustomField[], i18nKey?: string): ControlElement[]` | re-export of `useFieldsUischemaParser` |
| A-5 | `useCustomFieldsModel(fields: CustomField[], values?: CustomFieldModel): CustomFieldModel` | re-export of `useFieldsModelParser` |
| A-6 | `mapCustomFieldValue(value: unknown, field?: CustomField): unknown` | relocated from B (R2); all 8 types, DATE real, no `"undefined"` |
| A-7 | `mapCustomFieldValuesToRequest(model?: CustomFieldModel, baseModel?: CustomFieldModel): CustomFieldModel \| undefined` | dirty diff + `""`→`null`; `undefined` signals an empty diff |
| A-8 | `resolveFieldByValue(value: ICustomFieldValue): CustomField \| undefined` | prefers the embedded `value.field`, falls back to the collection |
| A-9 | `mapCustomFieldValues(values?: ICustomFieldValue[]): CustomFieldModel` | client record → code-keyed record, via A-8 then A-6 |
| A-10 | `service.isAvailable: ComputedRef<boolean>` and `isReady(): Promise<boolean>` | bounded, error-settling (§2.5) |
| A-11 | `flushImages(model: CustomFieldModel): Promise<CustomFieldModel>` | resolves with every dirty IMAGE value replaced by its uploaded hash; rejects with the rewritten `custom_fields.<code>` error key |

**R4 is honoured by re-export, not relocation.** `utils/useFields.ts` is not moved and is edited only
as AC-14 requires (DATE + nullish coercion); `auth/auth.schemas.register.ts` and
`basket-fields/basket-fields.utils.ts` keep their existing import paths and neither directory is
touched. A owns the *contract*; the tree keeps the *files*.

> **Watch item for the developer seat.** `utils/useFields.ts:15` imports `CustomField` **from A**,
> and A re-exports the three parsers back from `utils/useFields.ts`. Type edge one way, value edge
> the other, so no runtime cycle — but the re-export must live in
> `client-custom-fields.schemas.ts` (a leaf), never in a path `useFields.ts` itself imports. If the
> bundler still reports a cycle, break it by having `useFields.ts` import the type from
> `client-custom-fields.types` directly instead of from the barrel.

## 5. Arms determination (variance law clause 3)

Derived **mechanically** from the parity table, not by preference. Clause 3: an arm exists only
where a scope has members **exclusive to it** or **overriding** the shared implementation — a
per-actor route, capability gate, or member at that layer. Per the layer-scope note in
`code-composables.companion.md`, clause 3 applies to all five layers, not only those with an
existing exemplar.

With `staff` and `guest` mapped to `null as never`, **exactly one actor resolves in each module**.
An arm is by definition a per-actor divergence, and a single resolving actor cannot diverge from
itself. Therefore **all five layers are `none` in both modules**, and no `*.{actor}.ts` file is
created anywhere in this pair. The full per-layer determination, each row citing the parity row that
decides it, is in `parity.yaml` → `arms:`.

**Unchanged by the one-resolving-cell revert.** With `client × on-behalf-of-client` now
`NOT-SUPPORTED` rather than in-scope, the resolving-actor count per module is still exactly one
(`client`), so the derivation and every layer's verdict are identical. What the revert removes is a
second *context* for that same actor — and a context is not an actor, so it could never have earned
an arm in the first place. The recorded near-misses in `parity.yaml` → `arms.*.cites` (D6/D7 as the
would-be services + meta earners, D3/D4/D5 as the would-be context members, D11 as the would-be
schemas divergence) all sit in the **staff** row and stand exactly as written.

## 6. AC → design element map

| AC range | Design element |
| --- | --- |
| AC-1..AC-3 | §2.1 `loadList`, §2.3 (brand from the resolved client) |
| AC-4, AC-5, AC-10 | §2.1 `client-custom-fields.types.ts` + `mapCustomField` |
| AC-6 | §2.5 |
| AC-7, AC-8, AC-9 | §2.1 `useClientCustomFields.actions` / `.meta` |
| AC-11..AC-15 | §4 A-3/A-4/A-5/A-6, §2.1 `client-custom-fields.schemas.ts` |
| AC-16 | §4 A-8, §3.3 (the `with=custom_fields.field` that makes it work unloaded) |
| AC-17 | §2.1 `mapCustomFieldDisplay` |
| AC-18..AC-22 | §2.6, §4 A-11 |
| AC-23, AC-24 | §2.7, §4 A-7, §3.5 steps 3-4 |
| AC-25 | §2.3, §2.4 |
| AC-27, AC-57 | §1, §2.1, §3.1 (barrel + `@internal`) |
| AC-30, AC-31, AC-41 | §3.3, §3.4 |
| AC-32..AC-35 | §3.1 `mapProfileFields`, `client-personal-details.schemas.ts` |
| AC-40, AC-42, AC-43 | §2.5 consumed by §3.4; §3.1 manager actions |
| AC-45..AC-52 | §3.5 |
| AC-44, AC-53..AC-56, AC-59 | §3.1 file plan, §0 (the `FieldsModel`/`FieldsContext` collision) |
| AC-60, AC-61 | §8 |
| AC-62 | `tasks.md` T-A9, T-B12 |

## 7. Edge cases

| Case | Handling |
| --- | --- |
| Session resolves AFTER construction (cold boot) | the query key carries the id **ref**; `enabled` + `guard` hold the unaddressable entry shut so it is never written to, and a late id re-derives into a different cache entry (`client-email.services.ts:101-131`). AC-41 |
| A definition exists with no value on the client | `useCustomFieldsModel` seeds the code from `value`/`default`; the field renders empty rather than absent (`utils/useFields.ts:218-227`) |
| A value exists whose definition was deleted from the catalogue | `resolveFieldByValue` returns `undefined` → the value is skipped, matching legacy's `if (!fieldCode) return result` (`client-personal-details.services.ts:47`) |
| Two concurrent IMAGE uploads | `useUpload` is deliberately non-singleton (`useUpload.ts:24-27`); one scoped image editor per `.for('field', id)`, so two fields get two interpreters |
| An IMAGE upload fails mid-save | `flushImages()` rejects with the rewritten `custom_fields.<code>` key and the PUT is **not** issued — legacy's `await` ordering has the same effect (`clientCustomFieldsForm.vue:105-121`). AC-19, AC-21 |
| Required custom field cleared | `validate` rejects before any request (AC-51); legacy `validateBeforeSubmit` throws before dispatch (`clientCustomFieldsForm.vue:102-104`) |
| `client_readonly` field submitted anyway | excluded from the diff by the schema's `readonly` + the field's `isDisabled`; the request-shape assertion (AC-49 / AC-23) is what proves it never reaches the wire |
| Locale changes as a result of the save | keep the existing `useLocale().setLocale(client.interface_language_code)` side effect — legacy parity (`clientProfileBasicConfigurationForm.vue:403-406`) |

## 8. In-repo consumers on the dropped surface — ruling

| Consumer | Ruling | Why |
| --- | --- | --- |
| `playgrounds/labs/src/pages/account/profile/components/ClientProfile.vue:33,49` | **Migrate.** `usePersonalDetails().as('self')`, then `.useContext().data` / `.useActions().isReady()` | Named by the dispatch as a consumer that must keep working. Client-surface page; the four-layer return is a breaking shape change, so the page moves with it. AC-60 |
| `playgrounds/labs/src/pages/account/profile/components/ClientProfileFieldsEdit.vue:34,66` | **Migrate.** `usePersonalDetailsManager().as('self')`, then `.useContext()` / `.useActions()` / `.useMeta()` | Same. Its `filterFields` prop keeps working — it becomes a scope-factory argument, not a destructured option. AC-60 |
| `playgrounds/labs/src/pages/account/admin/routes.ts:17,30` → `../profile/admin/Profile.vue`, `../profile/admin/Edit.vue` | **DELETE both routes and both `profile/admin/*` pages.** | These are the FE-2824 trap made visible. Neither page passes a client id nor a scope: `admin/Profile.vue:12-14` mounts the same client-surface `ClientProfile` / `ClientEmails` / `ClientPhones`, and `admin/Edit.vue:12-15` mounts `ClientProfileFieldsEdit`. With `STAFF: null as never` they still compile — because they never say `.as('staff')` — so they would keep rendering **the staff user's own profile while presenting as an admin client view**, which is exactly the advertised-but-broken capability D1/D2 records. Leaving them is a live cosplay surface; marking them "unsupported" keeps a route that resolves to a lie. Deleting is the only option that does not advertise a cell the matrix refuses. The `admin/routes.ts` nav entries go with them. AC-61 |

`playgrounds/labs/src/pages/account/profile/components/ClientEmails.vue:15` still calls
`useClientEmails()` **flat** and was last touched by pre-conversion commits — the `client-email`
conversion left it stale. **Not this run's work** (`client-email/` is read-only reference and the
page is not named by the dispatch), but recorded because it is the same breakage class this pair
must not repeat, and a developer migrating the two profile pages will be standing right next to it.
Listed in `dropped-capabilities.md` §4 as a non-capability note so the operator sees it in one pass.

## 9. What this design deliberately does not do

- Does not add a machine event, edit a machine, or request a sign-off token (R6).
- Does not relocate the shared field parsers (R4), touch `auth/` or `basket-fields/`, or
  re-implement the image POST (R5).
- Does not extend `session-store` (§3.3 rejected alternative (b)).
- Does not author `.feature` files or module docs — separate dispatches own those.
- Does not create a single `*.{actor}.ts` arm file (§5).
