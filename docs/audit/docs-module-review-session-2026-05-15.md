# Audit: `session` foundation doc — 2026-05-15 (r4)

> **Fourth review of the session foundation doc; supersedes r3 (2026-05-15-r3).** The candidate has landed every one of the three top priorities r3 surfaced — dependants table substantially regenerated from `graphify-out/graph.json`, both persistent tone slips rewritten verbatim against r3's suggested wording, and the two missing one-line flow purposes added. This pass scores the result and looks for fresh issues now that the prior carry-overs are gone.

**Module:** session
**Candidate:** [packages/headless/src/modules/session/docs/foundation.md](packages/headless/src/modules/session/docs/foundation.md)
**Golden:** _no `session.md` in [docs/workshop/archive/](docs/workshop/archive/) — brand foundation doc + system foundation doc used as proxy goldens._
**Prior audits:** [r3 (2026-05-15-r3)](docs/audit/session-foundation-2026-05-15-r3.md), [rereview (2026-05-15)](docs/audit/session-foundation-2026-05-15-rereview.md), [first pass (2026-05-15)](docs/audit/session-foundation-2026-05-15.md)
**Reviewer hat:** ship-readiness for architects rebuilding the platform in a non-Vue stack.

---

## Executive summary

| Category | P1 | P2 | P3 (r3) | P4 (this) | Δ vs r3 |
| --- | --- | --- | --- | --- | --- |
| Technical accuracy | 78 | 80 | 88 | **93** | **+5** |
| Completeness | 70 | 78 | 84 | **89** | **+5** |
| Structure | 88 | 92 | 96 | **96** | **=** |
| Tone | 84 | 88 | 90 | **96** | **+6** |
| Actionability | 80 | 84 | 88 | **92** | **+4** |
| **Overall** | **80** | **86** | **89** | **~93** | **+4** |

**Verdict: pass.** The doc is publishable as-is, modulo trivial dependants-table polish (basket weight off-by-one, two single-edge dependants — `billing 1`, `order 1` — still absent). Every top-three priority from r3 landed. The two persistent tone slips that survived three audits are now rewritten exactly to the suggested wording from the r3 audit. The Mermaid notation, Flow-shape compliance, and Strip-audit categories that bothered earlier passes are all clean. An architect reading this doc can plan the transport layer, the auth state machine, the basket-handover problem, the 2FA two-call dance, and the cross-origin transfer flow without opening any source file.

---

## Part 1 — Delta vs prior review (r3, 2026-05-15)

### 🔴 Critical (carried forward from r3)

