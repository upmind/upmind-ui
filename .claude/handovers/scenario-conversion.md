# Handover — convert a module's scenarios to "one scenario, one recording"

You are converting ONE headless module from the old scenario format to the new one
(ADR 035 + Amendment 1, FE-3145). Read this file end to end before you touch anything.

**Module under conversion:** `<module>` (fill in)
**Your branch:** `<branch>` (fill in). Merge `origin/develop` first — the new harness,
the recorder's `--scenario` filter and every reference module live there.

---

## 1. What "done" means

- Every client and guest capability of the module is a **driven** `.feature` scenario,
  replayed from **verbatim** staging recordings, one folder per step.
- A capability nothing can drive keeps ONE declarative scenario tagged `@todo`, with a
  **verified, named** blocker in a comment above it (see §7).
- The module keeps no capability `*.int.test.ts`. Its one integration test is
  `<module>.replay.int.test.ts`. Pure no-network `*.test.ts` may stay beside it.
- The module's labs playground page plays each scenario step by step.
- `pnpm exec vitest run src/modules/<module>` (in `packages/headless`) is green,
  traceability included. `pnpm exec tsc --noEmit -p .` is clean. Every blocking CI job
  passes (§9).

No workarounds, no hacks, no cheats. Done means done properly.

## 2. Read first (the law — cite it, do not restate it)

| File | Why |
| --- | --- |
| `docs/adr/035-one-scenario-one-recording.md` | The decision and Amendment 1 |
| `.claude/rules/code-tests.companion.md` §"Every answer is a recording" | The testing law in one page |
| `.claude/skills/factory/scenario/SKILL.md` D18–D25 | Replay spec, recorder, one scenario per capability, `@signed-out` |
| `tests/fixtures/README.md` | The recorder, the `--scenario` filter, identity rules |
| `.claude/skills/code-test-integration.companion.md` | The capture chain and its env/credential paths |

## 3. Reference implementations — copy the shape, not the content

| Module | Shows |
| --- | --- |
| `packages/headless/src/modules/client-email/__tests__/` | The canary. Recorder block, `recordStep`, `restoreStaging`, replay spec |
| `packages/headless/src/modules/contract-product/__tests__/` | Collection + manager (two scenario keys), `armBootStep`, `@signed-out`, staff-arranged states, `@todo` with verified blockers |
| `packages/headless/src/modules/contract/__tests__/` | A module whose status routing lives in the machine |
| `packages/headless/src/modules/invoices/__tests__/` | Retargeting (`.for(type, id)`), delegated access (AC-18) |

## 4. The layout

```text
packages/headless/src/modules/<module>/__tests__/
  <module>.feature                  the spec AND the playlist
  <module>.steps.ts                 the ONE step catalog
  <module>.fixtures.ts              the recorder (one describe per scenario, one it per step)
  <module>.replay.int.test.ts       the ONE integration test
  <module>.traceability.test.ts     every non-@todo scenario has a test, every test a scenario
  fixtures/*.json                   one-offs: pure unit tests + labs forced states only
  scenarios/<scenario-slug>/<NN>/*.json   one folder per step, Background first, 1-based
```

- A step that makes no request still has its folder, holding only `.gitkeep`.
- Folder names come ONLY from `scenarioSlug` / `stepKey` (`packages/headless/src/testing/fixtures.ts`)
  and `scenarioDir` / `stepFixturesDir` / `recordedStepDir` / `prepareScenarioDirs` /
  `stepDirDrift` (`packages/headless/src/testing/scenario-fixtures.ts`). Never build a path by hand.
- `__tests__/recordings/` (the old integration recording units) is rejected. Delete it
  when its scenarios are converted.

## 5. The conversion, in order

1. **Audit the `.feature`** (§6). Cut or rephrase display scenarios before you record anything.
2. **Recorder.** In `<module>.fixtures.ts`, add one `describe` per scenario, named with the
   scenario title verbatim, and one `it` per step, named with the step text verbatim.
   Each `it` calls a `recordStep(scenario, step, generator => …)` like `client-email`'s:
   `prepareScenarioDirs` once per scenario, then a `Generator` whose `recordingsDir` is
   `recordedStepDir(import.meta.dirname, feature, scenario, step)`. `recordedStepDir`
   throws on a title or step the feature does not hold — that is the drift guard.
