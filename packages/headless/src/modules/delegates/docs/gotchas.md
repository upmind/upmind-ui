# delegates — Gotchas

The sharp edges of `readClientDelegates` / `inviteClientDelegate` /
`acceptDelegateInvite`. For anyone consuming this module, or writing tests
against it.

> **🧪 For Testers:** every section below carries a 🧪 expected-behaviour
> statement. Fixture names point at the recorded request/response pairs in
> `__tests__/fixtures/`.

## 1. The accept hash is not readable from the delegate record — anywhere, at client scope

Neither the owner's list nor the invitee's own view of a delegate row
carries the acceptance hash. The ONLY client-scope route to it is the
invitation EMAIL: the invitee's own sent-email history
(`self/email_history`, a `client-email-history` capability), read in full
via `emails/{id}?with=data`, with the hash parsed out of the
`/delegate_access/accept/{hash}` link inside `data.body`.

```ts
// ⚠️ Wrong: there is no field on a Delegate that carries the hash.
// delegates[0].acceptHash — does not exist, on either side's view of the row.

// ✅ Right: the hash lives in the invitation message itself.
// 1. GET self/email_history (client-email-history) — find the invitation
// 2. GET emails/{id}?with=data — parse data.body for the accept link
// 3. acceptDelegateInvite(parsedHash)
```

This is why `delegates.fixtures.ts` polls the invitee's own inbox rather
than reading the hash off any delegate-shaped response — there is no
shortcut.

> **🧪 For Testers:** `AC-DL8` proves the CONTRAST directly — the route
> appears nowhere in what `readClientDelegates` or `inviteClientDelegate`
> return, and in the SAME test, the recorded invitation's own body does
> carry it.

## 2. `acceptDelegateInvite` returns the OWNER'S row, not a distinct acceptance record

`AcceptedDelegateInvite` is a type alias of `Delegate` — the accept endpoint
returns the exact same shape the owner sees when listing, just with
`active` now `true`. An earlier cut of this module's types declared
`clientId`, `objectType` and `objectId` off `IDelegate` (the wider platform
type); the recorded response carries NONE of them on this path, so all
three would have been permanently `undefined` had they shipped — modelled
from the type package rather than from what the wire actually returns.

```ts
// ⚠️ Wrong: expecting a distinct "what did I just get" record
// const { objectType } = await acceptDelegateInvite(hash); // no carrier for this

// ✅ Right: the SAME Delegate shape, isAccepted now true
const accepted = await acceptDelegateInvite(hash);
accepted.isAccepted; // true
accepted.ownerClientId; // whose account this access is on
```

**`objectType` — which would name WHAT was granted (a product, a ticket, or
the whole account) — has no carrier in this response at all.** Surfacing it
needs an endpoint that actually returns it; none of the three this module
calls does.

> **🧪 For Testers:** `AC-DL9` asserts the returned `id` matches the
> OUTSTANDING row's `id` — same record, not a new one.

## 3. `active` on the wire means "accepted", not "enabled"

`mapDelegate` renames `active` to `isAccepted` on purpose. Read literally on
the wire, `active: false` looks like a disabled or switched-off row. All it
actually records is whether the invitee has taken up the invitation yet.

```ts
// A row with isAccepted: false is a NORMAL, expected state — an invitation
// still outstanding — not an error and not a disabled delegate.
const pending = await readClientDelegates(ownerId);
pending[0].isAccepted; // false — just means "not yet accepted"
```

> **🧪 For Testers:** `AC-DL4` is exactly this case — a party invited but
> not yet accepted is still LISTED, with `isAccepted: false`, never omitted
> or errored.

## 4. Reads retry on a 5xx; the invite and accept mutations do not

`readClientDelegates` goes through the platform's query-read path, which
retries a 5xx a few times before surfacing it. `inviteClientDelegate` and
`acceptDelegateInvite` go through the mutation path, which does not retry —
the first 5xx is the one the caller sees.

> **🧪 For Testers:** `AC-DL18`/`AC-DL19`/`AC-DL20` each assert the SAME
> thing — a `503` rejects rather than resolving as an empty list / a
> pending invite / a granted acceptance — but the invite and accept calls
> hit that rejection on the FIRST attempt; only the read gets automatic
> retries first.

## 5. Every failure surfaces loudly — none of the three calls substitutes a default outcome

A `401` (rejected bearer), a `403` (not the owner), a `409` (already a
delegate), a `404` (unissued hash), or a `503` (service unavailable) all
reject the call. None of them is swallowed into "no delegates", "invited
anyway", or "accepted anyway".

```ts
// ⚠️ Wrong: treating a resolved call as success without checking
// await readClientDelegates(someoneElsesId); // this REJECTS on a 403, it
// does not resolve []

// ✅ Right
try {
  await readClientDelegates(namedId);
} catch {
  // refused — render this distinctly from "granted nothing" (AC-DL2 vs
  // AC-DL13 / AC-DL14 / AC-DL18)
}
```

## 6. Per-product/per-ticket narrowing is UNVERIFIED

`DelegateInviteModel` carries `contractProductIds` / `ticketIds`, and
`mapDelegateInvite` forwards them onto the wire as `contract_product_ids` /
`ticket_ids` when set. **No capture exercises either field** — every
recorded invite in this module's fixtures grants the whole account
(`full_delegate: true`). Whether supplying either list actually narrows the
resulting grant, rather than the platform silently granting the whole
account regardless, has not been observed. `AC-DL15` / `AC-DL16` in
`delegates.feature` are tagged `@todo` for exactly this reason — do not
treat per-product or per-ticket sharing as working.

## 7. The staff arm does not exist

`AC-DL17` ("staff acting for a client manages that client's delegates") is
tagged `@todo`. There is no staff services variant, no scope matrix,
nothing staff-shaped anywhere in this module. Every one of the three calls
is a client-portal call, full stop.

## 8. This module owns granting; `session-store` owns reading the result

`readClientDelegates` / `inviteClientDelegate` / `acceptDelegateInvite`
never report the accepted access back onto the invitee's own identity —
that is `session-store`'s `delegatedIds` / `isDelegated()` /
`hasDelegatedProducts`. This module's own
`delegates.delegated-access.int.test.ts` asserts the LINK between the two
(accepting here populates `session-store`'s `delegatedIds`), but the read
surface itself lives there, not here.

> **🧪 For Testers:** don't add a "what does the invitee now hold"
> assertion to this module's own service tests — it belongs against
> `session-store`.

## Edge cases

| Scenario | Expected behaviour | Notes |
| --- | --- | --- |
| Account has granted nobody access | `readClientDelegates` resolves `[]`, not an error | `AC-DL2` — `get-clients-id-delegates-case-no-delegates.json`, real `total: 0` |
| Caller names an account they don't own | `readClientDelegates` rejects, `403` | `AC-DL13` |
| Re-inviting an address that already holds accepted access | `inviteClientDelegate` rejects, `409` | `AC-DL6` |
| Accepting a hash that was never issued | `acceptDelegateInvite` rejects, `404` | `AC-DL10` |
| Service unavailable on any of the three calls | rejects, `503` — no default substituted | `AC-DL18`/`AC-DL19`/`AC-DL20` |
