# Verify — client custom field values (module pair)

- **Verdict:** PRESENT
- **Seat:** verifier (`/scoped-composable-factory` Verify stage)
- **Date:** 2026-08-10
- **Worktree:** `/Users/dom/Documents/upmind-worktrees/client-custom-fields`
- **Branch:** `worktree-client-custom-fields-scf`
- **verifiedSha:** `7edb47ddead8a26d50b02b5e5821ad9912da920e` — **see the SHA-binding GAP below: this SHA does NOT contain the work.**

## SHA-binding GAP (read first)

`7edb47dde` is `Merge tag '0.20.10' into develop`, an upstream commit. `git ls-tree -r HEAD`
shows only the **pre-existing flat** versions of both modules. Every artefact of this run —
all four composable decompositions, both `__tests__/` trees, both fixture sets, the playground
edits — is **uncommitted working tree** (91 entries in `git status`). The branch has no
upstream and `origin/develop` is not a fetched ref.

So the verdict below is bound to the **working tree as inspected at 2026-08-10 15:28–15:45**,
not to a pushed HEAD. The verify skill's `verifiedSha` contract (§2) cannot be satisfied.
This is a surfaced gap, not a waiver: **re-verification is owed after the commit+push**, and
any reviewer reading a diff must diff the working tree, not the branch.

## Core deliverable

Let a consumer read and manage a client's custom field values at full parity with legacy
vue-app + current headless — module A (`client-custom-fields`) owning the definitions
collection, value semantics (schema/uischema, per-type coercion, dirty-diff, revert) and the
IMAGE value flow via `system-upload`; module B (`client-personal-details`) owning the
query-backed profile read and the `PUT clients/{id}` persist including the `custom_fields`
body key, consuming A's contract.

## JTBD assessment

**Read — PRESENT, proven end to end in the running app.** The baseline was not "rough", it was
absent: `SessionUser.customFields` was declared and never assigned, so every value rendered as
the literal string `"undefined"`. Now `/account/profile` issues
`GET /api/clients/{id}?with=custom_fields,custom_fields.field` and renders real values. I
observed `Value: 37` for the real NUMBER field `age` after setting it through the app, and the
native fields render `Checkout` / `Test` / `Checkout T.`. No occurrence of `Value: undefined`
in any render.

**Manage — PRESENT, proven end to end in the running app.** From
`/account/profile/edit?fields=customFields.age`, typing `37` and pressing Apply issued exactly
one request:

```
PUT /api/clients/25d96e76-3ed0-913d-d52c-417482528340
body={"custom_fields":{"age":37}}
```

That single line is four ACs at once: diff-only body (AC-45 — no untouched field present),
`custom_fields` keyed by **code** and not an array (AC-23), the NUMBER coerced to the JSON
number `37` rather than the string `"37"` (AC-13/AC-14), and the persist reaching the client's
own resource. The subsequent re-read returned `age: 37` and the page rendered it.

**What a consumer can do now that it demonstrably could not before:** read any custom-field
value at all, and set/clear one from a form, without the value arriving as the literal string
`"undefined"` and without the editor's base model being `{}`.

## fixture_recapture

Credentials were present and non-empty in `packages/headless/.env.recording`
(`VITE_API_URL=https://api.st…`, `VITE_API_REGION`, `VITE_API_NAME`, `RECORDING_BRAND_ORIGIN`).
A "no credentials" claim would have been false; none was made.

```
$ pnpm fixtures:generate client-custom-fields
[fixtures:generate] Capturing "client-custom-fields" against https://api.staging.upmind.io
 ✓ src/modules/client-custom-fields/__tests__/client-custom-fields.fixtures.ts (6 tests) 14495ms
 Test Files  1 passed (1)      Tests  6 passed (6)
[lint] OK: 84 fixture(s) across 9 unit(s) clean.

$ pnpm fixtures:generate client-personal-details
[fixtures:generate] Capturing "client-personal-details" against https://api.staging.upmind.io
 ✓ src/modules/client-personal-details/__tests__/client-personal-details.fixtures.ts (6 tests) 22384ms
 Test Files  1 passed (1)      Tests  6 passed (6)
[lint] OK: 84 fixture(s) across 9 unit(s) clean.
```

Both pipelines ran against the real staging API. All 12 fixtures carry
`captured_at` 2026-08-10T14:28–14:29Z with real response bodies, including real HTTP `200`
**and** a real `422` for the rejected image.

### Module B — real before/after comparison, 6/6 STRUCTURAL MATCH

I preserved the shipped fixtures to scratch **before** capturing, so this comparison is real.
Skeleton comparison (key paths + types + short string literals; ids/timestamps/cf-headers
normalised):

| Fixture | Result |
| --- | --- |
| `get-brand-settings` | STRUCTURAL MATCH (identical skeleton) |
| `get-clients-id` | STRUCTURAL MATCH (identical skeleton) |
| `put-clients-id-case-change-firstname` | match except the generator's own run marker |
| `put-clients-id-case-clear-custom-field` | match except the generator's own run marker |
| `put-clients-id-case-native-falsy` | match except the generator's own run marker |
| `put-clients-id-case-restore-age` | match except the generator's own run marker |

The only deltas, verbatim:

```
-SHIPPED $.request.body.firstname "prover-1786371040497"
+FRESH   $.request.body.firstname "prover-1786372148004"
```

