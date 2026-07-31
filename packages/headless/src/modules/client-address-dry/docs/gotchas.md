# client-address-dry Gotchas

Edge cases and behaviours that surprise people. Written for developers wiring this module into UI and for testers designing scenarios — every gotcha carries a testable expected-behaviour statement.

## 1. Staff writes are gated off on an unmodified session today — pending, not broken

**Problem:** The staff arm's `add`/`update`/`setDefault`/`remove`/`refresh`/`ensure` are each `undefined` unless the acting staff session carries the matching permission code (`list_client_addresses` / `create_client_address` / `update_client_address` / `delete_client_address`). Those codes are read off a field the staff-identity endpoint already fetches — but the session store's mapped staff-user profile does not yet carry it through. **Consequence: on today's unmodified session, every staff session resolves all four permission flags to `false`, so every staff write is `undefined`, regardless of the staff member's real permissions.** This is a verified fact, not a suspicion — the module's own code reads defensively off the raw field precisely because the mapped profile does not expose it yet.

The module's own code is correct and would function the moment the field is populated — this is a session-store gap, not a `client-address-dry` defect. The real fix (carrying the permission field through the staff session's mapped profile) is a sibling-module change outside this module's own scope, recommended as a follow-up.

```typescript
// ❌ wrong — assumes a staff instance's write actions are always present
await asStaff.useActions().remove(addressId);

// ✅ right — check first; today this branch is always taken for staff
const staffActions = asStaff.useActions();
if (staffActions.remove) {
  await staffActions.remove(addressId);
} else {
  // permission absent — today, unconditionally, on an unmodified session
}
```

> **🧪 For Testers:** A staff session acting on a named client can always **read** that client's address list today. A staff session's **write** actions (`add`/`update`/`setDefault`/`remove`/`ensure`) and the readable permission flags (`canList`/`canCreate`/`canUpdate`/`canDelete`) all read as absent/`false` for every staff session on the current build — this is expected until the session-store follow-up lands, not a regression to file against this module. Once a staff session's mapped profile does carry the permission field, granting or revoking any one of the four codes changes only the matching action/flag pair — the other three stay independently sourced.

## 2. A record that arrived through a bulk import surfaces identically to any other row

**Problem:** Every list read on this collection requests that import rows be included, and once included, such a row is returned with no distinguishing signal and no edit/delete lockout applied to it by this collection. A caller cannot tell from the collection's own returned shape whether a given row is still pending reconciliation from a bulk import.

> **🧪 For Testers:** A row that arrived via a bulk import appears in the list alongside ordinary rows and can be edited, deleted, or set default through the same actions as any other row — there is no gotcha to reproduce here beyond confirming the row is present at all.

## 3. `.inBrand(id)` only ever resolves the session's own active brand

**Problem:** The new-address country seed reads the active brand's own configured country — a session-wide singleton with no by-id lookup for any brand other than the one currently active. Passing a different brand id does not fetch or resolve that brand; it silently seeds from whichever brand is _actually_ active in the session, which may not be the one named.

```typescript
// If BRAND_X is not the session's active brand, this does NOT seed
// the new-address country from BRAND_X's country — it seeds from
// whatever brand the session actually has active.
const addresses = useClientAddressesDry().as("self").inBrand(BRAND_X);
```

> **🧪 For Testers:** With `.inBrand()` unset or set to the session's own active brand, a new address's seeded country matches that brand's configured country. With `.inBrand()` set to any _other_ brand id, the seeded country is still the active brand's — not the named one. This mirrors the platform's own single-active-brand model; it is not a regression.

## 4. `useInternals().service` bypasses the staff permission gate — by design

**Problem:** The raw service object exposed via `useInternals().service` calls the admin endpoints directly, with no permission check — the gate lives in the `useActions()` staff arm, one layer up. This is consistent with every other scoped module's `internals` layer (an advanced-access escape hatch for debugging/advanced consumers), not a hole specific to this module — but it means a consumer reaching for `useInternals().service` to "work around" an `undefined` gated action reintroduces exactly the gap the permission gate exists to close.

> **🧪 For Testers:** Calling a mutation through `useActions()` respects the permission gate; calling the equivalent method on `useInternals().service` directly does not. This is expected for every scoped module in this codebase, not unique to `client-address-dry`.

## 5. A create that already matches an existing address is rejected outright, not deduplicated

**Problem:** Submitting a create whose fields match an address the client already has does not silently succeed or merge — the platform rejects it with an error rather than returning the existing record. A caller relying on the find-or-create action for this case gets the matching row without a second request only when it is already present in the currently-loaded list; a create submitted directly, bypassing find-or-create, against a genuine duplicate is rejected.

```typescript
// If this address already exists for the client, the platform rejects
// the create outright rather than silently deduplicating it.
await addresses.useActions().add(duplicateModel);
// -> rejects with a "You already have this address." error
```

> **🧪 For Testers:** Submitting a create that duplicates an address the client already has returns an error response rather than a `2xx` with the existing or a merged record — surface the rejection to the caller rather than treating it as a soft success.

## 6. `remove()` and a soft-succeeded create/update both resolve without throwing — check the returned value

**Problem:** Two unrelated situations both look like "nothing happened, but nothing threw either": `remove()` resolves `undefined` with no request issued when the target address's own delete-eligibility flag is false, and a create/update can settle successfully with no record in the response body. Neither is surfaced as an error — a caller assuming a rejected promise means "blocked" and a populated return value on every successful create/update will occasionally see neither.

> **🧪 For Testers:** An address with its delete-eligibility flag false cannot be removed through `useActions().remove()` — no request is sent and no error is surfaced; the item remains in the list. Separately, a `2xx` create/update is not a guarantee that a record comes back in the response — treat an empty body on success as a distinct, valid outcome to handle, not an error.
