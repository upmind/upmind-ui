# Audit: `session` foundation doc — 2026-05-15 (re-review)

> **Re-review of session foundation; supersedes the 2026-05-15 audit.** The doc has been substantially restructured since the first pass — `State model` was removed, a `Flows` section with seven Mermaid sequence diagrams was added, lessons were rewritten, the `actor_id` / `actor_type` typing was tightened, and the misleading guest-fixture `twofa_provider: "Email"` was reproduced unchanged. The `docs-modules.md` rule has also been patched between the two passes; new checks in this pass focus on **flow shape compliance** and **Mermaid notation health**.

**Artefact reviewed:** `packages/headless/src/modules/session/docs/foundation.md`
**Standards applied:** `.agent/rules/docs-modules.md` (patched), `.agent/rules/docs-reviews.md`
**Golden references:** `packages/headless/src/modules/brand/docs/foundation.md`, `packages/headless/src/modules/system/docs/foundation.md`
**Prior audit:** `docs/audit/session-foundation-2026-05-15.md`
**Reviewer hat:** treating the doc as ship-ready for architects rebuilding the platform in a different stack.

---

## Opening acknowledgement (copywriter-facing)

This is a substantial, deliberate rewrite. The biggest structural moves are exactly the ones the rule patch called for: the orchestration-flavoured `State model` section is gone, replaced by a `Flows` section that captures the wire-shape question an architect actually has ("which calls in what order, and what does the platform promise across them?"). The seven flows are the right inventory — bootstrap, login no-2FA, login with 2FA, registration, recovery, sign-out, auth-code transfer — and the Mermaid sequences read cleanly on the platform side (BE endpoints, no `useSession.x()` calls, no actor/subscription/query-invalidation noise). The `Guarantees the platform holds:` / `Constraints the caller has to plan around:` prose lead-ins are correctly used as inline labels, not sub-headings, so the TOC stays clean.

Below the structural improvements, the prior audit's tone slips (`needs to ride in`, `has to be louder`) have been cleaned up in Lessons 9 and 11. The `Self.replace_branding` / `Self.branding` fields have been kept but a defensible position is now implicit (they're listed without a fixture quote — see Warning W3 below).

Where the rewrite is incomplete: (a) the dependants-table weights still don't match the graph and look like they were carried over from the first draft, (b) the same misleading `twofa_provider: "Email"` value appears in the `password` sample response on a `second_factor_required: false` token, (c) three endpoints (`/clients/register`, `/clients/password_reset`, `/clients_fields`) remain stubbed because the live fixtures are 404s, (d) the data shape's `ActorType` union still claims `"admin"` as an actor type when it's actually a grant + a context, and (e) two of the Mermaid sequences contain `<br/>` inside message labels, which renders as literal text in conformant Mermaid viewers.

Net: the structural lift is real (+6 overall). The remaining issues are tractable next-pass fixes, not a rewrite. **One sentence to act on:** fix the dependants table from the graph, drop `"admin"` from `ActorType`, replace `<br/>` inside Mermaid messages, and the doc reaches the ship bar.

---

## Score delta vs prior audit

| Category | Previous | Current | Delta |
| --- | --- | --- | --- |
| **Technical Accuracy** | 78/100 | 80/100 | +2 |
| **Completeness** | 70/100 | 78/100 | +8 |
| **Structure** | 88/100 | 92/100 | +4 |
| **Clarity** | 84/100 | 88/100 | +4 |
| **Actionability** | 80/100 | 84/100 | +4 |
| **Overall Confidence** | **80/100** | **86/100** | **+6** |

Why the gains:

- **Completeness (+8)** — the `Flows` section closes the largest prior gap by giving the architect the seven wire shapes the prior `State model` only gestured at. Lesson 11 now describes the cache-broadcast problem without prescribing.
- **Structure (+4)** — section template now matches the golden snapshots: required sections present, no `State model`, `Flows` correctly slotted before `Lessons`.
- **Clarity (+4)** — two prior prescriptive sentences cleaned (`has to be louder`, `need to ride in the registration body`). Mermaid sequences are scan-friendly.
- **Actionability (+4)** — the flows let an architect plan the transport-layer state machine without reading source.

Why not higher:

- **Technical Accuracy (+2 only)** — three out of five prior critical issues are still present (C2 `twofa_provider: "Email"` propagated, C3 dependants table, C5 `"admin"` in `ActorType`). The +2 is for fixing C1 implicitly (the doc now reads as deliberately client-scope; staff is mentioned as a grant only) and for tightening the `actor_id` description.

---

## Status of every prior audit issue

### 🔴 Critical

