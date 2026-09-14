# delegates — Architecture

## Overview

Three files, no composable: `delegates.services.ts` (the three calls, one
per endpoint), `delegates.mappers.ts` (wire ⇄ model mapping, both
directions), and `delegates.types.ts` (the three public model types). There
is no `.machine.ts`, no `useX.ts`, no scope matrix, no per-actor arm. Every
call takes an explicit `clientId` (for the two owner-side calls) or `hash`
(for the accept call) rather than resolving a target from an active
session — there is no identity seam here to resolve one, because there is no
scope builder in front of these calls at all. This module is deliberately
the smallest slice that lets FE-3036 record a real, driven-through-real-
services grant rather than hand-rolled HTTP.

## Why no composable

FE-3041 (DG-2) owns the module proper: the scoped composable, its actor
arms, per-product/per-ticket scope mutations, sub-resource reads, delegate
removal, and the co-mingled visibility surface that reconciles "what I hold"
with "what's held on my behalf." Scaffolding a composable here — even an
armless one — would pre-empt the scope-collapse decision that story exists
to make. Three plain async functions are the whole module today.

## Why these three calls and no others

FE-3036 needed one thing: a recorded `/self` whose `delegated_ids` is
populated, which only exists as the result of an accepted grant. Producing
that fixture honestly means performing the grant for real — invite, then
accept — rather than inventing the populated state.
`readClientDelegates` exists alongside them because the owner side of the
grant (pending vs. accepted) needed a driven-through-services capture too,
not just the invitee's identity.

## Not modelled, on purpose

- **The admin `skip_invite` / `delegate_client_id` direct-attach path.** It
  lets an admin grant access without ever sending an invitation. FE-3041's
  AC (FR-17/AC-15) bars exposing it from the client portal, and it is not a
  client-portal capability to begin with.
- **Per-product / per-ticket scope mutations** (`AC-DL15`, `AC-DL16`) — the
  invite model carries `contractProductIds` / `ticketIds` and the mapper
  forwards them when set, but no capture exercises them; whether they
  actually narrow the grant is unverified. See
  [gotchas.md #6](./gotchas.md#6-per-productper-ticket-narrowing-is-unverified).
- **The staff arm** (`AC-DL17`, staff acting for a client) — no staff
  services variant, no scope matrix.
- **Delegate removal**, sub-resource reads, and the co-mingled visibility
  surface (what I hold vs. what's held on my behalf).

All four ride FE-3041 and are carried in `delegates.feature` as `@todo`
scenarios specifically so a green traceability run can never quietly
certify them (`delegates.traceability.test.ts`).

## Relationship to `session-store`

This module and `session-store` split the same capability along the
grant/read seam:

| Concern | Owned by |
| --- | --- |
| Invite, accept, list (the grant itself) | `delegates` (this module) |
| `delegatedIds` on the session user, `isDelegated(record)`, `hasDelegatedProducts` | `session-store` (FE-3036) |

`session-store`'s two `/self` captures either side of a real accept
(`get-self-case-not-delegated.json` / `get-self-case-delegated.json`) are
co-located with THIS module's fixtures — captured by the same generator run
— because the populated `delegated_ids` map only exists as the causal result
of the accept this module performs. Neither module re-derives the other's
capability; they share the recorded grant that connects them.
`delegates.delegated-access.int.test.ts`, in this module's own test suite,
asserts that link (`AC-DL11`/`AC-DL12`); the read surface itself
(`delegatedIds`, `isDelegated()`) is documented in `session-store`'s own
docs, not repeated here.

## Fixture generation

`delegates.fixtures.ts` drives the real grant end to end against staging:
the owner invites, the invitee's own correspondence is polled until the
invitation email lands, the hash is parsed out of the email body (the only
client-scope route to it — see
[gotchas.md #1](./gotchas.md#1-the-accept-hash-is-not-readable-from-the-delegate-record--anywhere-at-client-scope)),
the invitee accepts, and `/self` is captured on both sides of that accept.
It revokes the pair's standing grant first so the run performs a real cycle
rather than reading an outcome it did not cause. Run on demand:

```bash
pnpm fixtures:generate delegates
```

## Dependencies

### This module depends on

| Concern | Usage |
| --- | --- |
| Request/query layer | bearer-token attachment, URL construction, response mapping (`select`) for the read; plain mutation calls for invite/accept |
| Shared type-definitions package | `IClientDelegate` — type-level only |

### Modules that depend on this one

None today. Only the module barrel (`packages/headless/src/modules/
index.ts`) re-exports it; no consumer module imports it yet.

## Integration points

- `client-email-history` — the invitee's own correspondence is where the
  acceptance link actually lives; this module does not read email itself,
  and the fixture generator/tests reach it through that module's own
  endpoints (`self/email_history`, `emails/{id}?with=data`).
- `session-store` — the accepted grant surfaces on the invitee's own
  identity via `delegatedIds`; see "Relationship to `session-store`" above.

## Module boundary

The barrel (`index.ts`) exports the three calls and the three model types —
curated named exports only, no `export *`. `delegates.services.ts` and
`delegates.mappers.ts` are `@internal`; nothing outside this module imports
them directly (`@internal/no-cross-module-imports`).
