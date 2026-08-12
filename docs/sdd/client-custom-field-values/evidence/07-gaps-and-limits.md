# 07 — Gaps, limits and unverified threads

Read this before trusting anything in files 01–06. Every gap I know of is here, including the ones
that reflect badly on my own run. A pipeline I could not run is a **surfaced gap, never a silent
waiver**.

## G1 — SHA-binding gap: the verdict is not bound to a pushed commit

```
$ git rev-parse HEAD
7edb47ddead8a26d50b02b5e5821ad9912da920e
$ git log --oneline -1
7edb47dde Merge tag '0.20.10' into develop
$ git ls-tree -r HEAD | grep client-custom-fields
  … only the PRE-EXISTING flat module files …
$ git rev-parse --abbrev-ref --symbolic-full-name @{u}
fatal: no upstream configured
```

`7edb47dde` is an **upstream merge commit that contains none of this run's work**. All of it —
four composable decompositions, both `__tests__/` trees, both fixture sets, the playground edits —
was uncommitted working tree (91 `git status` entries) when I inspected it. `origin/develop` is not
even a fetched ref.

So `verifiedSha` cannot be satisfied as the skill intends. **Everything in this directory is bound
to the working tree as inspected on 2026-08-10 15:28–15:54 and 2026-08-11 15:37–15:51**, not to a
commit any reviewer can check out. **A fresh end-to-end verification is owed after commit+push**,
and the conductor has confirmed it will be dispatched then.

## G2 — Module A's original fixtures were destroyed by my own re-capture

`tests/fixtures/generate.mjs` writes co-located in place with **no scratch-path option**, so the
skill's isolation requirement is unachievable with this repo's capture path. I overwrote all six of
module A's shipped fixtures before preserving them; they were untracked, so they are
unrecoverable. **My error.**

- The byte-level before/after comparison for module A **does not exist**.
- Conformity there rests on module A's 19/19 integration suite **replaying my own fresh capture**.
- **The module A fixtures now in the tree are mine, not the prover's.**

Full detail in [`06-fixture-recapture.md`](./06-fixture-recapture.md). **Owed to the repo:** give
`generate.mjs` a scratch-path/output-dir option so a future verifier cannot destroy the artefact it
is grading.

## G3 — Request economy: I measured ONE read per boot, not two

This is a genuine tension I am flagging rather than reconciling, because I did not measure the
thing the other figure describes.

**What I observed (RECORDED)**, raw counts, one `/account/profile` load, both modules active:

```
GET /api/clients/{id}?with=custom_fields,custom_fields.field   x1
GET /api/custom_fields?…                                        x0
```

and on each `/account/profile/edit` navigation, likewise `x1`. That is the whole of what I
measured: **one profile read reached the network.** I originally attributed this to a shared query
key; that attribution is refuted below and should not be relied on.

**What is reported elsewhere:** a **two-reads-per-boot** cost. **REPORTED (not observed by me)** —
attribution: the Review seat via the conductor. I cannot confirm or refute it from my data.

### My original reconciliation hypothesis was WRONG — refuted from source

I originally suggested the shared `["client", <clientId>, "record"]` key was what collapsed the two
reads into the one I measured. **That explanation is refuted.** The planner verified from source
that module A's *effective* query key carries a `{locale}` segment (`useQuery.ts:262`) while module
B's raw key does not, so **the two cache entries were never shareable in the first place** — a
shared-key collapse cannot be the mechanism, and my earlier claim in this file that the shared key
"demonstrably collapsed" the two reads was an over-reading of a single request count.

What I actually established is narrower and still true: **one** profile read reached the network on
a `/account/profile` load. The likelier mechanisms for that are **in-flight request dedupe** (the
second call joining a still-open first) or a **warm `staleTime: DAY` cache hit** — neither of which
implies a shared key, and both of which are invisible at the browser network layer where I counted.