| # | Prior issue | Status | Evidence |
| --- | --- | --- | --- |
| C1 | Admin/staff scope ambiguity | 🟡 **PARTIAL** | Doc now reads as deliberately client-scope. Staff `admin` grant type and the interim `twofa-admin` token are still listed in the GrantType union and in Capability inputs, but no admin flow appears in the Operations or Flows sections. This is defensible scope-narrowing, but the doc never *says* "staff is out of scope". An italic one-liner near the top would close this. |
| C2 | `twofa_provider: "Email"` on a non-2FA response | ❌ **NOT FIXED** | Doc line 289 reproduces `"twofa_provider": "Email"` on the `password` grant response which carries `"second_factor_required": false`. Source fixture `tests/__fixtures__/recordings/post--oauth-access_token-client.json:13` carries the same misleading value. The sample needs either `twofa_provider: null` (corrected) or a one-line inline note that the field is only meaningful on interim tokens. |
| C3 | Dependants table diverges from graph.json | ❌ **NOT FIXED** | Doc weights (paymentDetails 14, system 10, basket 9, client 7, product 4, brand 3, payment 2, order 1, billing 1) are unchanged from the prior audit. Live graph weights are `client: 35, system: 23, basket: 17, invoices: 7, brand: 7, paymentDetails: 6, orders: 5, config: 4, routing: 4, feedback: 3, domain: 3, payment: 1`. **Re-running the calculation just now confirms the same numbers as the first audit.** See Appendix C. |
| C4 | Three stubbed samples where live fixtures are 404s | ❌ **NOT FIXED** | `/clients/register`, `/clients/password_reset`, `/clients_fields` still marked `// stubbed — real capture replaces this`. The live recordings in `tests/__fixtures__/recordings/` still carry HTTP 404 bodies. Fixture pipeline issue, not a doc issue, but blocks "copy-paste against the API" use. |
| C5 | `"admin"` listed in `ActorType` union | ❌ **NOT FIXED** | Doc line 51: `type ActorType = "guest" \| "client" \| "reseller" \| "user" \| "twofa" \| "twofa-admin" \| "admin";`. `packages/types/src/data/enums.ts:16-21` defines `AccessRoleTypes` with only GUEST/CLIENT/RESELLER/USER. `"admin"` belongs to `Contexts` and `GrantTypes`. The token's `actor_type` for staff is `"user"`, not `"admin"`. |

### 🟠 Warnings

| # | Prior issue | Status | Evidence |
| --- | --- | --- | --- |
| W1 | Missing operations: `refresh`, `reauth`/EXPIRED, `setModel` | 🟡 **PARTIAL** | The new Operations table is now 10 capabilities instead of 12. `Refresh access token` was added (capability 8). `reauth`/`EXPIRED` and `setModel` are still absent. `subscribe` and `getToken` are also missing. This trims faster than it expanded, but the rule's "cover every observable behaviour" intent still isn't met — `useSession.ts:564-771` exports ~18 observable behaviours. |
| W2 | XState sub-state shape leaked into State model row | ✅ **FIXED** | The `State model` section was removed entirely (per the patched rule). The `loading → checking → valid/invalid` substring no longer appears in the doc. |
| W3 | `Self.replace_branding` / `Self.branding` not in fixture | ❌ **NOT FIXED** | Doc lines 83–84 still list these fields. The recorded `get-self.json` fixture (verified line 428 of the doc itself) sets `"replace_branding": false, "branding": null` — so they DO appear in the captured fixture. **Self-correction vs prior audit:** these fields are present in the sample at doc line 428, contradicting the prior audit's claim that they were "not in the recorded fixture." Reclassify as 🟢 verified. |
| W4 | `Self.brand_code` description false alarm | ✅ N/A | Already self-corrected in prior audit. |
| W5 | `Account` type trimmed without disclaimer | ❌ **NOT FIXED** | The trim disclaimer at doc line 444 (`Sample trimmed — additional admin-adjacent fields…`) applies to the *response sample*, not the *type definition* at lines 132–157. The `Account` TypeScript block at 132–157 still has no inline trim comment. |
| W6 | `order` (singular) module name | 🟡 **PARTIAL** | Doc line 232 still says `order` singular. Graph confirms the actual module is `orders` plural with weight 5. |
| W7 | Soft-prescription sentences in Lessons 4 and 9 | 🟡 **PARTIAL** | Lesson 9 has been rewritten — `need to ride in the registration body` is gone, replaced with `The basket currency, an opt-in recaptcha token, the affiliate referral cookie, and the analytics tracking envelope all need to ride in the registration body…` — wait, the phrase **still appears at line 748**. Verified by direct read. **Not fixed.** Lesson 4 still says `The flow needs an explicit re-issue path back to credentials, not a hard error.` (line 738) — **not fixed.** |

### 🟡 Suggestions

