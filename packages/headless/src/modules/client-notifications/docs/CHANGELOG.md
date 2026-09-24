# Changelog

All notable changes to the `client-notifications` module.

## [Unreleased]

This module has not shipped a tagged release. The entries below record its conversion from a Vue component and a subsequent round of fixes, in the order they landed on this branch. See [gotchas.md](./gotchas.md#11-independent-status--read-this-before-trusting-any-capability-claim-in-this-doc-set-as-final) for this module's current status — these entries describe what changed, not a certification that the result has been independently re-checked.

### Added

- The scoped, hybrid conversion of the account's notification-preferences page into two composables: `useClientNotifications` (read-only collection) and `useClientNotificationsManager` (draft editor backed by a full-set save).
- A generated form definition (`schema`/`uischema`) for the editor — one boolean field per topic x channel pair, grouped by topic, derived at read time from the account's own topics and channels. This is what makes the grid driveable through the playground's existing generic form-handoff path, with no change to the shared playground runtime.
- A locked-topic write guard, enforced at the action layer (`toggle`/`selectAll`/`clearAll`) and again inside `update(value)` for an arbitrary replacement draft — two-sided: a new disabled row on a locked topic is refused; a pre-existing one survives an unrelated save.
- A clean-draft re-seed: while the editor is not dirty, an external change to the server-held opt-out set (another tab, a collection refresh) is reflected into the draft automatically; a dirty draft is left alone.
- Identity-and-token cache salting on the opt-out read and save: the cache key carries both the resolved account id and the guest link token together, so two different tokens (or a token vs. a signed-in account) never share a cached result.
- Containment of the guest link token: it is resolved once and threaded directly to the two functions that need it, never assigned into published state, so it cannot be read back off any context/meta/internals surface or embedded in a thrown error's payload.
- Four integration tests that had previously asserted a value the implementation could not make false were rewritten so each is capable of failing against a real regression.

### Changed

- Collection readiness (`isReady()`) changed from resolving `true` once all three reads have completed, to resolving `!hasError` — a failed read now reports not-ready rather than being indistinguishable from a successful one.
- Editor readiness (`isReady()`) changed from potentially hanging forever when the underlying save-machine reaches its terminal failure state, to resolving `false`.
- The collection's queries are minted once per scope and threaded into the editor's load step, rather than re-minted on every re-entry to the editor's loading state.
- The construction-time session-settle refresh is now gated on the editor still being in its initial waiting state, so it can no longer fire against an editor that has already become usable.

### Removed

- The prior services implementation's direct read of the ambient session's active-user id was replaced with the platform's shared identity-resolution seam, so the module's resolved identity is no longer independent of the scope it was opened against.
- A locked-topic filter previously implemented at the schema-validation layer was removed — validation's resolved return value was never consulted by the underlying save machine, so the filter was inert. The real guard now lives at the action/update layer (see "Added").

### Fixed

- A save that shrank the opt-out set, and a save immediately following a prior save, both previously risked corrupting the draft or leaving stale dirty state; both paths are now covered by dedicated tests.
- A rejected save previously could not be retried with a bare retry event in every settled-error state; a retry now resends the current draft explicitly.
- `update(value)` called with the current, unchanged draft previously bypassed the "nothing to save" gate and issued a real no-op write; the gate now binds the effective model regardless of how `update` was called.
- The opt-outs read/write cache key was unsalted by identity in an earlier revision of this conversion; it is now salted by account id and link token together (see "Added").

### Not captured

- **Staff acting on behalf of a client.** Every endpoint this module reads and writes is account-implicit; no server-side address exists to retarget against. Not ported because there is nothing to port against.
- **A client-side re-seed reacting to another tab's edit while genuinely mid-flight on a competing save.** Two-tab last-write-wins on a concurrent save is not specifically covered.
- **The oracle page's own uncapped polling readiness mechanism.** Deliberately not carried over; this module's readiness resolves off request-settlement state instead of a timer.

## Migration Guide

### Getting an instance

Before (the oracle's page-local composable), the notification-preferences editor was opened as part of a single page component with no reusable scoped API. After conversion:

```ts
import {
  ScopeActorTypes,
  useClientNotifications,
  useClientNotificationsManager
} from "@upmind-automation/headless";

const list = useClientNotifications().as(ScopeActorTypes.CLIENT);
const editor = useClientNotificationsManager().as(ScopeActorTypes.CLIENT);
```

### Reading state — the four-layer destructure

Both composables return `useActions()` / `useContext()` / `useMeta()` / `useInternals()` factories rather than a flat object — call the one you need:

```ts
import type { UseClientNotifications } from "@upmind-automation/headless";
declare const list: ReturnType<UseClientNotifications["fresh"]>;

const { topics, channels, optOuts, isEnabled } = list.useContext();
const { isAvailable, isLoading } = list.useMeta();
```

### The positive/negative model split

A caller integrating directly against the platform's opt-out endpoint previously had to read and write the negative (disabled-only) list by hand. This module now performs that inversion internally — read `useContext().isEnabled(topicId, channelId)` / `model.preferences[...]` for the positive answer, and never construct an opt-out row list directly unless you are calling `update(value)` with a full replacement `NotificationsModel` (which is still in the positive shape — the negative projection happens inside `update`, not before it).

### The locked-topic guard now applies at the write, not only in the UI

A caller that previously filtered locked topics out of its own request payload by hand no longer needs to (and should not, since a hand-filtered payload for a topic that was legitimately already opted out before it locked would incorrectly drop that pre-existing row). Send the full effective draft and let `update()` apply the two-sided guard.
