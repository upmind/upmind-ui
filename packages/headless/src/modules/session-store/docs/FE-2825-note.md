# FE-2825 §5.1/§5.2 vs the ratified multi-session model

**Status:** ratified 2026-07-02 (product owner). This note supersedes the "security hardening" framing in `docs/sdd/FE-2825/requirements.md` / `design.md` for the two items below. It does not touch anything else in FE-2825.

## Why this note exists

FE-2825 (a Tranche-6 hand-port design, predating the multi-session ratification) proposed two "security hardenings" against session-store, both framed as closing a vulnerability. Neither was checked against a multi-session functional requirement, because no such requirement had been written down yet. The ratified model (`1 cookie per scope, unlimited sessions in the store, activate() regenerates the cookie from the store`) now makes clear that one of the two hardenings would have broken the product outright, and the other targets the wrong problem.

## §5.2 — null token secrets before the sessionStorage write

**Ruling: must NOT be implemented as specified.**

- `design.md:176` (the design's own "Accepted degradation" paragraph): secondary client/staff sessions would reload as metadata-only, "re-auth required to activate."
- The model's requirement 2: inactive sessions' tokens are cached in `sessionStorage` for the whole browsing session specifically so that switching back to one is instant — **zero server round trips**.
- Nulling `access_token`/`refresh_token`/`guest_token` before every `sessionStorage` write removes the one field that requirement depends on for any session that isn't the current cookie-backed one. The moment a session stops being cookie-backed, its token becomes unrecoverable — "instant switch" becomes "re-authenticate." This is a direct, acknowledged-by-the-design-doc-itself contradiction of the multi-session requirement, not a subtle one.
- Do not build a test campaign, or an implementation, around §5.2's metadata-only sessionStorage payload. The correct target is the opposite: every held session's token persists in the cache.

## §5.1 — SET_SESSION broadcast re-hydration ("doorbell")

**Ruling: not a test target as specified; the real gap is different.**

- `requirements.md:9-11` / `design.md:120-137`: proposed that the `SET_SESSION` receiver stop trusting `message.session` and instead call `hydrateFromStorage()` (mirroring the `UNAUTHENTICATED` path), slimming the message to `{ actor, sessionId }`.
- This addresses payload trust (a same-origin script could forge a `SET_SESSION` message), which is a real but narrow concern — `hydrateFromStorage()` re-reads cookie + sessionStorage metadata and wouldn't shrink the multi-session cache itself, so §5.1 in isolation doesn't break requirement 2 the way §5.2 does.
- It also isn't the fix the model actually needs. The model's requirements 3 and 4: switching sessions in one tab is tab-local and **must never broadcast**; only **login** and **logout** broadcast, applied like-for-like (a login upgrades every guest tab; a logout ends the session in every tab currently showing that user; a tab already on a different user is untouched).
- Today's code broadcasts `SET_SESSION` unconditionally on every `add()`/`activate()` call — logins **and** switches to an already-cached session alike. Hardening the receiver's trust in that payload (§5.1) doesn't touch this: it would just make the over-broadcast trustworthy instead of removing it. The gap that actually needs closing is upstream, at the sender — stop broadcasting on switch, and verify login/logout broadcast like-for-like.
- Test target: requirement 4 (like-for-like login/logout sync) and requirement 3 (switches never broadcast) — not the doorbell pattern.

## Citations

- Model: session-store functional requirements, §THE MODEL, requirements 2/3/4 (product owner, ratified 2026-07-02).
- `docs/sdd/FE-2825/design.md:176` — the design's own admission that §5.2 forces re-auth for secondary sessions.
- `docs/sdd/FE-2825/design.md:120-137`, `requirements.md:9-11` — §5.1 doorbell specification.
- See also [Gotchas §7](./gotchas.md#7-sessionstorage-holds-every-sessions-tokens--this-is-the-required-multi-session-cache-not-a-leak) and [Gotchas §8](./gotchas.md#8-cross-tab-set_session-broadcasts-on-every-session-add-not-only-loginlogout).