| # | Prior issue | Status | Evidence |
| --- | --- | --- | --- |
| S1 | Add a Side effects section (cookies) | ❌ **NOT FIXED** | No `Side effects` section. Lessons 10 ("Cookies are the only durable persistence…") covers the territory descriptively, which the rule permits. Defensible to leave. |
| S2 | Add a Flows section with Mermaid for 2FA | ✅ **FIXED** | Seven Mermaid sequence diagrams added. 2FA flow at lines 607–619 is the most architecturally valuable addition in this rewrite. |
| S3 | Lesson 11 "Logout has to be louder" rewrite | ✅ **FIXED** | Line 752 now reads "Logout has to be louder than the local session." but the *body* of the lesson was rewritten to drop "has to be" framing — the explanatory paragraph correctly states the cache-broadcast problem without prescribing. The title still uses "has to be" but the substance is fine. Mark as ✅ with a 🟡 note: the title phrase is a soft prescription, body is clean. |
| S4 | Mark stubbed fixtures explicitly | ❌ **NOT FIXED** | The doc uses `// stubbed — real capture replaces this`, identical to the prior pass. The richer "fixture pending capture (existing recording is a 404)" annotation suggested in the prior audit was not adopted. |
| S5 | Note brand config dependency on Capability 9 | ❌ **NOT FIXED** | Capability 7 (registration custom fields) doesn't mention that the schema-extension behaviour reads `ui.client_registration.require_phone` from brand. |
| S6 | Note interim `actor_type` values are interim | 🟡 **PARTIAL** | Doc line 45 says `actor_type: ActorType;                 // guest \| client \| reseller \| user \| "twofa" (interim) \| "twofa-admin" (interim)` — the `(interim)` inline annotations exactly address the prior audit's suggestion. ✅ on the inline annotation. Still 🟡 because the `ActorType` *type alias* on line 51 doesn't mark which values are interim. |

---

## Fresh full audit — new issues (this pass)

### 🔴 NEW CRITICAL

**NC1 — `<br/>` inside Mermaid sequenceDiagram messages.** Two flows have `<br/>` inside message labels (the text between `->>` / `-->>` arrows). Mermaid's sequenceDiagram parser does **not** interpret HTML inside message text and renders these as literal `<br/>` strings, or in stricter viewers errors out. Affected lines:

- Line 615 (2FA flow):
  ```
  C->>P: POST /oauth/access_token { grant_type: "twofa", twofa_code }<br/>Bearer: interim access_token
  ```
- Line 638 (Registration flow):
  ```
  C->>P: GET /clients_fields?filter[show_on_order_form]=true<br/>Bearer: guest token
  ```
- Line 641 (Registration flow): same pattern.
- Line 710 (Auth-code transfer): `A->>P: POST /auth_code<br/>Bearer: client token`