**What this changes for the post-commit measurement.** Counting at the network layer cannot
distinguish "one read was issued" from "two reads were issued and one was served from cache or
joined in flight". My instinct to **count at the service seam rather than the network layer**
stands and is the right correction — it is now the *required* method, not a preference, and it
should assert the number of times each service function is entered, not the number of HTTP requests
observed. The `{locale}`-segment asymmetry is itself worth an explicit assertion, since two keys
that look shared but are not is the kind of thing that silently doubles request volume.

## G4 — AC-18: upload progress is binary, not incremental

Legacy tracks real byte-level progress via axios `onUploadProgress`
(`customFields.vue:375-383`). This pair reports **binary `0`/`100`**:
`useClientCustomFieldImage.meta.ts:50` — `progress = computed(() => isComplete.value ? 100 : 0)`.

Three independent barriers, all confirmed:

1. `query`'s `doFetch` uses native `fetch()`, which has no upload-progress hook.
2. Nothing dispatches `system-upload`'s `PROGRESS` event.
3. **REPORTED (not observed by me)** — attribution: the planner — `useUpload()`'s return type does
   not expose the machine's `progress` context field at all, so even a dispatched `PROGRESS` event
   would be unreadable.

**Honesty assessment: exemplary.** The source says *"AC-18 IS PARTIALLY DELIVERED — binary 0/100,
no incremental progress … Docs and review must not describe incremental progress as delivered"*,
the test name says `"reports uploading + progress honestly (binary 0/100)"`, and interpolating a
fake timer-driven value was explicitly **rejected** as worse than an honest binary signal. Nothing
claims incremental progress.

**One residual mismatch:** `requirements.md:326-327` still reads *"`progress` advances from `0`
toward `100`"*, which the delivery satisfies only degenerately. The AC text should be amended to
match the honest implementation. Recorded as a tracked partial delivery, not a silent narrowing.

## G5 — CONSTRUCTED versus RECORDED, and whether the constructed coverage is adequate

Because the brand carries only NUMBER + IMAGE definitions
([`06`](./06-fixture-recapture.md)), a large share of module A's value-semantics proofs use
constructed inputs. **None is misrepresented.** Labelling appears at `@fileoverview` *and* inside
individual test names, so a grader reading only test output still sees the word:

```
AC-17 (constructed SELECT — no real SELECT definition on this brand) a choice value projects
  to its option's LABEL, not the raw stored value
AC-17 (constructed SELECT_RADIO/checkbox — no real definition on this brand) …
```

- `schemas.test.ts` fileoverview: AC-15's choice scenario is a CONSTRUCTED `CustomField` "built
  from the real recorded 'age' definition with only `typeId`/`code`/`options` overridden … never
  presented as a recording", while "AC-11's NUMBER row and AC-12's per-definition control ARE
  proven against the two real recorded definitions".
- Envelope-substitution cases keep the **real recorded envelope** and substitute only the type
  discriminator; `installDefinitionsHandler` wraps a mutable row set in the **recorded** envelope,
  "never a fresh hand-authored fixture".
- AC-35's `LANGUAGE_ID_ABSENT_FROM_BRAND = "constructed-absent-language-id"` is labelled
  constructed **and validated against reality** —
  `expect(realLanguageIds).not.toContain(LANGUAGE_ID_ABSENT_FROM_BRAND)` against the recorded brand
  list. An "absent id" cannot be recorded by definition, so this is the honest construction.

**My adequacy judgement: adequate, not papering over.** The split falls on the right seam — every
**wire contract** (AC-10, AC-23, AC-24, AC-18/20/21, the profile read and persist) rests on real
recordings, and the constructed inputs feed only **pure functions** over already-mapped shapes.
The recorded-fixture rule binds wire contracts; no wire contract here is constructed.

## G6 — `type_code` strings `"date"` / `"password"` remain unconfirmed against real data

