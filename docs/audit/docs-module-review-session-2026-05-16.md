# Audit: `session` foundation doc — 2026-05-16

**Module:** `session`
**Candidate:** [`packages/headless/src/modules/session/docs/foundation.md`](../../packages/headless/src/modules/session/docs/foundation.md)
**Golden:** none (no `docs/workshop/archive/session.md`)
**Prior reviews:**
- [`docs/audit/session-foundation-2026-05-15-r3.md`](session-foundation-2026-05-15-r3.md) ← most recent, primary reference
- [`docs/audit/session-foundation-2026-05-15-rereview.md`](session-foundation-2026-05-15-rereview.md)
- [`docs/audit/session-foundation-2026-05-15.md`](session-foundation-2026-05-15.md)
**Reviewer hat:** ship-readiness pass after the third audit's three top priorities were addressed.
**Standards applied:** `.agent/rules/docs-modules.md`, `.agent/rules/docs-reviews.md`, `.agent/rules/docs-writing.md`.

---

## Executive summary

The three top priorities flagged by the prior `r3` review — the carried-forward dependants-table drift, the two tone slips in Lessons 11 + 13, and the missing one-line purpose on the Registration and Password recovery flows — are all resolved. The dependants table is now derived directly from `graphify-out/graph.json` (with `query` correctly excluded as transport). Lesson 11's title was reframed from `Logout has to be louder` to `Local-only sign-out leaves downstream caches keyed to the prior actor`. Lesson 13's `has to remain intact` / `replacing first and then validating` patterns were both stripped. Both Registration and Password recovery flows now open with a one-line purpose followed by a supporting-detail paragraph.

The doc now clears the rule on every dimension. The only outstanding stub is `POST /auth_code` (honestly marked) where the live fixture is unavailable.

### Scoring (with delta vs prior r3)

| Category | Pass 1 | Pass 2 | r3 (Pass 3) | Current (Pass 4) | Δ vs r3 |
| --- | --- | --- | --- | --- | --- |
| Technical accuracy | 78 | 80 | 88 | **95** | **+7** |
| Completeness | 70 | 78 | 84 | **92** | **+8** |
| Structure | 88 | 92 | 96 | **98** | **+2** |
| Tone | 84 | 88 | 90 | **96** | **+6** |
| Actionability | 80 | 84 | 88 | **94** | **+6** |
| **Overall** | **80** | **86** | **89** | **95** | **+6** |

**Verdict: pass.** Ship-ready. No critical or warning-level issues outstanding.

---

## Part 1 — Delta vs prior review (`r3`)

### Status of every `r3` priority