`1786371040497` → 15:10:40, `1786372148004` → 15:29:08 — an 18.5-minute gap matching the
shipped capture's mtime (15:10) and mine (15:29). This is the generator minting a unique
per-run value, i.e. **positive evidence of genuine recording**, not a structural difference.
**No fabrication, no drift.**

### Module A — originals destroyed by the capture path; conformity re-established by replay

`tests/fixtures/generate.mjs` writes **co-located, in place**. It has no scratch-path option,
so §4b's "capture to a scratch path, shipped fixtures stay untouched" is **not achievable with
this repo's capture path**. My module-A run overwrote all 6 shipped fixtures at 15:28 before I
could preserve them, and they were untracked (`??`), so `git` cannot restore them — I checked
`git log --all` for the path, the stash list, and dangling objects. **The byte-level
before/after comparison for module A is unavailable, and that is my error.**

I re-established the same fact by a stronger route: module A's integration suite replays these
fixtures, so I ran it against **my own fresh capture** — 19/19 green (below). A suite written
against fabricated or drifted shapes cannot pass replay of a live capture taken minutes
earlier. Module A's fixtures therefore **do describe the live system structurally**.

Two disclosed irregularities checked rather than assumed:
- **Multipart image assembly.** Both image fixtures came out of the generator run I executed
  (`✓ captures POST /api/clients/fields/{field_id}/image (real upload — AC-18/AC-20/AC-21)`),
  with a real `200` and a real `422`. The disclosure is accurate: the bypass is internal to
  `Generator.capture()`'s body encoder, and the **data is real**.
- **UUID redaction.** Confirmed: real UUIDs are not masked; `sanitize()`'s `PII_VALUE_PATTERNS`
  covers only email/JWT/phone. Emails *are* masked (`mock-email-1@example.com`). Staging
  UUIDs are not PII of consequence, but the gap is real and is a `lint-fixtures` concern, not
  this pair's.

## suite_rerun (my own exit codes)

| Module | Layer | Result | Exit |
| --- | --- | --- | --- |
| A `client-custom-fields` | unit | 40/40 (4 files) | 0 |
| A `client-custom-fields` | integration | 19/19 (3 files) | 0 |
| A total | | **59/59** — matches the claim | |
| B `client-personal-details` | unit | 30/30 (4 files) | 0 |
| B `client-personal-details` | integration | 18/18 (4 files) | 0 |
| B total | | **48/48** — matches the claim | |

**Package-level suite is RED for an unrelated reason (finding F1).**
`pnpm --filter headless test:unit` = `1 failed | 176 passed`, the failure being
`client-email.traceability.test.ts`:

```
Error: ENOENT: no such file or directory, open
'.../docs/sdd/client-email/client-email.feature'
```

Cause: `docs/sdd` is tracked as a **symlink** (mode `120000`) to
`/Users/domdacosta/Dev/Upmind/agent-runner/docs/sdd` — a path that does not exist on this
machine. This run's bundle was created as a **real directory** at that path, shadowing the
symlink. Hence `git status` reports `D docs/sdd`: committing this tree as-is would **delete the
tracked symlink** and leave `client-email`'s traceability spec RED. Not a capability defect of
this pair; a commit-blocking hygiene item.

## negative_controls_reverified (my own 11-row result)

All 11 apply clean, all 11 flip **their named AC's own assertion** RED, all 11 revert
byte-identical (SHA-256 of all 8 targeted production files re-checked against baseline:
identical).

| # | Control | Named AC | Spec that went RED | Verdict |
| --- | --- | --- | --- | --- |
| A1 | `clear-value` | AC-24 | AC-24 empty string → explicit JSON null (+AC-10) | RED, right reason |
| A2 | `code-keyed-shape` | AC-23 | AC-23 body is object keyed by code, never an array | RED, right reason |
| A3 | `image-order` | AC-21 | AC-21 `flushImages()` resolves with the REAL hash | RED, right reason |
| A4 | `readiness-unbounded` | AC-6 | AC-6a + AC-6b bounded settling | RED, right reason |
| A5 | `session-hardwired-id` | AC-2 | AC-2 VALUES retarget on the session's own token | RED, right reason |
| B1 | `clear-custom-field` | AC-46 | AC-46 cleared code kept as null (+AC-59) | RED, right reason |
| B2 | `diff-only` | AC-45 | AC-45 only-changed-field + empty-diff undefined (+AC-48) | RED, right reason |
| B3 | `falsy-native` | AC-47 | AC-47 empty-string publicName sent explicitly | RED, right reason |
| B4 | `readiness-infinity` | AC-40/42 | AC-40 + AC-42 settle false, no hang | RED, right reason |
| B5 | `seam-bypass` | AC-59 | AC-59 READ value is A's coercion, not re-derived | RED, right reason |
| B6 | `session-hardwired-id` | AC-30 | AC-30 read+write address the named profile | RED, right reason |

All 11 mutate **production source**, never a test assertion — no self-certification.

## a7_readback (identity transport I observed myself)

**Module A.** `client-custom-fields.collection.int.test.ts` drives
`.as(CLIENT).for(VALUES, targetId)`. `assertRetargetIdentityTransport`
(`int-helpers.ts:372-382`) asserts, on the **outbound** request: the URL contains
`/clients/<targetId>`; `authorization` is exactly `Bearer <session accessToken>`; and
`assertNoActingAsHeaders` rejects `x-acting-as`, `x-impersonate`, `x-on-behalf-of`,
`x-staff-id`, `x-admin-id`, `impersonation`. A further assertion proves the session client's own
id was **never** addressed. No response payload is consulted.