3. **Arrange and restore.** The scenario arranges the staging state it states, uncaptured,
   and restores staging after (`afterAll(restoreStaging)`). A state the client cannot
   create is arranged with the staff token, recorded, then reset.
4. **Record ONE scenario at a time:**
   `pnpm fixtures:generate <module> --scenario "<exact scenario title>"`
   A bare `pnpm fixtures:generate <module>` re-records EVERY scenario and every fixture —
   hundreds of files. Do not run it unless you mean it.
5. **Replay spec.** Copy `contract-product.replay.int.test.ts`: `arrange` calls
   `startScenarioReplay(server)` (the wall), arms step 01 BEFORE the session seed (the
   seed's boot reads are answered by step 01), then `seedSessionFor(scenario, seedClientSession, …)`.
   `beforeStep` arms `replayStep(server, stepFixturesDir(...))`. `cleanup` resets the
   module's scopes and throws on the first capture gap. Keep the drift `describe`.
6. **Steps.** Every step fires a real action id off the booted composable, or reads a real
   published state. `() => Promise.resolve()` is a fake step. A step that acts on a record
   reads its id off the step recording that addressed it, never a copied literal.
7. **Run, fix, commit** — one scenario per commit (§10).
8. **Labs page.** Wire the module's playground page so each step draws the record that
   step booted (see commits `39fa06d0da`, `a5b9cc600e`, `c04cbb4952` for contract,
   contract-product, ticket). No module-specific labs tests — ever.
9. **Delete what the conversion replaces:** the old capability `*.int.test.ts`, the
   `recordings/` units, any `server.use(http.…)` handler a test wrote itself.
10. **Docs:** `pnpm --filter docs corpus:build && pnpm --filter docs corpus:emit` (§9).

## 6. What a scenario is — capability, never display

Operator ruling, 2026-09-29, for ALL modules. A headless module has no UI.

- A scenario tests a **capability**: an action, a guard, a transition or a state.
- A scenario never tests **display**: text, a reason, a label, a message, formatting, or
  which control is visible.
- Rephrase a display claim as the guard or state behind it — "I cannot ask to cancel while
  a pro-rata invoice is pending" — or cut it.
- No STAFF capabilities. The staff token only ARRANGES state.
- No third-party gateway flows, no backend arithmetic checks, no "the server fails"
  scenarios, no module-specific labs tests.
- Scenarios assert business outcomes from the recorded rows and totals — never a fixed
  count or a masked name from one capture run.
- Token and transport behaviour belong to `query` / `session-store` / `auth`. Tag those
  `@moved`, do not re-test them per module.
- One scenario per capability. A driven scenario plus a declarative twin is a duplicate.

## 7. `@todo` — the bar is high

- **WE MATCH LEGACY.** Before you call anything a blocker, find how the legacy app
  (`/Users/domdacosta/Dev/Upmind/vue-app`) reaches that state or that call. If legacy
  can, so can the recorder.
- **ALL writes to the staging API for fixtures are allowed.** "It writes to staging" is
  never a blocker. Arrange it, record it, restore it.
- A blocker names the exact request and the exact staging answer, verbatim. Example that
  passed review:
  > Staging refuses the import upload that puts a product in these states: legacy's
  > route `POST api/admin/import/files` answers 422 "Brand id required in organisation
  > mode!", with `brand_id` sent or not.
- Another that passed: "Only the platform's fraud engine sets `contract_fraud`: the staff
  fraud event sets the contract's fraud_status alone, and the manual-status route refuses
  the code (422 "Selected status is not allowed!")."
- Put a `@todo` row in its OWN `Scenario Outline` with the blocker comment above it, so
  the driven rows of the same outline stay driven.
- No `@todo` without the orchestrator's (or operator's) approval. A `@todo` must never be
  a silent skip in the steps or the recorder — the generator throws on missing state.

## 8. Gotchas (each one cost hours on FE-3145)

**Recording and replay**

- Replay identity (`tests/fixtures/fixture-naming.mjs` `fixtureIdentity`) ignores
  `limit`, `offset`, `order` and `with`. EXCEPTION: `limit=count` IS identity (a count
  read and a page read are different requests). So paging, sorting and filtering are
  separate STEPS with their own recordings — the latest armed step answers.