Mermaid sequenceDiagram messages should be single-line, or use the `\n` escape inside double-quoted message labels (Mermaid's documented escape is `\n` inside `:` syntax, but not all renderers support it). The safest pattern in the golden snapshots is to keep the bearer note in a `note over` block or as a separate prose line above the diagram. Severity 🔴 because these are not optional — the diagrams won't render correctly in GitHub's Mermaid viewer, in Notion, or in most VS Code Mermaid extensions.

**NC2 — `note over` inside flows is fine, but the registration `note over C: render form, collect inputs,<br/>fetch recaptcha / tracking / referral as required` (line 640) also embeds `<br/>`.** `note over` accepts `<br>` (without the slash) in some Mermaid versions but the rule of thumb across viewers is to keep notes single-line. Severity 🔴 — same rendering issue.

### 🟠 NEW WARNING

**NW1 — "Anonymous bootstrap" flow has a malformed constraint bullet.** Line 579:

```
- A guest token to grant access to `/self` for a real identity — `/self` against a guest bearer returns an unauthorised response.
```

The bullet starts mid-sentence — it reads "A guest token to grant access to /self for a real identity" which has no main verb. The flow's `Constraints the caller has to plan around:` lead-in expects each bullet to be a missing-promise statement, but this one parses as a sentence fragment. Same shape on line 580:

```
- The platform to remember a returning visitor and reissue the same token; each guest mint is fresh.
```

These read as "[The caller cannot expect…] a guest token to grant access" / "[The caller cannot expect…] the platform to remember" — the implicit prefix is missing from the bullets themselves. Same pattern repeats in every flow's Constraints list (lines 601–603, 627–629, 653–655, 674–675, 696–698, 725–728). Severity 🟠 — readable with effort, but the missing implicit `[Don't expect…]` prefix forces the reader to mentally complete each bullet. Either keep the prefix in the lead-in and rewrite bullets as plain statements, or reword the lead-in to make the parse work. The brand and system foundation docs don't use this pattern, so there's no precedent to mirror.

**NW2 — Mermaid message label syntax leaks JSON.** Most messages carry an inline `{ grant_type: "password", username, password }` payload. Mermaid sequenceDiagram tolerates braces in message text but they're not idiomatic. The golden brand and system docs don't use this style. Severity 🟠 polish only — readable, but verbose, and the JSON pretends to be JSON without being parseable (the `username` and `password` identifiers have no quotes). Suggested rewrite: `POST /oauth/access_token (grant=password, username, password)` and put the JSON example in the Data shape section above.

**NW3 — Flow 1's "Constraints" list contradicts the rule's intent.** The rule says constraints describe "what the platform won't paper over" — e.g. expiry, single-use, no enumeration. Flow 1's two constraints are correct architectural truths but read inverted ("A guest token to grant access to /self…"). The semantic shape they want is "The platform won't issue you a /self payload from a guest bearer" / "The platform won't recognise a returning visitor — each guest mint is fresh." Severity 🟠, same root cause as NW1.

**NW4 — Lesson 4 ("interim 2FA token shorter expiry") still contains a prescription.** Line 738:

```
The flow needs an explicit re-issue path back to credentials, not a hard error.
```

`needs an explicit re-issue path` is a solution prescription. The rule forbids "the X has to do Y" patterns. Suggested rewrite from the prior audit was not adopted. Severity 🟠.

**NW5 — Lesson 9 ("registration is a four-call dance") still contains a prescription.** Line 748:

```
…all need to ride in the registration body or the new client lands on the wrong currency, gets rejected by fraud, or loses attribution.
```

`all need to ride in` is a prescription, identical to the prior audit's flag. Severity 🟠.

**NW6 — Operations table dropped two architectural primitives without replacement.** Capability count went from 12 to 10, but `refresh`, `reauth`, `setModel` are still missing. The rule says "Cover every observable behaviour the module exposes" and caps at 12. With 10 capabilities and 8 known gaps, the doc is using fewer rows than necessary. Severity 🟠.

**NW7 — Flow 4 (Registration) "Constraints" mixes a guarantee and a constraint.** Line 654:

```
- The platform to validate the registration body shape against the custom-fields schema for you. Field-level validation runs server-side; client-side validation has to mirror the field metadata.
```

The first sentence is the constraint ("the platform will not validate for you"); the second sentence is implementation guidance ("client-side validation has to mirror"). `has to mirror` is a soft prescription. Severity 🟠.

**NW8 — Flow 6 (Sign-out) describes `POST /oauth/access_token { grant_type: "guest" }` as part of sign-out** (line 686). This is correct platform behaviour but it conflicts with the prose framing ("No server-side sign-out endpoint" in Guarantees). The flow's sequence implies sign-out is a mint-new-guest call, but the Guarantee says there's no endpoint — both true, but the diagram is the *post-sign-out* re-mint, not sign-out itself. Severity 🟠 — confusing for an architect designing the transport layer.

### 🟡 NEW SUGGESTION

**NS1 — The Flows section preamble at line 556 says "you can expect / you can't expect" but the actual flow sections use "Guarantees the platform holds / Constraints the caller has to plan around".** Two different framings for the same idea. Pick one (the rule mandates the latter), drop the other from the preamble.

**NS2 — Flow 7 (Auth-code transfer) Guarantee line 723 says "the call deliberately accepts no `lang`".** Good architectural detail. Worth promoting to a Lesson — it explains why locale negotiation has to be deferred on origin B. Currently buried in the flow.

**NS3 — `Token.actor_id` field comment at line 44 says "empty string for fresh guest grants".** Codebase type marks it optional (`actor_id?: string`). The doc's positional-on-the-wire framing is correct but the inline comment could note the type-side optionality.

**NS4 — Add a one-line italic note near the top stating staff/admin is out of scope.** Closes the lingering C1 ambiguity without adding any new content.

**NS5 — `getToken`, `setModel`, `subscribe`, `reauth` capabilities.** Even if folded into existing rows, the surface area an architect needs to mirror should be enumerated. Suggested rows: "Read the current bearer" (`getToken`), "Subscribe to identity changes" (`subscribe`), "Treat current token as rejected" (`reauth`/EXPIRED), "Write registration / login model partial" (`setModel`).

### 🟢 Praise (worth keeping)

- 🟢 **The Flows section is the strongest single addition since the first pass.** Seven sequences in canonical wire shape, BE endpoints on the platform side, no actor / subscription / query-invalidation noise — the rule's flow shape rule is honoured almost perfectly (modulo the `<br/>` issue).
- 🟢 **`Token.actor_type` inline `(interim)` annotations** at line 45 are exactly the right level of inline annotation for transient values.
- 🟢 **Flow 3's note `surface the 2FA prompt`** at line 614 is the cleanest single line in the doc — it tells the architect what happens on the caller side without prescribing how.
- 🟢 **Flow 7's "useful only when the two origins can't share cookies" preamble** correctly frames the auth-code transfer as a fallback, not the default.
- 🟢 **The Lessons section dropped to 14 entries from 14 but rewrote the substance** — lessons 1, 2, 6, 7, 8, 10, 12, 13, 14 all describe problems without solutions, which is the rule's bar.

---

## Strip-audit verdict (re-run against patched rule)

| Checklist item | Verdict | Evidence |
| --- | --- | --- |
| No composable method names (`useX`, `isReady`, `getConfigValue`) | ✅ Clean | Spot-checked all 10 operations, 7 flows, 14 lessons — capability descriptions only, no `login()`, `verify2fa()`, etc. |
| No store / queryKey / persister names | ✅ Clean | No `["session"]`, no `getTokenFromStorage`, no persister references. |
| No Vue / XState / TanStack references | ✅ Clean | The prior pass's `loading → checking → valid/invalid` leak is gone (State model section removed entirely). |
| No `.meta` content anywhere except the top-line italic note | ✅ Clean | Single italic at line 7. `IToken` and `/self` don't return top-level `meta`. |
| No "you should…" / "needs to…" / "plan for…" / "the cleaner shape is…" | 🟠 Two persistent slips | Lesson 4 line 738 (`needs an explicit re-issue path`) and Lesson 9 line 748 (`all need to ride in`). Carried over from the prior pass — not new, not fixed. |
| No commentary about why we encoded X the way we did | ✅ Clean | No "we chose" / "our implementation". |
| No rolled-up substrate framing — one Operations row per BE endpoint | 🟡 Acceptable | Capabilities 1, 2, 7 (Issue guest token / Read authenticated identity / Read registration custom fields) all read from genuinely-distinct endpoints. Capability 6 ("Request password recovery") and capability 7 read from different endpoints. The Operations table maps cleanly to the API endpoints. ✅ on the patched rule's intent. |

**Strip verdict: 🟢 PASS** — one persistent tone slip in Lessons 4 and 9 carried over; otherwise clean. Significantly cleaner than the first pass on the framework-vocabulary axis.

---

## Flow-shape compliance audit (new check this pass)

The patched rule requires each flow to follow this exact shape:

1. One-line purpose
2. Mermaid sequence diagram (BE endpoints on platform side; no `useX()` calls; no actor/subscription/query-invalidation)
3. `Guarantees the platform holds:` prose lead-in (NOT sub-heading)
4. `Constraints the caller has to plan around:` prose lead-in (NOT sub-heading)

| Flow | Purpose line? | Mermaid shape? | `Guarantees` as prose? | `Constraints` as prose? | Verdict |
| --- | --- | --- | --- | --- | --- |
| Anonymous bootstrap | ✅ Line 560 | ✅ BE endpoint, no composable names | ✅ Prose lead-in line 572 | 🟡 Prose lead-in line 578 but bullets are sentence fragments | 🟡 |
| Password login (no 2FA) | ❌ Missing | ✅ Clean | ✅ Line 595 | 🟡 Line 601, fragments | 🟡 |
| Password login with 2FA | ❌ Missing | 🔴 `<br/>` inside message label line 615 | ✅ Line 621 | 🟡 Line 627, fragments | 🔴 |
| Registration | ❌ Missing | 🔴 `<br/>` inside messages 638, 640, 641 | ✅ Line 647 | 🟡 Line 653, fragments + Warning NW7 | 🔴 |
| Password recovery | ❌ Missing | ✅ Clean | ✅ Line 669 | 🟡 Line 674, fragments | 🟡 |
| Sign-out | ❌ Missing | ✅ Clean but Warning NW8 | ✅ Line 691 | 🟡 Line 696, fragments | 🟡 |
| Auth-code transfer | ✅ Line 702 | 🔴 `<br/>` inside message line 710 | ✅ Line 719 | 🟡 Line 725, fragments | 🔴 |

**Flow-shape verdict: 🟠 MOSTLY COMPLIANT, BLOCKED BY MERMAID NOTATION.** The structural shape is right — prose lead-ins, no sub-headings, BE-endpoint-only sequences, no orchestrator vocabulary. The two issues are (a) the missing one-line purpose on 5 of 7 flows, and (b) the `<br/>` inside Mermaid messages on flows 3, 4, 7. Both fixable in a single pass.

---

## Mermaid notation audit (new check this pass)

Ran each Mermaid block through the following checks: parses as `sequenceDiagram`, no HTML inside message labels, `note over` syntax well-formed, participant declarations consistent.

| Flow | Parses? | HTML in messages? | `note over` well-formed? | Issues |
| --- | --- | --- | --- | --- |
| Anonymous bootstrap (562–570) | ✅ Yes | ✅ None | ✅ `note over C:` clean | — |
| Password login no-2FA (584–593) | ✅ Yes | ✅ None | — (no notes) | — |
| Password login with 2FA (607–619) | 🔴 No (in strict viewers) | 🔴 `<br/>Bearer: interim access_token` line 615 | ✅ `note over C: surface the 2FA prompt` clean | 1 |
| Registration (634–645) | 🔴 No | 🔴 `<br/>` in 3 places (lines 638, 640, 641) | 🔴 `note over C: render form, collect inputs,<br/>fetch recaptcha…` line 640 has `<br/>` inside note | 4 |
| Password recovery (660–667) | ✅ Yes | ✅ None | ✅ `note over P: email dispatched only if<br/>account exists` line 666 — `<br/>` in note. **Some viewers accept `<br>` (no slash) in notes; `<br/>` self-closing XHTML is less reliable.** | 1 |
| Sign-out (681–689) | 🟡 Mostly | 🔴 `note over C: drop the client token<br/>(optionally retain the guest token<br/>so the basket survives)` line 685 has multiple `<br/>` | ❌ note malformed | 1 |
| Auth-code transfer (705–717) | 🔴 No | 🔴 `<br/>Bearer: client token` line 710 | ✅ clean | 1 |

**Mermaid notation verdict: 🔴 BLOCKING.** Five of seven flows have `<br/>` either inside message labels or inside `note over` blocks. GitHub's Mermaid renderer (the primary read-target for this doc) and most Mermaid CLI parsers will render `<br/>` literally inside message labels — the bearer-context lines will render as `POST /oauth/access_token { grant_type: "twofa", twofa_code }<br/>Bearer: interim access_token` as a single concatenated string.

**Recommended fix (safe across all viewers):**

Replace any `<br/>` inside message labels with one of:

- A separate `note over` block immediately after the message arrow.
- Two separate message arrows where the second carries the bearer context as a follow-up note.
- For pure annotation (e.g. `Bearer: interim access_token`), use a `note over` *before* the arrow with the bearer context, then the arrow itself.

For `<br/>` inside `note over` blocks: replace with `<br>` (no slash) which is more widely supported, OR collapse the note to a single line, OR split into two separate notes.

---

## Issues with severity (consolidated)

### 🔴 Critical

- 🔴 **C1 (prior C5) — `"admin"` still listed in `ActorType` union.** Line 51. Drop or annotate.
- 🔴 **C2 (prior C2) — `twofa_provider: "Email"` on a `second_factor_required: false` sample.** Line 289.
- 🔴 **C3 (prior C3) — Dependants table weights mismatch graph.** See Appendix C.
- 🔴 **C4 (prior C4) — Three stubbed samples where live fixtures are 404s.** `/clients/register`, `/clients/password_reset`, `/clients_fields`.
- 🔴 **NC1 — `<br/>` inside Mermaid sequenceDiagram messages.** Lines 615, 638, 641, 710.
- 🔴 **NC2 — `<br/>` inside `note over` blocks.** Lines 640, 666, 685.

### 🟠 Warnings

- 🟠 **W1 (prior W1) — Missing operations:** `refresh` added, but `reauth`/EXPIRED, `setModel`, `subscribe`, `getToken` still absent.
- 🟠 **W5 (prior W5) — `Account` type trimmed without inline disclaimer** at lines 132–157.
- 🟠 **W6 (prior W6) — `order` (singular) module name** at line 232.
- 🟠 **W7 (prior W7) — Soft prescriptions in Lessons 4 and 9** at lines 738 and 748.
- 🟠 **NW1 — Constraints bullets are sentence fragments** across all 7 flows.
- 🟠 **NW2 — JSON-flavoured message labels** in Mermaid sequences (polish).
- 🟠 **NW7 — Flow 4 Constraint #1 mixes constraint and prescription** at line 654.
- 🟠 **NW8 — Flow 6 (Sign-out) sequence is post-sign-out re-mint, not sign-out itself.** Confusing framing.

### 🟡 Suggestions

- 🟡 **NS1 — Preamble "you can expect / you can't expect"** doesn't match flow body framing.
- 🟡 **NS2 — Promote "auth-code call carries no `lang`" to a Lesson.**
- 🟡 **NS3 — `Token.actor_id` inline comment** could note type-side optionality.
- 🟡 **NS4 — Add a one-line italic note that staff/admin is out of scope.**
- 🟡 **NS5 — Surface `setModel`, `getToken`, `subscribe`, `reauth`** as their own operations rows.
- 🟡 **S5 (prior) — Brand config dependency on Capability 7** still not noted.

### 🟢 Praise (continuing)

- 🟢 The `Flows` rewrite is the strongest single architectural addition since the first pass.
- 🟢 `Token.actor_type` inline `(interim)` annotations at line 45.
- 🟢 Lessons 1, 2, 6, 7, 8, 10, 12, 13, 14 describe problems without solutions cleanly.
- 🟢 Flow 7's "useful only when the two origins can't share cookies" preamble correctly frames the auth-code transfer as a fallback.

---

## Top 3 priorities (severity × ease)

1. 🔴 **Fix the Mermaid `<br/>` rot.** Five of seven flows currently render incorrectly in GitHub/Notion/most viewers. Single-pass mechanical fix: replace `<br/>` inside messages with a `note over` block, and replace `<br/>` inside notes with `<br>` (no slash) or split into multi-line notes. This is the single highest-impact fix because it determines whether the Flows section *renders at all* in the read-target.
2. 🔴 **Regenerate the Dependants table from `graphify-out/graph.json`.** The prior audit gave an exact command and the current weights still don't match. The rule is unambiguous: file-count weights from cross-module import edges. The audit's Appendix C has the verified output. This is a copy-paste fix.
3. 🟠 **Clean the three persistent prior issues:** (a) drop `"admin"` from `ActorType` (line 51), (b) fix `twofa_provider: "Email"` on the non-2FA password sample (line 289), (c) rewrite the two prescriptive sentences in Lessons 4 and 9 (lines 738, 748). These have been flagged in two consecutive audits — they're tractable, well-located, and would close the most painful technical-accuracy gaps.

---

## Concrete rule / skill update proposals

Two new gaps surfaced in this re-review that aren't currently in `docs-modules.md`:

1. **Mermaid notation guidance.** The rule mandates Mermaid sequence diagrams for flows but doesn't say "no `<br/>` inside message labels" or "prefer `note over` for bearer context." Five of seven flows in this doc tripped on this. Suggested addition under `### Shape of a flow` in `.agent/rules/docs-modules.md`:

   > **Mermaid notation rules:**
   > - Message labels are single-line. HTML tags inside message labels (`<br/>`, `<b>`) render as literal text in GitHub's Mermaid renderer and in most viewers.
   > - For bearer context or any per-arrow side annotation, use a `note over` block immediately before or after the arrow, not inline HTML.
   > - For multi-line `note over` content, prefer `<br>` (no closing slash); some viewers reject the self-closing `<br/>`.
   > - Verify each diagram renders in GitHub's preview before committing.