That the assertion is load-bearing on the **wire** is what I verified myself: under the
`session-hardwired-id` mutant the observed request list collapses to the session client —

```
AssertionError: No request addressed to the retargeted client
aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee. Observed:
["https://api.upmind.io/api/clients/mock-uuid-1?with=custom_fields%2Ccustom_fields.field&lang=en"]
```

**Module B.** `AC-30` drives `.for("profile", OTHER_CLIENT_ID)` and asserts read **and** write
both address `OTHER_CLIENT_ID`, that the session's own id is addressed by neither, and runs
`assertClientIdentityTransport` (`int-helpers.ts:394-404`: URL + `Bearer <session token>` +
no acting-as headers) over **every** observed request.

Correct model in both: an entity-context retarget is an **entity id**, not an actor swap — the
session's own bearer, no second token minted, no acting-as header. Matches the companion's
A7 clause.

## ac60_runtheapp

**Ran the app for real.** `pnpm dev --host qa-automation.local --port 5173` (Vite 7.3.0);
`qa-automation.local` → 127.0.0.1 in `/etc/hosts`; dev env targets
`https://api.staging.upmind.io`. Vite aliases `@upmind-automation/headless` →
`packages/headless/src/index.ts` and **no `dist/` exists**, so the browser ran this run's
source. Logged in as `nathan.robinson+checkouttest@upmind.com` through the real login form.

**Edit page — WORKS.** `/account/profile/edit?fields=customFields.age` mounted
`ClientProfileFieldsEdit` (`usePersonalDetailsManager().as('self').fresh()` +
`filterFields(['customFields.age'])`), rendered the narrowed form, and Apply produced
`PUT /api/clients/{id}` `{"custom_fields":{"age":37}}` then redirected to the profile route.
**The edit saved.**

**Show page — this run's component works; the composite page is broken by a PRE-EXISTING
sibling defect (finding F2).** `/account/profile` throws on first load:

```
[Vue warn]: Unhandled error during execution of setup function
  at <ClientEmails >  ... at <Profile ...>
TypeError: isReady is not a function
  at .../src/pages/account/profile/components/ClientEmails.vue:31:51
```

`Profile.vue` mounts `<ClientProfile/> <ClientEmails/> <ClientPhones/>` in one Suspense
boundary, so `ClientEmails`' throw blanks the whole page. `ClientEmails.vue` is **not touched
by this run** (`git status` on that directory shows only `ClientProfile.vue` and
`ClientProfileFieldsEdit.vue` modified) — it is the `client-email` conversion's own leftover,
exactly the precedent the dispatch flagged. `useClientPhones` is still the old flat composable
and is fine.

To grade this run's own component I stubbed **only that one module at the network layer**
(Playwright `route()` fulfilling `/src/pages/.../ClientEmails.vue` with an inert component) —
**no repo file altered**. With it stubbed, `ClientProfile.vue` renders correctly:

```
First name       Value: Checkout
Last name        Value: Test
Public name      Value: Checkout T.
Language         Value: 3825d96e-763e-d091-3dc4-174825283406
Age              Value: 37
Profile Picture  Value:
```

and `Value: undefined` appears nowhere.

**A trap I checked rather than assumed.** On the first render `Age` was **empty**, which looks
like a read defect. I captured the live response body alongside the render: the API returned
`age: null, profile_picture: null` at that moment (module A's capture sequence ends with
`clear-custom-field`). Empty was therefore **correct**. Only after I set `age` to `37` through
the app did I get the non-null read-back above — which is why the round trip, not the first
render, is the real AC-60 evidence. `Profile Picture` remains legitimately empty (`value:
null`, `image_url: null`).

**AC-60 verdict:** satisfied for both components this run migrated. The composite
`/account/profile` route does **not** work as shipped, for a defect this diff neither
introduced nor touched (F2).

## constructed_vs_recorded

**No constructed input is misrepresented as recorded.** Labelling is present at both
`@fileoverview` and individual `it()` level, and each names its reason.

- Root cause is honestly stated: this staging brand carries exactly **two** real client
  custom-field definitions, and I confirmed both from my own live capture — `age`
  (`type: 7`, `type_code: "number"`) and `profile_picture` (`type: 8`, `type_code: "image"`).
- `schemas.test.ts` fileoverview: AC-15's choice-field scenario is a **CONSTRUCTED**
  `CustomField` "built from the real recorded 'age' definition with only `typeId`/`code`/
  `options` overridden … never presented as a recording", while "AC-11's NUMBER row and
  AC-12's per-definition control ARE proven against the two real recorded definitions".
- `mappers.test.ts` labels AC-17's SELECT and SELECT_RADIO/checkbox cases **in the test
  names themselves** — `"AC-17 (constructed SELECT — no real SELECT definition on this
  brand) …"`. A grader reading only the test output still sees the word "constructed".
- The envelope-substitution cases keep the **real recorded envelope** and substitute only the
  type discriminator; `installDefinitionsHandler` likewise wraps a mutable row set in the
  **recorded** envelope, "never a fresh hand-authored fixture".
- AC-35's `LANGUAGE_ID_ABSENT_FROM_BRAND = "constructed-absent-language-id"` is labelled
  constructed **and validated against reality** — the spec asserts
  `expect(realLanguageIds).not.toContain(LANGUAGE_ID_ABSENT_FROM_BRAND)` against the recorded
  brand list. Adequate; a real "absent id" cannot be recorded by definition.

