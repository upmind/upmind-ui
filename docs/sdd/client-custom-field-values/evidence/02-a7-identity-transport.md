# 02 — A7 identity-transport read-backs (both modules)

The A7 clause (`rules/verify-reality-check.md` + its Upmind companion) requires the proof to
assert the **outbound request contract**, never the response payload: the **request URL
retarget** and the **auth identity transport** (which session token was selected, which
acting-as headers were sent).

**Status: RECORDED.** I re-drove both read-backs myself and, critically, verified they *bite* by
applying the identity-seam mutant and observing what the outbound wire collapsed to.

## Module A — `client-custom-fields`

Spec: `client-custom-fields.collection.int.test.ts`, AC-2. Drives a genuine entity retarget:

```ts
useClientCustomFields()
  .as(ScopeActorTypes.CLIENT)
  .for(ClientCustomFieldsContextTypes.VALUES, targetId)   // targetId != session client
```

Assertion helper `assertRetargetIdentityTransport` (`client-custom-fields.int-helpers.ts:372-382`),
applied to the **observed outbound request**:

```ts
expect(observed.url).toContain(`/clients/${targetId}`);                     // URL retarget
expect(observed.headers.authorization ?? observed.headers.Authorization)
  .toBe(`Bearer ${accessToken}`);                                          // session's OWN token
assertNoActingAsHeaders(observed.headers);                                  // no actor swap
```

`assertNoActingAsHeaders` rejects all six of:
`x-acting-as`, `x-impersonate`, `x-on-behalf-of`, `x-staff-id`, `x-admin-id`, `impersonation`.

Plus a negative assertion that the session client's own id was **never** addressed:

```ts
const addressedSession = observed.all()
  .some(request => request.url.includes(`/clients/${sessionClientId}`));
expect(addressedSession).toBe(false);
```

**Identity model asserted:** the session's own bearer, no second token minted, no acting-as
header — because a `VALUES` context id is an **entity** id, not an actor swap. That is the
correct model for this pair (`.as('staff')` is a compile-time error; `.for('client', id)`
compiles nowhere — see [`07`](./07-gaps-and-limits.md)).

### The proof that the assertion is load-bearing — RECORDED

Applying `client-custom-fields.session-hardwired-id.must-fail.patch`, which deletes exactly the
`VALUES` arm of `resolveClientId`, collapsed the observed outbound URL list to the **session**
client. Verbatim from my own run:

```
AssertionError: No request addressed to the retargeted client
aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee. Observed:
["https://api.upmind.io/api/clients/mock-uuid-1?with=custom_fields%2Ccustom_fields.field&lang=en"]
: expected undefined to be defined
```

`mock-uuid-1` is the session client. This is the FE-2824 shape caught on the wire: with the
retarget removed the request silently addresses the session's own resource, and the assertion
goes RED for exactly that reason rather than for an unrelated one.

## Module B — `client-personal-details`

Spec: `client-personal-details.read.int.test.ts`, AC-30 — asserts the **read and the write**
both address an explicitly named profile, and that neither addresses the session's own client:

```ts
const details = usePersonalDetails().as(ScopeActorTypes.SELF).for("profile", OTHER_CLIENT_ID);
await details.useActions().isReady();
await details.useActions().refresh();

expect(OTHER_CLIENT_ID).not.toBe(sessionClientId);
expect(requests.some(r => r.url.includes(`/clients/${OTHER_CLIENT_ID}`))).toBe(true);
expect(requests.some(r => r.url.includes(`/clients/${sessionClientId}`))).toBe(false);

for (const request of requests) {
  assertClientIdentityTransport(request, OTHER_CLIENT_ID, accessToken);   // every request
}
```

`assertClientIdentityTransport` (`client-personal-details.int-helpers.ts:394-404`) is the same
three-part contract — URL contains the target client, `Bearer <session accessToken>`, and
`assertNoActingAsHeaders` — and it is applied to **every** observed request, not just the first.

### Mutant confirmation — RECORDED

`client-personal-details.session-hardwired-id.must-fail.patch` reduces `resolveClientId` to
`computed(() => activeUser.value?.id)`. Result from my own run:

```
× AC-30 reads AND writes clients/{id} for an EXPLICITLY NAMED profile — the read and the
  write address the same client, and it is not the session's own
  -> AssertionError: expected false to be true
     at requests.some(request => request.url.includes(`/clients/${OTHER_...`))
```

## Live-app corroboration — RECORDED

Independently of the specs, the real running app's own outbound traffic showed the same identity
model in the `self` case: the profile read and the persist both addressed
`/api/clients/25d96e76-3ed0-913d-d52c-417482528340` — the session client's own id, resolved
through the scope seam rather than hardwired — with no acting-as headers observed.

## What this does not cover

Only the **client** actor resolves in this pair. Staff-acting-for-a-client is a signed
`Dropped-with-Linear-issue` row, so no staff-identity transport exists to assert — and that is
enforced by the type system, not merely documented (`ScopeActorTypes.STAFF` is `null as never`
in all three scope matrices).