- Signed-in boot reads (brand settings, system, basket, the session's `/self`) are
  answered by the recordings of the modules that own them. If a test boots and hangs or
  throws an unhandled rejection, a brand/system boot read went unanswered — replay the
  owner's recordings in `beforeEach` (see `account.int.test.ts`, commit `baa90d3e01`).
- `@signed-out` scenarios seed NO client session: `seedSessionFor` leaves the guest
  session. The wall stays on, so an authenticated request fails by name.
- An editor is a SECOND scenario key in `replayFeature({ composables })`:
  `{ actor }` for a new record, `{ actor, context: { type, id } }` for an existing one.
  One contract, one machine: never retarget a live manager to another record.
- A step added to or removed from the `.feature` fails the drift check until you
  re-record that scenario. A REWORDED step is not caught by the folder check — re-record.
- `example.com` addresses are not masked. Do not treat them as PII leaks.

**Production code**

- A scenario that fails because the composable is wrong is a PRODUCTION bug. Fix the
  production code to match legacy; never loosen the step.
- Machine edits need the operator's approval first (`code-xstate.companion.md`). The
  approved shape for status routing: the load's `onDone` is an ordered conditional list,
  each guard reads `data.record` raw fields inline, each entry assigns the context, and
  the last entry has no guard (the unknown-status error). No `always` on `loading`, no
  extra `checking` node, no selector or helper that maps a value only to test it.
- Auth, account, session-store and scope code stay unchanged. Query changes only where
  approved.
- Brand settings: read with `useBrand`'s existing `ensure`/`use` and pass the key. Do not
  add a new getter.
- Reuse the shared product parsers (`useProductName`, `useUischemaTitle`) inside the
  module's own mapper, like `contract-product.mappers.ts` does. Do not re-derive them.

**Tooling**

- Typecheck with `pnpm exec tsc --noEmit -p .`. `npx tsc` fails silently on the npm
  devEngines check (EBADDEVENGINES) — a "clean" result from it is false.
- NEVER run `git stash` (or `stash pop`). The operator's own stash lives there. Commit
  instead.
- Stage files by explicit path. Never `git add -A` / `git add .` in the monorepo.
- Do not edit CI yaml without asking the operator.
- Never print credentials (`tests/fixtures/credentials.ts`, `packages/headless/.env.recording`).
- `vitest-serial-guard.sh` blocks parallel e2e runs only; unit/integration runs are fine.

## 9. CI — what goes red after a conversion, and the fix

| Job | Cause | Fix |
| --- | --- | --- |
| `gate:examples` / `gate:api-drift` / `gate:symbols` | Doc snippets or the corpus are stale after your source change | `pnpm --filter docs corpus:build`, fix any doc snippet the gate names, rerun the gate: `node docs/corpus/gates/gate-<name>.mjs` |
| `gate:authorship` (blocking) | `docs/published-docs` does not match what `corpus.json` emits | `pnpm --filter docs corpus:emit`, then commit the submodule |
| merge conflict in `docs/corpus/corpus.json` | Generated file — both sides rebuilt it | Take ours, `corpus:build`, `corpus:emit`, commit the submodule, then the merge. Never hand-merge it |
| cart staging build `TS6305` | `modules-*` dist missing | Already fixed on develop (`.gitlab-ci/cart.yml` artifacts) — merge develop |

**`docs/published-docs` is a submodule whose `main` is LIVE.** Commit it on `develop`
only (`git -C docs/published-docs branch --show-current` must print `develop`), push it,
then commit the new submodule pointer in the monorepo. A hook blocks commits to `main`.

Run all four gates locally before you push:

```bash
for g in examples api-drift symbols authorship; do
  node docs/corpus/gates/gate-$g.mjs >/dev/null 2>&1; echo "gate-$g=$?"
done
```

## 10. Working rules

- Commit each scenario as it goes green. Do not sit on 100+ uncommitted files.
- One prover per few scenarios. A fresh prover beats a long one that keeps stopping.
- Verify every `@todo` a seat raises yourself, against legacy and staging, before you
  accept it. Seats raise lazy blockers.
- After the scenarios pass, have `upmind-agent:pseudo-nathan` grade them: valid, needed,
  nothing missing, capability not display. It grades only; it does not author.
- After code changes, run `pnpm graph` (not `graphify update .`).
- Report to the operator in short plain lines. One decision per halt, with a
  recommended default and the verbatim evidence.
