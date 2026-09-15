# delegates — Usage & API

Three imperative, one-shot calls. No composable, no reactive state, no
`.as()` / `.for()` — call them directly and await the result.

```ts
import {
  readClientDelegates,
  inviteClientDelegate,
  acceptDelegateInvite,
  type Delegate,
  type DelegateInviteModel,
  type AcceptedDelegateInvite
} from "@upmind-automation/headless";
```

## `readClientDelegates(clientId)`

The delegates an owner has granted on its own account — including rows still
awaiting acceptance.

| Param | Type | Required |
| --- | --- | --- |
| `clientId` | `string` | Yes — the OWNER's client id, whose account the grants are on |

**Returns:** `Promise<Delegate[]>`

```ts
const delegates = await readClientDelegates(ownerId);
delegates[0].isAccepted; // false while the invitation is still outstanding
```

> **🧪 For Testers:** the account read is the one NAMED, never the caller's
> own (`AC-DL5`) — see [gotchas.md](./gotchas.md). A caller with no claim on
> the named account is refused, `403` (`AC-DL13`); a bearer the platform
> rejects is refused, `401` (`AC-DL14`); a temporarily unavailable service is
> refused, `503` (`AC-DL18`). All three REJECT the call — none of them
> resolves as `[]`. An account that has granted nothing genuinely returns
> `[]` (`AC-DL2`) — that is the one case that is NOT an error.

## `inviteClientDelegate(clientId, model)`

Invite a party to hold delegated access to the owner's account. The invitee
need not already hold an account of their own.

| Param | Type | Required |
| --- | --- | --- |
| `clientId` | `string` | Yes — the OWNER's client id, whose account is being shared |
| `model` | `DelegateInviteModel` | Yes |

```ts
type DelegateInviteModel = {
  email: string;
  fullDelegate?: boolean;
  contractProductIds?: string[]; // accepted on the wire; narrowing UNVERIFIED — see gotchas.md #6
  ticketIds?: string[]; // accepted on the wire; narrowing UNVERIFIED — see gotchas.md #6
};
```

**Returns:** `Promise<Delegate>` — the created row, `isAccepted: false`.

```ts
const grant = await inviteClientDelegate(ownerId, {
  email: "invitee@example.com",
  fullDelegate: true
});
```

> **🧪 For Testers:** inviting an address that already holds ACCEPTED access
> is refused, `409` (`AC-DL6`), rather than creating a second row. A
> temporarily unavailable service is refused, `503` (`AC-DL19`) — never
> reported as if the invitation went out. Only the `fullDelegate: true` path
> has a captured fixture; every real invite this module recorded grants the
> whole account.

## `acceptDelegateInvite(hash)`

Called by the INVITEE, authenticated as themselves. `hash` is the credential
carried in the invitation email — it is not readable from the delegate row
at all (see [gotchas.md #1](./gotchas.md#1-the-accept-hash-is-not-readable-from-the-delegate-record--anywhere-at-client-scope)).

| Param | Type | Required |
| --- | --- | --- |
| `hash` | `string` | Yes — the invitation hash carried by the accept link |

**Returns:** `Promise<AcceptedDelegateInvite>` — a type alias of `Delegate`;
the SAME owner-side row, now `isAccepted: true`.

```ts
const accepted = await acceptDelegateInvite(hashFromInvitationEmail);
accepted.isAccepted; // true
accepted.ownerClientId; // whose account this access is on
```

> **🧪 For Testers:** a hash that was never issued is refused, `404`
> (`AC-DL10`), never resolved as if access were granted. A temporarily
> unavailable service is refused, `503` (`AC-DL20`).

## Errors

All three calls REJECT on a non-2xx response. None of them substitutes a
default outcome — a `401`/`403`/`404`/`409`/`503` from the platform surfaces
as a rejected promise, never as an empty array, a fabricated pending row, or
a fabricated accepted row.

```ts
try {
  await readClientDelegates(someAccountId);
} catch (error) {
  // refused — render this distinctly from "granted nothing" (AC-DL2 vs.
  // AC-DL13 / AC-DL14 / AC-DL18)
}
```

## Types

```ts
import type {
  Delegate,
  DelegateInviteModel,
  AcceptedDelegateInvite
} from "@upmind-automation/headless";
```

That is the module's whole public surface today. The services and mappers
are internal (`@internal`) and are not exported — see
[gotchas.md](./gotchas.md) and [architecture.md](./architecture.md).
