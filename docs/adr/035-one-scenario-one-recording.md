# ADR 035: One Scenario, One Recording

**Date:** September 2026
**Status:** Accepted 2026-09-23 (operator ruling, FE-3145). Amended 2026-09-24 — see [Amendments](#amendments). Built for the reference module (`client-email`); other modules open.
**Authors:** Dominic da Costa
**Related:**

- [ADR 025: Co-located Cross-Module Journey Units](./025-colocated-journey-units.md) — the self-contained, slug-keyed unit this ADR applies to a single module's scenarios.
- [ADR 020: Gherkin as Test Planning Spec](./020-gherkin-test-planning.md) — Amendment 5 makes a module's `.feature` the executed artefact; this ADR gives each of its scenarios a recording.
- [ADR 033: The Scenario Declaration Contract](./033-scenario-declaration-contract.md) — the playground page whose scenario bar plays these recordings.
- Linear: **FE-3145** — the ticket this decision was ruled on, including its scope change.

---

## Context

A module's recordings were produced by its `<module>.fixtures.ts` generator in the generator's own order, not by its `.feature` scenarios. Nothing linked a scenario step to the recording that answers it, so the shared replay (`tests/fixtures/corpus-replay.ts`) matched each live request against the whole corpus and, when no recording fitted, built an answer: it pooled rows across captures (`corpusRows`), re-applied the live request's filter, sort and limit (`servedCollection`), and edited recorded rows after each write (`createCorpusSession`). Scenario expectations were then written against those built answers — `client-email` stated "the collection holds 3 addresses" while its only list recording held one.

The build-an-answer design was defended as keeping replay from being "cosmetic" (`R7-4`). The operator ruling of 2026-09-23 rejects that: a forced state is a static picture, and a scenario is a recorded sequence played back verbatim.

## Decision

1. **A module scenario is a recording unit, keyed by its `.feature` title.** It follows the journey principles (ADR 025 — one self-contained, slug-keyed unit with its own recorded fixtures and its own replay) but lives in the module that owns it. Journeys stay for flows across modules.

2. **Layout.** `packages/headless/src/modules/<module>/__tests__/scenarios/<scenario-slug>/<NN>/*.json`. `<scenario-slug>` is `scenarioSlug(title)`; `<NN>` is `stepKey(index)`, the step's 1-based place, Background steps first. Every step has a folder; a step that makes no request holds only a `.gitkeep`. Both sides name folders only through `packages/headless/src/testing/fixtures.ts` (`scenarioSlug`, `stepKey`) and `packages/headless/src/testing/scenario-fixtures.ts` (`scenarioDir`, `stepFixturesDir`, `recordedStepDir`).

3. **Recording uses the module's existing generator.** `<module>.fixtures.ts` holds one `describe` per scenario and one `it` per step, named from the `.feature`, each writing through the existing `Generator` into `recordedStepDir(...)`. `prepareScenarioDirs` empties the scenario and lays out every step folder before its first step records. A scenario arranges the staging data its steps need and leaves staging as it found it.

4. **Replay is one request, one response.** The replay server's matching is unchanged; a step folder's fixtures are served by identity like any fixture directory. Before each step, that step's fixtures are armed in front of every step before it, so a request a later step did not record keeps the answer of the latest step that did. Anything no step recorded is a capture gap and fails.
   - Headless: `replayFeature`'s `arrange` calls `startScenarioReplay` (the wall only) and its `beforeStep` calls `replayStep(server, stepFixturesDir(...))` (`tests/fixtures/replay-server.ts`).
   - Labs: `useForcedState().arm("replay", scenario)` arms step `01` in front of `createScenarioWall()` over the module's own subject; the player calls `replayStep(index)` before each scene. A module with no `scenarios/` keeps its corpus replay until it is rebuilt.
   - The matching both sides use is one module, browser-safe: `tests/fixtures/fixture-handlers.ts` (`handlersFor`, `normalizeRecording`); `buildHandlers` is `handlersFor` over a directory.

5. **The recording must read as the `.feature` does.** A module's replay test asserts `stepDirDrift(...)` is empty for every recorded scenario — one folder per step, no more, no fewer.

6. **Scenarios assert outcomes a recording can hold.** No fixed counts and no masked names tied to one capture run. Steps read the record ids they act on from the step recording that addressed them, never a copied literal. Addresses on `example.com` are not masked (`redactValue`), matching the fixture lint's `isMasked`.

### Rejected

- Pooling rows, re-applying live criteria, and editing recorded rows after a write — each builds an answer staging never returned.
- Choosing a recording by a loosened match when no exact one exists (`narrowsAlike`) and hand-written filtered handlers (`installFilteredEmailsHandler`) — the same gap, guessed at.
- Counting repeated requests inside the replay server — the scenario's step order already says which answer comes next.
- A second recorder beside `Generator`, and step folders named by step text.

## Consequences

- `resolveCorpusRequest` serves the matched recording verbatim; the pooling and re-filter code is deleted.
- Each rebuilt module's scenarios fail loudly on drift, from either side: a new request the recording lacks, or a step added to or removed from the `.feature`. A reworded step is not caught by the folder check.
- Recordings are larger: a Background read is recorded once per scenario. Self-containment is the point.
- **Open:** remove `narrowsAlike`, `createCorpusSession`'s row edits and `installFilteredEmailsHandler`; update the factory templates, skills and rules to produce this shape; rebuild every other module the `client-email` way. Two replay tests in other modules (`client-company` AC-36, `invoices` "still narrows on a real row filter") depended on the deleted re-filter and fail until their modules are rebuilt.

## Amendments

### Amendment 1 (2026-09-24): Every capability is a driven scenario

Operator ruling 2026-09-24, FE-3145. It adds to Decision 1 and does not change it.

1. **Two kinds of recording, no third.** Fixtures are one-offs: flat `__tests__/fixtures/*.json`, one file per request, for pure unit tests and the labs forced states. Scenarios are multi-step flows: `__tests__/scenarios/<slug>/<NN>/`. A test that needs a sequence of requests IS a scenario. Integration recording units (`__tests__/recordings/`) are rejected.
2. **Every module capability is a driven `.feature` scenario.** A module keeps no capability `*.int.test.ts`; its one integration test is `<module>.replay.int.test.ts`. Token and transport behaviour belong to the `query`, `session-store` and `auth` modules, not to each module that uses them.
3. **One scenario per capability.** The driven scenario carries the capability's `@AC-N` tag. A capability that no scenario can drive keeps one declarative scenario, tagged `@todo` with its named blocker. A driven scenario and a declarative twin for the same capability is a duplicate.
4. **An editor is a second scenario key.** `replayFeature({ composables })` boots the module's manager beside its collection: `{ actor }` for a new record, `{ actor, context: { type, id } }` for an existing one. Reference: `client-email`.
