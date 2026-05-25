# Audit: `session` foundation doc — 2026-05-15 (r3)

> **Third review of the session foundation doc; supersedes the 2026-05-15-rereview audit.** The candidate has been **substantially rewritten** since the second pass — Mermaid `sequenceDiagram` was replaced by `flowchart TD` throughout (the largest single fix), `"admin"` was dropped from the `ActorType` union, an explicit out-of-scope note for staff was added near the top, the Operations table grew from 10 to 12 (now includes refresh, reauth, subscribe), and the Constraints bullets were rewritten from sentence fragments into standalone declarative statements. This pass focuses on whether the new structural moves stick, and on the four issues that have now persisted across three audits.

**Module:** session
**Candidate:** `packages/headless/src/modules/session/docs/foundation.md`
**Golden:** _no `session.md` in `docs/workshop/archive/` — brand + system foundation docs used as proxy goldens._
**Prior audits:** `docs/audit/session-foundation-2026-05-15-rereview.md` (most recent), `docs/audit/session-foundation-2026-05-15.md`
**Reviewer hat:** ship-readiness for architects rebuilding the platform in a non-Vue stack.

---

## Executive summary

| Category | Pass 1 | Pass 2 (rereview) | Pass 3 (this) | Δ vs P2 |
| --- | --- | --- | --- | --- |
| Technical accuracy | 78 | 80 | **88** | **+8** |
| Completeness | 70 | 78 | **84** | **+6** |
| Structure | 88 | 92 | **96** | **+4** |
| Tone | 84 | 88 | **90** | **+2** |
| Actionability | 80 | 84 | **88** | **+4** |
| **Overall** | **80** | **86** | **~89** | **+3** |

**Verdict: pass with fixes.** The doc has cleared the structural and Mermaid-notation bars that blocked the previous pass. Three carried-over issues remain (dependants weights vs graph, the `twofa_provider: "Email"` value on the non-2FA password sample, and three stubbed fixtures whose live recordings are 404s) — none are rewrites; all three are single-file mechanical corrections. With those landed and two minor tone slips cleaned up (`has to be louder`, `has to remain intact`), the doc reaches 92–93/100 and is at-or-above the brand and system golden snapshots on every category. The architectural lift since P1 is real: an architect rebuilding from this doc can plan the transport layer, the auth state machine, the basket-handover problem, and the cross-origin transfer flow without reading any source.

---

## Part 1 — Delta vs prior review (rereview, 2026-05-15)

### 🔴 Critical (carried forward)

