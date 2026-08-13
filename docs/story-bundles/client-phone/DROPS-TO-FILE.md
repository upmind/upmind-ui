# client-phone — 12 dropped capabilities awaiting a Linear issue

> **Status: OPEN. This is blocker B1 and it cannot be closed from the planning seat.**
> The Linear MCP session was **unauthenticated** when this repair ran (2026-08-10).
> No issues were created and **no issue ids were invented**.
>
> **Operator action:** file the 12 issues below, then replace each row's
> `linear: UNFILED — operator to file; …` line in
> [`parity.yaml`](./parity.yaml) with the issue identifier.

## Why this file exists

`verify-parity-oracle.companion.md` binds the generic `Dropped-with-tracked-issue`
disposition to **`Dropped-with-Linear-issue`** in this monorepo — **carrying the
Linear issue reference**. The disposition's name *is* its contract. Twelve rows in
`parity.yaml` carry that disposition with an operator sign-off (2026-08-08, tier-1)
but **no tracker reference**, so twelve real, oracle-demonstrated capabilities are
currently tracked nowhere. Each row previously read `linear: TBD — file at Code`;
Code, Tests, Verify and Review have all run, so that instruction was stale and has
been replaced with an accurate pending marker.

Nothing about the substance of any drop changed. Every one remains signed.

## Filing metadata (suggested, operator to confirm)

- **Labels:** `actor:Human`, plus the module/area label the operator uses for headless client modules
- **Status:** Backlog
- **Body:** each issue should quote its `oracle:` citation verbatim from `parity.yaml` and reference the row id, so the parity row and the issue point at each other
- **S1–S7 relationship:** S2–S7 all presuppose S1 (the admin endpoint family). Consider filing S1 first and linking S2–S7 as blocked by it, or filing S1–S7 as one parent with six children

---

## Group A — the whole staff surface (S1–S7)

Operator ruling 1, 2026-08-08, tier-1. Cells = `client × self` stands; every staff
capability the legacy oracle reveals is recorded as a signed drop. `STAFF` is
`null as never` in both scope matrices, so `.as('staff')` is a compile-time error
rather than an advertised-but-absent capability.

### S1 — `staff × client`

- **Capability dropped:** Read and write ANOTHER client's phones through the admin endpoint family.
- **Oracle:** vue-app `src/store/modules/data/clients/phones.ts` — `apiPath` returns admin `api/admin/clients/{clientId}/phones` alongside client `api/clients/{clientId}/phones`, selected by `isAdminContext && !isMockClientContext()`. All four actions (list, create, update, remove) route through `.contextual`.
- **Suggested title:** `client-phone: restore the staff admin endpoint family (api/admin/clients/{clientId}/phones) — parity row S1`
- **Note:** the largest single drop in the table. The admin path is a *different* endpoint family, not a parameterisation of the client one. Restoring it is a scope-matrix edit plus a services arm — `design.md` section 4 deliberately keeps `resolveClientId`'s context branch rather than hardcoding the session id, so this restoration does not require unpicking that.

### S2 — `staff × client`

- **Capability dropped:** Gate listing another client's phones on the `list_client_phones` capability.
- **Oracle:** vue-app `clientPhonesList.vue` — `<guard :if-client="true" :if-admin="['list_client_phones']">` and the `created()` hook's `this.$userCan('list_client_phones')` branch.
- **Suggested title:** `client-phone: gate staff list on the list_client_phones capability — parity row S2`
- **Note:** ADR-001 section 6 (capabilities filter staff actions) is the mechanism this would use when restored. Blocked by S1.

### S3 — `staff × client`

- **Capability dropped:** Gate creating a phone on the `create_client_phone` capability.
- **Oracle:** vue-app `clientPhonesComp.vue` — the "Add new" link renders only under `$userCan('create_client_phone')`, and `createPhone()` re-checks before opening the modal.
- **Suggested title:** `client-phone: gate staff create on the create_client_phone capability — parity row S3`
- **Note:** blocked by S1.

### S4 — `staff × client`

- **Capability dropped:** Gate set-as-default on the `update_client_phone` capability.
- **Oracle:** vue-app `clientPhoneRow.vue` (the dropdown item is disabled without it) and `phones.ts` `makeDefault` (`if (!rootGetters["user/can"]("update_client_phone")) return`).
- **Suggested title:** `client-phone: gate staff set-default on the update_client_phone capability — parity row S4`
- **Note:** blocked by S1.

### S5 — `staff × client`

- **Capability dropped:** Gate deletion on the `delete_client_phone` capability.
- **Oracle:** vue-app `clientPhoneRow.vue` (disabled without it) and `phones.ts` `confirmDelete` (`if (!rootGetters["user/can"]("delete_client_phone")) return`).
- **Suggested title:** `client-phone: gate staff delete on the delete_client_phone capability — parity row S5`
- **Note:** blocked by S1.

### S6 — `staff × client` · **file this one first if only one gets filed**

- **Capability dropped:** Act AS a client (impersonation) while managing their phones.
- **Oracle:** vue-app `phones.ts` — the `!isMockClientContext()` half of the contextual selector deliberately routes an impersonating staff session back to the CLIENT path while the target `clientId` stays the impersonated client's.
- **Suggested title:** `client-phone: restore acting-as-client (impersonation) phone management — parity row S6 (the FE-2824 shape)`
- **Note:** **this is the FE-2824 receipt verbatim** — the acting-as-client capability whose silent loss is the reason `verify-parity-oracle` exists. When restored, `verify-reality-check.companion.md`'s A7 clause applies: the read-back must assert the **request URL retarget** AND the **auth identity transport** (which session token was selected, which acting-as headers were sent) — never the response payload alone. Blocked by S1.

