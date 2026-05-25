# Audit: `session` foundation doc — 2026-05-15

**Artefact reviewed:** `packages/headless/src/modules/session/docs/foundation.md`
**Standards applied:** `.agent/rules/docs-modules.md`, `.agent/rules/docs-reviews.md`
**Golden references:** `packages/headless/src/modules/brand/docs/foundation.md`, `packages/headless/src/modules/system/docs/foundation.md`
**Prior audit:** none — this is the first audit of the session foundation doc.
**Reviewer hat:** treating the doc as ship-ready for architects rebuilding the platform in Svelte (or any non-Vue stack).

---

## Opening acknowledgement

The doc is genuinely good. It hits the hardest brief a workshop deliverable can have — explain identity without sounding like Vue/XState/Upmind — and largely succeeds. Highlights:

- 🟢 **Excellent "What it is"** — frames session as the identity contract every other module reads, names the actor archetypes, and lands the "no useful unauthenticated mode" insight without prescribing how to fix it.
- 🟢 **Grant-type catalogue is the right level of detail.** Listing all twelve grants discriminated by `grant_type` is more useful than ten paragraphs of prose, and surfaces the single-endpoint-many-flows architectural problem cleanly.
- 🟢 **The 2FA interim-token lessons are genuinely hard-won.** "Login is not a single round-trip" + "interim 2FA token has a much shorter expiry" + "actor_type lives in two places that can disagree" are exactly the kind of problems an architect needs to know before they design the auth state machine, not after.
- 🟢 **State diagram + state table is a clean addition.** Most modules don't need this section; session legitimately does, and the ASCII shape is readable.
- 🟢 **Lessons section is the strongest in any foundation doc to date** — 14 entries, problem-stated, no "the cleaner shape is X" trailing prescriptions, covers cookie-origin, refresh-mid-call, logout broadcast, transfer single-use, guest→client token swap.

This is at-or-above the brand and system bars on most dimensions, with a handful of correctable issues below.

---

## Scoring

| Category | Score | Notes |
| --- | --- | --- |
| **Technical Accuracy** | 78/100 | One real type mismatch (`twofa_provider` nullability) plus a guard-vs-doc discrepancy. Sample fixtures are mostly stubbed; one real capture has a misleading `twofa_provider: "Email"` for a non-2FA response that the doc inherits verbatim. |
| **Completeness** | 70/100 | Operations table is missing four observable behaviours from `useSession`: `refresh`, `reauth`/EXPIRED, `setModel`, `getToken`. The `admin`/staff actor is named in five places but has no operations row and the codebase's admin services are entirely commented out — needs an explicit scope decision. |
| **Structure** | 88/100 | All required sections present and well-ordered. Hot-keys-by-lifecycle section is absent — defensible because session doesn't own config — but worth a one-sentence note. |
| **Clarity** | 84/100 | Strong prose, but two sentences contain "the flow needs an explicit re-issue path" and "needs to ride in the registration body" — soft prescriptions that drift from the rule's "no should/must/needs to" tone. |
| **Actionability** | 80/100 | An architect can rebuild from this doc, but the missing operations and the admin ambiguity will force them to read source. Stubbed `/clients/register`, `/clients/password_reset`, and `/clients_fields` samples are also blockers for copy-paste verification. |
| **Overall Confidence** | **80/100** | Solid first cut. Three targeted fixes lift it to ~88. |

---

## Top 3 priorities (severity × ease)

1. 🔴 **Decide the scope of staff/admin and apply it consistently.** The doc names four actor types (`guest`, `client`, `user`, `reseller`) in Core concepts and the `Token.actor_type` union, calls out `twofa-admin` and `admin` grants, but the Operations table only describes client flows and the `admin/` services directory is entirely commented-out code. Either: (a) declare staff explicitly out of scope for the workshop doc with an italic note near the top, OR (b) add an `admin`-grant flow row + curl to Operations and API endpoints. Right now an architect cannot tell whether staff login is a real capability of this module.
2. 🔴 **Fix the `twofa_provider` typing — it's nullable in the recorded fixture and in the real `IToken`, but the doc's `Token` type marks it `TwofaProvider | null` while also showing it as `"Email"` on the *guest* fixture sample (line 312) where there is no 2FA in play.** The recorded fixture is the source of truth; in it `actor_type: "guest"` carries `twofa_provider: null`. The doc inherits the misleading `"twofa_provider": "Email"` value from `post--oauth-access_token-client.json` for a `second_factor_required: false` response — a clear fixture-recording bug that has propagated into the foundation doc. Add a one-line note explaining the field is only meaningful on interim tokens.
3. 🟠 **Complete the operations inventory.** The composable exports `refresh()`, `reauth()` (sends `EXPIRED`), `setModel()`, `getToken()`, `getTransferDetails()`, and `transferred()` as observable behaviours. The doc covers 12 capabilities; the actual exported surface contains ~18. Capability 1 ("readiness signal") covers `isReady` + `isAuthenticated` but not `subscribe`/refresh. Without these, the rebuild target has no way to map "what hooks does my equivalent need to expose?" — which is the central job of the Operations table per `docs-modules.md`.

