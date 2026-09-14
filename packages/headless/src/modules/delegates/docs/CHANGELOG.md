# Changelog

All notable changes to the `delegates` module are documented here. Format
follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **`readClientDelegates(clientId)`** — the grants an owner has made on its
  own account, accepted and pending alike. Retries a transient 5xx a few
  times before surfacing it — see [gotchas.md #4](./gotchas.md#4-reads-retry-on-a-5xx-the-invite-and-accept-mutations-do-not).
- **`inviteClientDelegate(clientId, model)`** — invite a party by email;
  `fullDelegate: true` is the only path exercised so far. `contractProductIds`
  / `ticketIds` are accepted on the model and forwarded to the wire, but
  narrowing behaviour is unverified — see
  [gotchas.md #6](./gotchas.md#6-per-productper-ticket-narrowing-is-unverified).
- **`acceptDelegateInvite(hash)`** — called by the invitee; turns the
  owner's outstanding row into an active one. `AcceptedDelegateInvite` is a
  type alias of `Delegate` — the endpoint returns the SAME owner-side row.
- **`__tests__/delegates.feature`** (ADR-020) — the module's non-executable
  business-logic contract, 20 scenarios (`AC-DL1`–`AC-DL20`), three tagged
  `@todo` (per-product sharing, per-ticket sharing, the staff arm).
- **`delegates.traceability.test.ts`** — holds the feature file and the
  proving specs in step in both directions; a capability losing its only
  proof, or a spec naming a scenario the feature no longer carries, fails
  this test.
- **Recorded fixtures** — driven end to end against staging by
  `delegates.fixtures.ts` (`pnpm fixtures:generate delegates`): a real
  invite → (invitee's own correspondence) → accept cycle, captured on both
  sides, plus the 401/403/404/409/503 negative paths.

### Scope — this is a stub

This module is deliberately the narrow client-portal slice FE-3036 needed
to record a delegated `/self` by driving real services rather than
hand-rolled HTTP. FE-3041 (DG-2) owns the module proper — the scoped
composable, its actor arms, per-product/per-ticket scope mutations,
sub-resource reads, delegate removal, and the co-mingled visibility
surface. See [architecture.md](./architecture.md) for what that means
structurally and [gotchas.md](./gotchas.md) for the sharp edges this scope
leaves behind.

### Not modelled

- The admin `skip_invite` / `delegate_client_id` direct-attach path
  (FE-3041 AC FR-17/AC-15 — an admin capability, not a client-portal one).
- Delegate removal, sub-resource reads, the co-mingled visibility surface.
- A working staff arm (`AC-DL17`, `@todo`).
- Verified per-product / per-ticket narrowing (`AC-DL15`/`AC-DL16`, `@todo`
  — the wire fields exist and are forwarded, but no capture exercises
  them).

### Recorded fixtures

| Fixture | Covers |
| --- | --- |
| `get-clients-id-delegates-case-accepted.json` | the owner's list, one accepted row |
| `get-clients-id-delegates-case-pending.json` | the owner's list, one outstanding row |
| `get-clients-id-delegates-case-no-delegates.json` | an account granting nobody access (`total: 0`) |
| `post-clients-id-delegates.json` | the owner's invite, `active: false` on creation |
| `post-clients-id-delegates-case-already-a-delegate.json` | re-inviting an already-accepted party (409) |
| `patch-delegate-access-accept-{hash}.json` | the invitee's real accept, `active: true` |
| `patch-delegate-access-accept-notarealinvitehash.json` | accepting an unissued hash (404) |
| `get-self-email-history-case-delegate-invitation.json` | the invitation reaching the invitee's own correspondence |
| `get-emails-id.json` | the invitation's full body — the only client-scope route to the accept hash |
| `get-self-case-delegated.json` / `get-self-case-not-delegated.json` | the SAME invitee's identity, either side of the real accept — shared with `session-store` (FE-3036) |
| `get-self-case-grantor.json` | the owner's own identity — holds no delegated access itself |
| `get-clients-id-delegates-case-not-the-owner.json` | a client reading an account it does not own (403) |
| `get-clients-id-delegates-case-rejected-bearer.json` | a bearer the brand refuses (401) |
| `get-clients-id-delegates-case-service-unavailable.json` / `post-clients-id-delegates-case-service-unavailable.json` / `patch-delegate-access-accept-notarealinvitehash-case-service-unavailable.json` | a forced 503 on each of the three operations |

### Notes

- The accept capture's filename carries the real hash that run issued and
  spent; a re-record mints a new hash into a new filename, and the
  generator prunes the superseded one.
- Today's grant is account-level, so the recorded `delegated_ids` on the
  accepted-side `/self` fixture carries the `client` key alone — see
  [gotchas.md #6](./gotchas.md#6-per-productper-ticket-narrowing-is-unverified).