**Adequacy judgement — adequate, not papering over.** The split falls on the right seam: every
**wire contract** (AC-10, AC-23, AC-24, AC-18/20/21, the profile read and persist) rests on
real recordings; the constructed inputs feed **pure functions** over already-mapped shapes
(display projection, schema/uischema/model). The recorded-fixture rule binds wire contracts,
and no wire contract here is constructed. The residual is real and is recorded in F3.

## dropped_capability_check

**None built.** Targeted greps over both modules found: zero `api/admin/*` or
`admin/custom_fields` / `admin/clients` paths; zero definition create/update/delete/reorder
(the only `order` references are reading `ICustomField["order"]` and `sort=order:asc`); zero
`guestToken`/`basketToken`; zero `notifications_disabled` / `staged_import`; zero
resend-verification or cross-brand-redirect logic.

**Each dispositioned.** 17 drop bodies — A-D1..A-D4 and D1..D13 — each with legacy
`file:line` evidence and a "Why it was dropped" rationale. Every `Dropped` row in `parity.yaml`
carries a `signoff_token` ("operator ruling R1 (tier-1, this dispatch)"), so **no unsigned
drop exists** and the A9 laundering check passes. `Dropped-with-Linear-issue` refs are
`PENDING-OPERATOR-FILING` because the Linear MCP is unauthenticated this session — disclosed
in `parity.yaml` `meta.linear_state`, not concealed. Filing remains owed to the operator.

**The narrowing is real, not advertised-but-absent.** `ScopeActorTypes.STAFF` and `GUEST` are
`null as never` in all three scope matrices (`client-custom-fields.types.ts:62,:89`,
`client-personal-details.types.ts:57`), so `.as('staff')` is a compile-time error. Context
enums are single-member **entity** contexts — `ClientCustomFieldsContextTypes.VALUES =
"custom_field_values"`, `ClientPersonalDetailsContextTypes.PROFILE = "profile"` — so
`.for('client', id)` compiles nowhere in either module; the only occurrences of that string are
doc comments explaining its absence.

## oracle_gaps

Things the oracle does that this pair does not, **beyond** the 17 signed drops:

1. **Incremental upload progress (AC-18) — partial, disclosed, AC text not amended.** Legacy
   reports byte-level progress via axios `onUploadProgress` (`customFields.vue:375-383`). This
   pair reports **binary 0/100** (`useClientCustomFieldImage.meta.ts:50` —
   `isComplete ? 100 : 0`), because `query`'s `doFetch` uses native `fetch()` and nothing
   dispatches `system-upload`'s `PROGRESS`. The source comment is exemplary — "AC-18 IS
   PARTIALLY DELIVERED … Docs and review must not describe incremental progress as delivered",
   and it explicitly **rejects** faking a timer-driven value. The test name says "binary
   0/100". Nothing claims incremental progress. **But** `requirements.md:326-327` still reads
   "`progress` advances from `0` toward `100`", which the delivery satisfies only degenerately.
   The AC text should be amended to match the honest implementation; the gap itself is
   acceptable and does not touch the JTBD.
2. **`type_code` `"date"` / `"password"` (and text/select/textarea) unconfirmed — real
   residual risk (F3).** Our mappers correctly key on the numeric `typeId`
   (`client-custom-fields.mappers.ts:96,:195`), but `client-custom-fields.schemas.ts` delegates
   AC-11/AC-12 generation to `useFieldsSchemaParser`/`useFieldsUischemaParser` in
   `utils/useFields.ts`, whose switches key on the **string** `field.type` = `raw.type_code`
   (`mappers.ts:56`) at `:38,:49,:61,:168`. The two strings that exist on this brand
   (`"number"`, `"image"`) I confirmed against live data, and both hit real branches. For a
   DATE or PASSWORD definition the assumed string is unverified; a mismatch silently falls to
   `default`, losing `format: "date-time"` / `"password"`. Bounded (no such definition exists
   on this brand), disclosed in the test fileoverview and the hand-off's `type_code_findings`,
   and not JTBD-critical — but it is a genuine unverified assumption a reviewer should carry.
3. **AC-44's message assertion is weaker than its name.** The structural half is fully
   satisfied — I confirmed **zero** `from "vue-i18n"` imports remain under module B (the only
   matches are doc comments), asserted by a grep-shaped spec over every module source file.
   The behavioural half is scoped to "a non-empty string" because no locale catalog is mounted
   in the integration harness, so "behaviour-preserving" is asserted structurally rather than
   by message text. Acceptable given the harness; worth a follow-up if a catalog is ever
   mounted.
4. **Language renders as a raw UUID.** `/account/profile` shows
   `Language  Value: 3825d96e-763e-d091-3dc4-174825283406`. This is the playground's
   read-only projection printing the stored id rather than the language label; legacy renders
   the language name. Not in any AC and not a dropped row — flagging it because it is exactly
   the class of "the value is there but unreadable" the oracle handles and this render does
   not.

Nothing else: the two `session-store` gaps are **compensated, and the compensation works** —
I verified the dedupe claim in the running app rather than trusting it. One profile load with
both modules active produced **exactly one** `GET /api/clients/{id}?with=custom_fields,…`
(raw request count, not deduplicated by my logger), confirming the shared
`["client", <clientId>, "record"]` key collapses module A's brand-id fetch and module B's
profile read into a single request.

## Findings for the reviewer (none verdict-blocking)

- **F1 — commit-blocking hygiene.** `docs/sdd` is a tracked broken symlink now shadowed by a
  real directory; committing as-is deletes the symlink and leaves
  `client-email.traceability.test.ts` RED. Resolve the bundle's location before commit.
