// -----------------------------------------------------------------------------
/**
 * @module client-address/__tests__/client-address.replay
 * @description The co-located `client-address.feature`, REPLAYED through the
 * module's own step catalog against the real composable — ONE scenario, ONE
 * recording (FE-3145, ADR 035). Each driven scenario plays its own
 * `scenarios/<scenario>/` fixtures, step by step, and nothing else: before each
 * step, that step's recorded answers are armed. A request no step of the
 * scenario recorded fails the scenario by name. A scenario no step drives is
 * skipped by name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate client-address`, which records
 * every driven scenario against staging.
 *
 * ## What Breaks If These Fail
 * A fake step, a flag the composable does not publish, an action it does not
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
import { useClientAddressManager, useClientAddresses } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor } from "../../../testing/session-seed";
import {
  armBootStep,
  resetClientAddressScopes,
  seedClientSession,
  seedGuestSession
} from "./client-address.int-helpers";
import {
  CLIENT_ADDRESSES_SCENARIO,
  CLIENT_ADDRESS_MANAGER_SCENARIO,
  clientAddressesSteps
} from "./client-address.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-address.feature"),
  "utf-8"
);

let replay: ReturnType<typeof startScenarioReplay> | undefined;

/** Starts a scenario on its own recording, behind a real client session. */
async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  const signedOut = includes(scenario.tags, "@signed-out");
  if (
    !signedOut &&
    !existsSync(scenarioDir(import.meta.dirname, scenario.name))
  )
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate client-address`
    );

  replay = startScenarioReplay(server);

  // Step 01 is every scenario's boot step — armed here, before
  // `seedClientSession` calls `initStore`, so a scenario carrying its own
  // forbidding brand read (AC-20/AC-21) answers the boot's config read in
  // front of the shared permissive brand recordings.
  armBootStep(stepFixturesDir(import.meta.dirname, scenario, 0));
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, the check it broke only the symptom.
 */
function cleanupScenario(scenario?: FeatureScenario): void {
  resetClientAddressScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${scenario?.name ?? "scenario"}" — ${gap}`);
}

/** Arms the answers THIS step recorded; a step that made no request has none. */
function armStep(scenario: FeatureScenario, index: number): void {
  const dir = stepFixturesDir(import.meta.dirname, scenario, index);
  if (existsSync(dir)) replayStep(server, dir);
}

// -----------------------------------------------------------------------------

/**
 * Every recorded scenario holds ONE folder per step, numbered in step order — so
 * a step added to or removed from the `.feature` fails here until the scenario is
 * recorded again.
 */
describe("client-address — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(clientAddressesSteps);
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
  moduleName: "client-address",
  feature,
  catalog: clientAddressesSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the helper.
    [CLIENT_ADDRESSES_SCENARIO]:
      useClientAddresses as unknown as NodeComposable,
    [CLIENT_ADDRESS_MANAGER_SCENARIO]:
      useClientAddressManager as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
