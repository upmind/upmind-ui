# Verifier evidence — client custom field values

Filed by the **verifier** seat for `/scoped-composable-factory`'s Verify stage, per
`rules/verify-evidence-filing.md` (U7: no conforming evidence, no move into Linear
**Needs Review**).

The verdict itself lives in [`../verify.md`](../verify.md) — including AMENDMENT 2 (the
unstubbed AC-60 re-confirmation) and AMENDMENT 3 (Review's blockers 1/2). **This directory does
not restate the verdict**; it holds the raw, openable proof behind it so a human reviewer can
read what was actually observed without re-running anything.

## What is in here

| File | Contains |
| --- | --- |
| [`01-wire-captures-persist.md`](./01-wire-captures-persist.md) | The outbound `PUT` bodies I captured for the persist path, and the read-back that confirmed each |
| [`02-a7-identity-transport.md`](./02-a7-identity-transport.md) | A7 read-backs, both modules: URL retarget, session token selected, acting-as headers absent, plus the observed collapse under the mutant |
| [`03-ac60-unstubbed-app-readback.md`](./03-ac60-unstubbed-app-readback.md) | The run-the-app read-back with **no stubs**: rendered page content, language label, absence of `"undefined"` / bare UUID |
| [`04-suite-outputs.md`](./04-suite-outputs.md) | My own suite runs, per module per layer, with exit codes |
| [`05-negative-controls.md`](./05-negative-controls.md) | My own **13**-row negative-control certification: which spec went RED for each mutant |
| [`06-fixture-recapture.md`](./06-fixture-recapture.md) | The live re-capture, module B's 6/6 structural comparison with verbatim deltas, and module A's overwrite disclosure |
| [`07-gaps-and-limits.md`](./07-gaps-and-limits.md) | Every gap, limit and unverified thread — read this before trusting anything above |

## Provenance of this evidence — read first

Everything here was produced by **me re-executing**, never by copying a filed log. That is the
seat's whole point: a pasted `PASS` line is not proof, and stored provenance receipts
(manifests, stamps, hashes) are forgeable by whoever wrote the fixture.

Two honesty markers used throughout:

- **RECORDED** — captured from the real staging API (`https://api.staging.upmind.io`) or observed
  on the real wire / in the real running app during my own run.
- **CONSTRUCTED** — a hand-built input, labelled as such, never presented as a recording.

Where a number came from someone else's report rather than my own observation, it is marked
**REPORTED (not observed by me)** and attributed. I have not adopted any figure I did not
measure.

## Environment these observations were taken in

- Worktree `/Users/dom/Documents/upmind-worktrees/client-custom-fields`, branch
  `worktree-client-custom-fields-scf`.
- Legacy oracle: `/Users/dom/Documents/Upmind/vue-app` — **see the provenance caveat below; the
  branch named in earlier drafts of this file was wrong by the time you are reading it.**
- Real API: `https://api.staging.upmind.io`, brand origin `http://qa-automation.local:5173`.
- Playwright 1.57.0 driving a real chromium against `pnpm dev` (Vite 7.3.0), with
  `@upmind-automation/headless` aliased to **`packages/headless/src/index.ts`** and **no `dist/`
  present** — so the browser executed this run's source, not a stale build.

## The binding caveat

**`verifiedSha` = `7edb47ddead8a26d50b02b5e5821ad9912da920e`, which does NOT contain the work.**
That commit is `Merge tag '0.20.10' into develop`; every artefact of this run was uncommitted
working tree when I inspected it. This evidence is therefore bound to *the working tree as
inspected*, not to a pushed commit. A fresh end-to-end verification is owed after commit+push.
Detail in [`07-gaps-and-limits.md`](./07-gaps-and-limits.md).

## Oracle provenance — read before following any legacy citation

**The oracle is a separate working checkout, NOT a pinned worktree, and its branch moved
mid-run.** Every dispatch in this run named it as `feat/cancellation-logs-updates`, carried forward
from the original research; by the late verification rounds the checkout was actually on
`feat/FE-3080-promotion-disqualifying-products`. Nothing citing it is *wrong* — the late citations
are exact on the tree that was checked out when they were made — but a reader who checks out the
branch named in prose may land on a different tree.

A branch name is not a pin. The checkout has now moved **twice** during this work, across **three**
branches, so all three phases are pinned by SHA:

| Phase | Branch at the time | SHA | Commit date |
| --- | --- | --- | --- |
| Initial research citations | `feat/cancellation-logs-updates` | `62953d26fad279520534ef77cb1bb632b9d74304` | 2026-08-07 10:23:10 +0100 |
| Late verification (AC-47 onward) | `feat/FE-3080-promotion-disqualifying-products` | `47fdeb0c053219cff5ee9c8276c2a741c6554178` | 2026-08-06 18:04:51 +0100 |
| Post-gate parity finding (AC-63 / PG-1) | `feat/FE-3007-future-date-cancellations` | `ea310f5a42e32b7ae1255c223b77918ef0594286` | 2026-08-11 11:35:35 +0100 |

Recorded authoritatively in `../requirements.md` §2 and machine-readably in `../parity.yaml` →
`meta.oracle`. Registered as lesson **L5** in `../requirements.md` §9: *an oracle citation needs a
SHA, not a branch name* — a reference that borrowed confidence from its form rather than from what
it actually resolved to. Two branch moves in one run is L5 earning its place, not a theoretical
concern.

### I verified all three SHAs myself, and the lineage is not a straight line

Read-only, in the oracle checkout — the third confirmed as a real commit and the branch it sits on
identified (the dispatch named the SHA but not the branch):

```
$ git rev-parse --abbrev-ref HEAD
feat/FE-3007-future-date-cancellations
$ git rev-parse HEAD
ea310f5a42e32b7ae1255c223b77918ef0594286
$ git log -1 --format='%ci %s' ea310f5a42
2026-08-11 11:35:35 +0100 Add client revoking; Add reason and cancellation fields
```

**`47fdeb0c05` is the fork point, not the newest tree.** It is the merge-base of the other two:

```
merge-base(62953d26fa, ea310f5a42) = 47fdeb0c05
merge-base(47fdeb0c05, ea310f5a42) = 47fdeb0c05
47fdeb0c05 is an ancestor of 62953d26fa        # and of ea310f5a42
62953d26fa is NOT an ancestor of ea310f5a42    # divergent siblings
```

So the three phases are **not** chronological along one branch: the late-verification SHA is the
common ancestor, and the initial-research and post-gate SHAs are divergent siblings descending from
it. A reader diffing "initial → post-gate" is crossing a fork, not walking forward. Anyone assuming
the phases are ordered will be wrong.

**Citation stability: 10/10 checked lines byte-identical.** Across all the SHAs I compared, every
cited line held. The nine from the previous cycle:

| Citation | Result |
| --- | --- |
| `clientProfileBasicConfigurationForm.vue:3` (the `<guard :if-client>` branch) | byte-identical |
| `clientProfileBasicConfigurationForm.vue:264` (diff-only body region) | byte-identical |
| `clientProfileBasicConfigurationForm.vue:350` (the diff baseline pick) | byte-identical |
| `clientProfileBasicConfigurationForm.vue:395` (empty-diff no-op) | byte-identical |
| `store/modules/data/clients/index.ts:149-150` (read `with=custom_fields`) | byte-identical |
| `customFields.vue:348` (`uploadCustomImages`) | byte-identical |
| `customFields.vue:384` (the `guestToken` branch) | byte-identical |
| `auth.services.client.ts:72` (child `access_token`) | byte-identical |

plus the citation the post-gate AC-63 finding rests on, which I validated at **all three** SHAs:

| Citation | Result |
| --- | --- |
| `customFields.vue:10` — `<template v-for="(field, index) in filteredCustomFields">` | byte-identical at `62953d26fa`, `47fdeb0c05` **and** `ea310f5a42` |

That last one is the load-bearing one for AC-63: the oracle renders by iterating **definitions**,
and it does so stably across every tree this bundle consulted — so "legacy is definition-driven" is
not an artefact of which branch happened to be checked out. For contrast,
`clientCustomFieldsForm.vue:92-93` reduces over `client.custom_fields` to seed the form model by
code — values seed, definitions render. That asymmetry is exactly what the value-driven read surface
collapsed.

### How to follow a legacy citation safely

**Confirm a citation against the cited SYMBOL — the function, `computed`, or template block — not
against the line number.** A symbol survives a rebase; a line number does not. Both SHAs are
reachable without checking anything out:

```bash
git -C /Users/dom/Documents/Upmind/vue-app show 62953d26fa:<path>   # initial research
git -C /Users/dom/Documents/Upmind/vue-app show 47fdeb0c05:<path>   # late verification
git -C /Users/dom/Documents/Upmind/vue-app show ea310f5a42:<path>   # post-gate (AC-63 / PG-1)
```

If a line number does not match, search the file for the named symbol before concluding the
citation is wrong — and if the checkout has moved on again, prefer the SHAs above over whatever
branch happens to be checked out.