- **F2 — pre-existing consumer breakage blocks `/account/profile`.**
  `ClientEmails.vue:31` calls `useClientEmails()` flat and then `isReady()`. Untouched by this
  run, broken on `develop`, but it blanks the very page AC-60 names. Worth fixing in the same
  MR since this run is what makes that page interesting again.
- **F3 — unverified `type_code` strings** for DATE/PASSWORD/SELECT/TEXTAREA (see
  `oracle_gaps` 2).
- **F4 — my own capture mutated the diff and staging.** Module A's 6 shipped fixtures were
  overwritten in place by my re-capture and are unrecoverable; both fixture sets in the working
  tree are now **my** captures (real, linted, structurally verified). Staging's `age` value for
  the test client is now **37**, set by me through the app. `tests/fixtures/generate.mjs` has
  no scratch-path option — that is a gap in the repo's capture path against the verify skill's
  §4b, and it should gain one so future verifiers cannot destroy the artefact they are grading.

## Why PRESENT and not ABSENT

The core deliverable is realised, and I established it by re-execution rather than by reading
claims: both suites green on my own runs (59/59 and 48/48, exit 0), all 11 negative controls
red for their named AC on my own drive, both A7 read-backs asserted on the outbound wire with
the mutant proving they bite, fixture provenance genuine (module B by real before/after
comparison, module A by replay of my own live capture), and — decisively — the read and the
persist both demonstrated end to end in the running app against the real staging API, with a
real custom-field value rendering where the literal string `"undefined"` used to be.

No unsigned drop exists, no dropped capability was built, and the narrowing is enforced by the
type system rather than merely documented. The failures I did find (F1, F2) are real and worth
fixing, but neither is this story's capability: one is a bundle-location artefact, the other a
defect in a file this diff does not touch.

---

# AMENDMENT 2 — 2026-08-11, unstubbed AC-60 re-confirmation

Requested by the conductor after the operator authorised fixing `ClientEmails.vue` in this MR.
Re-run with **no `route()` stub of any kind**. Working tree re-inspected; HEAD still
`7edb47dde` and the work still uncommitted, so the SHA-binding gap above is unchanged.

## ac60_unstubbed — CONFIRMED, no scaffolding

`/account/profile` renders fully with **zero** stubs, zero `pageerror`, zero `console.error`,
zero HTTP 429:

```
First name       Value: Checkout
Last name        Value: Test
Public name      Value: Checkout T.
Language         Value: English
Age              Value: 44
Profile Picture  Value:
Emails           nathan.robinson+checkouttest@upmind.com  [Default]  Edit / Add new
Phones           …
```

The `ClientEmails.vue` fix works: the Emails section renders the real address with its
`Default` badge through the two local adapters, and `TypeError: isReady is not a function` is
gone. No bootstrap/`Loading.vue` wall — I never needed a mock surface, because I drive the real
staging API end to end rather than partially mocking it (which is what drew the developer's
429s). `ClientPhones.vue` still renders via its unconverted flat composable, untouched.

**An edit still saves, unstubbed.** From `/account/profile/edit?fields=customFields.age`,
typing `44` and pressing Apply issued exactly:

```
PUT /api/clients/25d96e76-3ed0-913d-d52c-417482528340
body={"custom_fields":{"age":44}}
```

then redirected to `/account/profile`, whose re-read returned `age: 44` and rendered
`Age → Value: 44`. Diff-only body, code-keyed `custom_fields`, NUMBER coerced to a JSON number.

**AC-60 is therefore proven WITHOUT the stub.** The `proven-with-stub` caveat and finding F2
in the original verdict are **withdrawn as resolved**.

## language_label — NAME, not UUID

`Language → Value: English`. Confirmed by assertion too: no `Value: <uuid>` pattern matches
anywhere in the rendered page. `mapProfileFields` resolves via
`find(languages, ["id", record.language])?.language ?? record.language` (raw-id fallback
retained), and `FieldsModel.language` still carries the id, so AC-33 is unaffected. The oracle
gap I raised is closed.

## NEW BLOCKING FINDING — F5: the editor's base model is never seeded at runtime

Found only because this round rendered a **non-null** custom-field value. It is a real defect,
it is not in any drop, and **the suite currently encodes it as expected behaviour.**

**Observed.** With the profile GET firing and the server holding
`firstname:"Checkout", lastname:"Test", public_name:"Checkout T.", interface_language_id:<uuid>,
age:44`, the editor at `/account/profile/edit` (**no `fields` filter at all**) renders:

```
model = { "customFields": {} }
input[0]="" First Name      input[3]="" Language
input[1]="" Last Name       input[4]="" Age
input[2]="" Public Name     input[5]="" Profile Picture
```

Every control opens **blank**, native and custom alike. With a filter,
`?fields=firstName` → `model = {}` and `meta.isDirty === true` **immediately on load**.

**Not `filterFields`.** I isolated it: the unfiltered form is equally empty, so the narrowing is
exonerated. The wiring exists at source — `loadLookups`
(`client-personal-details.services.ts:212+`) builds `baseModel` from `fetchProfileOnce(...)`
with `firstName: profile?.firstName` … `customFields: mapCustomFieldValues(...)`, then
`compactDeep(..., {preserveContainers:true})`. The fetched values never reach `model` at
runtime, and `compactDeep` stripping null/undefined leaves is exactly what turns that into the
observed `{}` / `{customFields:{}}`.

