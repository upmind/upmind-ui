# client-phone-dry Gotchas

Edge cases and behaviours that surprise people. Written for developers wiring this module into UI and for testers designing scenarios — every gotcha carries a testable expected-behaviour statement (these are the behavioural spec for test authoring per ADR-021).

## 1. Staff writes are gated off on the unmodified prod path today — pending, not broken

**Problem:** The staff arm's `add`/`update`/`setDefault`/`remove`/`refresh`/`ensure` are each `undefined` unless the acting staff session carries the matching capability code (`list_client_phones` / `create_client_phone` / `update_client_phone` / `delete_client_phone`). Those codes are read off `functionalities`, a field `/admin/self` already fetches — but `session-store`'s mapped `SessionUser` does not yet carry it through (`session-store.mappers.ts`'s `mapSessionUser` has no `functionalities` key). **Consequence: on today's unmodified prod path, every staff session resolves zero capabilities, so every staff write is `undefined`, regardless of the staff member's real permissions.** This is a verified fact, not a suspicion — the verifier seat re-executed the module's tests against the real `mapSessionUser` and confirmed the field is absent (`docs/sdd/client-phone-dry-smoke/evidence/verify.md`).

The module's own code is correct and would function the moment the field is populated — this is a `session-store` gap, not a `client-phone-dry` defect. The real fix (carrying `functionalities` from `/admin/self` through `mapSessionUser`) is a sibling-module change outside this module's file grant, recommended as a follow-up but not filed as this smoke test's own side effect. See the sibling precedent: `session-store/docs/FE-2825-note.md` documents an analogous session-store field-wiring gap.

```typescript
// ❌ wrong — assumes a staff instance's write actions are always present
await asStaff.useActions().remove(phoneId);

// ✅ right — check first; today this branch is always taken for staff
const staffActions = asStaff.useActions();
if (staffActions.remove) {
  await staffActions.remove(phoneId);
} else {
  // capability absent — today, unconditionally, on the unmodified prod path
}
```

> **🧪 For Testers:** A staff session `.for('client', id)` can always **read** a named client's phone list today. A staff session's **write** actions (`add`/`update`/`setDefault`/`remove`/`ensure`) are `undefined` for every staff session on the current build — this is expected until the `session-store` follow-up lands, not a regression to file against this module.

## 2. `.inBrand(id)` only ever resolves the session's own active brand

**Problem:** D3's brand-country seed reads `useBrand().countryId` — a session-wide singleton with no by-id lookup for any brand other than the one currently active. Passing `.inBrand(someOtherBrandId)` does not fetch or resolve that brand; it silently seeds from whichever brand is _actually_ active in the session, which may not be the one named.

```typescript
// If BRAND_X is not the session's active brand, this does NOT seed
// the new-phone country from BRAND_X's country — it seeds from
// whatever brand the session actually has active.
const phones = useClientPhonesDry().as("self").inBrand(BRAND_X);
```

> **🧪 For Testers:** With `.inBrand()` unset or set to the session's own active brand, a new phone's seeded country matches that brand's configured country. With `.inBrand()` set to any _other_ brand id, the seeded country is still the active brand's — not the named one. This mirrors legacy's own single-active-brand model; it is not a regression.

## 3. No captured wire recordings back this module's own endpoints yet

**Problem:** Unlike `auth`'s or `session-store`'s co-located ADR-025 fixture recordings, `client-phone-dry`'s own list/mutation endpoints have no captured JSON fixtures. The integration test suite drives hand-authored mock responses directly inside the test files (`phoneFixture()`, `listEnvelope()` in `client-phone-dry.cell-b.int.test.ts`) rather than replaying a recording. Session-bootstrap fixtures (the token/`/self` responses used to seed a client+staff session) _are_ real, reused cross-module from `session-store/__tests__/fixtures` — only the phone-endpoint responses themselves are hand-authored.

> **🧪 For Testers:** Sample response bodies in this module's docs are sourced from its own test mocks, not a live capture — treat field values as illustrative, not as a guaranteed live-server byte match, until a real recording exists.

## 4. `useInternals().service` bypasses the staff capability gate — by design

**Problem:** The raw service object exposed via `useInternals().service` calls the admin endpoints directly, with no capability check — the gate lives in the `useActions()` staff arm, one layer up. This is consistent with every other scoped module's `internals` layer (an advanced-access escape hatch for debugging/advanced consumers), not a hole specific to this module — but it means a consumer reaching for `useInternals().service` to "work around" a `undefined` gated action reintroduces exactly the gap #7 capability gate is there to close.

> **🧪 For Testers:** Calling a mutation through `useActions()` respects the capability gate; calling the equivalent method on `useInternals().service` directly does not. This is expected for every scoped module in this codebase, not unique to `client-phone-dry`.

## 5. A staged-import row locks out silently, never with an error

**Problem:** `update`/`setDefault`/`remove` against a phone whose `staged_import` is true resolve `undefined` with **no request issued and no thrown error** — the lockout is a client-side no-op, not a server rejection the caller can catch.

```typescript
// ❌ wrong — assumes a rejected/caught error means "locked"
try {
  await actions.remove(stagedPhoneId);
} catch {
  showLockedMessage(); // never reached — remove() resolves, it doesn't reject
}

// ✅ right — check canEdit first
if (context.canEdit(phone)) {
  await actions.remove(phone.id);
} else {
  showLockedMessage();
}
```

> **🧪 For Testers:** Attempting to edit, set-default, or remove a staged-import row produces no outbound request and no error — the row simply does not change. A non-staged sibling row in the same list mutates normally.

## 6. `remove()` silently no-ops on a non-deletable phone too

**Problem:** Separately from the staged-import lockout, `remove()` also no-ops (resolves `undefined`, no DELETE issued) when the target phone's own `meta.canDelete` is false — the same "no error, just nothing happens" shape as gotcha 5, for a different reason.

> **🧪 For Testers:** A phone with `can_delete: false` cannot be removed through `useActions().remove()` — no request is sent and no error is surfaced; the item remains in the list.

## 7. `ensure()` on the staff scope is create-gated, not just a shared find-or-create

**Problem:** `ensure()` (find-or-create) composes over _whichever_ `loadList`/`add` the current scope resolved to. On the staff scope it is gated on `create_client_phone` identically to `add` — an earlier build gap left it ungated, which would have let a staff session without `create_client_phone` create a phone via `ensure({not-in-list})`, bypassing the capability gate entirely. This was closed; `ensure` is now `undefined` under the same condition `add` is.

> **🧪 For Testers:** A staff session lacking `create_client_phone` has `useActions().ensure === undefined`, identically to `useActions().add`. Granting the capability makes both present.
