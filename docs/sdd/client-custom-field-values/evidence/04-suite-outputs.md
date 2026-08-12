# 04 — Suite outputs (re-run by me, not copied)

> **Current counts (settled tree, re-run by me):** module A **60/60 exit 0**, module B **51/51
> exit 0** (30 unit + 21 integration). The Run 1 / Run 2 tables below are the earlier, smaller
> suites (59 and 48) preserved as the historical record of what I measured when — not stale claims
> about the present. Both new specs (AC-6c, and the AC-46/AC-47 clear-through-pipeline pair) landed
> after Run 2; see [`05-negative-controls.md`](./05-negative-controls.md).

**Status: RECORDED.** I re-ran every one of these myself and captured the real exit codes. A
filed `PASS` line from another seat is not proof — that is the F8 evidence-forgery class this
seat exists to close.

Runner: `vitest 3.2.4`, from `packages/headless`, scoped per module per project. Scoped to
targeted specs within the standing 30-minute test ceiling (ADR-021); no multi-hour suite was run.

## Run 1 — initial verification

| Module | Layer | Files | Tests | Exit |
| --- | --- | --- | --- | --- |
| A `client-custom-fields` | unit | 4 | **40 passed / 40** | 0 |
| A `client-custom-fields` | integration | 3 | **19 passed / 19** | 0 |
| **A total** | | | **59 / 59** | |
| B `client-personal-details` | unit | 4 | **30 passed / 30** | 0 |
| B `client-personal-details` | integration | 4 | **18 passed / 18** | 0 |
| **B total** | | | **48 / 48** | |

Matches the claimed 59/59 and 48/48.

Module A unit files: `traceability` (3), `surface` (9), `schemas` (10), `mappers` (18).
Module A integration files: `image` (5), `guard` (4), `collection` (10).
Module B unit files: `playground-admin-removed` (2), `traceability` (3), `mappers` (17), `surface` (8).
Module B integration files: `language` (2), `read` (6), `manager-cold-boot` (3), `manager` (7).

### Why module A's integration run is also the fixture-provenance proof

Module A's 19 integration tests **replay** the co-located fixtures. That run was executed against
**my own fresh capture** (taken minutes earlier), not against the shipped fixtures. A suite
written against fabricated or drifted shapes cannot pass replay of a live capture. See
[`06-fixture-recapture.md`](./06-fixture-recapture.md) for why this substitution was necessary.

## Run 2 — after the language-name fix landed

Re-run to confirm the developer's `mapProfileFields` change did not regress either module:

```
A exit=0    Tests  59 passed (59)
B exit=0    Tests  48 passed (48)
```

## Package-level suite is RED, for an unrelated reason

`pnpm --filter headless test:unit` (the whole package, not the two modules):

```
Test Files  1 failed | 23 passed (24)
     Tests  1 failed | 176 passed (177)

FAIL  src/modules/client-email/__tests__/client-email.traceability.test.ts
Error: ENOENT: no such file or directory, open
  '.../docs/sdd/client-email/client-email.feature'
    at featureAcTags (client-email.traceability.test.ts:37:17)
```

**Cause, and it is not this pair's modules.** `docs/sdd` was tracked as a **symlink**
(mode `120000`) pointing at `/Users/domdacosta/Dev/Upmind/agent-runner/docs/sdd` — a path that
does not exist on this machine — and this run's bundle was created as a real directory at that
path, shadowing it. `client-email`'s traceability spec reads its own bundle through that path and
cannot find it.

This is the same root cause as Review's blocker 3 (the bundle sitting under a gitignored path).
Per the conductor, `.gitignore` now uses `docs/sdd/*` with a negation for
`docs/sdd/client-custom-field-values/`, and the stale symlink is out of the index — I confirmed
both this bundle and this `evidence/` directory are no longer ignored:

```
$ git check-ignore -v docs/sdd/client-custom-field-values/verify.md
  (no output — NOT ignored)
$ git check-ignore -v docs/sdd/client-custom-field-values/evidence
  (no output — NOT ignored)
```

Whether that resolution also restores `client-email`'s bundle path — and so clears this RED — I
have **not** re-measured this round, per the instruction not to re-run while four seats are
working in the tree. It is on the post-commit re-verification list.

## What a green suite here does and does not mean

Green means type-consistent and behaviour-conformant *to the assertions written*. It does not
mean correct. Two demonstrations from this very bundle:

- **F5** (editor base model never seeded) was green across all 107 tests and was caught only by
  running the app against a **non-null** value.
- Review's **blocker 1** (the clear path writing an empty body and reporting success) was
  likewise green.

Both are the FE-2824 shape: gates that grade structure can be satisfied without delivering
capability (`rules/verify-cosplay.md`).
