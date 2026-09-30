# client-notifications — Gotchas

The sharp edges of the account's notification-preferences grid and its draft editor. For anyone consuming `useClientNotifications` / `useClientNotificationsManager`, or writing tests against them. Several of these have caused real, repeated defects in this module's history — read this before you rediscover one.

> This module has not been re-verified since its last round of code changes. Every item below is a description of what the code and its tests currently do, not a certification that the behaviour is correct, complete, or production-ready. Where an earlier verification round is cited, its findings are recorded as historical context, not as a current, re-confirmed status.

## 1. The opt-out inversion — read the model positively, never the wire

The model you read (`NotificationsModel.preferences`, `isEnabled(...)`) is positive: `true` means the notification is enabled. The server's own list is negative: a row present means _disabled_; absence means _enabled_. This module performs the conversion at exactly two boundaries — building the draft/collection view from the read, and projecting the draft back to a save body — and nowhere else.

> **👩‍💻 For Developers:** If you ever bypass this module and call the opt-out endpoints directly, remember there is no "enabled" flag on the wire at all — only a list of what's off.

This inversion is the root cause of most of this module's historical defects (see items 3 and 4 below, both of which are inversion-adjacent failure modes) and is the single fact most worth getting right first in any reimplementation.

## 2. The guest link token is deliberately unreachable from the public surface

A link-token-identified caller (`.withId(token)` with no session) is transported by URL query parameter, never an `Authorization` header, and the token also salts the opt-out read/write cache key together with the account id. Both limbs of the salt are load-bearing: account id alone collides two different guests (both resolve `undefined`); token alone collides two different signed-in accounts (both resolve absent). An unsalted key would serve one identity's private preferences to a different request.

The token itself is not assigned into the editor's held state at all — it lives only in the closure of the composable that resolved it, and is threaded directly into the two functions that need it. This means it cannot be found by walking the debugging/internals surface, cannot appear in a thrown construction error's payload, and cannot be republished by a future whole-state passthrough, because a value never assigned into held state is not there to pass through.

> **🧪 For Testers:** Two different link tokens must read and save completely independently — confirm this explicitly rather than assuming cache isolation "just works."

## 3. `limit: 0` is load-bearing, not a preference

All three reads (topics, channels, opt-outs) always request the complete set. Because of the inversion (item 1), a truncated opt-out read does not fail safe — a missing row renders as **enabled**, not as "unknown." There is deliberately no filter branch and no sort member declared on the criteria schema for any of the three reads: no endpoint here is proven to accept either, and an unrecognised sort parameter on this platform is answered with an HTTP 500 rather than being ignored. Do not add a filter bar or a sort control to this module's UI without first confirming the server accepts the parameter you'd be sending.

## 4. The locked-topic rule is two-sided

A topic with `canOptOut === false` cannot be **newly** disabled, through any surface — the single-pair toggle, the per-topic bulk actions, or an arbitrary replacement draft handed to `update(value)`. The guard is enforced at the point of the write, not only by disabling a UI control.

The rule only ever blocks a _new_ disabled row on a locked topic. A pair that was **already** disabled on that topic before it became locked survives an unrelated save unchanged. A version of this guard that unconditionally strips every locked-topic row on every save looks correct until exactly that case — and this exact regression has happened twice in this module's history. If you touch this guard, verify both directions: a fresh attempt to disable a locked pair is refused, AND a pre-existing disabled pair on a now-locked topic survives an unrelated save.

## 5. The editor's grid is driven through the generated form, by design

The topic x channel grid has no per-cell toggle component. It is driven through the form definition instead: the editor publishes a real, non-empty `schema`/`uischema` pair (one boolean field per topic x channel pair, grouped by topic) generated at read time from the account's own topics and channels, and any generic form renderer can display and save that grid from it. If a grid appears not to be interactive in a given surface, check whether that surface is reading the form definition, not whether the capability exists.

## 6. A save in flight swallows a second save attempt — by design

Calling `update()` again while a previous save has not yet settled is not queued and is not merged — this is a deliberate, ruled-on platform behaviour, not a defect, and no fix is planned or intended. Do not "fix" this by adding a save queue without a fresh decision to do so.

## 7. The late-session refresh path — an open, unresolved risk, not a closed one

There is a construction-time mechanism intended to unstick an editor scope that has no resolved identity yet at the moment it is opened (the session may still be restoring when the composable is first called): once the session settles, a refresh signal is sent, but only while the scope is still in its initial waiting state — never once the scope has already become usable.

This narrows one specific misfire (a signal that would otherwise wipe an in-progress, unsaved draft on an already-usable editor by re-running the initial load), but it does **not** restore a general guarantee that _waiting for the editor to become ready is sufficient protection against a later reload wiping unsaved work_. That general premise has been checked directly against the landed code and found false in at least one path, and no further fix against it is currently planned — it is recorded as the consuming caller's own contract to hold, not this module's to guarantee. A caller building a long-lived editor session against this module should not assume "I awaited readiness once at open time" is a durable guarantee against a later, external reload event; re-test this specific interaction if your integration depends on it, rather than trusting this note as a closed item.

## 8. Staff cannot act for a client here — and there is no context to widen into

Every one of the three server resources this module reads and writes is account-implicit: none of them carry a target-account identifier a staff caller could redirect against. Both scope matrices declare every actor cell unusable for `.for(...)`, and no context enum is published for a future capability to widen into. This is a recorded platform fact (no server-side address exists to retarget against today), not an oversight — do not add a context enum "for later" without first confirming the server side actually supports addressing another account on these endpoints.

## 9. A `mandatory` field is declared on the topic type but never appears on a captured row

`NotificationTopic`'s `mandatory` field is typed optional and is genuinely absent on every topic row this module's recorded fixtures carry — nothing reads it. The locked/mandatory-badge behaviour you see in the UI is derived entirely from `canOptOut`, the one field that is actually present and actually read. Do not wire a consumer to `mandatory` expecting it to carry a value; confirm against a live capture first if you need it.

## 10. Independent status — read this before trusting any capability claim in this doc set as final

The most recent independent check of this code's actual behaviour concluded the module was not yet ready to ship, citing two specific problems: a collection readiness signal that reported "ready" after a failed read (rendering every preference as falsely enabled), and an editor readiness signal that never settled at all after a failed read. That same check also found that several documented state flags (`isValid`, `isProcessing`, the collection's `error`, and others) had no test in the suite that would fail if the flag were replaced by a constant that never changed.

Code changes addressing both readiness problems (now resolving a genuine `false` on error rather than hanging or reporting an unconditional `true`) are present in the current source, and tests targeting some of the previously-toothless assertions have since been added. **Neither has been independently re-checked.** Treat every "the readiness signal correctly reports X" statement elsewhere in this doc set as a description of the code's current intent, not as a re-confirmed fact, until a fresh independent check has run against this exact commit.

## 11. The internal planning notes do not travel with the branch

The requirements, design notes, and task breakdown this module's build relied on are excluded from version control in this repository and exist only in the worktree that produced them. A fresh clone of this branch receives the code and its tests, but none of the planning record, acceptance criteria, or prior rulings behind it. If you are working from a fresh clone, do not assume any planning artifact referenced elsewhere is available to you locally.