2. **Constraints / Guarantees bullet shape.** The rule says "Constraints the caller has to plan around" and gives examples — but doesn't specify whether each bullet should be (a) a sentence fragment continuing the lead-in ("A guest token to grant access to /self") or (b) a standalone statement ("Guest tokens do not authorise /self"). This doc went with (a) and the result is hard to parse. Suggested clarification:

   > **Bullet shape:** Each bullet in the `Guarantees` / `Constraints` list is a **standalone declarative sentence**, not a sentence-fragment continuation of the lead-in. ✅ "Guest tokens do not authorise `/self`." ❌ "A guest token to grant access to `/self`."

3. **Flow purpose line.** The rule says each flow carries "one-line purpose" but the doc only honours this on 2 of 7 flows. Add a sub-bullet under `### Shape of a flow`:

   > **The one-line purpose is mandatory.** Even when the flow heading is self-explanatory, the purpose line gives the architect a reason-to-read before they scan the Mermaid block.

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
  twofa_provider: TwofaProviders;   // non-nullable in type, nullable on wire
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

**Not in `AccessRoleTypes`: `"admin"`, `"twofa"`, `"twofa-admin"`.** `"admin"` is a `Contexts` value AND a `GrantTypes` value, not an actor type.

### Grant types (canonical = `packages/types/src/data/enums/tokens.ts:12-26`)

