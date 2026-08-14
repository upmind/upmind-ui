# verify.md — client-address scoped conversion

    verdict:       PRESENT
    verifiedSha:   b8549ef82923cf8ffaa8713bd5076598b66082e9
    branch:        feature/client-address-scoped-conversion
    base:          bff994868 (gitlab/develop)
    seat:          verifier
    date:          2026-08-14
    supersedes:    the verdict stamped 3bc6e1941 (seven commits behind; review #3 blocker B4)
    posture:       fail-closed. Every number in section 3 was re-executed at THIS
                   sha. Section 8 states exactly which evidence is carried forward
                   from the earlier pass and why, rather than re-asserting it as fresh.

---

## 0. Why this file was re-issued

The previous verdict was honest when written and stale when read. It was stamped
`3bc6e1941`, before all three review blockers were fixed; it reported 115/1 and 16
negative controls against a tree that now measures 123 tests and 19 controls; its
sections 4 and 6 signed off on a CREATE wire body that changed twice afterwards;
and it was never committed, so the capability evidence would not have travelled
with a push.

Nothing about the code needed to change. This file re-executes the verdict against
the tree that exists.

---

## 1. Core deliverable

Let a consumer manage a client's postal addresses at full parity with legacy
vue-app plus the pre-conversion headless module — delivered as TWO scoped
composables (`useClientAddresses` collection + `useClientAddressManager`
per-address form editor) whose every request resolves the target client through
ONE identity seam instead of five independent session re-reads.

Measured against BOTH oracles: (a) `packages/headless/src/modules/client-address/`
@ `bff994868`; (b) legacy vue-app @ `47fdeb0c`.

---

## 2. What moved since the stale verdict, and what did not

`git diff 3bc6e1941..b8549ef82` — 16 files, +923/-63.

| Blocker | Fix | Landed at |
| --- | --- | --- |
| B1 (round 1) | the update limb resolves a mapped `Address`, so both `processing` limbs feed `setModel` the same shape | `b95443dc3` / `22944476c` |
| B1 (round 2, root cause) | `parse` falls back to `context.model` on the data-less `xstate.after(wait)#processed` re-entry, instead of re-deriving the whole model from the form-open clone | `22944476c` |
| B2 | a region cleared by a country change reaches the wire as an explicit `null`, minted at the mapper — not at `parse`, where a `null` fails the schema `enum` and wedges the machine | `be4b04cba` |
| B3 | the coercion moved BELOW `if (!baseData) return next`, so it cannot put `region_id: null` on a CREATE | `22f4794d3` |
| records | comments / JSDoc / one patch header | `b8549ef82` |

**The records-only claim at `b8549ef82` is mechanically confirmed.** Every `+`/`-`
line in its four `.ts` files falls inside a comment or JSDoc block, and the one
`.patch` file it touches is byte-identical below `diff --git` (verified against
`be73c0187`). No executable line moved.

**Public surface unchanged since `3bc6e1941`.** The barrel diff over that range
contains two added JSDoc blocks and nothing else — no export added, renamed or
removed. Section 1 of the superseded file enumerated all 15 collection members,
all 22 manager members and the module-level exports against oracle (a) and found
none missing; that enumeration is unaffected by anything in this range, so it is
carried forward rather than re-typed. What I did re-check at HEAD is the wire
behaviour those members produce (section 4) — which is what actually changed.

---

## 3. evidence_rerun — measured at `b8549ef82`

    worktree:  /Users/dom/Documents/upmind-worktrees/client-address
    HEAD:      b8549ef82923cf8ffaa8713bd5076598b66082e9
    clean:     git status --porcelain lists only this file, untracked (now committed)

| Check | Command | Measured | Exit |
| --- | --- | --- | --- |
| module suite | `npx vitest run --project unit --project integration src/modules/client-address` | **123 tests: 122 passed, 1 failed**; 15 files: 14 passed, 1 failed; 33.4s | 1 |
| the 1 failure | — | AC-20 brand-config keys on the wire; `expected [] to deeply equal ArrayContaining[…]` | — |
| headless type-check | `pnpm --filter @upmind-automation/headless type-check` | no diagnostics | **0** |
| consumer type-check | `pnpm --filter @upmind-automation/client-vue type-check` | no diagnostics | **0** |
| module lint | `npx eslint src/modules/client-address --ext .ts` | clean, zero findings | **0** |
| fixture lint | `node tests/fixtures/lint-fixtures.mjs` | `OK: 143 fixture(s) across 13 unit(s) clean.` | **0** |
| eslint suppressions | `eslint-suppressions.json` | 2 `client-address` entries at base `bff994868` → **0** at HEAD | — |

The suite was run twice — once before the negative-control cycles and once after —
and produced 122/1 of 123 both times, with the worktree byte-identical to HEAD
afterwards. The earlier verdict's 115/1 of 116 is superseded: the suite gained
seven tests across the blocker-fix commits.

The single RED is the standing AC-20 / finding F6 halt (see section 9). It is red
in every one of the 20 suite runs recorded in this file, mutated and unmutated
alike, and is subtracted from every blast radius below.

### 3b. The negative-control table — 19 controls, re-measured

All 19 patches `git apply --check` clean at HEAD. Method, per control: apply →
run the whole module suite → `git checkout --` the module → confirm
`git status --porcelain` for `packages/headless` is empty. **`dirty_after_revert`
was 0 for all 19.** Radius = failures MINUS the standing AC-20/F6 halt.

| # | Control | Declared radius | **Measured radius** | Suite | Agrees |
| --- | --- | --- | --- | --- | --- |
| 1 | `address-type` | AC-22 + collateral AC-24 | **2** — AC-22/AC-23 type on the wire; AC-24 posts the model | 120/3 | yes |
| 2 | `auth-guard` | AC-11, no collateral | **2** — both AC-11 empty-log read-backs | 120/3 | yes |
| 3 | `client-id-limb` | AC-3 + collateral AC-11, AC-13 | **3** — exactly those | 119/4 | yes |
| 4 | `collection-readiness-bound` | exactly 1; companion stays green | **1** — AC-4 bounded settle; the timer-hygiene companion stayed GREEN | 121/2 | yes |
| 5 | `default-guard` | AC-13, specifically NOT AC-12 | **2** — both AC-13; AC-12 stayed GREEN | 120/3 | yes |
| 6 | `default-id` | AC-5 + collateral AC-35, AC-12 | **3** — exactly those | 119/4 | yes |
| 7 | `description-order` | 3 AC-31 read-backs | **3** — exactly those | 119/4 | yes |
| 8 | `diff-payload` | 3 AC-23, "no collateral beyond that set" | **5** — the 3, PLUS AC-19/AC-23 region-clear and AC-23 resolves-the-SAVED-address | 117/6 | **understates by 2** |
| 9 | `feedback` | AC-40 success-delete quarter only | **1** — exactly that; the other three quarters GREEN | 121/2 | yes |
| 10 | `find-one` | AC-7; "string lookups route to the same helper either way" | **3** — all three AC-7, INCLUDING the case-insensitive string lookup the header says is unaffected | 119/4 | **string-lookup claim wrong** |
| 11 | `lock-country` | AC-21 EDIT half only | **1** — the edit half; the create half stayed GREEN | 121/2 | yes |
| 12 | `manager-amputation` | 3 AC-23 + AC-15 + AC-30 = 5 | **10** — those 5, PLUS region-clear and the four saved-model / saved-meta read-backs | 112/11 | **understates by 5** |
| 13 | `manager-create-amputation` | "exactly the two AC-24 tests" | **4** — all four AC-24, incl. both region-key read-backs | 118/5 | **understates by 2** |
| 14 | `readiness-bound` | 2 AC-26 | **2** — exactly those | 120/3 | yes |
| 15 | `region-clear` | 1, pinned at `22f4794d3` | **1** — AC-19/AC-23 region_id null; zero collateral | 121/2 | yes |
| 16 | `saved-meta` | 1, pinned | **1** — the settled-meta description read-back | 121/2 | yes |
| 17 | `saved-model-shape` | 4, pinned at `be73c0187`, "118 passed / 5 failed" | **4** — and the absolute count reproduces EXACTLY: 118 passed / 5 failed | 118/5 | yes, exact |
| 18 | `scope-identity` | exactly 1 (AC-30 mid-flight move) | **1** — exactly that; both AC-2 and AC-30's read stayed GREEN | 121/2 | yes |
| 19 | `session-hardwired-read` | "flips NOTHING … not yet demonstrated red" | **1** — AC-2 reads the SCOPE-CONTEXT client's list while the session's activeUser differs | 121/2 | **header stale; it DOES discriminate now** |

**Every one of the 19 controls flipped its declared subject RED.** Not one failed
to discriminate. That is the load-bearing result, and it is what separates this
delivery from FE-2824: the identity seam was broken two independent ways
(`scope-identity` attacks the pin, `session-hardwired-read` hardwires the session
into the read URLs) and the suite caught each with a single surgical test.

### 3c. Five stale negative-control headers — a records finding, not a capability gap

Rows 8, 10, 12, 13 and 19 disagree with their headers. Every disagreement runs in
the SAFE direction: four understate their collateral (more tests guard the
behaviour than the header claims) and the fifth understates itself (`session-
hardwired-read` says its control cannot yet go red; it now does, because the
discriminating AC-2 setup landed at `5e3529a0b`). None of them overstates
discrimination, so none hides a missing capability.

The cause is the same one that produced blocker B4: measurements written against
an earlier tree and not re-taken when later commits added tests. `b8549ef82` set
out to correct four durable records and fixed `saved-model-shape`'s — which now
reproduces exactly — but left these five. `region-clear`, `saved-meta` and
`saved-model-shape` show the durable fix already in use: pin the claim to the
commit it was measured at, and state the radius (which is stable) separately from
the absolute counts (which are not). Handing this to the reviewer as records debt,
not blocking on it.

---

## 4. a7_rechecked — identity and wire, against the CURRENT bodies

This is the section that went stale, so none of it is carried forward.

### 4a. The wire bodies, re-derived independently of the tests

I did not take the CREATE and PUT bodies from the suite's assertions. I imported
`mapIAddressData` / `mapIAddressDataDiff` from HEAD directly and serialised their
output, then compared against the recorded oracle
(`__tests__/client-address.e2e-oracle.pre-migration.json`), whose five POST and
two PUT bodies I extracted mechanically.

| Case | Serialised body at HEAD | Oracle |
| --- | --- | --- |
| CREATE, no region picked | `{name, address_1, address_2, city, state, postcode, country_id, type}` — **no `region_id` key** | identical to the oracle's POST[3], the region-less create |
| CREATE, region picked | same + `"region_id"` | identical to oracle POST[0/1/2/4] |
| CREATE, schema-less caller with no `type` | `type: 1` (HOME) | oracle carries `type` on all five POSTs; base hardcoded `1` for every caller, so these consumers are unchanged |
| PUT, country change clearing a region | `{"region_id":null,"country_id":"…"}` | the AC-19 capability; `null` survives `JSON.stringify`, `undefined` does not |
| PUT, single field | `{"city":"Manchester"}` | diff-only per parity L3 |
| PUT, address that NEVER had a region | `{"city":"Manchester"}` — **no `region_id`** | both sides coerced together, so no spurious clearance |
| PUT, no baseline | full payload | documented fallback |

Oracle CREATE key vocabulary, extracted from the recording:
`address_1, address_2, city, country_id, name, postcode, region_id, state, type`.
The keys HEAD emits are a subset of it in every case, and the region-less create
matches POST[3]'s key set exactly. **B3 is closed at the mapper, not merely at the
assertion:** the `null` is minted inside `mapIAddressDataDiff` below the
`if (!baseData) return next` early return, so no create path can reach it.

### 4b. Identity transport

`assertClientIdentityTransport` (`client-address.int-helpers.ts:684`) asserts all
three limbs the companion's A7 clause requires:

- **URL retarget** — `observed.url` contains `/clients/${scopeResolvedClientId}/addresses`
- **auth identity** — `Authorization === Bearer ${thatClientSessionsToken}`
- **acting-as headers** — asserts NONE of `x-acting-as`, `x-impersonate`,
  `x-on-behalf-of`, `x-staff-id`, `x-admin-id`, `impersonation` is present

Applied at four call sites: the DELETE and the set-default PUT
(`mutations.int.test.ts:86,135`), the list read and the mid-flight save PUT
(`scope-identity.int.test.ts:129,270`).

**Stated precisely, because the earlier file was loose about it:** the CREATE POST
does NOT carry its own header assertion. Its URL retarget IS asserted — `capturePosts`
registers its handler at `*/clients/${clientId}/addresses` and the tests assert
`posts.texts()` has length 1, so a POST addressed anywhere else is not captured and
the read-back fails. Its auth identity is covered structurally rather than by its
own assertion: `add` (`client-address.services.ts:369-380`) builds its URL from
`clientId.value` — the seam — and goes out through the same `useQuery()` transport
with `withAccessToken: true` as `put`, `del` and `getOne`, which is the single layer
the four assertions above exercise. There is no second auth path for the POST to
diverge onto. I am recording this as covered-by-shared-transport, not as an
independent read-back.

### 4c. Scope purity — verified by hand

`ci/lint-scope-purity.mjs` does not exist in this repo (the `ci/` directory is
absent entirely), so I checked its subject directly. Across all 16 production
`.ts` files of the module: **zero** occurrences of `useTestAttrs`, `process.env`,
`import.meta.env`, `NODE_ENV`, `VITEST`, `__TEST__` or `isTest`. The exercised
path is the PROD path, and the module does not even use the one sanctioned
FE-2865 carve-out.

---

## 5. silent_drops — re-checked at HEAD

**NONE.**

Re-checked against both oracles with the current wire behaviour. The specific
question this section had to answer again is whether the B1/B2/B3 fixes removed
anything while fixing what they fixed. They did not:

- **The barrel is unchanged since `3bc6e1941`** except for two added JSDoc blocks
  — no member dropped, renamed or narrowed.
- **The CREATE body did not lose a field.** Its key set is a subset of the
  oracle's own create vocabulary, and the only case that omits `region_id` is the
  case the oracle also omits it in. B3 removed a key legacy never sent; it did not
  remove one legacy sent.
- **The PUT body did not lose a field.** The diff still carries every moved key;
  B2 ADDED the one key (`region_id: null`) that a country change previously
  dropped on the floor.
- **`type` is not lost for schema-less callers.** `?? ADDRESS_TYPE_KEYS.HOME`
  replaces base's unconditional `type: 1` hardcode for exactly the callers that
  pass no type (`client-company`, `basket-billing/unified` literals), so their
  wire body is unchanged from base, while the manager now sends the client's
  actual choice — which is parity row L5's whole point (`disposition: Direct`).
- The compiler-invisible reshape — `useContext().default` returns the ID string,
  not the row (ruling R5 / D-4) — is unchanged by this range and remains
  dispositioned, with `apps/velia` / `apps/hosting` the declared C21 operator
  follow-up.

### Unsigned-drop check (A9)

Machine-audited `parity.yaml`: **12 rows carry `disposition: Dropped-with-Linear-issue`**
— `CELL-3`, `CELL-7`, `U1`, `D1`–`D8`, `C21`. **Every one names an operator ruling**
(R2 on eleven, R10 on `C21`; `CELL-7` names "Ruling R2" in its `reason` prose and
cross-references rows D1–D8). There is **no unsigned drop**, and therefore no
verdict-blocking A9 irregularity.

Declared tallies re-counted independently and internally consistent:
`undispositioned_parity_cell_count: 0`, `undispositioned_row_count: 0`.

One correction to the superseded file: it said "10 drops carry `linear_ref: OWED`".
The accurate statement is **12 rows carry an OWED ref, resolving to 10 distinct
owed issues** — `CELL-3` and `CELL-7` share D1–D8's, which is what the table's own
`dropped_refs_owed: 10` counts. See section 9.

---

## 6. fixture_disposition — CARRIED FORWARD, not re-captured

**No fixture changed since the earlier pass, so I did not re-capture. This result
is carried forward from `3bc6e1941`; it is not a fresh capture and is not
presented as one.**

Verified before deciding:

    git diff --name-only 3bc6e1941..b8549ef82 -- .../__tests__/fixtures/     -> 0 files
    blob-hash comparison of all 15 fixtures across the two shas               -> identical
    .../__tests__/*.json (incl. the e2e oracle) and client-address.fixtures.ts -> 0 files changed

The carried-forward result, performed at `3bc6e1941`: all 15 fixtures re-captured
live against `https://api.staging.upmind.io` via `pnpm fixtures:generate
client-address` (13 generator specs, 29.1s), shipped files copied to scratch and
restored with `git checkout --` so the diff under verification was never mutated,
then compared structurally — keys, value shapes, enum leaf values, HTTP status,
method, UUID-normalised path template, header key sets, excluding volatile values.
**15/15 structurally identical, 0 mismatched — neither fabricated nor drifted.**
All 15 were reproducible by the generator, so there is no hand-authored orphan.

Carrying it forward is sound precisely because the artefacts are byte-identical:
a re-capture at `b8549ef82` would compare the same 15 files against the same live
contract. What a carried-forward result cannot cover is **drift in the live API
between the two passes** — same-day here, but the exposure is real and named.
`fixtures:generate` remains runnable in this environment, so the operator can
force a fresh capture at any time.

---

## 7. Verification GAPs (surfaced, not waived)

1. **`ci/lint-scope-purity.mjs` and `ci/lint-plan-compliance.mjs` do not exist in
   this repo** — there is no `ci/` directory at all. Both gates' subjects were
   verified by hand instead (sections 4c and 5). Their automated verdicts are
   unavailable, not passed.
2. **Five stale negative-control headers** (section 3c). Records debt handed to
   the reviewer.
3. **Four ACs have tests but no mutant** — AC-32, AC-36, AC-9, AC-10 — plus the
   create-body shape. Already triaged to the operator. Their tests' discriminating
   power is unproven; I did not mutate them independently.
4. **The CREATE POST has no independent auth-identity read-back** (section 4b). It
   is covered by shared transport, which is weaker than an assertion.
5. **Fixture provenance is carried forward, not fresh** (section 6).
6. **No Linear issue ID exists for this bundle**, so the tracker mirror could not
   be filed. This committed file is the verdict of record; the mirror is owed once
   an ID exists.

---

## 8. Known-and-accepted — re-confirmed, not re-litigated

- **AC-20 / F6 — the single expected RED.** Re-confirmed at source at this sha:
  `brand.services.ts` `ensureBrandConfig`'s JSDoc says "the refetch below is what
  sends it" and the body contains no refetch; `@tanstack/query-core@5.90.12`
  `isStaleByTime` returns `false` for `"static"` before it tests `isInvalidated`,
  so `invalidate()` cannot force it. Genuinely upstream. Parity row `U1`, standing
  halt. AC-21's three `lockCountry` tests are green, so no user-visible behaviour
  is lost — only the wire-level request assertion.
- `apps/velia` / `apps/hosting` untouched by operator ruling; submodules.
- The staff drops (`CELL-3`, `CELL-7`, `D1`–`D8`) — signed by ruling R2, refs
  `OWED — unfiled`: 10 distinct issues across 12 rows.
- `client-company.traceability` fails at base — pre-existing.
- The bundle's location under `docs/story-bundles/` is with the operator
  (`docs/sdd` is a broken symlink in this worktree).

---

## 9. Verdict

**PRESENT** — `verifiedSha` `b8549ef82923cf8ffaa8713bd5076598b66082e9`.

The capability landed against both oracles, and it is still landed after three
rounds of blocker fixes. The public surface is unchanged from the pass that
enumerated it member by member. The three fixes are real at the seam, not at the
assertion: I re-derived the CREATE and PUT bodies straight from the mappers at
HEAD, independently of the suite, and they match the recorded oracle's own
vocabulary — including the region-less POST that B3 was about, and the explicit
`region_id: null` clearance that B2 added. The identity seam is discriminating,
not FE-2824 cosplay: 19 controls, all applying and reverting clean, every one of
them flipping its declared subject RED, with the two headline identity mutants
each caught by exactly one surgical test.

The single RED is the confirmed upstream AC-20/F6 halt, whose dependent behaviour
is delivered and proven.

What is NOT clean, and is handed to the reviewer rather than buried: five
negative-control headers still carry measurements taken against earlier trees.
Every one errs safe — four understate their collateral, and the fifth understates
its own control's power — so none conceals a missing capability, and none changes
this verdict. But they are the same staleness class that produced blocker B4, and
the fix already demonstrated on three sibling patches is to pin each claim to the
commit it was measured at.