| # | Prior issue | Status | Evidence |
| --- | --- | --- | --- |
| C2 (P1, P3) | `twofa_provider: "Email"` on a non-2FA `password` sample | 🟡 **PARTIAL — unchanged** | Fixture value still present at [foundation.md:299](packages/headless/src/modules/session/docs/foundation.md#L299) (`actor_type: "client", second_factor_required: false, twofa_provider: "Email"`). Mitigating prose still present at [foundation.md:307](packages/headless/src/modules/session/docs/foundation.md#L307) explaining `twofa_provider` is the actor's enrolled method, not the challenge state. Status frozen at 🟠 per r3's judgment — the trap is closed in prose, fixture value is sourced from the real recording, no further fix required unless the BE returns `null` on this path in a future capture. |
| C3 (P1, P2, P3) | Dependants table weights diverge from `graph.json` | ✅ **FIXED** (~85%) | Table at [foundation.md:232-242](packages/headless/src/modules/session/docs/foundation.md#L232-L242) substantially regenerated. New ranking: `client 12, basket 6, invoices 4, paymentDetails 4, orders 3, domain 2, payment 1, system 1` + Presentation-layer row + footnote at [foundation.md:244](packages/headless/src/modules/session/docs/foundation.md#L244) explaining `query 5` is listed as own-dependency rather than peer dependant. Re-running the jq filter from r3 confirms: graph returns `client 12, basket 7, query 5, invoices 4, paymentDetails 4, orders 3, domain 2, billing 1, order 1, payment 1, system 1`. **Doc now matches graph on 8 of 11 entries.** Three residuals: (a) `basket` doc-weight 6 vs graph 7 — off by 1, possibly the result of excluding test files; (b) `billing 1` missing; (c) `order 1` (the singular cousin of `orders`) missing. Downgrade severity to 🟡 — the architectural shape of the dependants tree is now correct and the table is no longer misleading. **This was the single largest defect r3 flagged; it's now resolved.** |
| C4 (P1, P2, P3) | Three stubbed samples where live fixtures were 404s | ❌ **NOT FIXED — fixture-pipeline issue** | `/clients/register`, `/clients/password_reset`, `/clients_fields` still annotated `// stubbed — real capture replaces this` at [foundation.md:569](packages/headless/src/modules/session/docs/foundation.md#L569), 595, 614. `tests/__fixtures__/recordings/` does now carry alternate-name variants (`post-clients-register.json`, `post-clients-password_reset.json`, `get-clients_fields-20dc6ef3.json`) alongside the original `post--clients-register.json` etc. — worth checking whether the fixture-pipeline can promote one of the alternates into the doc on the next run. Doc-side stubbing is honest and the curls are correct; the 200-response samples are the only gap. |

### 🟠 Warning (carried forward from r3)

| # | Prior issue | Status | Evidence |
| --- | --- | --- | --- |
| Tone slip 1 (P1, P2, P3) | Lesson 11 title `Logout has to be louder` | ✅ **FIXED** | Lesson 11 now reads at [foundation.md:858](packages/headless/src/modules/session/docs/foundation.md#L858): _"**Local-only sign-out leaves downstream caches keyed to the prior actor.** Clearing the persisted token is necessary but not sufficient — basket, payment, panel, and analytics consumers all hold their own caches keyed off the prior actor. Without a signal that downstream consumers can subscribe to, a fresh guest session shows the previous client's data until each cache happens to invalidate on its own schedule."_ Title is now declarative; body is unchanged from r3 (already clean). Exactly matches the r3 audit's suggested rewrite. |
| Tone slip 2 (P1, P2, P3) | Lesson 13 `has to remain intact` + solution-shape suffix | ✅ **FIXED** | Lesson 13 now reads at [foundation.md:860](packages/headless/src/modules/session/docs/foundation.md#L860): _"**The transfer auth-code is single-use and short-lived, and redemption replaces the active token.** A redirect-driven transfer can be invalidated by a refresh, a back-button, or an intermediary touching the URL. A failed redemption that has already discarded the prior token leaves the user signed out of both origins — the platform won't restore either."_ Word-for-word match with r3's suggested rewrite. |
| W1 (P1, P3) | Missing operations: `setModel`, `getToken`, `logout` | 🟡 **PARTIAL — same as r3** | Operations table holds steady at 12 rows (the rule's cap). `logout` is still absent as an explicit row — covered architecturally via the Sign-out flow ([foundation.md:781-791](packages/headless/src/modules/session/docs/foundation.md#L781-L791)) and Lesson 11 ([foundation.md:858](packages/headless/src/modules/session/docs/foundation.md#L858)). `getToken` and `setModel` remain absent — defensibly omitted (`getToken` is a leaf read on already-documented state; `setModel` is form-scaffolding). Not a blocker. |
| W5 (P1, P3) | `Account` type trimmed without inline disclaimer | ✅ N/A — already fixed P3 | Disclaimer at [foundation.md:139-142](packages/headless/src/modules/session/docs/foundation.md#L139-L142). |
| S5 (P1, P3) | Brand-config dependency on Capability 7 | ❌ **NOT FIXED** | Capability 7 (Read registration custom fields) at [foundation.md:30](packages/headless/src/modules/session/docs/foundation.md#L30) still doesn't note that the schema-extension behaviour depends on brand-configured registration policy. The lesson on "Registration is a four-call dance" partly compensates ([foundation.md:854](packages/headless/src/modules/session/docs/foundation.md#L854)) — it names the discovery call and brand-driven shape. Defensible to leave. 🟡 polish. |

### 🟡 Suggestion (carried forward from r3)

| # | Prior issue | Status | Notes |
| --- | --- | --- | --- |
| Flow purpose lines (P3) | Registration + Password recovery flows missing one-line purpose | ✅ **FIXED** | Registration flow now opens at [foundation.md:733](packages/headless/src/modules/session/docs/foundation.md#L733): _"Creates a new client account from a guest session and authenticates them. The form schema is brand-driven, the registration response is a client record (not a token), and the follow-up credentials exchange may itself surface a 2FA challenge."_ Password recovery now opens at [foundation.md:761](packages/headless/src/modules/session/docs/foundation.md#L761): _"Requests a password-reset email for a username. The response is identical regardless of account existence, dispatch policy, or rate-limit state — out-of-band signals (email arrival) are the only confirmation."_ Both purpose lines are crisp and frame the surprise architecturally. |

### New issues this pass

#### 🟡 Suggestion — three Guarantees bullets read as sentence fragments

[foundation.md:794-796](packages/headless/src/modules/session/docs/foundation.md#L794-L796) (Sign-out flow Guarantees):

> - No server-side sign-out endpoint. Authentication is bearer-presented per request; signing out is a caller-side decision to stop presenting the bearer.
> - **The previous client token to remain valid** until its natural expiry if the caller forgets to drop it. Possession of the bearer is access.

[foundation.md:822-826](packages/headless/src/modules/session/docs/foundation.md#L822-L826) (Auth-code transfer Guarantees):

> - **The code to be single-use** and short-lived (minutes). After redemption it's burnt.
> - **The redeemed token to represent** the same actor as the issuing token, with a fresh `expires_in`.
> - **The code-redemption call to succeed** even before i18n / locale negotiation is set up on origin B — the call deliberately accepts no `lang`.

These four bullets use a `[subject] to [verb]...` elliptical construction that reads as "[Platform guarantees] the code to be single-use" — grammatically defensible (relies on the prose lead-in `Guarantees the platform holds:` to complete the sentence), but stylistically inconsistent with the other 30+ Guarantees bullets across the doc, which are standalone declaratives ("A guest grant succeeds…", "The interim token signs only the 2FA exchange"). Mechanical rewrites — change "to be" → "is", "to remain" → "remains", "to represent" → "represents", "to succeed" → "succeeds".

#### 🟡 Suggestion — Sign-out flow includes caller-side coordination step

The terminal Mermaid node at [foundation.md:790](packages/headless/src/modules/session/docs/foundation.md#L790) reads `"Invalidate caches keyed off prior actor<br/>(basket, panel, payment details)"`. This is caller-side coordination, which the rule's flow anti-patterns flag (_"Coordination commentary ('then we refresh the basket subscription'). That belongs in Lessons (as a problem statement) or nowhere."_). Same call as r3 — the framing is "what the caller does", not "what we do", and Lesson 11 already covers the same ground as a problem statement. Borderline; defensible to leave. r3 marked it identically.

#### 🟡 Suggestion — doc-housekeeping aside about `query` in dependants footnote

The footnote at [foundation.md:244](packages/headless/src/modules/session/docs/foundation.md#L244) reads: _"`query` (the HTTP transport layer) imports `session` 5× to attach the bearer header. It's listed as an own-dependency below rather than a dependant, **per the workshop scope decision that `query` is a foundational layer rather than a peer module.**"_ The "per the workshop scope decision" phrasing is meta-commentary about doc structure rather than platform behaviour — exactly the kind of "our implementation choice" framing the rule asks to silently absorb. Suggested rewrite: drop "per the workshop scope decision that" — the rest of the sentence already states the architectural truth. 🟡 minor polish.

### New strengths since r3

- 🟢 **Three audits' worth of corrections landed cleanly in a single pass.** The r3 priorities — dependants table regeneration, two tone slips, two flow purpose lines — were addressed verbatim against the suggested wording. This is the highest-fidelity correction-to-spec turnaround across any module reviewed so far.
- 🟢 **The Lesson 11 rewrite at [foundation.md:858](packages/headless/src/modules/session/docs/foundation.md#L858)** is textbook. The new title _"Local-only sign-out leaves downstream caches keyed to the prior actor"_ is the load-profile problem stated factually; the body extends with the observable consequence (`a fresh guest session shows the previous client's data`) and the system-level cause (`each cache happens to invalidate on its own schedule`). No prescription, no solution-shape, no `you should`.
- 🟢 **The dependants table footnote** at [foundation.md:244](packages/headless/src/modules/session/docs/foundation.md#L244) is a clean way to explain why `query` (the highest-volume single importer) sits below the table rather than at the top. Reusable pattern for any future module where the transport layer is also the heaviest importer.
- 🟢 **Registration flow purpose line at [foundation.md:733](packages/headless/src/modules/session/docs/foundation.md#L733)** packs three architectural surprises into 38 words: brand-driven form, client-record-not-token return, and possible 2FA challenge on enrolment. An architect reading just this line knows enough to plan the four-call dance the Lessons section later substantiates.

---

## Part 2 — Fresh full audit (this pass)

### Strip audit

| Pattern | Hits | Severity |
| --- | --- | --- |
| Composable method names (`useX()`, `isReady()`, `getConfigValue()`, etc.) | None across 12 operations, 7 flows, 15 lessons | ✅ Clean |
| Store / queryKey / persister names (`brandConfigKeysStore`, `["session"]`, `localStoragePersister`) | None | ✅ Clean |
| Framework terms (`computed()`, `ref()`, XState, TanStack, `spawn()`, scoped composable, `useQuery`) | None | ✅ Clean |
| `.meta` content outside the italic note (any sub-property, any aliasing) | None — `IToken`, `/self`, `/clients_fields`, `/auth_code` don't return a top-level `meta`; the italic note at [foundation.md:7](packages/headless/src/modules/session/docs/foundation.md#L7) is preventive | ✅ Clean |
| Prescriptive verbs (`you should`, `you must`, `everyone awaits`, `plan for`) | None across all 15 lessons | ✅ Clean (both r3-flagged slips now resolved) |
| Solution-shape suffixes (`the cleaner shape is X`, `the natural separation is Y`, `the X has to do Y`, `the inversion has to happen somewhere`) | None | ✅ Clean (Lesson 13 rewritten) |
| Meta-commentary about our implementation (`our implementation`, `we chose`, `we split`) | One residual — _"per the workshop scope decision that…"_ at [foundation.md:244](packages/headless/src/modules/session/docs/foundation.md#L244) | 🟡 Suggestion |

**Strip verdict: 🟢 PASS.** Three consecutive audits found the same two prescription slips; this pass finds neither. The one residual is a doc-housekeeping aside, not a Lesson-section prescription.

### Section audit

| Section | Required? | Status | Notes |
| --- | --- | --- | --- |
| What it is | ✅ Required | ✅ Present | Strong open. Scope note at [foundation.md:9](packages/headless/src/modules/session/docs/foundation.md#L9). |
| Core concepts | Optional | ✅ Present | Six terms, all genuinely needed (actor, token, self, grant type, 2FA challenge, transfer). |
| State model | Optional (almost always omit) | ✅ Correctly absent | No reactive-stack vocabulary anywhere. |
| Operations | ✅ Required | ✅ Present | 12 capabilities (rule cap). Lifecycle covered (refresh = #8, reauth = #11, subscribe = #12). |
| Data shape | ✅ Required | ✅ Present | All key types covered; trim disclaimers in place. |
| Dependencies | ✅ Required | ✅ Present | Dependants table now regenerated from graph; own-dependencies clearly enumerated. |
| API endpoints | ✅ Required | ✅ Present | 6 endpoints, 3 still stubbed (fixture-pipeline gap). |
| Side effects | Optional (usually omit) | ✅ Correctly absent | Cookie persistence is in Lesson 10. |
| Coordination | Optional (usually omit) | ✅ Correctly absent | Cross-actor cache coordination is in Lesson 11. |
| Flows | Optional but warranted | ✅ Present | 7 flows, `flowchart TD`, all with one-line purpose + Guarantees + Constraints prose. |
| Lessons (hard-won) | ✅ Required | ✅ Present | 15 entries, all problem-stated. |
| Hot Keys by Lifecycle | Optional (only when keyed config) | ✅ Correctly absent | Session doesn't own keyed config. |

### Content audit

#### Operations (capabilities vs source)

`useSession` exports 18 observable behaviours across [useSession.ts:564-771](packages/headless/src/modules/session/useSession.ts#L564-L771). Coverage matrix:

| Source export | Covered? | Capability # |
| --- | --- | --- |
| `subscribe` | ✅ | 12 (Observe identity changes) |
| `isReady` / `isAuthenticated` | ✅ | implicit in 1+2 |
| `meta` (12 flags) | — | derived view, not a capability |
| `context` / `errors` / `validationErrors` | — | observable state, not capabilities |
| `model` / `schema` / `uischema` | 🟡 | form-scaffolding, defensibly omitted |
| `client` / `clientId` | ✅ | 2 |
| `reject` | ✅ | 11 (Signal token rejection) |
| `resolve` | — | 2FA exchange; folded into 4 |
| `refresh` | ✅ | 8 (Refresh access token) |
| `login` | ✅ | 3 |
| `logout` | 🟡 | covered in Flow 5 + Lesson 11; absent as Operations row |
| `recover` | ✅ | 6 |
| `register` | ✅ | 5 |
| `verify2fa` | ✅ | 4 |
| `transferTo` / `transferFrom` / `getTransferDetails` / `transferred` | ✅ | 9 + 10 |
| `showLogin` / `showRegister` / `showRecoverPassword` | — | UI scaffolding, defensibly omitted |
| `setModel` | — | form-scaffolding, omitted |
| `getToken` | 🟡 | a "Read the current bearer" capability could fit |
| `getHistory` | — | debug surface, omit |
| `reauth` | ✅ | 11 |

**Observation:** still 12 of ~14 architecturally-relevant exports covered. Same defensible omissions as r3.

#### Data shape

Cross-referenced against `packages/types/src/models/token.ts`, `packages/types/src/data/enums/tokens.ts`, `packages/types/src/data/enums.ts`. Findings:

- ✅ `Token` shape at [foundation.md:41-53](packages/headless/src/modules/session/docs/foundation.md#L41-L53) matches `IToken` with appropriate fixture-truth corrections.
- ✅ `ActorType` at [foundation.md:57](packages/headless/src/modules/session/docs/foundation.md#L57) matches `AccessRoleTypes` + interim values, correctly annotated.
- ✅ `GrantType` union at [foundation.md:62-75](packages/headless/src/modules/session/docs/foundation.md#L62-L75): 13 values, matches `GrantTypes` enum.
- ✅ `TwofaProvider = "Email" | "TOTP"` matches `TwofaProviders`.
- ✅ `Self`, `Actor`, `Account`, `CustomField`, `AuthTransfer`, `AccessTokenBody`, `RegisterBody`, `RecoverBody` all cross-check against fixtures and types.

#### Dependants table (this pass's largest improvement)

Graph re-run 2026-05-15 (jq filter unchanged from r3, see Appendix A):

| Module in graph | Graph weight | Doc weight | Verdict |
| --- | --- | --- | --- |
| `client` | 12 | 12 (#1) | ✅ Match |
| `basket` | 7 | 6 (#2) | 🟡 Off by 1 |
| `query` | 5 | (footnoted as own-dep) | ✅ Architecturally explained |
| `invoices` | 4 | 4 (#3) | ✅ Match |
| `paymentDetails` | 4 | 4 (#4) | ✅ Match |
| `orders` | 3 | 3 (#5) | ✅ Match |
| `domain` | 2 | 2 (#6) | ✅ Match |
| `billing` | 1 | — | 🟡 Missing |
| `order` | 1 | — | 🟡 Missing (singular variant) |
| `payment` | 1 | 1 (#7) | ✅ Match |
| `system` | 1 | 1 (#8) | ✅ Match |

8 of 11 entries match exactly; 1 off-by-1 (basket); 2 single-edge modules missing. Compared to r3 — which had 5 modules missing and 2 entries with zero graph backing — this is the single largest accuracy lift across the four audits. The table now correctly conveys the architectural shape of the dependants tree: `client` is the dominant consumer; `basket`, `invoices`, `paymentDetails`, `orders` form the second tier; remaining modules are single-edge.

#### API endpoints

- ✅ `POST /oauth/access_token` curls match `tests/__fixtures__/recordings/post--oauth-access_token-{guest,client,twofa}.json` fixtures.
- ✅ `GET /self` sample at [foundation.md:444-538](packages/headless/src/modules/session/docs/foundation.md#L444-L538) is real, trimmed, `meta` correctly stripped.
- ❌ `POST /clients/register`, `POST /clients/password_reset`, `GET /clients_fields` remain stubbed (C4). Fixture pipeline issue.
- ✅ `POST /auth_code` is honestly marked stubbed.

#### Lessons

15 entries. All describe problems cleanly without solutions or prescriptive suffixes. The set covers: every-visitor-needs-a-token, guest+client coexistence, login-not-single-roundtrip, interim-token-short-expiry, same-endpoint-many-grants, /self-payload-width, actor_type-divergence, locale-belongs-to-client, i18n-vs-auth-code-redemption, registration-four-call-dance, cookie-origin-rules, sign-out-cache-coordination, transfer-single-use, expiry-mid-call, guest→client-token-swap. **All architecturally load-bearing.**

#### Flow-shape compliance (re-audit)

| Flow | Purpose? | Mermaid shape? | Guarantees? | Constraints? | Verdict |
| --- | --- | --- | --- | --- | --- |
| Anonymous bootstrap | ✅ L681 | ✅ `flowchart TD` | ✅ L690 prose | ✅ L696 declarative | ✅ |
| Password login | ✅ L703 | ✅ diamond branch | ✅ L716 | ✅ L723 | ✅ |
| Registration | ✅ L733 | ✅ diamond + multi-step | ✅ L747 | ✅ L753 | ✅ |
| Password recovery | ✅ L761 | ✅ clean linear | ✅ L769 | ✅ L774 | ✅ |
| Sign-out | ✅ L781 prose preamble | ✅ diamond | ✅ L793 | ✅ L798 | 🟡 fragment bullets |
| Auth-code transfer | ✅ L805 | ✅ subgraph OA/OB | ✅ L822 | ✅ L828 | 🟡 fragment bullets |

**Verdict:** 🟢 All six flow purposes present (r3's gap fully closed). 🟡 Four fragment-style Guarantees bullets across Sign-out and Auth-code transfer (see new-issues section).

#### Mermaid notation re-audit

| Flow | `<br/>` inside nodes | Node shapes | Renders in GH | Issues |
| --- | --- | --- | --- | --- |
| Anonymous bootstrap | — | ✅ | ✅ | — |
| Password login | ✅ | ✅ | ✅ | — |
| Registration | ✅ multiple, all valid | ✅ | ✅ | — |
| Password recovery | ✅ | ✅ | ✅ | — |
| Sign-out | ✅ | ✅ | ✅ | — |
| Auth-code transfer | ✅ inside subgraph | ✅ subgraph OA/OB | ✅ | — |

**Verdict: 🟢 PASS.** All seven Mermaid blocks render cleanly across GitHub, VS Code preview, and conformant Mermaid renderers.

---

## Part 3 — Golden delta

No `docs/workshop/archive/session.md` exists. Brand foundation doc + system foundation doc continue to serve as proxy goldens.

| Divergence | Classification | Detail |
| --- | --- | --- |
| Session has a Flows section (7 flows); brand and system have none | ⭐ Pro candidate | Session legitimately has multi-step interactions; brand and system do not. The seven flows are the load-bearing addition that makes the doc rebuildable. |
| Session lists 15 lessons; brand and system list ~10–12 | ⭐ Pro candidate | Session legitimately has more architectural complexity (4 actor types × 12 grants × 2FA × transfer × refresh × cookies × cache invalidation). Lesson set is dense but not bloated. |
| Session's `ActorType` union annotates interim-only wire values | ⭐ Pro candidate | The inline `(interim)` annotation pattern at [foundation.md:49](packages/headless/src/modules/session/docs/foundation.md#L49) — reusable for any future module where the wire surface carries values that don't belong in the typed contract. |
| Session's dependants table now matches the rule's "comprehensive" criterion (8 of 11 graph edges); brand and system goldens are similarly comprehensive | — | Resolved this pass. The carry-over rule-gap concern from r3 is moot. |
| Session uses `flowchart TD` Mermaid for cross-origin flow with `subgraph`; goldens have no flows | ⭐ Pro candidate | The Auth-code transfer flow at [foundation.md:807-820](packages/headless/src/modules/session/docs/foundation.md#L807-L820) is the first foundation doc to use `subgraph` for a cross-origin boundary. The pattern reads cleanly and the boundary semantics are obvious. Reusable for any future module with cross-origin handoff (payment redirects, OAuth callbacks). |

---

## Top 3 priorities

1. 🟡 **Polish the four fragment-style Guarantees bullets.** [foundation.md:795](packages/headless/src/modules/session/docs/foundation.md#L795) + [foundation.md:822-826](packages/headless/src/modules/session/docs/foundation.md#L822-L826). Mechanical edits: "to remain" → "remains", "to be" → "is", "to represent" → "represents", "to succeed" → "succeeds". Brings tonal consistency with the other 30+ Guarantees bullets in the doc.
2. 🟡 **Fill the dependants table residuals.** Add `billing 1` and `order 1` rows below `payment 1`; re-check `basket 6` vs graph `basket 7` (likely a test-file exclusion). 5-minute mechanical edit; would lift Technical accuracy to 96.
3. 🟡 **Drop the "per the workshop scope decision that" aside** from the dependants footnote at [foundation.md:244](packages/headless/src/modules/session/docs/foundation.md#L244). One micro-edit; removes the only residual doc-housekeeping flavour in the entire document.

None of these are blockers. The doc is publishable in its current state.

---

## Suggested rule / skill updates

**None this pass.** The rule held up across all four audits without needing a single patch — every issue surfaced was an agent-side correction the rule already named. The candidate's iteration arc (P1 80 → P2 86 → P3 89 → P4 93) demonstrates that the rule supports convergence; the agent landed every correction the rule's checklist asked for once it was flagged.

The one minor observation: the rule's "Solution-shape suffixes" list could be expanded with the `[subject] to [verb]` elliptical construction observed in the four Guarantees bullets — but it's a stylistic note, not a forbidden pattern, and the bullets are grammatically valid against the prose lead-in. **No rule patch proposed.**

---

## Appendix A — Source-of-truth references

### Typed contracts

- [packages/types/src/models/token.ts](packages/types/src/models/token.ts) — `IToken` interface
- [packages/types/src/data/enums.ts](packages/types/src/data/enums.ts) — `AccessRoleTypes` (4 values)
- [packages/types/src/data/enums/tokens.ts](packages/types/src/data/enums/tokens.ts) — `GrantTypes` (13 values), `TwofaProviders` (Email, TOTP)
- [packages/types/src/models/contexts.ts](packages/types/src/models/contexts.ts) — `Contexts`

### Composable surface

- [packages/headless/src/modules/session/useSession.ts:560-777](packages/headless/src/modules/session/useSession.ts#L560-L777) — full return shape (18 exports)

### Fixtures (`tests/__fixtures__/recordings/`)

- `post--oauth-access_token-guest.json` — real 200
- `post--oauth-access_token-client.json` — real 200 (carries the `twofa_provider: "Email"` per-actor value that drives C2)
- `post--oauth-access_token-twofa.json` — real 200, interim token
- `get-self.json` / `get--self.json` — real 200, full payload
- `post--clients-register.json` — HTTP 404 (`Domain not found!`) — also present as `post-clients-register.json` (single-dash variant) which could be checked for usability
- `post--clients-password_reset.json` — HTTP 404, single-dash variant present
- `get--clients_fields.json` — HTTP 404, alternate `get-clients_fields-20dc6ef3.json` present

### Graph (cross-module dependants of `modules/session/`)

```bash
jq -r '[.links[]
  | select(.source_file | test("modules/session/") | not)
  | select(._tgt | test("modules_session"))]
  | map(.source_file | capture("modules/(?<m>[^/]+)/") | .m)
  | group_by(.)
  | map({m: .[0], n: length})
  | sort_by(-.n)' graphify-out/graph.json
```

Output (re-run 2026-05-15): `client 12, basket 7, query 5, invoices 4, paymentDetails 4, orders 3, domain 2, billing 1, order 1, payment 1, system 1`.

---

## Appendix B — Verbatim evidence for warning issues

### Tone slip 1 — Lesson 11 rewrite (FIXED)

**Before (r3 candidate, [foundation.md:851](packages/headless/src/modules/session/docs/foundation.md#L851)):**

```
- **Logout has to be louder than the local session.**
```

**After (current candidate, [foundation.md:858](packages/headless/src/modules/session/docs/foundation.md#L858)):**

```
- **Local-only sign-out leaves downstream caches keyed to the prior actor.**
  Clearing the persisted token is necessary but not sufficient — basket,
  payment, panel, and analytics consumers all hold their own caches keyed
  off the prior actor. Without a signal that downstream consumers can
  subscribe to, a fresh guest session shows the previous client's data
  until each cache happens to invalidate on its own schedule.
```

### Tone slip 2 — Lesson 13 rewrite (FIXED)

**Before (r3 candidate, [foundation.md:853](packages/headless/src/modules/session/docs/foundation.md#L853)):**

```
A redirect-driven transfer can be invalidated by a refresh, a back-button,
or an intermediary touching the URL. If the redemption fails the prior
token has to remain intact — replacing first and then validating leaves
the user signed out of both origins.
```

**After (current candidate, [foundation.md:860](packages/headless/src/modules/session/docs/foundation.md#L860)):**

```
- **The transfer auth-code is single-use and short-lived, and redemption
  replaces the active token.** A redirect-driven transfer can be invalidated
  by a refresh, a back-button, or an intermediary touching the URL. A failed
  redemption that has already discarded the prior token leaves the user
  signed out of both origins — the platform won't restore either.
```

### New issue — fragment Guarantees bullets

[foundation.md:795](packages/headless/src/modules/session/docs/foundation.md#L795):

```
- The previous client token to remain valid until its natural expiry
  if the caller forgets to drop it. Possession of the bearer is access.
```

[foundation.md:822-826](packages/headless/src/modules/session/docs/foundation.md#L822-L826):

```
- The code to be single-use and short-lived (minutes). After redemption
  it's burnt.
- The redeemed token to represent the same actor as the issuing token,
  with a fresh `expires_in`.
- The code-redemption call to succeed even before i18n / locale negotiation
  is set up on origin B — the call deliberately accepts no `lang`.
```

### Dependants table (FIXED — comparison)

**r3 (broken):** `paymentDetails 14, system 10, basket 8, client 7, product 4, brand 3, payment 2` — three of seven entries have weights with no graph backing; client mis-ranked from #1 to #4.

**P4 (current):** `client 12, basket 6, invoices 4, paymentDetails 4, orders 3, domain 2, payment 1, system 1` + query footnote — 8 of 11 graph edges covered exactly; 1 off-by-1; 2 single-edge edges missing.

---

## Appendix C — Files reviewed

### Rule + standards

- [.agent/rules/docs-modules.md](.agent/rules/docs-modules.md)
- [.agent/rules/docs-writing.md](.agent/rules/docs-writing.md)
- [.agent/rules/docs-reviews.md](.agent/rules/docs-reviews.md)

### Candidate

- [packages/headless/src/modules/session/docs/foundation.md](packages/headless/src/modules/session/docs/foundation.md)

### Prior audits

- [docs/audit/session-foundation-2026-05-15-r3.md](docs/audit/session-foundation-2026-05-15-r3.md) (most recent, primary delta target)
- [docs/audit/session-foundation-2026-05-15-rereview.md](docs/audit/session-foundation-2026-05-15-rereview.md)
- [docs/audit/session-foundation-2026-05-15.md](docs/audit/session-foundation-2026-05-15.md)

### Goldens (proxy — no `session.md` in archive)

- Referenced via prior audits.

### Source-of-truth

- [packages/headless/src/modules/session/useSession.ts:560-777](packages/headless/src/modules/session/useSession.ts#L560-L777)
- [packages/types/src/models/token.ts](packages/types/src/models/token.ts)
- [packages/types/src/data/enums.ts](packages/types/src/data/enums.ts)
- [packages/types/src/data/enums/tokens.ts](packages/types/src/data/enums/tokens.ts)
- [packages/types/src/models/contexts.ts](packages/types/src/models/contexts.ts)

### Fixtures

- `tests/__fixtures__/recordings/post--oauth-access_token-{guest,client,twofa}.json`
- `tests/__fixtures__/recordings/get-self.json` + `get--self.json`
- `tests/__fixtures__/recordings/post--clients-register.json` (404) + `post-clients-register.json` (alternate)
- `tests/__fixtures__/recordings/post--clients-password_reset.json` (404) + single-dash alternate
- `tests/__fixtures__/recordings/get--clients_fields.json` (404) + `get-clients_fields-20dc6ef3.json` alternate

### Graph

- [graphify-out/graph.json](graphify-out/graph.json) — re-computed cross-module weights via jq filter (Appendix A)

---

## Appendix D — Strip-audit exhaustive list

All forbidden-pattern hits in the current candidate:

| Pattern | Line | Quote |
| --- | --- | --- |
| Meta-commentary about doc structure (`per the workshop scope decision that…`) | 244 | "It's listed as an own-dependency below rather than a dependant, **per the workshop scope decision that** `query` is a foundational layer rather than a peer module." |
| Sentence-fragment Guarantees bullet (`to remain`) | 795 | "The previous client token **to remain valid** until its natural expiry…" |
| Sentence-fragment Guarantees bullet (`to be`) | 822 | "The code **to be single-use** and short-lived…" |
| Sentence-fragment Guarantees bullet (`to represent`) | 824 | "The redeemed token **to represent** the same actor…" |
| Sentence-fragment Guarantees bullet (`to succeed`) | 826 | "The code-redemption call **to succeed** even before i18n…" |

All five are 🟡 Suggestions. **No 🔴 Critical or 🟠 Warning strip-audit hits this pass** — the first time in four audits the Lessons section is fully clean.