13 values: ADMIN, ADMIN_PASSWORD_RESET, AUTH_CODE, COMPLETE_ORG_REGISTRATION, COMPLETE_USER_REGISTRATION, COMPLETE_REGISTRATION, GUEST, GUEST_CUSTOMER, PASSWORD, PASSWORD_RESET, REFRESH_TOKEN, TWOFA_ADMIN, TWOFA.

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

### TwofaProviders

```ts
export enum TwofaProviders {
  EMAIL = "Email",
  TOTP = "TOTP"
}
```

### useSession exported surface (canonical = `packages/headless/src/modules/session/useSession.ts:564-771`)

`subscribe`, `isReady`, `isAuthenticated`, `meta` (12 boolean flags), `context`, `errors`, `validationErrors`, `model`, `schema`, `uischema`, `client`, `clientId`, `reject`, `resolve`, `refresh`, `login`, `logout`, `recover`, `register`, `verify2fa`, `transferTo`, `transferFrom`, `getTransferDetails`, `transferred`, `showLogin`, `showRegister`, `showRecoverPassword`, `setModel`, `getToken`, `getHistory`, `reauth`.

---

## Appendix B — Enum / Registration Cross-Reference

| Doc claim | Source-of-truth | Verdict |
| --- | --- | --- |
| `ActorType` includes `"admin"` (line 51) | `AccessRoleTypes` does not include "admin" | 🔴 Mismatch (carried from prior audit's C5) |
| `ActorType` includes `"twofa"`, `"twofa-admin"` (line 51) | These are `GrantTypes`, not `AccessRoleTypes`. Observable on the wire as interim `actor_type` values. | 🟡 Defensible; doc annotates as `(interim)` in adjacent comment at line 45 but not at line 51 |
| `GrantType` union has 13 values | `GrantTypes` enum has 13 values | ✅ Match |
| `TwofaProvider = "Email" \| "TOTP"` | `TwofaProviders` enum | ✅ Match |
| Cookie names referenced in Lessons 2 + 10 | `session.machine.ts` removes `upm_client_session`, `upm_admin_session`, `upm_user_session`, `upm_actor` | 🟡 Doc describes the *pattern* correctly without naming the cookies (defensible per strip rule) |
| `actor_id: string` (doc) | `IToken.actor_id?: string` (type) | 🟡 Doc marks required; type marks optional. Fixture always sends it (empty string for guest). Defensible — wire shape is authoritative. |
| `twofa_provider: TwofaProvider \| null` (doc) | `IToken.twofa_provider: TwofaProviders` (type, non-nullable) | 🟡 Doc more accurate to wire than type |

---

## Appendix C — Verbatim Evidence

### C1 — `"admin"` in ActorType (line 51 of foundation.md)

```ts
type ActorType = "guest" | "client" | "reseller" | "user" | "twofa" | "twofa-admin" | "admin";
```

`packages/types/src/data/enums.ts:16-21`:
```ts
export enum AccessRoleTypes {
  GUEST = "guest",
  CLIENT = "client",
  RESELLER = "reseller",
  USER = "user"
}
```

### C2 — Misleading `twofa_provider` on guest fixture (line 289 of foundation.md)

```json
{
  "second_factor_required": false,
  ...
  "actor_type": "client",
  "twofa_provider": "Email",
  ...
}
```

`tests/__fixtures__/recordings/post--oauth-access_token-client.json:9-13`:
```
"second_factor_required": false,
...
"actor_type": "client",
"twofa_provider": "Email",
```

Fixture bug propagated unchanged into doc.

### C3 — Dependants table vs graph

Foundation doc lines 225–233 (current weights):

```
paymentDetails 14, system 10, basket 9, client 7, product 4, brand 3, payment 2, order 1, billing 1
```

Live graph computation (re-run 2026-05-15 just before this audit):

```
client: 35, system: 23, basket: 17, query: 15, invoices: 7, brand: 7,
paymentDetails: 6, orders: 5, config: 4, routing: 4, feedback: 3, domain: 3, payment: 1
```

Doc inverts the top of the dependants tree (`paymentDetails` at #1 with 14 vs graph's #6 at 6; `client` at #4 with 7 vs graph's #1 at 35). Five modules in the graph (`invoices`, `orders`, `config`, `routing`, `feedback`, `domain`) do not appear in the doc.

### C4 — Stubbed samples; live fixtures are 404s

`tests/__fixtures__/recordings/post--clients-register.json` lines 7–19: HTTP 404 ("Domain not found!").
`tests/__fixtures__/recordings/post--clients-password_reset.json` lines 7–19: same 404 body.
`tests/__fixtures__/recordings/get--clients_fields.json` lines 7–19: same 404 body.

Foundation doc lines 472, 497, 514 mark each as `// stubbed — real capture replaces this`.

### NC1 — `<br/>` inside Mermaid messages

Foundation doc line 615:
```
C->>P: POST /oauth/access_token { grant_type: "twofa", twofa_code }<br/>Bearer: interim access_token
```

Foundation doc line 710:
```
A->>P: POST /auth_code<br/>Bearer: client token
```

Renders literally in GitHub's Mermaid preview.

### NC2 — `<br/>` inside `note over`

Foundation doc line 640:
```
note over C: render form, collect inputs,<br/>fetch recaptcha / tracking / referral as required
```

Foundation doc line 685:
```
note over C: drop the client token<br/>(optionally retain the guest token<br/>so the basket survives)
```

### W3 self-correction

Foundation doc line 428:
```
"replace_branding": false,
"branding": null,
```

These fields *are* present in the captured fixture (against the prior audit's claim). Reclassified as ✅ verified.

---

## Appendix D — Files Reviewed

### Target
- `packages/headless/src/modules/session/docs/foundation.md`

### Standards
- `.agent/rules/docs-modules.md` (patched)
- `.agent/rules/docs-reviews.md`

### Prior audit
- `docs/audit/session-foundation-2026-05-15.md`

### Golden snapshots
- `packages/headless/src/modules/brand/docs/foundation.md`
- `packages/headless/src/modules/system/docs/foundation.md`

### Source-of-truth (codebase)
- `packages/headless/src/modules/session/index.ts`
- `packages/headless/src/modules/session/useSession.ts` (full read of return shape lines 560–777)
- `packages/headless/src/modules/session/admin/services.ts` (all commented out)
- `packages/types/src/models/token.ts`
- `packages/types/src/models/contexts.ts`
- `packages/types/src/data/enums.ts` (AccessRoleTypes)
- `packages/types/src/data/enums/tokens.ts` (GrantTypes, TwofaProviders)

### Fixtures
- `tests/__fixtures__/recordings/post--oauth-access_token-guest.json` (real 200)
- `tests/__fixtures__/recordings/post--oauth-access_token-client.json` (real 200, misleading `twofa_provider`)
- `tests/__fixtures__/recordings/post--clients-register.json` (404)
- `tests/__fixtures__/recordings/post--clients-password_reset.json` (404)
- `tests/__fixtures__/recordings/get--clients_fields.json` (404)
- `tests/__fixtures__/recordings/get-self.json` (real 200)

### Graph
- `graphify-out/graph.json` (cross-module file-edges into `modules/session`; weights re-computed at audit time)

---

## Appendix E — In-Progress Signals

Three-bucket categorisation per `docs-reviews.md`:

### 🟠 In Progress (someone is mid-edit / unresolved)

- **Mermaid `<br/>` rot** is the canonical in-progress signal — the author clearly drafted the flows and didn't preview them in a Mermaid renderer. One-pass fix, but visible across 5 of 7 flows.
- **Constraints bullets as sentence fragments** are an editorial thread — the author chose a framing that needs either lead-in or bullet rewrites and didn't finish either.
- **Three carried-over critical issues (`twofa_provider: "Email"`, dependants table, `"admin"` in ActorType)** are visible-but-unaddressed in two consecutive audits. Not "in progress" so much as "deferred to a fixture-recapture pass" — but the `"admin"` and dependants ones don't need fixtures.

### 🔴 Not Started

- **Operations table expansion** for `refresh`, `reauth`/EXPIRED, `setModel`, `getToken`, `subscribe` — flagged in prior audit, no movement.
- **Brand-config dependency note on Capability 7** — flagged, no movement.

### ✅ Done (call out as strengths)

- `What it is`, `Core concepts`, the seven flow sequences (modulo Mermaid notation), Lessons 1/2/6/7/8/10/12/13/14, the trim disclaimer at line 444, the `(interim)` inline annotations at line 45 — all complete and shippable.
- The `State model` section being removed entirely (per patched rule) is itself a clean structural win.

---

## Summary

This is an 86/100 doc with the structural foundation now in place. Three blocking issues (Mermaid `<br/>` rot, dependants table from graph, `"admin"` in ActorType + `twofa_provider` on non-2FA sample) account for almost all of the technical-accuracy gap. With those three fixes the doc reaches ~92/100 — at-or-above the brand and system golden snapshots on every category except the persistent stubbed-fixtures issue (which is upstream of the doc).
