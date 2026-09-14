# delegates

Delegate access: one account owner shares their account with another party
by email invitation.

**This module is a deliberate stub.** It is the narrow client-portal slice
FE-3036 needed to record a delegated `/self` fixture by driving real
services rather than hand-rolled HTTP. FE-3041 (DG-2) owns the module
proper — the scoped composable, its actor arms, per-product/per-ticket scope
mutations, sub-resource reads, delegate removal, and the co-mingled
visibility surface. Adding any of that here now would pre-empt the
scope-collapse design FE-3041 exists to make.

## Quick Start

```ts
import {
  readClientDelegates,
  inviteClientDelegate,
  acceptDelegateInvite
} from "@upmind-automation/headless";

// The owner's own grants — accepted and pending alike
const delegates = await readClientDelegates(ownerId);

// Invite a party by email
const grant = await inviteClientDelegate(ownerId, {
  email: "invitee@example.com",
  fullDelegate: true
});

// The invitee accepts, using the hash from the invitation email
const accepted = await acceptDelegateInvite(hashFromEmail);
```

There is no composable here — no `.as()`, no `useActions()` /
`useContext()` / `useMeta()`. Call the three functions directly and await
the result. See [Usage](./docs/usage.md) for the complete reference.

## Features

| Feature | Status | Notes |
| --- | --- | --- |
| List an owner's grants (accepted + pending) | ✅ | `readClientDelegates` |
| Invite a party by email, whole-account grant | ✅ | `inviteClientDelegate` |
| Invitee accepts an invitation | ✅ | `acceptDelegateInvite` |
| Per-product / per-ticket scoped grants | ⏳ | wire fields exist, narrowing unverified — `AC-DL15`/`AC-DL16`, `@todo` |
| Staff acting for a client | ⏳ | `AC-DL17`, `@todo` — FE-3041 |
| Delegate removal | ⏳ | FE-3041 |
| Scoped composable / actor arms | ⏳ | FE-3041 (DG-2) — deliberately not scaffolded here |
| Admin `skip_invite` / `delegate_client_id` direct-attach | ❌ not modelled | admin capability, not client-portal — FE-3041 AC FR-17/AC-15 |

## Key Concepts

### Grant

One record naming a party who has been invited to, or holds, delegated
access to an owner's account. `isAccepted` (wire: `active`) is `false` while
the invitation is outstanding, `true` once the invitee has accepted — a
pending row is a first-class managed state, not an error. See
[gotchas.md](./docs/gotchas.md#3-active-on-the-wire-means-accepted-not-enabled).

### The acceptance hash

The invitee's proof they were the one invited. It is never returned on the
delegate record at client scope — the only client-scope route to it is the
invitee's own correspondence (`client-email-history`). See
[gotchas.md](./docs/gotchas.md#1-the-accept-hash-is-not-readable-from-the-delegate-record--anywhere-at-client-scope).

### Relationship to `session-store`

This module owns the **granting** side: invite, accept, list. `session-store`
owns the **reading** side: `delegatedIds` on the session user,
`isDelegated(record)`, `hasDelegatedProducts` (FE-3036). Read the identity
side there — this module does not re-expose it. See
[architecture.md](./docs/architecture.md#relationship-to-session-store).

## Documentation

| Doc | Audience | Content |
| --- | --- | --- |
| **This README** | Everyone | Overview, stub scope, quick start |
| [Foundation](./docs/foundation.md) | Rebuild on another stack | Portable capability spec, no Upmind vocabulary |
| [Usage](./docs/usage.md) | All devs | Full API reference for the three calls |
| [Architecture](./docs/architecture.md) | Contributors | Why no composable, stub boundaries, `session-store` split |
| [Gotchas](./docs/gotchas.md) | All | Sharp edges, with test evidence |
| [Changelog](./docs/CHANGELOG.md) | All | What shipped, what's deliberately not modelled |

## Contract

[`__tests__/delegates.feature`](./__tests__/delegates.feature) is the
non-executable business-logic contract (ADR-020) — 20 scenarios
(`AC-DL1`–`AC-DL20`), three tagged `@todo` (per-product sharing, per-ticket
sharing, the staff arm). `delegates.traceability.test.ts` holds the feature
and the proving specs in step in both directions. Do not treat a `@todo`
scenario as working.

## Fixtures

Every fixture in `__tests__/fixtures/` is a real capture, driven end to end
against staging by `delegates.fixtures.ts` (`pnpm fixtures:generate
delegates`) — no hand-authored wire body backs any test in this module. See
[CHANGELOG.md](./docs/CHANGELOG.md) for the fixture list.
