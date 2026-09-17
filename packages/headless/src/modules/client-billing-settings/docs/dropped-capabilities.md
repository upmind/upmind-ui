# client-billing-settings — Dropped Capabilities

This file records SIX capabilities the legacy application supports that this module deliberately does not build: **a staff member reading and writing another client's invoice-consolidation preference on that client's admin page.** It is not a bug list and not a roadmap — it is a receipt. Anyone reading only the code sees a scope matrix that refuses a `staff` actor at compile time; nothing in the code says whether that refusal is a considered decision or an accidental gap. This file is what turns "refused" into "refused on purpose, and here is where the missing work is tracked."

> **Why this file has to exist, not just be true.** This module's only delivered actor is `client`, and its everyday call resolves the target record from the caller's own session identity. That is the same surface shape a silently-dropped capability takes: one actor, session-derived identity, no second arm. The only thing distinguishing this module's actual design — a staff arm that was never owed in the first place — from that failure is this file existing and being accurate. Without it, "never built" and "built, then quietly removed" look identical from outside the module.

## The legacy source these rows are read from

The legacy source cited in every row below lives in a **sibling checkout, outside this monorepo**: `/Users/dom/Documents/Upmind/vue-app` (commit `5d85c2a517`). It is not reachable from this repository's own history or its knowledge graph — a reader who wants to confirm a row must open that checkout directly. Paths below are relative to its `src/` directory, using these short names for the files involved:

| Short name | Path |
| --- | --- |
| `form:` | `components/app/global/client/clientInvoiceConsolidationForm.vue` |
| `comp:` | `components/app/global/client/clientInvoiceConsolidationComp.vue` |

## The refusal, and where it is enforced

`CLIENT_BILLING_SETTINGS_SCOPE_MATRIX` pins the staff key to `null as never`. That is not a runtime check — it means `useBillingSettings().as('staff')` and `useBillingSettingsManager().as('staff')` both fail to compile. There is no code path in this module that a staff actor can reach at all.

The context that names a client (`ClientBillingSettingsContextTypes.CLIENT`, wire value `AccessRoleTypes.CLIENT`) is granted **only** to the `client` row of the matrix, matching every sibling client module. The member briefly carried the resource-flavoured name `SETTINGS` — naming the settings record while carrying the CLIENT's own id — and its context was, for a short period, dropped entirely by a since-reversed change that misread that mismatch as `.for()` itself being the defect. That reversal is corrected, and the compile-time gate it had erased is restored. See [gotchas.md](./gotchas.md#10-the-trap-was-the-contexts-name-not-for-itself--a-resource-named-member-carrying-the-clients-own-id).

The legacy application does support a staff-administration surface. Its admin billing-settings page (`views/admin/upmind/billing/settings/index.vue:19-24`) mounts an admin client-billing component (`components/app/admin/clients/clientBillingSettings.vue:29-39`) that in turn mounts the same consolidation form component the client's own self-service page uses (`comp:` → `form:`). This module is built against the client's own self-service half of that shared form only.

## The dropped capabilities

Six distinct capabilities, each verified directly against the legacy source cited, not against a description of it:

| # | Capability | Legacy source | Disposition |
| --- | --- | --- | --- |
| D1 | Staff addresses another client's consolidation settings at all — the identity retarget every row below depends on. | `views/admin/upmind/billing/settings/index.vue:19-24`; `components/app/admin/clients/clientBillingSettings.vue:29-39` | `Dropped-with-Linear-issue` (FE-3137) |
| D2 | The admin WRITE ENDPOINT — a different URL, not a retarget. | `store/modules/data/clients/index.ts:21-29` — `apiPath()` exposes `admin="api/admin/clients"` and `client="api/clients"`; `contextual` picks between them by `isAdminContext && !isMockClientContext()`. Used at `:322`. | `Dropped-with-Linear-issue` (FE-3137) |
| D3 | The `update_client` permission gate on whether any field is editable. | `clientInvoiceConsolidationForm.vue:229-231`; resolves via `store/modules/user/index.ts:23-28`, which returns `true` unconditionally outside `Contexts.ADMIN`, making the gate admin-only by construction. | `Dropped-with-Linear-issue` (FE-3137) |
| D4 | Admin-flavoured description copy on the surface. | `clientInvoiceConsolidationComp.vue:8-12` | `Dropped-with-Linear-issue` (FE-3137) |
| D5 | Sticky multi-form save/revert orchestration — one Save and one Revert commit this form together with sibling billing forms. | `components/app/admin/clients/clientBillingSettings.vue:20-39`; the child contract at `clientInvoiceConsolidationComp.vue:27-34` | `Dropped-with-Linear-issue` (FE-3137) |
| D6 | Unconditional admin visibility, bypassing the brand `restrict_to_staff` gate. | `clientInvoiceConsolidationComp.vue:73` — the admin branch of `actorCanConsolidate` short-circuits the brand config read entirely. | `Dropped-with-Linear-issue` (FE-3137) |

Row D1 is the identity retarget every other row depends on: without it, none of D2 through D6 has an actor to apply to. Rows D2 and D3 show the retarget is not a same-path variant of the client flow — it is a different endpoint behind a different permission model entirely. Row D4 is recorded even though it is only description copy, because "it is only copy" is exactly how a per-actor surface difference gets lost. Row D5 is recorded as half of a combined action — the other half belongs to sibling admin billing forms this module does not deliver — because half of a combined action is still this module's own capability, and would otherwise vanish with no record at all. Row D6 is the other half of the visibility gate this module does deliver for clients: recording D6 next to that gate keeps a future reader from misreading the client-side gate as applying to everyone.

## Tracking

Every row above carries the disposition **`Dropped-with-Linear-issue`**, tracked as:

> **Linear FE-3137**
> The staff-cell capabilities named in rows D1-D6 above, recorded in full with per-capability legacy receipts rather than folded into a single "staff not supported" line. Staff consolidation administration sits outside this module's parity oracle: no admin-context consumer in this codebase calls it, so an arm here would have no caller. FE-3137 is where that arm — services, a permission gate, and a visibility bypass — would be picked up if a caller appears.

Closing FE-3137 is what would retire every row in the table above. Until then, the compile-time refusal in `CLIENT_BILLING_SETTINGS_SCOPE_MATRIX` and the rows above are expected to stay in lockstep — a change to one without the other is exactly the kind of drift this file exists to prevent.