---

## Strip-audit verdict

The strip is mostly clean — well above the brand and system bars on day-one drafts.

| Checklist item | Verdict | Evidence |
| --- | --- | --- |
| No composable method names (`useX`, `isReady`, `getConfigValue`) | ✅ Clean | Spot-checked all 14 lessons + 12 operations — capability descriptions only |
| No store / queryKey / persister names | ✅ Clean | No `["session"]` query keys, no `upm_client_session` cookie names, no `getTokenFromStorage` |
| No Vue / XState / TanStack references | 🟡 One slip | Doc says "Sub-flows reachable from `guest`. Each owns its own model, schema, and validation lifecycle (`loading → checking → valid/invalid`)" — `loading → checking → valid/invalid` is our XState sub-state shape, lifted verbatim from `guest.machine.ts`. Reads as architectural truth when it's our implementation choice. |
| No `.meta` content anywhere except the top-line italic note | ✅ Clean | One italic note at line 7, no further mentions. Note: I checked — neither `IToken` nor `/self` returns a `meta` field at the top level, so there's actually no `meta` to strip from the data shape here. The note is preventive, which is fine. |
| No "you should…" / "needs to…" / "plan for…" / "the cleaner shape is…" | 🟠 Two near-misses | (a) Lesson 4: "the flow needs an explicit re-issue path back to credentials, not a hard error" — soft prescription. (b) Lesson 9: "The basket currency … all need to ride in the registration body" — describing requirement is fine, but "need to ride" is on the wrong side of the line. (c) Capability 7 description: "Custom-field shape is brand-driven; `recaptcha_token` is required when brand policy demands it." — "is required when" is descriptive, OK. |
| No commentary about why we encoded X the way we did | ✅ Clean | No "we chose" / "our implementation" anywhere |
| No rolled-up substrate framing — one Operations row per BE endpoint | 🟠 Borderline | Capabilities 1–3 (readiness / actor / identity) all read from the same `/self` payload but split into three observable behaviours. This is defensible — they're genuinely distinct reads in the consumer surface — but the boundary between "rolled-up substrate" and "logical capability" is judgement-call territory. The brand doc's equivalent split (`Read brand identity`, `Read visual assets`, `Read regional defaults`, `Read tax policy`) all read the same `/brand/settings` response and the same rule applies. Keeping as-is is consistent with the golden snapshot. |

**Strip verdict: 🟢 PASS with two soft-prescription cleanups.**

---

## Capability coverage check

The Operations table promises 12 capabilities. The `useSession` composable exports the following observable behaviours (counted from `useSession.ts:564-771`):

| Behaviour | In doc? | Notes |
| --- | --- | --- |
| `isReady` / `isAuthenticated` | ✅ Capability 1 | Folded into "readiness signal" |
| `meta.isAuthenticated` + actor read | ✅ Capability 2 | Folded into "read current actor" |
| `client` / `clientId` | ✅ Capability 3 | "Read authenticated identity" |
| Guest token mint (implicit on `check`) | ✅ Capability 4 | Implicit-on-first-contact described well |
| `login` | ✅ Capability 5 | |
| `verify2fa` | ✅ Capability 6 | |
| `register` | ✅ Capability 7 | |
| `recover` | ✅ Capability 8 | |
| `getCustomFields` (via register schema) | ✅ Capability 9 | |
| `logout` | ✅ Capability 10 | |
| `transferTo` | ✅ Capability 11 | |
| `transferFrom` + `useTransfer` | ✅ Capability 12 | |
| `refresh` | ❌ **Missing** | `service.send({ type: "REFRESH" })` — re-validates the token. An architectural primitive every consumer of session needs. |
| `reauth` / `EXPIRED` event | ❌ **Missing** | `service.send({ type: "EXPIRED" })` — drops session to `expired` and re-checks. The transport layer's hook for "token rejected mid-flight". |
| `setModel` | ❌ **Missing** | The form-model write that drives the validation `checking → valid/invalid` substates. Without it the architect doesn't know forms have a partial-write contract. |
| `getToken` | 🟡 Folded? | The bearer-extraction primitive. Capability 2 mentions "holds the access token used to sign requests" but doesn't expose it as a capability the transport layer reads. |
| `subscribe` | 🟡 Implicit | The observability primitive every downstream consumer uses. Possibly under "readiness signal" but worth a row. |
| `getTransferDetails` / `transferred` | 🟡 Folded | Reasonable to fold into Capabilities 11/12. |
| `showLogin` / `showRegister` / `showRecoverPassword` | 🟡 UI-only | These are presentation-layer entry points. Reasonable to omit, but the doc could note this explicitly. |
| Staff/admin grant flow | ❌ **Missing or out-of-scope** | See top-3 priority #1. |

**Coverage: 12 of ~18 observable behaviours.** Three core architectural primitives (`refresh`, `reauth`, `setModel`) are missing entirely.

---

## Data-shape cross-reference

