// -----------------------------------------------------------------------------
/**
 * @module contract/__tests__/contract.replay
 * @description The co-located `contract.feature`, REPLAYED through the module's
 * own step catalog against the real `useContracts` and `useContract` — ONE
 * scenario, ONE recording (FE-3145, ADR 035 + Am.1). Each scenario plays its own
 * `scenarios/<slug>/` fixtures, step by step: before each step, that step's
 * recorded answers are armed. A request no step of the scenario recorded fails
 * the scenario by name. A `@todo` scenario is skipped by name.
 *
 * Every recorded write is answered after {@link HELD_WRITE_MS}, the same for
 * every step, so a step can read the window before a change lands.
 *
 * The recordings come from `pnpm fixtures:generate contract`.
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
import { useContract, useContracts } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor, SIGNED_OUT_TAG } from "../../../testing/session-seed";
import {
  resetContractScopes,
  seedClientSession,
  seedGuestSession
} from "./contract.int-helpers";
import {
  CONTRACTS_SCENARIO,
  CONTRACT_SCENARIO,
  contractSteps
} from "./contract.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "contract.feature"),
  "utf-8"
);

/** How long every recorded write is held before its answer is served. */
const HELD_WRITE_MS = 400;

const heldWrites = {
  delayMs: (request: Request): number =>
    request.method === "GET" ? 0 : HELD_WRITE_MS
};

let replay: ReturnType<typeof startScenarioReplay> | undefined;
let currentScenario = "";

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  currentScenario = scenario.name;
  const signedOut = includes(scenario.tags, SIGNED_OUT_TAG);
  if (
    !signedOut &&
    !existsSync(scenarioDir(import.meta.dirname, scenario.name))
  )
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate contract`
    );

  replay = startScenarioReplay(server);
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is only the
 * symptom.
 */
function cleanupScenario(): void {
  resetContractScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${currentScenario}" — ${gap}`);
}

/** Arms the answers THIS step recorded; a step that made no request has none. */
function armStep(scenario: FeatureScenario, index: number): void {
  const dir = stepFixturesDir(import.meta.dirname, scenario, index);
  if (existsSync(dir)) replayStep(server, dir, heldWrites);
}

// -----------------------------------------------------------------------------

/**
 * Every recorded scenario holds ONE folder per step, numbered in step order —
 * so a step added to or removed from the `.feature` fails here until the
 * scenario is recorded again.
 */
describe("contract — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(contractSteps);
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
  moduleName: "contract",
  feature,
  catalog: contractSteps,
  composables: {
    // The scope builder types `.as()`/`.withId()` narrowly to each composable's
    // own matrix; `NodeComposable` is the erased shape the World boots.
    [CONTRACTS_SCENARIO]: useContracts as unknown as NodeComposable,
    [CONTRACT_SCENARIO]: useContract as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