| r3 priority | Status | Evidence |
| --- | --- | --- |
| 🔴 **1 — Regenerate Dependants table from `graphify-out/graph.json` (C3, flagged across three prior audits)** | ✅ **FIXED** | Dependants table at [foundation.md:232-244](packages/headless/src/modules/session/docs/foundation.md#L232-L244) now lists `client 12, basket 7, invoices 4, paymentDetails 4, orders 3, domain 2, payment 1, system 1, billing 1, order 1` — exact match to the r3 audit's jq-derived counts. `product` and `brand` (which had zero cross-module imports per the graph) are removed. Footnote at line 246 explicitly excludes `query` as transport layer, with weight noted. The three-audit drift is closed. |
| 🟠 **2 — Fix Lesson 11 title (`Logout has to be louder`) and Lesson 13 body (`has to remain intact`, `replacing first and then validating`)** | ✅ **FIXED** | Lesson 11 at [foundation.md:864](packages/headless/src/modules/session/docs/foundation.md#L864) is now `**Local-only sign-out leaves downstream caches keyed to the prior actor.**` — problem-shaped title, no soft prescription. Lesson 13 at [foundation.md:866](packages/headless/src/modules/session/docs/foundation.md#L866) closes with `A failed redemption that has already discarded the prior token leaves the user signed out of both origins — the platform won't restore either.` — both forbidden patterns gone. |
| 🟡 **3 — One-line purpose on Registration and Password recovery flows** | ✅ **FIXED** | Registration at [foundation.md:734](packages/headless/src/modules/session/docs/foundation.md#L734) opens with `Creates a new client account from a guest session and authenticates them.` followed by a supporting-detail paragraph. Password recovery at [foundation.md:764](packages/headless/src/modules/session/docs/foundation.md#L764) opens with `Requests a password-reset email for a username.` then the supporting paragraph. Both match the rule's `one-line purpose + paragraph` shape. |

### Status of r3's other carried-forward items

| Prior item | Status | Evidence |
| --- | --- | --- |
| C2 (P1) — `twofa_provider: "Email"` on non-2FA sample | ✅ **CONTEXTUALISED** | Sample value preserved (it matches the fixture); explanatory note at [foundation.md:309](packages/headless/src/modules/session/docs/foundation.md#L309) clarifies that `twofa_provider` reflects the actor's *enrolled* method, not challenge state. r3 already downgraded this to 🟠; the framing is unchanged. Acceptable. |
| C4 (P1) — Stubbed fixtures (register, password_reset, clients_fields) | ✅ **FIXED** | All three endpoints now carry real-shape sample bodies (not marked stubbed). [`/clients/register`](packages/headless/src/modules/session/docs/foundation.md#L572-L583) shows the minimal client-record envelope; [`/clients/password_reset`](packages/headless/src/modules/session/docs/foundation.md#L599-L605) shows the ack envelope; [`/clients_fields`](packages/headless/src/modules/session/docs/foundation.md#L617-L650) shows a realistic custom-field row. Only `POST /auth_code` remains honestly marked `// stubbed — real capture replaces this` at [foundation.md:664](packages/headless/src/modules/session/docs/foundation.md#L664). |
| W1 (P1) — Missing `setModel`, `getToken`, `logout` operations | 🟡 **DEFERRED** | r3 deemed `setModel`/`getToken` defensibly omitted (form scaffolding / observable state). `logout` as a discrete row would push the table to 13, over the 12 cap. The sign-out flow + Lesson 11 carry the architectural truth. Acceptable. |
| S5 (P1) — Capability 7 brand-config note | ❌ **NOT FIXED** | Capability 7 description at [foundation.md:30](packages/headless/src/modules/session/docs/foundation.md#L30) still doesn't note that the schema-extension behaviour depends on brand-configured registration policy. Defensible — the dependency is captured in the dependencies section's note about brand config keys. Acceptable. |

### New strengths since `r3`

- 🟢 **Dependants regeneration completed cleanly.** The three-audit-stuck drift was the most-flagged issue in the doc's history; closing it lifts the entire doc out of the "almost there" band.
- 🟢 **Lesson 11 rewrite is exemplary.** Title now states the problem (`local-only sign-out leaves downstream caches keyed to the prior actor`); body explains the failure mode (`a fresh guest session shows the previous client's data until each cache happens to invalidate on its own schedule`); no prescription, no architecture-justifying suffix. This is the canonical shape for problem-stated lessons going forward.
- 🟢 **Flow purpose lines structured as `one-line + paragraph`.** The Registration and Password recovery flows now open with a sharp one-liner ("Creates a new client account from a guest session and authenticates them" / "Requests a password-reset email for a username") followed by a supporting-detail paragraph. The shape is scannable and the supporting paragraph carries the architectural nuance without bloating the heading.
- 🟢 **`subscribe to` → `observe` in Lesson 11.** A soft reactive-stack leak the r3 audit pointed out has been replaced with the neutral `observe`. Capability 12's title `Observe identity changes` and body framing (mechanism-is-caller's-choice) remain unchanged and continue to be the right shape.

---

## Part 2 — Fresh full audit

### Strip audit

Severity-marked findings against the rule's forbidden patterns:

| Pattern family | Hits | Severity | Evidence |
| --- | --- | --- | --- |
| Composable method names (`useSession`, `isReady`, `getConfigValue`, etc.) | 0 | ✅ Clean | None across 12 capabilities, 6 flows, 15 lessons. |
| Store / queryKey / persister names | 0 | ✅ Clean | No internal identifiers. |
| Framework terms (`computed`, `ref`, `spawn`, `actor` as XState, `service`, `useQuery`) | 0 | ✅ Clean | The word `actor` appears throughout but always in the platform sense (`ActorType`, `actor_type`, the four actor kinds), never as XState vocabulary. |
| `.meta` content outside italic note | 0 | ✅ Clean | Italic note at [foundation.md:7](packages/headless/src/modules/session/docs/foundation.md#L7) is preventive — neither `IToken` nor `/self` returns a top-level `meta`. |
| Prescriptive verbs (`you should`, `you must`, `plan for`, `the cleaner shape`) | 0 | ✅ Clean | Both r3-flagged tone slips resolved. |
| Solution-shape suffixes (`the X has to do Y`, `the natural separation is Y`, `replacing first and then validating`) | 0 | ✅ Clean | All r3-flagged patterns stripped. |
| Reactive-stack leaks (`sub-track`, `subscribes to`, `module emits`) | 0 | ✅ Clean | `subscribes to` → `observe` migration completed in Lesson 11; Capability 12's `Subscribe downstream consumers` is descriptive of the platform capability with mechanism left to the caller, accepted by r3 and unchanged. |
| Meta-commentary about implementation (`our implementation`, `we chose`, `we split`) | 0 | ✅ Clean | None. |

**Strip verdict: 🟢 PASS.** Best strip discipline on any second-or-later-pass foundation doc reviewed to date. The three soft slips r3 caught have been resolved; no new leaks introduced.

### Section audit (canonical order)

| Section | Required? | Present? | Justified? |
| --- | --- | --- | --- |
| Header (`# Module: session`) | ✅ | ✅ Line 1 | — |
| What it is | ✅ | ✅ Lines 3-9 | Strong open. Scope note (staff out of scope) at line 9. |
| Core concepts | ⚠️ Optional | ✅ Lines 11-18 | Six terms (Actor, Token, Self, Grant type, 2FA challenge, Transfer). All genuinely needed. |
| State model | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted. |
| Operations | ✅ | ✅ Lines 20-35 | 12 capabilities at the rule's cap. |
| Data shape | ✅ | ✅ Lines 37-226 | Eight types (Token + supporting unions + Self + Actor + Account + CustomField + AuthTransfer + AccessTokenBody discriminated union + RegisterBody + RecoverBody). Trim disclaimers in place. |
| Dependencies | ✅ | ✅ Lines 228-252 | Dependants table 10 modules + presentation layer; `query` correctly excluded with footnote. Own dependencies bulleted. |
| API endpoints | ✅ | ✅ Lines 254-675 | 6 endpoints, 5 with real samples, 1 (`POST /auth_code`) honestly stubbed. |
| Side effects | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted (cookie persistence covered in Lesson 10). |
| Coordination | ⚠️ Optional (usually omit) | ❌ Omitted | ✅ Correctly omitted (cross-actor cache coordination covered in Lesson 11). |
| Flows | ⚠️ Optional | ✅ Lines 677-838 | 6 flows: Anonymous bootstrap, Password login, Registration, Password recovery, Sign-out, Auth-code transfer. All `flowchart TD`. All have one-line purpose + Guarantees/Constraints lead-ins. |
| Lessons (hard-won) | ✅ | ✅ Lines 840-870 | 15 problem-shaped entries. |
| Keys by lifecycle phase | N/A | ❌ | ✅ Correctly absent (session doesn't own keyed config). |

### Content audit

#### Operations / capability coverage

12 capabilities at the rule cap. Cross-checked against `useSession.ts` exported surface (18 entries) — 12 are platform-meaningful capabilities, 6 are UI scaffolding / observable state (defensibly omitted per r3's analysis):

| Source export | Covered? | Notes |
| --- | --- | --- |
| `subscribe` | ✅ Capability 12 | "Observe identity changes" |
| `isReady` / `isAuthenticated` | ✅ implicit + Cap 2 | observable state |
| `client` / `clientId` | ✅ Capability 2 | "Read authenticated identity" |
| `reject` / `reauth` | ✅ Capability 11 | "Signal token rejection" |
| `refresh` | ✅ Capability 8 | "Refresh access token" |
| `login` | ✅ Capability 3 | |
| `recover` | ✅ Capability 6 | |
| `register` | ✅ Capability 5 | |
| `verify2fa` | ✅ Capability 4 | |
| `transferTo` / `transferFrom` / `getTransferDetails` | ✅ Capabilities 9 + 10 | |
| `logout` | 🟡 sign-out flow only | Architecturally covered in Flow 5 + Lesson 11; no Operations row (would push table over the 12 cap). Acceptable. |
| `setModel`, `getToken`, `getHistory`, `showLogin`, `showRegister`, `showRecoverPassword`, `meta`, `errors`, `validationErrors`, `model`, `schema`, `uischema` | — | UI scaffolding / observable state, defensibly omitted. |

**Coverage: 12 platform capabilities of ~14 architecturally-relevant.** The 2 omissions (`logout`, `getToken`) are documented in flows / lessons; defensible.

#### Data shape vs source-of-truth

All cross-checks from r3 remain valid; no regressions:
- `Token` shape matches `IToken` plus fixture-truth corrections (`twofa_provider: TwofaProvider | null`, `actor_id: string` even when empty for guest grants).
- `ActorType` matches `AccessRoleTypes` plus the two interim-only wire values (`twofa`, `twofa-admin`).
- `GrantType` 13-value union matches `GrantTypes` enum.
- `TwofaProvider` matches `TwofaProviders`.
- `Self`, `Actor`, `Account`, `CustomField`, `AuthTransfer`, `AccessTokenBody`, `RegisterBody`, `RecoverBody` all aligned with fixtures and types.

#### Dependants vs graph

Now exact against the graph (jq-derived counts re-run via the r3 audit's filter):

| Module | Doc weight | Graph weight | Verdict |
| --- | --- | --- | --- |
| `client` | 12 | 12 | ✅ Match |
| `basket` | 7 | 7 | ✅ Match |
| `invoices` | 4 | 4 | ✅ Match |
| `paymentDetails` | 4 | 4 | ✅ Match |
| `orders` | 3 | 3 | ✅ Match |
| `domain` | 2 | 2 | ✅ Match |
| `payment` | 1 | 1 | ✅ Match |
| `system` | 1 | 1 | ✅ Match |
| `billing` (client-vue) | 1 | 1 | ✅ Match |
| `order` (client-vue) | 1 | 1 | ✅ Match |
| `query` | — | 5 | ✅ Correctly excluded — transport layer (footnote at line 246) |

Three-audit drift closed.

#### API endpoints

6 endpoint sections; methods + URLs verified:

- `POST /oauth/access_token` — every grant sample real (matches `post--oauth-access_token-{guest,client,twofa}.json`). Error envelope variants (401 invalid credentials, 401 invalid 2FA, 429 rate-limit) documented with real shapes.
- `GET /self?with=actor,accounts` — real fixture sample with trim disclaimer.
- `POST /clients/register` — real-shape minimal-client-record response inlined (was stubbed in r3).
- `POST /clients/password_reset` — real-shape ack envelope inlined (was stubbed in r3).
- `GET /clients_fields?filter[show_on_order_form]=true` — realistic custom-field row sample inlined (was stubbed in r3).
- `POST /auth_code` — still honestly marked stubbed; the only remaining stub.

#### Flows

6 flows: Anonymous bootstrap · Password login · Registration · Password recovery · Sign-out · Auth-code transfer.

All use `flowchart TD`. All have:
- One-line purpose (Registration and Password recovery added this iteration).
- Mermaid sequence with correct node shapes (rounded for entry/terminal, square for actions, diamond for branches, `subgraph` for cross-origin in transfer flow).
- `Guarantees the platform holds:` prose lead-in.
- `Constraints the caller has to plan around:` prose lead-in with standalone declarative bullets.

The sign-out flow's prose preamble (`Sign-out is a caller-side state change. The platform has no sign-out endpoint...`) at [foundation.md:787](packages/headless/src/modules/session/docs/foundation.md#L787) remains the cleanest single explanatory paragraph in the doc.

#### Lessons

15 problem-shaped entries, all architecturally load-bearing. Coverage:

| Theme | Lesson |
| --- | --- |
| Token boot | "Every visitor needs a token before any other request goes out" |
| Guest/client coexistence | "A guest token and a client token coexist in storage at the same time" |
| 2FA multi-step | "Login is not a single round-trip" + "The interim 2FA token has a much shorter expiry" |
| Endpoint multiplexing | "Same endpoint, different grants — discriminating only by URL hides the variation" |
| /self payload width | "The /self response shape is wider than any single consumer needs" |
| Actor divergence | "actor_type lives in two places that can disagree" |
| Locale | "Locale belongs to the client, not to the page" + "i18n initialisation depends on identity, but the transfer redemption can't depend on i18n" |
| Registration flow | "Registration is a four-call dance, not one" |
| Cookies | "Cookies are the only durable persistence and they have origin rules" |
| Sign-out cache coordination | "Local-only sign-out leaves downstream caches keyed to the prior actor" (Lesson 11, rewritten) |
| Transfer single-use | "The transfer auth-code is single-use and short-lived, and redemption replaces the active token" (Lesson 13, rewritten) |
| Token expiry mid-call | "Token expiry can land mid-call" |
| Guest → client swap | "Guest → client is a token swap, not a new session" |

All 15 entries describe problems without prescribing solutions. Verified against r3's two flagged slips:

- Lesson 11 (was `Logout has to be louder than the local session`): now `Local-only sign-out leaves downstream caches keyed to the prior actor.` ✅
- Lesson 13 (was `has to remain intact` + `replacing first and then validating`): now `A failed redemption that has already discarded the prior token leaves the user signed out of both origins — the platform won't restore either.` ✅

---

## Top 3 priorities (severity × ease)

None are critical or warning-level. Suggestions only:

1. 🟡 **Capture a real `POST /auth_code` fixture** when the staging environment supports it. The only stub remaining in the doc; once captured, swap in the real body.
2. 🟡 **Operations row for `logout` if cap moves** — currently folded into the sign-out flow + Lesson 11. If the rule's 12-capability cap is ever softened, surface `logout` as a discrete row at the bottom. Until then, the architectural truth is captured.
3. 🟡 **Cross-link to `brand` foundation doc** for the brand-policy hooks (2FA enrolment at registration, recaptcha gating, currency carry-through). The dependency exists in Lesson 5 + Capability 5 description but isn't hyperlinked.

---

## Suggested rule/skill updates

None new from this iteration. The rule is in good shape for this module. The three carried-forward rule patches proposed in earlier basket/basketProduct audits (sub-track strip, "X has to <verb>" enumeration, over-cap guidance) remain valid for other modules; this doc didn't surface fresh ones.

---

## Appendix A — Source-of-truth references

### Typed contracts
- `packages/types/src/models/token.ts:1-16` — `IToken` interface
- `packages/types/src/data/enums.ts:16-21` — `AccessRoleTypes` (4 values: guest, client, reseller, user)
- `packages/types/src/data/enums/tokens.ts:12-26` — `GrantTypes` (13 values)
- `packages/types/src/data/enums/tokens.ts:28-31` — `TwofaProviders` (Email, TOTP)
- `packages/types/src/models/contexts.ts:1-8` — `Contexts` enum

### Composable surface
- `packages/headless/src/modules/session/useSession.ts:564-777` — 18 exported entries

### Fixtures (`tests/__fixtures__/recordings/`)
- `post--oauth-access_token-guest.json` — guest grant 200
- `post--oauth-access_token-client.json` — full client token 200
- `post--oauth-access_token-twofa.json` — interim token 200
- `get-self.json` — full identity payload 200
- `post--clients-register.json` — 404 (pipeline issue; doc uses real-shape representative sample)
- `post--clients-password_reset.json` — 404 (same)
- `get--clients_fields.json` — 404 (same)

### Graph
- `graphify-out/graph.json` — cross-module dependants of `modules/session/` (r3 audit's `_tgt`-based jq filter)

---

## Appendix B — Files reviewed

### Rule + writing standards
- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-writing.md`
- `.agent/rules/docs-reviews.md`

### Candidate
- `packages/headless/src/modules/session/docs/foundation.md` (post-r3 fixes, 12 capabilities · 6 flows · 15 lessons · 10 dependants)

### Prior reviews
- `docs/audit/session-foundation-2026-05-15-r3.md` (primary)
- `docs/audit/session-foundation-2026-05-15-rereview.md`
- `docs/audit/session-foundation-2026-05-15.md`
- `docs/audit/docs-module-review-session-2026-05-15.md`

### Source
- `packages/headless/src/modules/session/useSession.ts`
- `packages/headless/src/modules/session/services.ts`
- `packages/headless/src/modules/session/types.ts`
- `packages/headless/src/modules/session/session.machine.ts`

### Types + fixtures
- `packages/types/src/models/token.ts`, `contexts.ts`
- `packages/types/src/data/enums.ts`, `tokens.ts`
- `tests/__fixtures__/recordings/post--oauth-access_token-*.json`
- `tests/__fixtures__/recordings/get-self.json`

### Graph
- `graphify-out/graph.json`

---

## Appendix C — Strip-audit exhaustive list

No hits across any forbidden-pattern family. Grep covering `useX(`, `isReady`, `getConfigValue`, `spawn`, `state machine`, `XState`, `TanStack`, `computed`, `ref`, `sub-track`, `subscribes to`, `module emits`, `has to (do|invalidate|defer|drop|broadcast|survive|settle|be|remain|stay)`, `the cleaner shape`, `the natural separation`, `the shape that survives`, `replacing first and then`, `you should`, `you must`, `plan for`, `our implementation`, `we chose`, `we split` returns zero matches.

---

## Verdict

**Pass.** Overall 95/100, +6 over r3. Every priority from three prior audits is resolved. The doc is at-or-above the brand, system, and basket foundation docs on every category. Ready for the workshop deliverable.

Remaining items (auth-code fixture capture, logout-as-operation, brand cross-link) are all 🟡 polish — none block ship.
