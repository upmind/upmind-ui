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

A branch name is not a pin. Both SHAs, which are:

| Phase | Branch | SHA | HEAD date |
| --- | --- | --- | --- |
| Initial research citations | `feat/cancellation-logs-updates` | `62953d26fad279520534ef77cb1bb632b9d74304` | 2026-08-07 10:23:10 +0100 |
| Late verification (AC-47 onward) | `feat/FE-3080-promotion-disqualifying-products` | `47fdeb0c053219cff5ee9c8276c2a741c6554178` | 2026-08-06 18:04:51 +0100 |

Recorded authoritatively in `../requirements.md` §2 and machine-readably in `../parity.yaml` →
`meta.oracle`. Registered as lesson **L5** in `../requirements.md` §9: *an oracle citation needs a
SHA, not a branch name* — a reference that borrowed confidence from its form rather than from what
it actually resolved to.

### I verified both SHAs myself, and two things are worth knowing

Read-only, in the oracle checkout:

```
$ git rev-parse --abbrev-ref HEAD
feat/FE-3080-promotion-disqualifying-products
$ git rev-parse HEAD
47fdeb0c053219cff5ee9c8276c2a741c6554178
$ git cat-file -t 62953d26fa
commit                                        # still present locally
$ git branch --list feat/cancellation-logs-updates
  feat/cancellation-logs-updates               # branch still exists
```

**1. The labels are counter-intuitive: the "late" SHA is the OLDER tree.** `47fdeb0c05` is an
**ancestor** of `62953d26fa` (`git merge-base --is-ancestor` confirms it; the merge-base *is*
`47fdeb0c05`), and `62953d26fa` is the current tip of `feat/cancellation-logs-updates`. So the
FE-3080 branch was cut from a point *before* the initial-research commit, and the late verification
ran against an earlier tree than the early research did. A reader assuming "late = newer" would be
wrong.

**2. In practice the cited lines did not drift at all.** I spot-checked nine citations spanning
every oracle file the parity table leans on, comparing the exact cited line at both SHAs:

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

**9/9 identical**, so the branch move did **not** invalidate any line number this bundle cites. The
caveat below is therefore about reproducibility hygiene, not about a known error.

### How to follow a legacy citation safely

**Confirm a citation against the cited SYMBOL — the function, `computed`, or template block — not
against the line number.** A symbol survives a rebase; a line number does not. Both SHAs are
reachable without checking anything out:

```bash
git -C /Users/dom/Documents/Upmind/vue-app show 62953d26fa:<path>   # initial research
git -C /Users/dom/Documents/Upmind/vue-app show 47fdeb0c05:<path>   # late verification
```

If a line number does not match, search the file for the named symbol before concluding the
citation is wrong — and if the checkout has moved on again, prefer the SHAs above over whatever
branch happens to be checked out.