| Field claimed in doc | Source-of-truth | Verdict |
| --- | --- | --- |
| `Token.access_token: string` | `IToken.access_token: string` (token.ts:5) | ✅ Match |
| `Token.refresh_token: string` | `IToken.refresh_token: string` | ✅ Match |
| `Token.token_type: string` | `IToken.token_type: string` | ✅ Match |
| `Token.expires_in: number` | `IToken.expires_in: number` | ✅ Match |
| `Token.refresh_expires_in: number` | `IToken.refresh_expires_in: number` | ✅ Match |
| `Token.second_factor_required: boolean` | `IToken.second_factor_required: boolean` | ✅ Match |
| `Token.actor_id: string` | `IToken.actor_id?: string` (optional) | 🟡 Doc marks required, type marks optional. The fixture always has it (empty string for guest). Defensible to mark required, but flag the difference. |
| `Token.actor_type: ActorType` | `IToken.actor_type?: AccessRoleTypes \| GrantTypes` | 🟡 Doc marks required; type marks optional. Defensible. |
| `Token.twofa_provider: TwofaProvider \| null` | `IToken.twofa_provider: TwofaProviders` (non-nullable in type) | 🟠 **Mismatch.** The type marks it non-nullable (`TwofaProviders` enum), but the fixture returns `null` for guest grants. The doc's nullable version is *more accurate to the wire*, but cite that the codebase type is stricter than reality. |
| `Token.created_at?: number` | `IToken.created_at?: number` | ✅ Match — and doc correctly notes "populated client-side at receive time" (verified in `utils.ts` — the persistence layer adds it). |
| `Token.redirect?: string` | `IToken.redirect?: Location["origin"]` | ✅ Match |
| `ActorType` enumeration includes `"admin"` | `AccessRoleTypes` enum (enums.ts:16-21) has GUEST/CLIENT/RESELLER/USER. `"admin"` only appears in `Contexts` and `GrantTypes`. | 🟠 **Mismatch.** `"admin"` is not a valid `actor_type` on a token — it's a *grant type* (admin login) and a *context* (admin cookie key), but tokens come back with `actor_type: "user"` for staff. Listing `"admin"` in `ActorType` confuses grant with actor. Drop `"admin"` from `ActorType`; keep it in the `GrantType` union (where the doc correctly has it). |
| `TwofaProvider = "Email" \| "TOTP"` | `TwofaProviders` enum (tokens.ts:28-31) | ✅ Match |
| `GrantType` union (12 values) | `GrantTypes` enum (tokens.ts:12-26) | ✅ Match — all 12 enum values represented |
| `Self.role: ActorType` | `/self` response `role: "client"` (fixture line 11) | ✅ Match |
| `Self.actor_id`, `org_id`, `brand_id`, `account_id` | All present in fixture (lines 12-15) | ✅ Match |
| `Self.impersonator_role`, `impersonator_id` | Present in fixture (lines 16-17) | ✅ Match |
| `Self.brand_code` | Present in fixture (line 110) | ✅ Match |
| `Self.replace_branding`, `branding` | **Not in the recorded fixture.** | 🟠 **Inventions or trim.** The `get-self.json` fixture does not contain `replace_branding` or `branding` fields at the top level (verified to line 200). These may be admin-only fields or may live elsewhere. Either cite the alternate fixture or remove. |
| `Self.analytics.{environment,version,language,clean_email,sha_user_id,salted_sha_user_id,logged_in,customer_type}` | Present in fixture (lines 110+ confirmed by partial read; full payload not enumerated) | 🟡 Likely accurate but not verified end-to-end in this audit pass. |
| `Actor` (the `actor` record inside `/self`) — doc lists ~25 fields | The full fixture has **62 fields** on `actor` (lines 18-109). Doc's "Listed fields are the ones a storefront commonly reads" disclaimer is honest. | ✅ Disclaimer used correctly. |
| `Actor.email`, `username`, `firstname`, `lastname`, `fullname`, `public_name`, `image_url`, `interface_language_id`, `interface_language_code`, `document_language_id`, `document_language_code`, `verified`, `is_guest`, `enabled_2fa`, `provider_2fa_id`, `status_id`, `location_country_code`, `location_town`, `default_email`, `has_login`, `has_legacy_invoices`, `topup_enabled`, `last_login` | All present in fixture | ✅ Match |
| `Actor.id`, `created_at`, `updated_at` | Present | ✅ Match |
| `Actor.custom_fields: CustomFieldValue[]` | **Not in the recorded fixture's `actor` object.** | 🟠 Either the `with=actor.custom_fields` expand is needed, or this field appears under different conditions. The doc's `Client` type in `types.ts` references it as `customFields?: IClient["custom_fields"]`, so the field exists on `IClient` but isn't returned by the default `with=actor,accounts` query. Note the conditional. |
| `Account` — doc lists ~22 fields | Fixture has 35+ fields including `wallet_statement_day_of_month`, `negative_wallet_allowance_calculated`, `negative_wallet_allowance_converted_formatted`, `affiliate_payout_paypal_email_id`, `invoice_account_id`. | 🟡 Trimmed, no disclaimer. Brand doc and the system doc both add an explicit "Sample trimmed — additional admin-adjacent fields … preserved in the captured fixture" line. Session doc has a similar note for the response body (line 494) but not for the `Account` type definition. |
| `CustomField` type | No real fixture available (`get--clients_fields.json` is a 404). Doc's shape is plausible but unverified. | 🟡 Mark explicitly stubbed. |
| `AuthTransfer` type | No real fixture available. Doc's shape matches `IAuthTransfer` in `session/types.ts:16-37`. | ✅ Match against type, ❌ no fixture verification. |
| `AccessTokenBody` discriminated union | Matches `GrantTypes` enum + observed call sites in `guest/services.ts`, `client/services.ts`, `session/services.ts` | ✅ Match |
| `RegisterBody` | Matches `register()` call site in `guest/services.ts:140-194` | ✅ Match |
| `RecoverBody` | Matches `recover()` call site | ✅ Match |

