// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and the one built spec it
 * cites. Authority: ADR 035 (`docs/adr/035-one-scenario-one-recording.md`),
 * `packages/headless/src/testing/replay-feature.ts` (the `replayFeature`
 * contract) and `agent-seat-separation` (this file is the PROVER's). A
 * disagreement between the skeleton, the reference spec and the contract is a
 * surfaced finding, never silently resolved toward either.
 *
 * Emitted by the PROVER seat into
 * `packages/headless/src/modules/<module>/__tests__/`. ONE per module, beside
 * the ONE feature and the ONE catalog it replays.
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
import { useModules } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { resetModuleScopes, seedClientSession } from "./module.int-helpers";
import { MODULES_SCENARIO, modulesSteps } from "./module.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------
/**
 * @module module/__tests__/module.replay.int.test
 * @description The module's OWN `module.feature`, REPLAYED through its OWN
 * `module.steps.ts` against the REAL composable — ONE scenario, ONE recording
 * (ADR 035). Each scenario plays its own `scenarios/<scenario>/<NN>/` fixtures,
 * step by step, and nothing else: before each step, that step's recorded
 * answers are armed in front of the steps before it. A request no step of the
 * scenario recorded fails the scenario by name. A scenario no step drives is
 * skipped by name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate module`: the module's own
 * `module.fixtures.ts` records every scenario, one `describe` per scenario and
 * one `it` per step, named from this feature.
 *
 * ## What Breaks If These Fail
 * A fake step, a flag the composable does not publish, an action it does not
 * expose, or a module that now asks the API something its scenario never
 * recorded.
 *
 * @reference `packages/headless/src/modules/client-email/__tests__/` — the
 * canary pair, read while authoring this skeleton, never a match target.
 */

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "module.feature"),
  "utf-8"
);

let replay: ReturnType<typeof startScenarioReplay> | undefined;

/**
 * Starts a scenario on its own recording: the wall, then a real authenticated
 * session, whose boot reads the kit answers from their OWNERS' recordings.
 */
async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  if (!existsSync(scenarioDir(import.meta.dirname, scenario.name)))
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate module`
    );

  replay = startScenarioReplay(server);
  await seedClientSession();
}

/** Arms the answers THIS step recorded, in front of every step before it. */
function armStep(scenario: FeatureScenario, index: number): void {
  replayStep(server, stepFixturesDir(import.meta.dirname, scenario, index));
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, the check it broke the symptom.
 */
function cleanupScenario(scenario: FeatureScenario): void {
  resetModuleScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${scenario.name}" — ${gap}`);
}

// -----------------------------------------------------------------------------

/**
 * Every recorded scenario holds ONE folder per step, numbered in step order —
 * so a step added to or removed from the `.feature` fails here until the
 * scenario is recorded again.
 */
describe("module — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(modulesSteps);
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
  moduleName: "module",
  feature,
  catalog: modulesSteps,
  composables: {
    // The scenario key maps to the composable the feature's steps actually
    // DRIVE (D19). The scope builder types `.as()`/`.for()` narrowly to the
    // module's own actor×context matrix, so ONE widening cast at the seam
    // erases it to the structural shape the World boots — never loosen the
    // helper.
    [MODULES_SCENARIO]: useModules as unknown as NodeComposable
    // An editor is a SECOND key (D24). Its steps boot it `{ actor }` for a
    // new or aggregate record, `{ actor, context: { type, id } }` for an
    // existing one:
    //
    //   [MODULE_MANAGER_SCENARIO]:
    //     useModuleManager as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