| # | Prior issue | Status | Evidence |
| --- | --- | --- | --- |
| C1 (P1) | Staff/admin scope ambiguity | ✅ **FIXED** | New italic note at [foundation.md:9](packages/headless/src/modules/session/docs/foundation.md#L9): _"Staff (`admin` grant, `actor_type: \"user\"`) is out of scope for this doc..."_. Operations and Flows now read as deliberately client-scope. |
| C2 (P1) | `twofa_provider: "Email"` on a non-2FA `password` sample | 🟡 **PARTIAL** | The misleading value is still present at [foundation.md:296](packages/headless/src/modules/session/docs/foundation.md#L296) (sample body `actor_type: "client", second_factor_required: false, twofa_provider: "Email"`). **But** the doc now adds an explicit annotation immediately after: _"`twofa_provider` reflects the **actor's enrolled 2FA method**, not the state of a challenge in flight..."_ at [foundation.md:304](packages/headless/src/modules/session/docs/foundation.md#L304). The architectural ambiguity is now resolved in prose; the fixture value remains misleading on its own but is no longer a trap. Downgrade severity to 🟠. |
| C3 (P1) | Dependants table weights diverge from `graph.json` | ❌ **NOT FIXED** | Doc weights at [foundation.md:234-241](packages/headless/src/modules/session/docs/foundation.md#L234-L241): `paymentDetails 14, system 10, basket 8, client 7, product 4, brand 3, payment 2`. Re-running the calculation against `graphify-out/graph.json` (jq filter in Appendix A): `client 12, basket 7, query 5, invoices 4, paymentDetails 4, orders 3, domain 2, billing 1, order 1, payment 1, system 1`. **Doc inverts the top of the tree** — `client` is graph's #1 (12) but the doc puts it at #4 (7); `paymentDetails` is the doc's #1 (14) but graph's #5 (4 — and the doc's `14` matches nothing in the graph at all). Five graph dependants are missing from the doc entirely (`query`, `invoices`, `orders`, `domain`, `order`, `billing`). |
| C4 (P1) | Three stubbed samples where live fixtures are 404s | ❌ **NOT FIXED** | `/clients/register`, `/clients/password_reset`, `/clients_fields` still annotated `// stubbed — real capture replaces this` at [foundation.md:567](packages/headless/src/modules/session/docs/foundation.md#L567), 591, 612. Live recordings still return HTTP 404 bodies (verified). Fixture-pipeline issue, not authored doc content. |
| C5 (P1) | `"admin"` in `ActorType` union | ✅ **FIXED** | Doc line [foundation.md:57](packages/headless/src/modules/session/docs/foundation.md#L57): `type ActorType = "guest" | "client" | "reseller" | "user" | "twofa" | "twofa-admin";` — `"admin"` removed. Matches `AccessRoleTypes` plus the two interim-only wire values, now correctly annotated `(interim)` in the adjacent comment at [foundation.md:49](packages/headless/src/modules/session/docs/foundation.md#L49). |
| NC1 (P2) | `<br/>` inside Mermaid sequenceDiagram messages | ✅ **FIXED** | The entire Flows section was rewritten from `sequenceDiagram` to `flowchart TD`. `<br/>` is valid syntax inside flowchart node labels (per the rule: "Use `<br/>` inside node labels for line breaks"). All seven flows render correctly in GitHub's preview and conformant viewers. **This is the single biggest structural lift since the prior pass.** |
| NC2 (P2) | `<br/>` inside `note over` blocks | ✅ **FIXED** | `note over` blocks are gone — the new flowcharts encode the same information as labelled square `["..."]` nodes or as standalone text outside the chart. |

### 🟠 Warnings (carried forward)

| # | Prior issue | Status | Evidence |
| --- | --- | --- | --- |
| W1 (P1) | Missing operations: `refresh`, `reauth`, `setModel`, `subscribe`, `getToken` | 🟡 **PARTIAL** | Operations grew from 10 to 12. **Added:** capability 8 "Refresh access token" ([foundation.md:31](packages/headless/src/modules/session/docs/foundation.md#L31)), capability 11 "Signal token rejection" ([foundation.md:34](packages/headless/src/modules/session/docs/foundation.md#L34)) — covers `reauth`/EXPIRED, capability 12 "Observe identity changes" ([foundation.md:35](packages/headless/src/modules/session/docs/foundation.md#L35)) — covers `subscribe`. **Still absent:** `setModel`, `getToken`, `getHistory`. Defensible to omit `setModel` and `getHistory` (UI scaffolding); `getToken` is observable and might deserve a row ("Read the current bearer"). Tablerow count now at the rule's cap of 12. |
| W3 (P1) | `Self.replace_branding` / `Self.branding` | ✅ N/A | Self-corrected in P2 audit — fields are present in the captured fixture ([foundation.md:535](packages/headless/src/modules/session/docs/foundation.md#L535)). |
| W5 (P1) | `Account` type trimmed without inline disclaimer | 🟡 **PARTIAL** | The TypeScript block at [foundation.md:140-167](packages/headless/src/modules/session/docs/foundation.md#L140-L167) now opens with a comment: _"Trimmed view: customer-facing fields only. The captured fixture also carries affiliate / payout / wallet-statement / negative-allowance variants…"_ — addresses P1's flag for the *type* (separately from the sample-level disclaimer at [foundation.md:538](packages/headless/src/modules/session/docs/foundation.md#L538)). |
| W6 (P1) | `order` (singular) in dependants table | ✅ **FIXED** | `order` is no longer in the table (replaced by `payment`, `brand`, `product`); but per C3, the table is wrong on different axes. |
| W7 (P1, P2) | Soft prescriptions in Lessons 4 and 9 | ✅ **FIXED** | Lesson 4 has been rewritten — the prior `The flow needs an explicit re-issue path back to credentials, not a hard error` is gone, replaced by a descriptive close: _"The response does not distinguish 'code wrong' from 'interim token expired'; both surface as 401 with `error.message: 'Invalid or expired two-factor auth code'."_ at [foundation.md:835](packages/headless/src/modules/session/docs/foundation.md#L835). Lesson 9 likewise rewritten — `all need to ride in` is gone; the new close at [foundation.md:847](packages/headless/src/modules/session/docs/foundation.md#L847) reads _"A registration that omits any of them creates a client where the corresponding surface is silently degraded."_ |
| NW1 (P2) | Constraints bullets are sentence fragments | ✅ **FIXED** | Bullets across all 7 flows are now standalone declarative statements. Examples: _"A guest bearer does not authorise `/self` for a real identity..."_ at [foundation.md:695](packages/headless/src/modules/session/docs/foundation.md#L695), _"The platform does not remember a returning visitor. Every guest mint is fresh..."_ at [foundation.md:696](packages/headless/src/modules/session/docs/foundation.md#L696). The lead-in/bullet contract works on a re-read. |
| NW2 (P2) | JSON-flavoured message labels in Mermaid | ✅ N/A | Resolved by the move to `flowchart TD`. Labels now carry endpoint + grant cleanly: `"POST /oauth/access_token<br/>grant: password"`. |
| NW3 (P2) | Flow 1 Constraints semantics inverted | ✅ **FIXED** | Bullets are now properly framed as missing-promise statements. |
| NW7 (P2) | Flow 4 Constraint #1 mixes constraint + prescription | ✅ **FIXED** | The "platform validates server-side / client-side has to mirror" mix is gone. New constraint at [foundation.md:750](packages/headless/src/modules/session/docs/foundation.md#L750) is purely descriptive: _"The platform validates the registration body only server-side. An in-browser duplicate of the custom-fields schema is a UX speed gain, not a correctness substitute — the server is the only authority."_ |
| NW8 (P2) | Sign-out flow describes post-sign-out re-mint, not sign-out itself | ✅ **FIXED** | The prose preamble at [foundation.md:774](packages/headless/src/modules/session/docs/foundation.md#L774) now explicitly states: _"Sign-out is a caller-side state change. The platform has no sign-out endpoint — the chart below describes the caller's transition back to a guest state, including the conditional guest re-mint when the prior guest token wasn't retained. The re-mint is preparation for the next request, not the sign-out itself."_ — exactly the framing the P2 audit suggested. |

### 🟡 Suggestions (carried forward)

| # | Prior issue | Status | Notes |
| --- | --- | --- | --- |
| NS1 (P2) | Preamble "you can expect / you can't expect" mismatch | ✅ **FIXED** | Preamble at [foundation.md:674](packages/headless/src/modules/session/docs/foundation.md#L674) now matches the flow-body framing: _"Each flow ends with two prose lists: **Guarantees the platform holds** ... and **Constraints the caller has to plan around** ..."_ |
| NS2 (P2) | Promote `lang`-less auth-code redemption to a Lesson | ✅ **FIXED** | New lesson at [foundation.md:845](packages/headless/src/modules/session/docs/foundation.md#L845): _"i18n initialisation depends on identity, but the transfer redemption can't depend on i18n."_ — promotes the prior flow-buried detail to a hard-won lesson. |
| NS3 (P2) | `Token.actor_id` type-side optionality | 🟡 **PARTIAL** | Inline comment at [foundation.md:45](packages/headless/src/modules/session/docs/foundation.md#L45) says `actor_id: string` with comment `// resolved actor id, empty string for fresh guest grants` — the wire-side framing is preserved; the type-side optionality (`IToken.actor_id?`) isn't called out. Defensible — fixture-as-truth. |
| NS4 (P2) | Italic note that staff is out of scope | ✅ **FIXED** | At [foundation.md:9](packages/headless/src/modules/session/docs/foundation.md#L9). |
| NS5 (P2) | Surface `setModel`, `getToken`, `subscribe`, `reauth` rows | 🟡 **PARTIAL** | `subscribe` and `reauth` added as capabilities 11 + 12. `setModel` and `getToken` still absent. |
| S5 (P1) | Brand-config dependency on Capability 7 (registration custom fields) | ❌ **NOT FIXED** | Capability 7 description still doesn't note that the schema-extension behaviour depends on brand-configured registration policy. |

### New strengths since rereview (call out)

- 🟢 **The entire Flows section was re-drawn as `flowchart TD`.** The rule explicitly endorses this notation; the previous `sequenceDiagram` was a rule-pre-patch artefact. All seven flows are now scan-friendly, branch-clear, and render in every Mermaid viewer.
- 🟢 **`note over` blocks were retired** in favour of labelled square nodes — fewer Mermaid-version quirks, same information.
- 🟢 **The "Sign-out is a caller-side state change" preamble** at [foundation.md:774](packages/headless/src/modules/session/docs/foundation.md#L774) is the cleanest single explanatory paragraph in the doc. An architect reading just that paragraph understands the entire shape of the problem.
- 🟢 **Capability 12 ("Observe identity changes")** at [foundation.md:35](packages/headless/src/modules/session/docs/foundation.md#L35) frames the subscribe behaviour as the *capability* with the *mechanism* explicitly left to the caller — exactly the framework-neutral phrasing the rule asks for: _"The mechanism is the caller's choice (callbacks, signals, polling); the *capability* is 'tell me when the active actor changes'."_
- 🟢 **Lesson 5 ("Same endpoint, different grants — discriminating only by URL hides the variation")** at [foundation.md:837](packages/headless/src/modules/session/docs/foundation.md#L837) is a textbook problem-stated lesson. Names the architectural failure mode (cache/dedupe by URL+method alone) and the consequence, without prescribing.
- 🟢 **All Constraints bullets across all 7 flows** are now standalone declarative statements — the rule's "bullet shape" patch (proposed in the P2 audit) was applied successfully even before the rule was updated.

---

## Part 2 — Fresh full audit (this pass)

### Strip audit

| Pattern | Hits | Severity |
| --- | --- | --- |
| Composable method names (`useX()`, `isReady()`, `getConfigValue()`, etc.) | None found across 12 operations, 7 flows, 15 lessons | ✅ Clean |
| Store / queryKey / persister names (`brandConfigKeysStore`, `["session"]`, `localStoragePersister`) | None | ✅ Clean |
| Framework terms (`computed()`, `ref()`, XState, TanStack, `spawn()`, scoped composable, `useQuery`) | None | ✅ Clean |
| `.meta` content outside the italic note (any sub-property, any aliasing) | None — `IToken` and `/self` don't return a top-level `meta`; the italic note at [foundation.md:7](packages/headless/src/modules/session/docs/foundation.md#L7) is preventive | ✅ Clean |
| Prescriptive verbs (`you should`, `you must`, `everyone awaits`, `plan for`) | Two soft slips remain — see below | 🟠 |
| Solution-shape suffixes (`the cleaner shape is X`, `the natural separation is Y`, `the X has to do Y`, `the inversion has to happen somewhere`) | One slip — see below | 🟠 |
| Meta-commentary about our implementation (`our implementation`, `we chose`, `we split`) | None | ✅ Clean |

**Two persistent tone slips:**

- 🟠 **Lesson 11 title** at [foundation.md:851](packages/headless/src/modules/session/docs/foundation.md#L851): _"Logout **has to be louder** than the local session."_ — title is prescriptive even though the body is clean. Suggested rewrite: _"Logout is louder than the local session by necessity."_ or _"Local-only sign-out leaves downstream caches keyed to the prior actor."_
- 🟠 **Lesson 13 body** at [foundation.md:853](packages/headless/src/modules/session/docs/foundation.md#L853): _"If the redemption fails the prior token **has to remain intact** — replacing first and then validating leaves the user signed out of both origins."_ — `has to remain intact` is a soft prescription and `replacing first and then validating leaves...` is a solution-shape pattern (it describes the wrong-order solution and its consequence). Suggested rewrite: _"A failed redemption that has already discarded the prior token leaves the user signed out of both origins — the platform won't restore either."_

**Strip verdict: 🟢 PASS** — three consecutive audits have found roughly the same two slips. Both are mechanical rewrites in single lessons.

### Section audit

| Section | Required? | Status | Notes |
| --- | --- | --- | --- |
| What it is | ✅ Required | ✅ Present | Strong open. Scope note added at [foundation.md:9](packages/headless/src/modules/session/docs/foundation.md#L9). |
| Core concepts | Optional | ✅ Present | Six terms, all genuinely needed. |
| State model | Optional (almost always omit) | ✅ Correctly absent | The earlier `loading → checking → valid/invalid` substring is gone. |
| Operations | ✅ Required | ✅ Present | 12 capabilities (rule cap). Refresh, reauth, subscribe added. |
| Data shape | ✅ Required | ✅ Present | All key types covered; trim disclaimers in place. |
| Dependencies | ✅ Required | ✅ Present | Dependants table present — but content wrong (C3). |
| API endpoints | ✅ Required | ✅ Present | 6 endpoints, 3 stubbed. |
| Side effects | Optional (usually omit) | ✅ Correctly absent | Cookie persistence is in Lessons 10. |
| Coordination | Optional (usually omit) | ✅ Correctly absent | Cross-actor cache coordination is in Lesson 11. |
| Flows | Optional but warranted | ✅ Present | 7 flows; `flowchart TD`; all required components. |
| Lessons (hard-won) | ✅ Required | ✅ Present | 15 entries, all problem-stated bar the two slips above. |
| Hot Keys by Lifecycle | Optional (only when keyed config) | ✅ Correctly absent | Session doesn't own keyed config. |

### Content audit

**Operations (capabilities vs source):** `useSession` exports 18 observable behaviours from [useSession.ts:564-771](packages/headless/src/modules/session/useSession.ts#L564-L771). The doc covers 12. Coverage:

| Source export | Covered? | Capability # |
| --- | --- | --- |
| `subscribe` | ✅ | 12 (Observe identity changes) |
| `isReady` / `isAuthenticated` | ✅ | folded into 1 (Issue guest token) implicit + 2 (Read identity) |
| `meta` (12 flags) | ✅ | derived view, not a capability |
| `context` / `errors` / `validationErrors` | ✅ | not capabilities, observable state |
| `model` / `schema` / `uischema` | 🟡 | `setModel` not in Operations; defensible (form scaffolding) |
| `client` / `clientId` | ✅ | 2 |
| `reject` | ✅ | 11 (Signal token rejection) |
| `resolve` | — | 2FA exchange; folded into 4 |
| `refresh` | ✅ | 8 (Refresh access token) |
| `login` | ✅ | 3 |
| `logout` | 🟡 | not in Operations table — covered architecturally in Flow 6 + Lesson 11, but missing as a row |
| `recover` | ✅ | 6 |
| `register` | ✅ | 5 |
| `verify2fa` | ✅ | 4 |
| `transferTo` / `transferFrom` / `getTransferDetails` / `transferred` | ✅ | 9 + 10 |
| `showLogin` / `showRegister` / `showRecoverPassword` | — | UI scaffolding, defensibly omitted |
| `setModel` | ❌ | not in Operations — form-scaffolding, defensibly omitted |
| `getToken` | ❌ | not in Operations — could be a "Read the current bearer" row |
| `getHistory` | — | debug surface, omit |
| `reauth` | ✅ | 11 |

**Observation:** the Operations table covers 12 of ~14 architecturally-relevant exported surfaces. The two missing ones are `logout` (architecturally important) and `getToken` (a leaf read). Adding `logout` as capability 13 would push the table to 13 of 12 — over the rule's cap, so a more honest fix is to fold logout into the existing surface (the sign-out flow is documented; the *operation* is "Drop the active token" and is essentially `reject` from the platform's perspective). Defensible to leave; worth a note in the next pass.

**Data shape:** Cross-referenced against `packages/types/src/models/token.ts`, `packages/types/src/data/enums/tokens.ts`, `packages/types/src/data/enums.ts`. Findings:

- ✅ `Token` shape matches `IToken` with the appropriate fixture-truth corrections (`twofa_provider: TwofaProvider | null` is more accurate than the type's non-nullable annotation; `actor_id: string` matches the wire even though the type marks it optional).
- ✅ `ActorType` now matches `AccessRoleTypes` plus the two interim-only wire values, correctly annotated.
- ✅ `GrantType` union: 12 values in the doc; `GrantTypes` enum has 13 values. **One missing:** `PASSWORD_RESET` and `ADMIN_PASSWORD_RESET` are listed in the doc ([foundation.md:71-72](packages/headless/src/modules/session/docs/foundation.md#L71-L72)) but `ADMIN_PASSWORD_RESET` is included. Re-count: doc enumerates `guest, password, admin, twofa, twofa-admin, auth_code, refresh_token, guest_customer, password_reset, admin_password_reset, complete_registration, complete_user_registration, complete_org_registration` — that's 13. ✅ Match.
- ✅ `TwofaProvider = "Email" | "TOTP"` matches `TwofaProviders`.
- ✅ `Self`, `Actor`, `Account`, `CustomField`, `AuthTransfer`, `AccessTokenBody`, `RegisterBody`, `RecoverBody` all cross-check against fixtures and types.

**Dependants table (CRITICAL):** see C3 above. The table is internally consistent but its weights are not from the graph. Counts derived from `graphify-out/graph.json` using the `_tgt`-based jq filter in Appendix A:

| Module in graph | True weight | Doc claims | Δ |
| --- | --- | --- | --- |
| `client` | 12 | 7 (and ranked #4) | −5, mis-ranked |
| `basket` | 7 | 8 (ranked #3) | +1 |
| `query` | 5 | — | missing |
| `invoices` | 4 | — | missing |
| `paymentDetails` | 4 | 14 (ranked #1) | +10, mis-ranked |
| `orders` | 3 | — | missing |
| `domain` | 2 | — | missing |
| `billing` | 1 | — | missing |
| `order` | 1 | — | missing (the singular cousin) |
| `payment` | 1 | 2 (ranked #7) | +1 |
| `system` | 1 | 10 (ranked #2) | +9, mis-ranked |

The doc's `product 4` and `brand 3` are not in the graph for session at all (no cross-module imports from `product/` or `brand/` reach `session/`). The Presentation-layer row is correctly placed but its weights for chrome consumers aren't graph-derived (and don't need to be — that's the rule's intent).

**API endpoints:** 6 endpoints (`POST /oauth/access_token` with sub-flows, `GET /self`, `POST /clients/register`, `POST /clients/password_reset`, `GET /clients_fields`, `POST /auth_code`). Three are stubbed (C4). Cross-check:

- ✅ `POST /oauth/access_token` curls match the real `tests/__fixtures__/recordings/post--oauth-access_token-{guest,client,twofa}.json` fixtures.
- ✅ `GET /self` sample is real, trimmed, with `meta` stripped (no top-level meta on this endpoint anyway).
- ❌ `POST /clients/register` recorded fixture returns HTTP 404 (`Domain not found!`) — doc stubs it. Same for `/clients/password_reset` and `/clients_fields`. Upstream fixture-pipeline issue.
- ✅ `POST /auth_code` is honestly marked stubbed.

**Lessons:** 15 entries. Of these, 13 describe problems cleanly without solutions. Lesson 11 title and Lesson 13 body carry the two soft prescriptions noted in the Strip audit. The lesson set covers: every-visitor-needs-a-token, guest+client coexistence, login-not-single-roundtrip, interim-token-short-expiry, same-endpoint-many-grants, /self-payload-width, actor_type-divergence, locale-belongs-to-client, i18n-vs-auth-code-redemption, registration-four-call-dance, cookie-origin-rules, logout-louder, transfer-single-use, expiry-mid-call, guest→client-token-swap. **All architecturally load-bearing**; the 15 entries map to genuine load-profile / race-condition / coupling-consequence / propagation problems the rule lists as canonical lesson categories.

### Flow-shape compliance (re-audit after flowchart rewrite)

The rule requires each flow to follow this shape: one-line purpose → `flowchart TD` Mermaid → `Guarantees:` prose lead-in → `Constraints:` prose lead-in.

| Flow | Purpose? | Mermaid shape? | Guarantees prose? | Constraints prose? | Verdict |
| --- | --- | --- | --- | --- | --- |
| Anonymous bootstrap | ✅ Line 677 | ✅ `flowchart TD`, rounded entry+terminal, square actions | ✅ Line 687 prose | ✅ Line 693 prose, declarative bullets | ✅ |
| Password login | ✅ Line 699 | ✅ `flowchart TD`, diamond for `second_factor_required?` branch | ✅ Line 713 | ✅ Line 720, declarative | ✅ |
| Registration | — Line 727 (heading only) | ✅ `flowchart TD`, diamond branch, multi-step | ✅ Line 742 | ✅ Line 748, declarative | 🟡 No one-liner purpose |
| Password recovery | — | ✅ Clean | ✅ Line 762 | ✅ Line 767, declarative | 🟡 No one-liner purpose |
| Sign-out | ✅ Line 773 (prose preamble doubles as purpose) | ✅ Diamond branch on token-retained, clean sequence | ✅ Line 786 | ✅ Line 791, declarative | ✅ |
| Auth-code transfer | ✅ Line 797 | ✅ `subgraph` for OA / OB cross-origin, rounded terminals, square actions | ✅ Line 815 | ✅ Line 821, declarative | ✅ |

**Verdict:** 🟢 **Mostly compliant.** Two flows (Registration and Password recovery) lack a one-line purpose between heading and Mermaid block — the same gap the P2 audit flagged on 5 of 7 flows. Easy fix in a single pass.

### Sign-out flow — one residual concern

The flow contains a step labelled `"Invalidate caches keyed off prior actor<br/>(basket, panel, payment details)"` at the terminal node. This is caller-side coordination behaviour described as a flow step. The rule's flow anti-patterns include _"Coordination commentary ('then we refresh the basket subscription'). That belongs in Lessons (as a problem statement) or nowhere."_ — but this is framed as caller-must-do, not us-doing-it, and Lesson 11 already covers the same territory as a problem statement. Borderline; defensible since the framing matches the rule's "describe what the caller does, not what we do" intent. 🟡 Suggestion only.

### Mermaid notation re-audit

Ran each `flowchart TD` block through visual + syntactic check:

| Flow | `<br/>` inside nodes (valid) | Node shapes correct | Renders in GH? | Issues |
| --- | --- | --- | --- | --- |
| Anonymous bootstrap | — | ✅ | ✅ | — |
| Password login | — | ✅ | ✅ | — |
| Registration | ✅ multiple, all valid | ✅ | ✅ | — |
| Password recovery | ✅ in C and D | ✅ | ✅ | — |
| Sign-out | ✅ in E and F | ✅ | ✅ | — |
| Auth-code transfer | ✅ inside subgraph nodes | ✅ subgraph OA/OB | ✅ | — |

**Verdict: 🟢 PASS.** The Mermaid notation rot from P2 is fully resolved.

---

## Part 3 — Golden delta

No `docs/workshop/archive/session.md` exists; using `brand/docs/foundation.md` and `system/docs/foundation.md` as proxy goldens.

| Divergence | Classification | Detail |
| --- | --- | --- |
| Session has a Flows section (7 flows); brand and system have none | ⭐ Pro candidate | Session is the first foundation doc to land Flows. The seven sequences are architecturally load-bearing for identity; brand and system don't need them. The rule supports both — session's pattern is now the reference for future modules whose surface includes multi-step interactions. |
| Session lists 15 lessons; brand and system list ~10–12 | ⭐ Pro candidate | Session legitimately has more architectural complexity (4 actor types × 12 grants × 2FA × transfer × refresh). The lesson set is dense but not bloated. |
| Session ActorType union includes `(interim)` annotations inline; goldens have no analogue | ⭐ Pro candidate | The `(interim)` inline annotation pattern at [foundation.md:49](packages/headless/src/modules/session/docs/foundation.md#L49) is a clean way to mark wire-only values that don't belong in the typed contract. Reusable for future modules. |
| Session's dependants table includes only 7 modules + presentation layer | 🟢 Rule gap (carried from P2) | Brand and system foundation docs ship comprehensive dependants tables. Session's omission of `client`, `query`, `invoices`, `orders`, `domain`, `billing` is C3 — the rule says "include every cross-module dependant the graph returns, weighted descendingly" but the candidate keeps a curated subset. |
| Session uses `flowchart TD` for flows; goldens have no flows | — | Rule-compliant; new pattern. |

---

## Top 3 priorities (severity × ease)

1. 🔴 **Regenerate the Dependants table from `graphify-out/graph.json` (C3).** Five graph dependants are absent; three present rows have weights with no source-of-truth backing. The jq filter in Appendix A gives the authoritative output. This is a 5-minute mechanical edit and would lift Technical Accuracy to ~93 alone. **Three audits in a row have flagged this.**
2. 🟠 **Fix the two persistent tone slips** at [foundation.md:851](packages/headless/src/modules/session/docs/foundation.md#L851) (Lesson 11 title `Logout has to be louder`) and [foundation.md:853](packages/headless/src/modules/session/docs/foundation.md#L853) (Lesson 13 body `has to remain intact`). Both mechanical rewrites; suggested wording in the Strip audit section above.
3. 🟡 **Add a one-line purpose to the Registration and Password recovery flows.** Two of seven flows still skip the rule-required purpose line between heading and Mermaid block. One sentence each.

---

## Suggested rule / skill updates

This pass did not surface new rule gaps. The P2 audit's three proposed rule patches (Mermaid notation guidance, Constraints bullet shape, mandatory one-line purpose on flows) were validated by the candidate's rewrite:

- The candidate switched from `sequenceDiagram` to `flowchart TD` after the rule's existing `flowchart TD` mandate became visible — so the rule **already** says the right thing. No patch needed; the P2 audit was wrong to flag this as a rule gap (the rule was clear, the agent missed it).
- The Constraints bullet rewrite landed before any rule patch — confirms the rule's lead-in/bullet contract is followable as-is.
- The one-line purpose gap remains on 2 of 7 flows. The rule already says "one-line purpose" — making it more emphatic in the rule probably won't change agent behaviour. **No rule patch proposed.**

**Net:** the rule is in good shape for the session module. The three remaining issues are agent-side (regenerate the dependants table, polish two lessons, add two purpose lines), not rule-side.

---

## Appendix A — Source-of-truth references

### Typed contracts

- `packages/types/src/models/token.ts:1-16` — `IToken` interface
- `packages/types/src/data/enums.ts:16-21` — `AccessRoleTypes` (4 values: guest, client, reseller, user)
- `packages/types/src/data/enums/tokens.ts:12-26` — `GrantTypes` (13 values)
- `packages/types/src/data/enums/tokens.ts:28-31` — `TwofaProviders` (Email, TOTP)
- `packages/types/src/models/contexts.ts:1-8` — `Contexts` (admin, client, guest, user, "")

### Composable surface

- `packages/headless/src/modules/session/useSession.ts:564-777` — full return shape (18 exports)

### Fixtures (`tests/__fixtures__/recordings/`)

- `post--oauth-access_token-guest.json` — real 200, `twofa_provider: null` correct
- `post--oauth-access_token-client.json` — real 200, but `twofa_provider: "Email"` even though `second_factor_required: false` (C2)
- `post--oauth-access_token-twofa.json` — real 200, interim token
- `get-self.json` — real 200, full payload
- `post--clients-register.json` — HTTP 404 (`Domain not found!`)
- `post--clients-password_reset.json` — HTTP 404
- `get--clients_fields.json` — HTTP 404

### Graph (cross-module dependants of `modules/session/`)

jq filter used to derive Appendix C numbers:

```bash
jq -r '[.links[]
  | select(.source_file | test("modules/session/") | not)
  | select(._tgt | test("modules_session"))]
  | map(.source_file | capture("modules/(?<m>[^/]+)/") | .m)
  | group_by(.)
  | map({m: .[0], n: length})
  | sort_by(-.n)' graphify-out/graph.json
```

Output: `client 12, basket 7, query 5, invoices 4, paymentDetails 4, orders 3, domain 2, billing 1, order 1, payment 1, system 1`.

---

## Appendix B — Verbatim evidence for critical / warning issues

### C2 — `twofa_provider: "Email"` on non-2FA `password` sample

[foundation.md:291-302](packages/headless/src/modules/session/docs/foundation.md#L291-L302):

```json
{
  "second_factor_required": false,
  "refresh_expires_in": 36000,
  "actor_id": "20403869-6e54-721d-359f-518d9305e7d2",
  "actor_type": "client",
  "twofa_provider": "Email",
  ...
}
```

**Source fixture** `tests/__fixtures__/recordings/post--oauth-access_token-client.json`:
```json
"second_factor_required": false,
...
"actor_type": "client",
"twofa_provider": "Email",
```

**Mitigating prose** at [foundation.md:304](packages/headless/src/modules/session/docs/foundation.md#L304):
> `twofa_provider` reflects the **actor's enrolled 2FA method**, not the state of a challenge in flight. A user with Email 2FA carries `"Email"` on every token they receive (interim and full); a user with TOTP carries `"TOTP"`; a user with no 2FA carries `null`. Only treat it as actionable when `second_factor_required: true` — otherwise it is identity metadata...

→ Severity downgraded from 🔴 to 🟠. The trap is now closed in prose, even if the fixture value remains misleading on its own.

### C3 — Dependants table vs graph

Doc [foundation.md:234-241](packages/headless/src/modules/session/docs/foundation.md#L234-L241):

| Module | Weight | (Doc rank) |
| --- | --- | --- |
| paymentDetails | 14 | #1 |
| system | 10 | #2 |
| basket | 8 | #3 |
| client | 7 | #4 |
| product | 4 | #5 |
| brand | 3 | #6 |
| payment | 2 | #7 |

Graph (re-run 2026-05-15, jq filter in Appendix A):

```
client: 12, basket: 7, query: 5, invoices: 4, paymentDetails: 4,
orders: 3, domain: 2, billing: 1, order: 1, payment: 1, system: 1
```

Five missing (query, invoices, orders, domain, billing). Two doc entries (`product`, `brand`) have **zero** cross-module imports into session in the graph.

### Strip slip — Lesson 11 title

[foundation.md:851](packages/headless/src/modules/session/docs/foundation.md#L851):

```
- **Logout has to be louder than the local session.**
```

### Strip slip — Lesson 13 body

[foundation.md:853](packages/headless/src/modules/session/docs/foundation.md#L853):

```
A redirect-driven transfer can be invalidated by a refresh, a back-button,
or an intermediary touching the URL. If the redemption fails the prior
token has to remain intact — replacing first and then validating leaves
the user signed out of both origins.
```

---

## Appendix C — Files reviewed

### Rule + standards
- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-writing.md`
- `.agent/rules/docs-reviews.md`

### Candidate
- `packages/headless/src/modules/session/docs/foundation.md`

### Prior audits
- `docs/audit/session-foundation-2026-05-15.md`
- `docs/audit/session-foundation-2026-05-15-rereview.md`

### Goldens (proxy — no `session.md` in archive)
- (referenced via prior audits; no fresh read this pass)

### Source-of-truth
- `packages/headless/src/modules/session/useSession.ts:560-777`
- `packages/types/src/models/token.ts`
- `packages/types/src/data/enums.ts`
- `packages/types/src/data/enums/tokens.ts`
- `packages/types/src/models/contexts.ts`

### Fixtures
- `tests/__fixtures__/recordings/post--oauth-access_token-{guest,client,twofa}.json`
- `tests/__fixtures__/recordings/get-self.json`
- `tests/__fixtures__/recordings/post--clients-register.json` (404)
- `tests/__fixtures__/recordings/post--clients-password_reset.json` (404)
- `tests/__fixtures__/recordings/get--clients_fields.json` (404)

### Graph
- `graphify-out/graph.json` — re-computed cross-module weights using `_tgt`-based jq filter (the prior audits used a different filter that yielded different numbers; the filter in Appendix A is the one that lines up with `graph.json`'s actual schema)

---

## Appendix D — Strip-audit exhaustive list

All forbidden-pattern hits in the current candidate:

| Pattern | Line | Quote |
| --- | --- | --- |
| `has to be` (prescriptive verb) | 851 | "Logout **has to be louder** than the local session." |
| `has to remain intact` (prescriptive verb) | 853 | "...the prior token **has to remain intact**..." |
| `replacing first and then validating` (solution-shape suffix) | 853 | "...**replacing first and then validating** leaves the user signed out of both origins." |

No other strip violations across the rest of the doc.