---

## Dependants cross-reference (graph vs doc)

The doc claims 10 dependants. The graph (`graphify-out/graph.json`, `links` array, file-edge count `source ∉ session ∧ target ∈ session`) shows:

| Module | Doc weight | Graph weight | Verdict |
| --- | --- | --- | --- |
| `client` | 7 | **35** | 🔴 **Massively under-weighted.** Client module imports from session 35 times — it's the heaviest dependant by far. Doc has it at #4 with weight 7. |
| `system` | 10 | 23 | 🟡 Doc directionally right but weight wrong (23 not 10). |
| `basket` | 9 | 17 | 🟡 Same — weight 17 not 9. |
| `query` | — | 15 | 🟢 Likely correctly excluded (`query` is the HTTP transport, lives in own dependencies). |
| `invoices` | — | 7 | 🔴 **Missing entirely.** Not in the doc's dependants table. |
| `brand` | 3 | 7 | 🟡 Weight 7 not 3, but order roughly right. |
| `paymentDetails` | 14 | 6 | 🔴 **Wrong direction.** Doc has it as the #1 dependant with weight 14; graph shows 6 cross-module edges. This may reflect the doc-author counting differently (e.g. by composable-call frequency rather than import edges), but `docs-modules.md` specifies "File-count weights from `graphify-out/graph.json` (cross-module import edges)" — the rule. |
| `orders` | — | 5 | 🔴 **Missing entirely.** Doc's `order` (singular) entry at weight 1 is the wrong module name — actual folder is `orders` (plural). |
| `config` | — | 4 | 🟡 Maybe folded into brand? The `config` directory does exist in the headless modules folder. |
| `routing` | — | 4 | 🔴 **Missing entirely.** |
| `feedback` | — | 3 | 🔴 **Missing entirely.** |
| `domain` | — | 3 | 🔴 **Missing entirely.** Doc has it under brand, not session. |
| `payment` | 2 | 1 | 🟡 OK |
| `product` | 4 | 0 | 🟡 No direct file edges in graph. Doc may be inferring "product reads currency which comes from session-derived account" — that's a *transitive* dependency, not a direct import. Either drop, or annotate as transitive. |
| `billing` | 1 | 0 | 🟡 Same — no direct edges in graph. |
| `order` (singular) | 1 | — | 🔴 **Wrong module name** — folder is `orders` plural. |

**Net verdict:** 🟠 The dependants table is significantly off from the graph and from the rule's source-of-truth specification. Recommend regenerating it directly from the cross-module file-edge count below, then writing the "reads"/"why" columns against that list:

```
client: 35, system: 23, basket: 17, invoices: 7, brand: 7,
paymentDetails: 6, orders: 5, config: 4, routing: 4,
feedback: 3, domain: 3, payment: 1
```

Plus a "Presentation layer" row (already present, well-written, keep).

---

## Sample-fixture audit

| Endpoint | Fixture status | Verdict |
| --- | --- | --- |
| `POST /oauth/access_token` (grant=guest) | `post--oauth-access_token-guest.json` — real 200 capture | ✅ Used; verbatim match |
| `POST /oauth/access_token` (grant=password) | `post--oauth-access_token-client.json` — real 200 capture | ✅ Used. **Concern:** the fixture has `twofa_provider: "Email"` on a `second_factor_required: false` response, which the doc reproduces verbatim. This is misleading — the field should be `null` for non-2FA responses. This looks like a fixture-recording bug; either flag the discrepancy or replace with a corrected capture. |
| `POST /oauth/access_token` (grant=password, interim) | **Stubbed** ("stubbed — real capture replaces this") | 🟠 Acceptable for first draft; mark for re-record. The interim-token response is the architecturally-important one; getting a real fixture is high-value. |
| `POST /oauth/access_token` (grant=twofa) | No fixture cited, no JSON shown | 🟡 The doc shows the curl + says "Response is a full `Token`" — acceptable, but a sample would be better. |
| `POST /oauth/access_token` (grant=auth_code) | No fixture cited | 🟡 Same — curl shown, no sample body. |
| `GET /self?with=actor,accounts` | `get-self.json` — real 200 capture | ✅ Used; doc trims the payload with an explicit disclaimer at line 494. |
| `POST /clients/register` | `post--clients-register.json` — **404 error capture** ("Domain not found!") | 🔴 The recorded fixture is a 404. The doc correctly marks the response as `// stubbed — real capture replaces this`. **A real success capture is needed before this doc ships** — `/clients/register` is one of the architecturally-important endpoints and the stub conceals what fields the response actually carries. |
| `POST /clients/password_reset` | `post--clients-password_reset.json` — **404 error capture** | 🔴 Same as register — stubbed, but the live fixture is a 404. Re-record needed. |
| `GET /clients_fields?filter[show_on_order_form]=true` | `get--clients_fields.json` — **404 error capture** | 🔴 Same — stubbed. The custom-fields response shape is architecturally important (drives the brand-specific registration model); needs a real capture. |
| `POST /auth_code` | No fixture | 🟠 Stubbed. Auth-code response shape (`client_id`, `actor_id`, `actor_type`, `code`, `redirect_url`) is plausible from `IAuthTransfer` in `types.ts:16-37` but unverified against the wire. |

