// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/__tests__/client-personal-details.replay
 * @description The co-located `client-personal-details.feature`, REPLAYED through
 * the module's own step catalog against the real composable — ONE scenario, ONE
 * recording (FE-3145, ADR 035 + Amendment 1). Each scenario plays its own
 * `scenarios/<scenario>/` fixtures, step by step, and nothing else: before each
 * step, that step's recorded answers are armed. A request no step of the scenario
 * recorded fails the scenario by name. A `@todo` scenario is skipped by name.
 *
 * The recordings come from `pnpm fixtures:generate client-personal-details`,
 * which records every driven scenario against staging.
 *
 * ## What Breaks If These Fail
 * A fake step, a flag a composable does not publish, an action it does not
 * expose, or a module that now asks the API something its scenario never
 * recorded.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createStepMatcher,
  parseFeatureScenarios
} from "@upmind-automation/scenario-harness";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import { usePersonalDetails } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor, SIGNED_OUT_TAG } from "../../../testing/session-seed";
import {
  armBootStep,
  resetClientPersonalDetailsScopes,
  seedClientSession,
  seedGuestSession
} from "./client-personal-details.int-helpers";
import {
  arrangeState,
  CLIENT_PERSONAL_DETAILS_SCENARIO,
  clientPersonalDetailsSteps
} from "./client-personal-details.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-personal-details.feature"),
  "utf-8"
);

/**
 * Starts a scenario on its own recording: the module's shared fixtures are
 * dropped, and a real authenticated client session is seeded.
 */
let replay: ReturnType<typeof startScenarioReplay> | undefined;
let activeScenario = "";

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  activeScenario = scenario.name;
  const signedOut = includes(scenario.tags, SIGNED_OUT_TAG);
  arrangeState.errored = includes(scenario.tags, "@errored");
  if (
    !signedOut &&
    !existsSync(scenarioDir(import.meta.dirname, scenario.name))
  )
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate client-personal-details`
    );

  replay = startScenarioReplay(server);

  // Step 01 is every scenario's boot step — armed here, before
  // `seedClientSession` calls `initStore`, so a scenario carrying its own
  // reduced brand language list (AC-35) answers the boot's config read in
  // front of the shared permissive brand recordings.
  armBootStep(stepFixturesDir(import.meta.dirname, scenario, 0));
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is only the
 * symptom.
 */
function cleanupScenario(): void {
  resetClientPersonalDetailsScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${activeScenario}" — ${gap}`);
}

/** Arms the answers THIS step recorded; a step that made no request has none. */
function armStep(scenario: FeatureScenario, index: number): void {
  const dir = stepFixturesDir(import.meta.dirname, scenario, index);
  if (existsSync(dir)) replayStep(server, dir);
}

// -----------------------------------------------------------------------------

/**
 * Every recorded scenario holds ONE folder per step, numbered in step order —
 * so a step added to or removed from the `.feature` fails here until the
 * scenario is recorded again.
 */
describe("client-personal-details — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(clientPersonalDetailsSteps);
  const recorded = reject(
    parseFeatureScenarios(feature),
    ({ name, tags }) =>
      includes(tags, "@todo") ||
      !existsSync(scenarioDir(import.meta.dirname, name))
  );

  it("records at least one scenario", () => {
    expect(recorded).not.toHaveLength(0);
  });

  forEach(recorded, scenario => {
    it(`${scenario.name} — one folder per step`, () => {
      expect(stepDirDrift(import.meta.dirname, scenario)).toStrictEqual({
        missing: [],
        extra: []
      });
      expect(matcher.malformedStepDefs).toStrictEqual([]);
    });
  });
});

replayFeature({
  moduleName: "client-personal-details",
  feature,
  catalog: clientPersonalDetailsSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to the composable's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam. The one composable serves the
    // read and the editor under one key.
    [CLIENT_PERSONAL_DETAILS_SCENARIO]:
      usePersonalDetails as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