Our mappers correctly key on the numeric `typeId`
(`client-custom-fields.mappers.ts:96,:195`, per `CustomField.typeId`'s own `@decision`). **But**
`client-custom-fields.schemas.ts` delegates AC-11/AC-12 generation to `useFieldsSchemaParser` /
`useFieldsUischemaParser` / `useFieldsModelParser` in `utils/useFields.ts`, whose switches key on
the **string** `field.type` = `raw.type_code` (`mappers.ts:56`) at `:38,:49,:61,:168`.

Confirmed from live data: `"number"` and `"image"` both exist and both hit real branches. For a
DATE or PASSWORD definition the assumed string is unverified; a mismatch falls silently to
`default`, losing `format: "date-time"` / `"password"`.

Bounded (no such definition exists on this brand), disclosed in the test fileoverview and the
hand-off's `type_code_findings`, and not JTBD-critical — but a real unverified assumption a
reviewer should carry.

## G7 — AC-44's behavioural half is weaker than its name

The **structural** half is fully satisfied and I confirmed it independently: **zero**
`from "vue-i18n"` imports remain under module B (the only matches are doc comments), asserted by a
grep-shaped spec over every module source file.

The **behavioural** half is scoped to "a non-empty string" because no locale catalog is mounted in
the integration harness, so "behaviour-preserving" is asserted structurally rather than by message
text. Acceptable given the harness; worth revisiting if a catalog is ever mounted.

## G8 — F5: the editor's base model is never seeded at runtime

Found by my unstubbed run-the-app read-back, **not** by any test. With the server holding
`firstname:"Checkout", lastname:"Test", public_name:"Checkout T.", interface_language_id:<uuid>,
age:44`, the editor at `/account/profile/edit` with **no filter at all** rendered:

```
model = { "customFields": {} }
input[0]="" First Name    input[3]="" Language
input[1]="" Last Name     input[4]="" Age
input[2]="" Public Name   input[5]="" Profile Picture
```

With `?fields=firstName`: `model = {}` and `meta.isDirty === true` **immediately on load**.

`filterFields` is **exonerated** — I isolated it by loading the unfiltered form, which is equally
empty. The wiring exists at source: `loadLookups` (`client-personal-details.services.ts:212+`)
builds `baseModel` from `fetchProfileOnce(...)`, then
`compactDeep(..., {preserveContainers:true})`. The fetched values never reach `model` at runtime.

**This is the second half of the defect this bundle set out to fix.** `requirements.md` §7.1 names
two consequences of the absent read verb: the `"undefined"` render (**fixed** — confirmed in
[`03`](./03-ac60-unstubbed-app-readback.md)) and, verbatim, *"the editor's `baseModel.customFields`
is always empty and no existing value is ever shown"* (**was not fixed**).

**Why no test caught it — the part that matters.**
`client-personal-details.language.int.test.ts:94-95` records:

> `baseModel`/`model` start as `{customFields:{}}` on load — loadLookups (T-B3) seeds ONLY
> `customFields`, never native

That was "confirmed empirically" against a client whose `age` was **null**, where an unseeded model
and a correctly-seeded-but-empty one are **indistinguishable**. A true observation was then
enshrined as the contract. This is the FE-2824 shape in its data dimension: a green suite
certifying a state the requirements call a defect, because the fixture's value happened to be null.
It is also precisely why a run-the-app read-back on a **non-null** value is not redundant with the
suite.

**Not destructive** — checked, not assumed: Apply-without-typing issued **no PUT** and
`Public name` survived (see [`01`](./01-wire-captures-persist.md)).

**Status:** reported fixed after my finding. **Not re-verified by me** — on the post-commit list.

**One thread I could never close:** I confirmed `baseModel` is *populated in source* but could not
observe its *runtime* value from the DOM (only `model` is rendered). So "`baseModel` populated but
`model` not seeded from it" versus "`baseModel` empty too" remains **unverified**. That distinction
is what separates a broken editor from an absent editor read verb, and it is the single loose thread
in my PRESENT verdict.

## G9 — Blockers Review found that my verdict did not reach

**REPORTED (not observed by me)** — attribution: the Review seat, via the conductor. Recorded here
because both are capability failures behind green gates, i.e. exactly this seat's target class, and
my evidence did not reach them.

1. **The clear path wrote an empty PUT body and reported success.** `useValidation.ts:483`'s
   `compactDeep(model, {preserveContainers:true})`, `isDeepEmpty.ts:27` treating `""` as
   non-meaningful and `:66` omitting the key → the cleared field reached the mapper **absent** →
   `mapIProfileFields` set `diff.firstname = undefined` → the empty-diff short-circuit missed
   because `Object.keys(diff).length === 1` → `JSON.stringify` dropped it → body `{}`, HTTP 200,
   old value returns. AC-46/AC-47 are `jtbd_carried_must_fix` rows. Reported fixed, captured as
   `{"public_name":null}`.

   **Why my evidence missed it:** both my round trips exercised **setting** a value
   (`age: 37`, `age: 44`); neither exercised **clearing** one. The lesson I am recording against my
   own method: *"manage" has more verbs than one, and a round trip that sets a value does not
   exercise clearing it.* A future run-the-app read-back must drive set **and** clear **and**
   revert. **Now partly closed:** a 13th control,
   `client-personal-details.clear-through-pipeline`, guards the clear path at the pipeline level
   and I have certified it RED on both AC-47 (body lands `{}`) and AC-46 (zero requests leave).
   The control set is therefore **13**, not 11, throughout this evidence set.

2. **Module A's readiness never settled when the brand read failed**, pinning module B's manager in
   `loading`. Reported fixed. My AC-6 negative-control re-drive covered readiness settling on a
   *definitions* failure, not on a *brand* failure — a distinct path my **original** controls did
   not reach. **Now closed:** a 12th control, `client-custom-fields.readiness-brand-failure`,
   guards exactly this path, and I have certified it RED on AC-6c (1 failed / 60) — see
   [`05-negative-controls.md`](./05-negative-controls.md).

## G10 — Drops, and the filing still owed

No dropped capability was **built**: targeted greps found zero `api/admin/*` paths, zero definition
create/update/delete/reorder, zero `guestToken`/`basketToken`, zero `notifications_disabled` /
`staged_import`, zero resend-verification or cross-brand-redirect logic.

All 17 drops (A-D1..A-D4, D1..D13) carry legacy `file:line` evidence and a rationale, and every
`Dropped` row in `parity.yaml` carries a `signoff_token` ("operator ruling R1"), so **no unsigned
drop exists** and the A9 laundering check passes.

**Still owed:** the `Dropped-with-Linear-issue` refs are all `PENDING-OPERATOR-FILING` because the
Linear MCP was unauthenticated for my whole engagement — disclosed in `parity.yaml`
`meta.linear_state`, not concealed. I also **could not mirror this verdict to Linear**, which
`rules/agent-seat-separation.md` names as part of this seat's filing duty. Both remain operator
actions.

The narrowing itself is real and type-enforced, not merely documented: `ScopeActorTypes.STAFF` and
`GUEST` are `null as never` in all three scope matrices, so `.as('staff')` is a compile-time error;
context enums are single-member **entity** contexts (`VALUES = "custom_field_values"`,
`PROFILE = "profile"`), so `.for('client', id)` compiles nowhere — the only occurrences of that
string in either module are doc comments explaining its absence.

**Caveat on those 17 drop bodies' citations.** They are `file:line` references into the oracle, and
the oracle is a separate working checkout whose branch moved mid-run — so a line number alone is not
a pin. Resolve them at `62953d26fad279520534ef77cb1bb632b9d74304` (initial research, tip of
`feat/cancellation-logs-updates`) or `47fdeb0c053219cff5ee9c8276c2a741c6554178` (late verification,
`feat/FE-3080-promotion-disqualifying-products`) via `git show <sha>:<path>`, and confirm each
against the cited **symbol** rather than the line. I spot-checked nine of these citations at both
SHAs and all nine were byte-identical, so this is hygiene rather than a known error — detail and
method in [`README.md`](./README.md#oracle-provenance--read-before-following-any-legacy-citation).
Registered as lesson **L5** in `../requirements.md` §9.

## G11 — Staging data I mutated

For the record, so nobody mistakes it for drift: the test client's `age` custom field was changed
by **me**, through the app, during read-backs — `null` → `37` → `44`. Its current value is `44`.
`public_name` was tested for survival and is unchanged at `Checkout T.`.