**Net:** 3 of 9 endpoint samples are stubbed where the real fixtures exist but recorded 404s. This is a fixture-capture problem upstream of the doc, but it means the doc cannot ship-as-is for "copy-paste against the API" use. Either re-record those three endpoints or add an explicit "not yet captured" line per stub.

---

## Tone audit

Per `docs-modules.md` tone section. The doc is mostly factual but two sentences slip into prescription:

| Quote | Issue | Suggested rewrite |
| --- | --- | --- |
| Lesson 4: "The flow needs an explicit re-issue path back to credentials, not a hard error." | "Needs an explicit path" → prescriptive | "Without a re-issue path back to credentials, the user is stuck on a 2FA screen they cannot complete." |
| Lesson 9: "…all need to ride in the registration body or the new client lands on the wrong currency, gets rejected by fraud, or loses attribution." | "All need to ride in" → prescriptive | "When the basket currency, recaptcha token, referral cookie, or analytics envelope is absent from the registration body, the new client lands on the wrong currency, is rejected by fraud, or loses attribution." |
| Lesson 11: "Logout has to be louder than the local session." | "Has to be" → prescriptive (and the rule explicitly forbids "the X has to do Y" suffixes) | "Clearing the persisted token is necessary but not sufficient — basket, payment, panel, and analytics consumers hold their own caches keyed off the prior actor. Without a broadcast they can subscribe to, a fresh guest session shows the previous client's data until each cache invalidates on its own schedule." |

These are all 🟡 polish — the doc still passes the tone bar overall.

---

## Section minimalism