### S7 — `staff × client`

- **Capability dropped:** Show staff-specific guidance copy on the phones section.
- **Oracle:** vue-app `clientPhonesComp.vue` — `isAdmin ? _sentence.manage_phones_desc_for_staff : _sentence.manage_phones_desc_for_client` (the latter interpolating the brand name).
- **Suggested title:** `client-phone: restore staff-specific guidance copy on the phones section — parity row S7`
- **Note:** the smallest of the seven, and recorded anyway. It is the only place the oracle carries an actor-derived READ value, which makes it the only candidate that could ever earn a `meta` arm. Blocked by S1.

---

## Group B — the advertised-but-absent editor option (R1)

### R1 — `client × self`

- **Capability dropped:** Target a client other than the session client from the manager.
- **Oracle:** `useClientPhoneManager(id, { clientId })` — ADVERTISED and JSDoc-documented ("the client to whom this phone belongs") but ABSENT: `clientId` reached only `actions.ts:34` `refreshContext` and `actions.ts:43` `hasSubscription`; no service read it and no URL was retargeted.
- **Suggested title:** `client-phone: the removed clientId targeting option on useClientPhoneManager was never wired — parity row R1`
- **Ruling:** operator ruling 2, 2026-08-08, tier-1 — **removed**, not carried forward unwired. **Do not re-litigate ruling 2.**
- **Note:** recorded as a drop rather than a no-op cleanup because the module's *public surface* genuinely shrinks — a consumer reading the JSDoc could believe the capability existed. Nothing is lost in fact, because nothing worked. The issue exists so the *intent* (staff/agent targeting a specific client's phones) is tracked somewhere; substantively it is S1's client-side twin and may reasonably be closed as a duplicate of S1.

---

## Group C — legacy-only client-surface behaviours (L1, L2, L3, L9)

All four are already absent from the pre-conversion headless module; these rows make
inherited-and-unrecorded drops visible rather than newly losing anything.

### L1 — `client × self`

- **Capability dropped:** Choose a phone TYPE when adding or editing (required select).
- **Oracle:** vue-app `addEditClientPhoneModal.vue` — a required `type` `b-select` over `src/data/status.ts:384` `PhoneTypes` (1 mobile, 2 home, 3 office, 4 personal), sent on create and update.
- **Suggested title:** `client-phone: no consumer can SET a phone's type (legacy had a required select) — parity row L1`
- **Sign-off:** operator, 2026-08-08, tier-1, covered by the D-1 ruling recorded in row W4.
- **Note:** the READ side survives (W4 — `Phone.type` stays exposed). What is dropped is the ability to SET it. Adding a required `type` today would fail every live consumer's save on day one, since none has a UI to collect it — which is why D-1 ruled for read-only.

### L2 — `client × self`

- **Capability dropped:** Include staged imports in the list (`with_staged_imports: 1`).
- **Oracle:** vue-app `phones.ts` list action — params always carry `with_staged_imports: 1`.
- **Suggested title:** `client-phone: list omits staged imports (legacy always sent with_staged_imports=1) — parity row L2`
- **Note:** a **data-visibility** difference, not a formatting one — it changes which ROWS the list returns. Recorded rather than assumed irrelevant, even though no client-surface consumer currently reads `IPhone.staged_import`.

### L3 — `client × self`

- **Capability dropped:** Deterministic list ordering.
- **Oracle:** vue-app `clientPhonesList.vue` sorts `created_at` ASCENDING; `clientPhoneSelect.vue` requests order `-created_at`.
- **Suggested title:** `client-phone: list has no deterministic sort; server default applies — parity row L3`
- **Note:** adding a sort would change every live consumer's row order on day one — a behaviour change dressed as parity. Recorded as the drop it is rather than fixed without a mandate. Note the oracle itself is inconsistent (ASC in the list, DESC in the selector), so restoring it needs a decision about which.

### L9 — `client × self`

- **Capability dropped:** Confirm a successful add or edit with a toast.
- **Oracle:** vue-app `addEditClientPhoneModal.vue` — `_sentence.confirm.add` / `_sentence.confirm.update` on success.
- **Suggested title:** `client-phone: no success feedback on add/edit (legacy toasted both) — parity row L9`
- **Note:** the pre-conversion headless module already raised none from the manager, and the `client-email` reference raises none from any layer. Reproducing legacy's toasts would double-report against the consumer's own success handling. Recorded as a drop rather than dismissed as a UI detail, because it is user-visible behaviour the oracle has. Contrast row W6: the *row-mutation* feedback (`remove` / `setDefault`) **is** carried, because the oracle's headless-side feedback is there.

---

## Checklist for closing B1

- [ ] 12 Linear issues filed (S1–S7, R1, L1, L2, L3, L9), each quoting its `oracle:` citation and naming its parity row id
- [ ] S2–S7 linked as blocked by S1 (or filed as children of an S1 parent)
- [ ] Each `parity.yaml` row's `linear: UNFILED — …` replaced with the issue identifier
- [ ] The `OPEN: 12 DROPPED CAPABILITIES` block at the head of `parity.yaml` removed
- [ ] `tally.drops-without-tracker-reference` set to `0`
- [ ] This file deleted, or reduced to a pointer at the filed issues