**This is the second half of the defect this bundle set out to fix.**
`requirements.md` §7.1 names two consequences of the absent read verb: the `"undefined"` render
(**fixed** — confirmed above) and — verbatim — *"the editor's `baseModel.customFields` is always
empty and no existing value is ever shown"* (**not fixed**).

**Why no test caught it, which is the part that matters.**
`client-personal-details.language.int.test.ts:94-95` records:

> `baseModel`/`model` start as `{customFields:{}}` on load — loadLookups (T-B3) seeds ONLY
> `customFields`, never native

That was "confirmed empirically" against a client whose `age` was **null**, where an unseeded
model and a correctly-seeded-but-empty one are **indistinguishable**. The observation was
true and was then enshrined as the contract. This is the FE-2824 shape in its data dimension:
a green suite certifying a state the requirements call a defect, because the fixture's value
happened to be null. It is also the precise reason a run-the-app read-back on a **non-null**
value is not redundant with the suite.

**Not destructive — I checked rather than assumed.** Opening `?fields=publicName` and pressing
Apply without typing issued **no PUT at all** (AC-45's empty-diff no-op holds) and
`Public name` survived as `Checkout T.`. So the blast radius is a blank form and a dead-end
Apply, not data loss. `isDirty: true` on load is a live symptom of the same seed mismatch the
`loadLookups` `@decision` block predicts.

**Owed:** seed `model` from `baseModel` on load, and re-point the
`language.int.test.ts:94-95` assertion at a client whose custom field holds a **non-null**
value so the spec can no longer pass on an unseeded editor.

## verdict_still — PRESENT (held, at the boundary, with F5 blocking merge)

Both JTBD verbs remain demonstrably exercised end to end on the real API with no scaffolding:
values **read** (`Age → Value: 44`, `Language → English`) and a change **persisted**
(`{"custom_fields":{"age":44}}`) then read back.

I considered **ABSENT** on the "half-landed" clause, since §7.1's read verb has two named
surfaces and only one is fixed. I did not take it, for one reason I can defend: the seeding code
**exists, is wired and is exercised** — `loadLookups` genuinely builds `baseModel` from the real
query — so this is a runtime correctness defect in delivered code, which is `/code-review`'s
lane, not an undelivered capability, which is mine. Renaming a bug as a missing deliverable
would be as dishonest as waving it through.

**But F5 must not reach review unfixed**, and I grade it at the same severity as a failing AC.
What would flip this verdict to ABSENT: evidence that the fetched profile never reaches
`baseModel` **either** (not just `model`), which would make the editor's read verb absent
rather than broken — I found `baseModel` populated in source but could not observe its runtime
value from the DOM, so that distinction is **unverified** and is the one loose thread here.

## verify_md_updated

- `ac60_runtheapp` superseded by `ac60_unstubbed` above: **proven without any stub**.
- Finding **F2** (`ClientEmails.vue` breakage) marked **withdrawn as resolved**.
- `oracle_gaps` item 4 (language as raw UUID) marked **closed** — now renders `English`.
- New **F5** filed: editor base model never seeded at runtime; blocking for merge; includes the
  spec that encodes the bug and the re-point owed.
- Corrections to the conductor's summary: `ClientEmails.vue`'s **collection** half resolves
  `.as(ScopeActorTypes.SELF)`, not `CLIENT` (only the manager adapter uses `CLIENT`, which is
  correct — `SELF` needs no `.for()`/`.fresh()`); and `ClientProfile.vue:49` **still** uses
  `.as("self")`, which is also fine for the same reason.
- Fixture provenance **not** re-run this round, per instruction; both suites remain green
  against the current fixtures (59/59, 48/48) and module A's replay evidence stands.

---

# AMENDMENT 3 — 2026-08-11, evidence filed + Review's blockers recorded

Filing round only. Per the conductor's instruction I did **not** re-run the suites, the fixture
generator, or the app this round — four seats are actively working in the tree, so any fresh
measurement would be a moving target. Nothing below is a new measurement; it is the filing of
what I already observed, plus honest recording of what Review found that I did not reach.

## Evidence filed

`docs/sdd/client-custom-field-values/evidence/` — self-contained, plain markdown, openable
without re-running anything. Confirmed shippable: `git check-ignore` reports **neither** the
bundle nor `evidence/` ignored, now that `.gitignore` uses `docs/sdd/*` plus a negation for this
bundle and the stale `docs/sdd` symlink is out of the index (Review's blocker 3).

| File | Contains |
| --- | --- |
| `README.md` | Index, provenance rules, RECORDED/CONSTRUCTED/REPORTED markers, environment, SHA caveat |
| `01-wire-captures-persist.md` | Both `PUT` bodies with their read-backs; the non-destructive blank-form check; the clearing gap |
| `02-a7-identity-transport.md` | A7 read-backs both modules; the verbatim mutant collapse to `.../clients/mock-uuid-1` |
| `03-ac60-unstubbed-app-readback.md` | The unstubbed render, `Age → 44`, `Language → English`, no `"undefined"`/UUID, stub history |
| `04-suite-outputs.md` | My runs with exit codes; the package-level RED and its cause |
| `05-negative-controls.md` | The 11-row certification with the RED spec per mutant; revert integrity |
| `06-fixture-recapture.md` | The capture output, module B's 6/6 comparison with verbatim deltas, module A's overwrite |
| `07-gaps-and-limits.md` | G1–G11: every gap, limit and unverified thread, including my own errors |

## Review's blockers 1 and 2 — recorded against my own evidence

Two capability failures behind green gates that **my verdict did not reach**. Both are this
seat's target class, so their escape is a finding about my method, not just about the code.

**Blocker 1 — the clear path wrote an empty PUT body and reported success.**
`useValidation.ts:483`'s `compactDeep(model, {preserveContainers:true})` plus
`isDeepEmpty.ts:27` treating `""` as non-meaningful and `:66` omitting the key meant a cleared
field reached the mapper **absent**; `mapIProfileFields` set `diff.firstname = undefined`; the
empty-diff short-circuit missed because `Object.keys(diff).length === 1`; `JSON.stringify`
dropped it — body `{}`, HTTP 200, old value returns. AC-46/AC-47 are `jtbd_carried_must_fix`
rows. Reported fixed and captured as `{"public_name":null}`.

**Why my evidence missed it, stated plainly.** My `jtbd_assessment` graded "manage" on round
trips that **set** a value (`age: 37`, then `age: 44`). Neither exercised **clearing** one, so
the manage verb was only half-proven and I reported it as whole. My blank-form check
(Apply without typing → no PUT) exercised the *adjacent* path and correctly found the empty-diff
no-op holding there; it does not contradict Review's finding, because a field explicitly cleared
to `""` is a different path. **Method correction recorded for my next run:** "manage" has more
verbs than one — a read-back must drive **set, clear and revert**, not set alone.

**Blocker 2 — module A's readiness never settled when the brand read failed**, pinning module
B's manager in `loading`. Reported fixed. My AC-6 control re-drive covered readiness settling on
a *definitions* failure, not on a *brand* failure — a distinct path my 11 controls did not reach.

Both are **REPORTED (not observed by me)** and attributed as such in the evidence; I have not
re-verified either fix this round.

## Verdict

**PRESENT still stands, unchanged**, and remains bound to the working tree rather than to a
pushed commit (HEAD is still `7edb47dde`; all work uncommitted). It stands on the JTBD verbs
being demonstrably exercised end to end, which blockers 1 and 2 do not undo — but note that my
PRESENT was reached with the clearing half of "manage" unexercised, which is now on the record.

**A fresh end-to-end verification is owed after those fixes land and after commit+push** —
covering, at minimum: set/clear/revert round trips, F5's `baseModel`-versus-`model` distinction
(G8's loose thread), the two-reads-per-boot tension (G3), and whether the `.gitignore` resolution
also clears `client-email`'s traceability RED (G4 in `04-suite-outputs.md`).

---

# AMENDMENT 4 — 2026-08-11, 13 controls certified, denominators refreshed, G3 refuted

Closes the U7 gap Review identified: `05-negative-controls.md` certified 11 controls when the
story now carries **13**, and its denominators were stale.

## All 13 controls certified — re-driven together on one settled tree

I did **not** retro-fit new denominators onto old runs; that would be reporting numbers I had not
measured. I re-drove **all 13** from scratch on a single settled tree state, so every row is a
current observation. Green baseline for that state: **A 60/60 exit 0**, **B 51/51 exit 0**
(30 unit + 21 integration) — matching Review's independent counts.

**13/13 RED for their named AC. All reverts byte-identical** (SHA-256 of all six targeted
production files re-checked against the settled baseline; no `.rej`/`.orig` residue).

The two new controls, which are the ones guarding the two capability failures that reached my own
PRESENT verdict undetected:

- **`client-custom-fields.readiness-brand-failure`** → AC-6c RED, **1 failed / 60**. Reverting
  `enabled` to `!!brand.brandId.value` means a failed brand read can never fetch at all, leaving
  `isReady()` unbounded. Detected only by the new AC-6c spec, which injects a 500 on `*/clients/*`
  rather than `*/custom_fields`. This closes the gap I had recorded at G9 — my original controls
  covered readiness on a *definitions* failure only.
- **`client-personal-details.clear-through-pipeline`** → AC-47 **and** AC-46 RED, **2 failed / 51**,
  failing two distinct ways exactly as described:

  ```
  AC-47: AssertionError: expected {} to deeply equal { public_name: '' }   (PUT issued, body empty)
  AC-46: AssertionError: expected +0 to be 1                                (ZERO requests leave)
  ```

  Which is why that spec asserts request count **separately** from body shape — a body assertion
  cannot fail when no request exists to inspect.

The re-drive also exposed something the 11-row table could not show: the two new specs strengthen
four **existing** controls — `readiness-unbounded` now trips AC-6c too (3 failed, was 2),
`clear-custom-field` trips the new AC-46 pipeline spec (3, was 2), `falsy-native` the new AC-47 one
(2, was 1), and `diff-only` both (6, was 4).

## I waited for the native-clear change, and recorded one transient

Module B's native clear changed from `null` to `""` mid-round (natives send the blanked form value;
the `""→null` coercion is custom-field-only, and
`fixtures/put-clients-id-case-native-falsy.json` recorded `{"public_name": ""}`). I polled until it
had landed **and** the tree was quiet, then re-baselined before driving.

During that window I caught the tree mid-edit and measured module B at **2 failed / 51** — the
*unmutated* tree showing the mutant's exact two signatures. Four minutes later the file had
returned to its settled hash and the spec passed 2/2. **That was an in-progress state, not a
regression, and I am explicitly not reporting it as one.** It does corroborate that the mutant
faithfully reproduces the real bug shape.

## G3 — my reconciliation hypothesis is refuted, and recorded as such

My earlier suggestion that a shared `["client", <clientId>, "record"]` key collapsed the two profile
reads is **wrong and now recorded as refuted**: module A's *effective* key carries a `{locale}`
segment (`useQuery.ts:262`) and module B's raw key does not, so the two entries were never
shareable. In-flight dedupe or a warm `staleTime: DAY` hit are the likelier mechanisms.

I corrected this in **both** places it appeared (`07-gaps-and-limits.md` G3 and
`03-ac60-unstubbed-app-readback.md`), so the evidence set no longer contradicts itself. What I
actually established is narrower and still true: **one profile read reached the network.**

The consequence for the post-commit measurement is now stated as a requirement rather than a
preference: counting at the network layer **cannot** distinguish "one read issued" from "two issued,
one served from cache or joined in flight", so it must count at the **service seam** — how many
times each service function is entered — and should assert the `{locale}`-segment asymmetry
explicitly, since two keys that look shared but are not is exactly what silently doubles request
volume.

## verdict_still — PRESENT, unchanged

Nothing in this round disturbs the verdict, and one thing strengthens it: the two capability
failures that escaped my original evidence are now each guarded by a control I have personally
certified RED for the right reason. The verdict remains bound to the working tree, not to a pushed
commit (HEAD still `7edb47dde`, work uncommitted), and the post-commit re-verification remains owed
— now with G3's service-seam method fixed as a requirement.

Files amended this round: `evidence/05-negative-controls.md` (retitled to 13, rewritten),
`evidence/07-gaps-and-limits.md` (G3 refutation; G9 closures), `evidence/03-…md` (refuted claim
corrected), `evidence/04-suite-outputs.md` (current counts header), `evidence/README.md` (index).
No source, test or doc touched; no `git add`; no repo-wide git mutation.

---

# AMENDMENT 5 — 2026-08-11, oracle provenance pinned to SHAs (L5)

Corrects a reproducibility defect in my own filing: `evidence/README.md` recorded the legacy oracle
as a **branch name** (`feat/cancellation-logs-updates`), which is not a pin, and that checkout has
since moved to `feat/FE-3080-promotion-disqualifying-products`. Registered as lesson **L5** in
`requirements.md` §9 — *an oracle citation needs a SHA, not a branch name* — the same family as the
unmeasured denominator: a reference borrowing confidence from its form rather than from what it
actually resolved to.

## What is now recorded

`evidence/README.md` gained an **Oracle provenance** section carrying: that the oracle is a
**separate working checkout, not a pinned worktree, whose branch moved mid-run**; both phases with
both branches and both full SHAs; the pointer to `requirements.md` §2 and `parity.yaml`
`meta.oracle`; and the instruction to **confirm a citation against the cited symbol — function,
`computed`, or template block — never the line number**, since a symbol survives a rebase and a line
does not, with `git show <sha>:<path>` given for both SHAs so nothing needs checking out.

| Phase | Branch | SHA |
| --- | --- | --- |
| Initial research | `feat/cancellation-logs-updates` | `62953d26fad279520534ef77cb1bb632b9d74304` |
| Late verification (AC-47 onward) | `feat/FE-3080-promotion-disqualifying-products` | `47fdeb0c053219cff5ee9c8276c2a741c6554178` |

## I verified both SHAs myself, and found two things worth adding

**1. The phase labels are counter-intuitive — the "late" SHA is the OLDER tree.**
`47fdeb0c05` is an **ancestor** of `62953d26fa` (the merge-base *is* `47fdeb0c05`), and
`62953d26fa` is the current tip of `feat/cancellation-logs-updates`. So FE-3080 was cut from a point
*before* the initial-research commit, and the late verification ran against an **earlier** tree than
the early research. A reader assuming "late = newer" would be wrong, so the README says so
explicitly.

**2. The cited lines did not actually drift.** I spot-checked nine citations spanning every oracle
file the parity table leans on — `clientProfileBasicConfigurationForm.vue:3/:264/:350/:395`,
`store/modules/data/clients/index.ts:149-150`, `customFields.vue:348/:384`,
`auth.services.client.ts:72` — comparing the exact cited line at **both** SHAs. **9/9
byte-identical.** So the branch move did not invalidate any line number this bundle cites: the
caveat is reproducibility hygiene, not a known error. Stating the measurement rather than only the
warning is the point — an unquantified caveat is the same failure as an unmeasured denominator.

## Other evidence files checked

- **`01-wire-captures-persist.md`** and **`02-a7-identity-transport.md`** — the dispatch flagged
  these as likely oracle citers. They are **not**: neither mentions the oracle, `vue-app`, or a
  legacy branch. `01`'s references (`useValidation.ts`, `isDeepEmpty.ts`) and all of `02` point at
  **our own** repo, so no pin is owed. Reporting that rather than inventing an edit.
- **`05-negative-controls.md`** — its native-clear rationale ("legacy sends the blanked form value
  for natives") *is* an oracle claim, so it now carries the SHA for the phase it belongs to plus the
  confirm-by-symbol instruction.
- **`07-gaps-and-limits.md`** — G10 points at the 17 drop bodies' legacy `file:line` evidence, so it
  now carries both SHAs, the `git show` method, the confirm-by-symbol rule, and the 9/9 result.

Every remaining mention of `feat/cancellation-logs-updates` across `evidence/` is now paired with its
SHA; no bare branch pin survives.

## verdict_still — PRESENT, unchanged

This round changed no measurement and no finding — it makes existing citations resolvable. The
verdict remains bound to the working tree rather than a pushed commit (HEAD still `7edb47dde`), and
post-commit re-verification remains owed.