| Section | Required by rule? | Present? | Justified? |
| --- | --- | --- | --- |
| What it is | ✅ Required | ✅ | — |
| Core concepts | ⚠️ Optional | ✅ | 🟢 Yes — Actor, Token, Self, Grant type, 2FA challenge, Transfer are genuinely needed before the rest of the doc lands. |
| State model | ⚠️ Optional (usually omit) | ✅ | 🟢 Yes — session has genuine domain state (checking / guest / client / transferring / expired). Justified. |
| Operations | ✅ Required | ✅ | — |
| Data shape | ✅ Required | ✅ | — |
| Dependencies | ✅ Required | ✅ | — |
| API endpoints | ✅ Required | ✅ | — |
| Side effects | ⚠️ Optional (usually omit) | ❌ | 🟡 **Could justify inclusion.** Session writes cookies (`upm_actor`, `upm_client_session`, `upm_admin_session`, `upm_user_session`) that other systems read — Lesson 10 mentions this but a Side-effects section listing the externally-observable cookie writes by name would be valuable to an architect rebuilding. The rule says "include only when the module has externally-observable side effects an equivalent **must** also produce" — these cookies meet that bar. Consider adding. |
| Coordination | ⚠️ Optional (usually omit) | ❌ | 🟢 Correctly omitted. Coordination lives in Lessons. |
| Flows | ⚠️ Optional | ❌ | 🟡 **Defensible inclusion candidate.** A Mermaid sequence diagram for the 2FA flow (credentials POST → interim token → second POST with interim bearer → final token → `/self`) would be high-signal. The state diagram covers the *state machine* shape; a sequence diagram would cover the *wire* shape, which is what an architect implementing the transport layer needs. |
| Lessons | ✅ Required | ✅ | — |
| Keys by lifecycle phase | N/A (session doesn't own config) | ❌ | 🟢 Correctly omitted. Brand owns keyed config; session reads `ui.client_area.hide_registration_forms` and `ui.client_registration.require_phone` from brand. |

---

## Issues with severity

### 🔴 Critical

- 🔴 **C1 — Admin/staff scope ambiguity** (see Top Priority #1).
- 🔴 **C2 — `twofa_provider: "Email"` reproduced from a misleading fixture** on a non-2FA guest response. The recorded fixture is itself buggy; the doc inherits the bug.
- 🔴 **C3 — Dependants table significantly diverges from graph.json** with `paymentDetails` at the top (weight 14, real edges 6) and `client` under-weighted (weight 7, real edges 35).
- 🔴 **C4 — Three endpoint samples stubbed because the real fixtures are 404s** (`/clients/register`, `/clients/password_reset`, `/clients_fields`). These are architecturally important and shouldn't ship stubbed.
- 🔴 **C5 — `"admin"` listed in `ActorType` union** — but `AccessRoleTypes` enum (the source of truth for actor types) has only GUEST/CLIENT/RESELLER/USER. `"admin"` is a grant type, not an actor type.

### 🟠 Warnings

- 🟠 **W1 — Missing operations:** `refresh`, `reauth`/EXPIRED, `setModel` are core observable behaviours not in the Operations table.
- 🟠 **W2 — XState sub-state shape leaked into State model row** ("`loading → checking → valid/invalid`").
- 🟠 **W3 — `Self.replace_branding` and `Self.branding` fields not present in the recorded fixture** — either inventions, conditional fields, or admin-only. Need verification or removal.
- 🟠 **W4 — `Self.brand_code` is present in fixture but not described in `Self` type doc** — wait, it *is* described. Cancel — false alarm. (Self-correction: re-verified the doc and it does list `brand_code`. Ignore.)
- 🟠 **W5 — `Account` type trimmed without disclaimer** (analogous note exists for `Actor` but not `Account`).
- 🟠 **W6 — `order` (singular) module name in dependants table** — should be `orders`.
- 🟠 **W7 — Two soft-prescriptive sentences in Lessons 4 and 9** (see tone audit).

### 🟡 Suggestions

- 🟡 **S1 — Add a Side effects section** listing the externally-observable cookie writes (`upm_actor`, `upm_client_session`, `upm_admin_session`, `upm_user_session`).
- 🟡 **S2 — Add a Flows section** with a Mermaid sequence diagram for the 2FA exchange (it's the single most non-obvious wire flow).
- 🟡 **S3 — Lesson 11 — "Logout has to be louder"** — rewrite to drop "has to be".
- 🟡 **S4 — Mark stubbed fixtures explicitly** with `// stubbed — fixture pending capture (existing recording is a 404 — see tests/__fixtures__/recordings/<name>.json)` to surface the upstream fixture issue.
- 🟡 **S5 — Note in Capability 9 ("Read registration custom fields")** that the schema-extension behaviour reads brand config (`ui.client_registration.require_phone`) — a cross-module dependency worth surfacing.
- 🟡 **S6 — `Token.actor_type` enumeration includes interim values (`"twofa"`, `"twofa-admin"`)** — this is correct per the codebase usage but worth a one-line note that these are interim, not steady-state, actor types. The reader could otherwise expect persistent storage to ever hold an actor of type `"twofa"`.

### 🟢 Praise (worth keeping)

- 🟢 The `What it is` paragraph is the single best opener in any foundation doc to date.
- 🟢 The `Token` type comment "(interim) / (interim)" next to `twofa` / `twofa-admin` actor types is exactly the right level of inline annotation.
- 🟢 The grant-type union with inline `// guest_customer — exchange a guest-customer token (one-time order link)` comments preserves architectural intent without prescribing implementation.
- 🟢 Lessons 5 ("Same endpoint, different grants") and 6 ("`/self` response shape is wider than any single consumer needs") are the kind of insights that would otherwise take an architect a week to discover.
- 🟢 The state diagram correctly shows `expired → checking` as transient — this is non-obvious and worth keeping.

---

## Concrete rule/skill update proposals

Two gaps in `.agent/rules/docs-modules.md` surfaced during this audit:

1. **Add a "data-shape trim disclaimer is per-block, not per-doc" sub-rule.** The current "Data shape [REQUIRED]" section says "Listed fields are the ones a storefront commonly reads" as a pattern, but the brand doc and this doc both have one disclaimer for the response (e.g. line 494) and none for the type definition (`Account` in this doc). Either require one or codify which is canonical. Suggested addition under Data shape:
   > When the typed shape is a strict subset of the wire shape (admin-adjacent fields trimmed), add an inline `// Trimmed — full shape preserved in fixture <name>.json; admin-adjacent fields (X, Y, Z) omitted` comment **on the type definition**, not only on the sample response.

2. **Add an "interim states" note to the State model section.** Session's `twofa` and `twofa-admin` `actor_type` values are valid only in transit between two calls to the same endpoint — they never persist. The rule's State model guidance doesn't currently mention how to flag transient-but-observable states. Suggested addition:
   > For state types that are observable on the wire but cannot persist, annotate them inline (e.g. `"twofa" — interim, valid only between credential POST and 2FA POST`).

3. **Tighten the dependants-table source-of-truth wording.** The rule says "File-count weights from `graphify-out/graph.json` (cross-module import edges)" — good — but doesn't say which graph object (`links` vs `edges`) or how to dedupe by source-file. This doc's dependants table appears to have been authored from intuition rather than the graph; a one-line `python3 -c …` snippet in the rule would close the gap. Suggested addition:
   > Compute weights with: `python3 -c "import json,re; from collections import Counter; g=json.load(open('graphify-out/graph.json')); n={x['id']:x for x in g['nodes']}; c=Counter(); [c.update([re.search(r'modules/([^/]+)', n.get(e['source'],{}).get('source_file','') or '').group(1)]) for e in g['links'] if 'modules/<NAME>' in (n.get(e['target'],{}).get('source_file','') or '') and 'modules/<NAME>' not in (n.get(e['source'],{}).get('source_file','') or '') and re.search(r'modules/([^/]+)', n.get(e['source'],{}).get('source_file','') or '')]; print(c.most_common())"`

---

## Appendix A — Property / API Reference (source of truth)

### Token shape (canonical = `packages/types/src/models/token.ts:4-16`)

```ts
export interface IToken {
  access_token: string;
  actor_id?: string;
  actor_type?: AccessRoleTypes | GrantTypes;
  created_at?: number;
  expires_in: number;
  redirect?: Location["origin"];
  refresh_expires_in: number;
  refresh_token: string;
  second_factor_required: boolean;
  token_type: string;
  twofa_provider: TwofaProviders;   // non-nullable in type
}
```

### Actor types (canonical = `packages/types/src/data/enums.ts:16-21`)

```ts
export enum AccessRoleTypes {
  GUEST = "guest",
  CLIENT = "client",
  RESELLER = "reseller",
  USER = "user"           // "user" = staff in the wire
}
```

**Not in `AccessRoleTypes`: `"admin"`, `"twofa"`, `"twofa-admin"`.** The first is a *context*, the latter two are *grant types*.

### Contexts (canonical = `packages/types/src/models/contexts.ts:1-8`)

```ts
export enum Contexts {
  ADMIN = "admin",
  CLIENT = "client",
  GUEST = "guest",
  USER = "user",
  NO_CONTEXT = ""
}
```

### Grant types (canonical = `packages/types/src/data/enums/tokens.ts:12-26`)

12 values: ADMIN, ADMIN_PASSWORD_RESET, AUTH_CODE, COMPLETE_ORG_REGISTRATION, COMPLETE_USER_REGISTRATION, COMPLETE_REGISTRATION, GUEST, GUEST_CUSTOMER, PASSWORD, PASSWORD_RESET, REFRESH_TOKEN, TWOFA_ADMIN, TWOFA. (Note: codebase has 13 because TWOFA and TWOFA_ADMIN are both listed; doc correctly enumerates all of them.)

### TwofaProviders (canonical = `packages/types/src/data/enums/tokens.ts:28-31`)

```ts
export enum TwofaProviders {
  EMAIL = "Email",
  TOTP = "TOTP"
}
```

### useSession exported surface (canonical = `packages/headless/src/modules/session/useSession.ts:564-771`)

`subscribe`, `isReady`, `isAuthenticated`, `meta` (12 boolean flags), `context`, `errors`, `validationErrors`, `model`, `schema`, `uischema`, `client`, `clientId`, `reject`, `resolve`, `refresh`, `login`, `logout`, `recover`, `register`, `verify2fa`, `transferTo`, `transferFrom`, `getTransferDetails`, `transferred`, `showLogin`, `showRegister`, `showRecoverPassword`, `setModel`, `getToken`, `getHistory`, `reauth`.

Plus `useTransfer` exposes `transferFrom` (renamed wrapper).

---

## Appendix B — Enum / Registration Cross-Reference

| Doc claim | Source-of-truth | Verdict |
| --- | --- | --- |
| `ActorType` includes `"admin"` | `AccessRoleTypes` does not include "admin" | 🔴 Mismatch — see C5 |
| `ActorType` includes `"twofa"`, `"twofa-admin"` | These are `GrantTypes`, not actor types | 🟡 Technically wrong but observable on the wire as interim `actor_type` values; doc usage is defensible if annotated as interim |
| `GrantType` union (12 values) | `GrantTypes` enum (13 values including both TWOFA and TWOFA_ADMIN) | ✅ Doc enumerates all of them |
| `TwofaProvider = "Email" \| "TOTP"` | `TwofaProviders` enum | ✅ Match |
| Cookie names mentioned in Lesson 10 (top-level-domain tokens) | `session.machine.ts:160-163` removes `upm_client_session`, `upm_admin_session`, `upm_user_session` and `upm_actor` | 🟡 Doc describes the pattern correctly but doesn't name the specific cookies — defensible per the strip rule (no store names). |

---

## Appendix C — Verbatim Evidence (critical issues)

### C2 — Misleading `twofa_provider` on guest fixture

`tests/__fixtures__/recordings/post--oauth-access_token-client.json` line 13:
```
"twofa_provider": "Email",
```
Same fixture line 9: `"second_factor_required": false` — so 2FA is not in play, yet the provider is populated. This is a recording bug.

Foundation doc line 339-340 reproduces this verbatim:
```
"twofa_provider": "Email",
```
on a `"second_factor_required": false` response.

### C3 — Dependants table vs graph

Doc line 275: `paymentDetails | 14 | …`
Graph file-edges (`source_file matches modules/paymentDetails AND target_file matches modules/session`): 6.

Doc line 278: `client | 7 | …`
Graph file-edges (`source_file matches modules/client AND target_file matches modules/session`): 35.

### C4 — Stubbed sample, real fixture is a 404

`tests/__fixtures__/recordings/post--clients-register.json` lines 7-19 contain a 404 error response. Foundation doc line 522 marks this as `// stubbed — real capture replaces this`. The fixture pipeline needs a successful capture before the doc can be considered shippable.

Same pattern for `post--clients-password_reset.json` and `get--clients_fields.json`.

### C5 — `"admin"` in ActorType

Foundation doc line 101:
```ts
type ActorType = "guest" | "client" | "reseller" | "user" | "twofa" | "twofa-admin" | "admin";
```
`packages/types/src/data/enums.ts:16-21`: AccessRoleTypes has only GUEST, CLIENT, RESELLER, USER. `"admin"` is in `Contexts` (a cookie-keying enum), not in actor types.

---

## Appendix D — Files Reviewed

### Target
- `packages/headless/src/modules/session/docs/foundation.md`

### Standards
- `.agent/rules/docs-modules.md`
- `.agent/rules/docs-reviews.md`

### Golden snapshots
- `packages/headless/src/modules/brand/docs/foundation.md`
- `packages/headless/src/modules/system/docs/foundation.md`

### Source-of-truth (codebase)
- `packages/headless/src/modules/session/index.ts`
- `packages/headless/src/modules/session/types.ts`
- `packages/headless/src/modules/session/services.ts`
- `packages/headless/src/modules/session/session.machine.ts`
- `packages/headless/src/modules/session/useSession.ts`
- `packages/headless/src/modules/session/useTransfer.ts`
- `packages/headless/src/modules/session/guest/services.ts`
- `packages/headless/src/modules/session/guest/guest.machine.ts` (partial — first 100 lines)
- `packages/headless/src/modules/session/client/services.ts`
- `packages/headless/src/modules/session/admin/services.ts` (all commented out)
- `packages/types/src/models/token.ts`
- `packages/types/src/models/contexts.ts`
- `packages/types/src/data/enums.ts` (AccessRoleTypes)
- `packages/types/src/data/enums/tokens.ts` (GrantTypes, TwofaProviders)

### Fixtures
- `tests/__fixtures__/recordings/post--oauth-access_token-guest.json`
- `tests/__fixtures__/recordings/post--oauth-access_token-client.json`
- `tests/__fixtures__/recordings/post--oauth-access_token.json` (not opened — variant)
- `tests/__fixtures__/recordings/get-self.json` (real 200 capture)
- `tests/__fixtures__/recordings/get--self.json` (401 — wrong-expand variant)
- `tests/__fixtures__/recordings/get--admin-self.json` (not opened)
- `tests/__fixtures__/recordings/post--clients-register.json` (404)
- `tests/__fixtures__/recordings/post--clients-password_reset.json` (404)
- `tests/__fixtures__/recordings/post--admin-users-password_reset.json` (not opened)
- `tests/__fixtures__/recordings/get--clients_fields.json` (404)
- `tests/__fixtures__/recordings/get-clients_fields-20dc6ef3.json` (not opened)
- `tests/__fixtures__/recordings/get--org-clients_fields.json` (not opened)

### Graph
- `graphify-out/graph.json` (nodes + links sections; fan-in computed via `links` array filtered for cross-module edges into `modules/session`).

---

## Appendix E — In-Progress Signals

Three-bucket categorisation per `docs-reviews.md`:

### 🟠 In Progress (someone is mid-edit / unresolved)

- The four 🔴 critical items above all read as drafting threads, not as architectural omissions. The doc reads as a careful first cut where the author knew certain endpoints were 404-stubbed and certain shape questions were unresolved — the explicit `// stubbed — real capture replaces this` markers prove the awareness. These are tractable next-pass fixes, not foundational rewrites.
- The admin/staff actor scope is the largest in-progress thread — the doc mentions admin grants and `twofa-admin` but doesn't include them as flows. This reads as "we know it's there, we haven't decided whether to scope it in" rather than "we forgot."

### 🔴 Not Started

- Side effects section (cookie writes) — not started, would add architectural value.
- Flows section (2FA Mermaid) — not started, would add architectural value.

### ✅ Done (call out as strengths)

- What it is, Core concepts, State model, Lessons — all complete, consistent, shippable.
- Token type, GrantType union, the operations-table prose — all complete.
- The strip discipline — meta-stripping, no composable names, no XState/Vue references (one minor leak only).

---

## Summary

This is an 80/100 first-cut foundation doc with clear paths to 88+. The three highest-value fixes are: (a) decide and apply the staff/admin scope, (b) fix the type/fixture mismatches around `twofa_provider` and `"admin"`-as-actor, (c) regenerate the dependants table from `graphify-out/graph.json` per the rule's source-of-truth specification. Beyond those, the doc is at-or-above the brand and system bars on tone, structure, and architectural lesson quality.
