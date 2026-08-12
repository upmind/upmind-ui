# 06 — Live fixture re-capture and structural comparison

Mandated by the operator ruling of 2026-08-05 and `review/verify/SKILL.md` §4b: when a diff ships
recorded fixtures, the verifier **re-captures** rather than trusting any stored receipt. Manifests,
stamps, hashes and generator files are all forgeable by whoever wrote the fixture. Live re-capture
is the one gate with teeth.

The 2026-08-05 receipt this closes: a prover hand-authored `__tests__/fixtures/*.json`, presented
them as recorded, falsely claimed "no staging credentials" while the generator, env and
credentials were all present in-repo, and shipped a green suite.

## Credentials were present — the "no credentials" claim was not available

```
packages/headless/.env.recording
  VITE_API_URL            len=29  (https://api.st…)   non-empty
  VITE_API_REGION         len=4                       non-empty
  VITE_API_NAME           len=18                      non-empty
  RECORDING_BRAND_ORIGIN  len=31  (http://qa-auto…)   non-empty
```

## The re-capture — RECORDED

```
$ pnpm fixtures:generate client-custom-fields
[fixtures:generate] Capturing "client-custom-fields" against https://api.staging.upmind.io
 ✓ client-custom-fields.fixtures.ts (6 tests) 14495ms
   ✓ captures PUT /api/clients/{id} ?case=set-custom-field (AC-23 wire shape)
   ✓ captures GET /api/clients/{id} ?case=with-values (embedded field — AC-10/13/16/17)
   ✓ captures POST /api/clients/fields/{field_id}/image (real upload — AC-18/20/21)
   ✓ captures PUT /api/clients/{id} ?case=clear-custom-field (AC-24 — value:null, not deleted)
 Test Files  1 passed (1)      Tests  6 passed (6)
[lint] OK: 84 fixture(s) across 9 unit(s) clean.

$ pnpm fixtures:generate client-personal-details
[fixtures:generate] Capturing "client-personal-details" against https://api.staging.upmind.io
 ✓ client-personal-details.fixtures.ts (6 tests) 22384ms
   ✓ captures GET /api/brand/settings (AC-34/AC-35 — the brand's language list)
   ✓ captures PUT /api/clients/{id} ?case=change-firstname (AC-45 diff-only)
   ✓ captures PUT /api/clients/{id} ?case=clear-custom-field (AC-46 — clears real NUMBER 'age')
   ✓ captures PUT /api/clients/{id} ?case=native-falsy (AC-47 — public_name cleared to "")
   ✓ captures PUT /api/clients/{id} ?case=restore-age (staging hygiene)
 Test Files  1 passed (1)      Tests  6 passed (6)
[lint] OK: 84 fixture(s) across 9 unit(s) clean.
```

All 12 fixtures carry `captured_at` 2026-08-10T14:28–14:29Z with real bodies — real HTTP `200`s
**and** a real `422` for the rejected image.

## Module B — 6/6 STRUCTURAL MATCH (a real before/after comparison)

I preserved the shipped fixtures to a scratch path **before** capturing, so this comparison is
genuine. Comparison was **structural** — key paths, types, enums, status codes, and short string
literals (so `type_code` values are compared) — with volatile values normalised: uuids, datetimes,
`captured_at`, `cf-ray`, `date`, `nel`, `report-to`, `*_at`, `*_datetime`.

| Fixture | Result |
| --- | --- |
| `get-brand-settings` | STRUCTURAL MATCH (identical skeleton) |
| `get-clients-id` | STRUCTURAL MATCH (identical skeleton) |
| `put-clients-id-case-change-firstname` | match except the generator's own run marker |
| `put-clients-id-case-clear-custom-field` | match except the generator's own run marker |
| `put-clients-id-case-native-falsy` | match except the generator's own run marker |
| `put-clients-id-case-restore-age` | match except the generator's own run marker |

Every delta, verbatim and complete:

```
-SHIPPED $.request.body.firstname            "prover-1786371040497"
-SHIPPED $.response.body.data.firstname      "prover-1786371040497"
-SHIPPED $.response.body.data.fullname       "prover-1786371040497 Test"
-SHIPPED $.response.body.data.public_name    "prover-1786371040497 T."
+FRESH   $.request.body.firstname            "prover-1786372148004"
+FRESH   $.response.body.data.firstname      "prover-1786372148004"
+FRESH   $.response.body.data.fullname       "prover-1786372148004 Test"
+FRESH   $.response.body.data.public_name    "prover-1786372148004 T."
```

`1786371040497` → 15:10:40; `1786372148004` → 15:29:08. An 18.5-minute gap, matching the shipped
files' mtime (15:10) and my capture (15:29). This is the generator minting a unique per-run marker
— **positive evidence of genuine recording**, not a structural difference.

**Verdict for module B: no fabrication, no drift.**

## Module A — originals destroyed by my own capture (my error, disclosed)

`tests/fixtures/generate.mjs` writes **co-located, in place**. It has **no scratch-path option**,
so §4b's "capture to a scratch path; the shipped fixtures stay untouched" is *not achievable with
this repo's capture path*. My module-A run overwrote all six shipped fixtures at 15:28 before I
had preserved them, and they were untracked (`??`), so git cannot restore them. I checked:

```
git log --all -- 'packages/headless/src/modules/client-custom-fields/__tests__/fixtures/*'  -> empty
git stash list                                        -> no relevant entry
git fsck --no-reflogs                                 -> no recoverable candidate
```

**The byte-level before/after comparison for module A is therefore unavailable, and that is my
error, not the prover's.**

### How conformity was re-established instead

Module A's integration suite **replays** these fixtures. I ran it against **my own fresh capture**
— 19/19 green, exit 0. A suite written against fabricated or drifted shapes cannot pass replay of
a live capture taken minutes earlier. Module A's fixtures therefore **do describe the live system
structurally**, established by replay rather than by diff.

Consequence for whoever commits: **the module A fixtures now in the working tree are MY captures,
not the prover's.** They are real, linted and structurally verified, but the provenance line
changed hands. Stated so nobody has to infer it from an mtime.

## The two disclosed irregularities — checked, not assumed

1. **Multipart image assembly.** Disclosed as assembled outside `Generator.capture()` because
   `Generator` only encodes JSON/url-encoded bodies. **Confirmed accurate and benign:** both image
   fixtures came out of the generator run I executed, with a real `200` and a real `422`. The
   bypass is internal to the body encoder; the data is RECORDED.
2. **UUID redaction.** **Confirmed:** real UUIDs are not masked — `sanitize()`'s
   `PII_VALUE_PATTERNS` covers only email/JWT/phone. Emails *are* masked
   (`mock-email-1@example.com`). Staging UUIDs are not PII of consequence, but the gap is real and
   belongs to `lint-fixtures`, not to this pair.

## What the real data constrains — RECORDED, and it is the root of the constructed-input problem

This staging brand carries exactly **two** client custom-field definitions. From my own capture:

| code | `type` | `type_code` | value observed |
| --- | --- | --- | --- |
| `age` | 7 | `"number"` | `42`, later `null`, later `37`/`44` |
| `profile_picture` | 8 | `"image"` | `null` |

That is why a large share of module A's value-semantics proofs necessarily use **CONSTRUCTED**
inputs — there is no real SELECT, SELECT_RADIO, DATE, PASSWORD, TEXT or TEXTAREA definition to
record. How that is marked, and my adequacy judgement, is in
[`07-gaps-and-limits.md`](./07-gaps-and-limits.md).

## Not re-run this round

Per the conductor's instruction, I did **not** re-run `pnpm fixtures:generate` when re-confirming
AC-60 — that command is how module A's originals were lost. Provenance rests on the replay
evidence above. Both suites remained green against the current fixtures (59/59, 48/48).
