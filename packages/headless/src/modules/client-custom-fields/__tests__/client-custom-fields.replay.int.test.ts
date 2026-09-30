// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/__tests__/client-custom-fields.replay.int.test
 * @description The co-located `client-custom-fields.feature`, REPLAYED through
 * the module's own step catalog against the real `useClientCustomFields()`
 * collection booted THROUGH THE BARREL — ONE scenario, ONE recording (FE-3145).
 * Each scenario plays its own `scenarios/<scenario>/` fixtures, step by step,
 * and nothing else: before each step, that step's recorded answers are armed. A
 * request no step of the scenario recorded fails the scenario by name. A
 * scenario no step drives is skipped by name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate client-custom-fields`, which
 * records every driven scenario against staging.
 *
 * The per-field IMAGE editor (`useClientCustomFieldImage`) is NOT a second
 * scenario key: its whole surface is a multipart upload the scenario Generator
 * cannot record and the World cannot hand a File across, so its capabilities are
 * `@todo` in the feature and no driven scenario boots it.
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
import { useClientCustomFields, useClientCustomFieldImage } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor } from "../../../testing/session-seed";
import {
  resetClientCustomFieldsScopes,
  seedClientSession,
  seedGuestSession
} from "./client-custom-fields.int-helpers";
import {
  CLIENT_CUSTOM_FIELDS_SCENARIO,
  CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO,
  CLIENT_CUSTOM_FIELD_IMAGE_2_SCENARIO,
  clientCustomFieldsSteps
} from "./client-custom-fields.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-custom-fields.feature"),
  "utf-8"
);

/**
 * Starts a scenario on its own recording: the module's shared fixtures are
 * dropped, and a real authenticated client session is seeded.
 */
let replay: ReturnType<typeof startScenarioReplay> | undefined;

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  if (!existsSync(scenarioDir(import.meta.dirname, scenario.name)))
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate client-custom-fields`
    );

  replay = startScenarioReplay(server);
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is only the
 * symptom.
 */
function cleanupScenario(scenario: FeatureScenario): void {
  resetClientCustomFieldsScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${scenario.name}" — ${gap}`);
}

/** Arms the answers THIS step recorded; a step that made no request has none. */
function armStep(scenario: FeatureScenario, index: number): void {
  replayStep(server, stepFixturesDir(import.meta.dirname, scenario, index));
}

// -----------------------------------------------------------------------------

/**
 * Every recorded scenario holds ONE folder per step, numbered in step order —
 * so a step added to or removed from the `.feature` fails here until the
 * scenario is recorded again.
 */
describe("client-custom-fields — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(clientCustomFieldsSteps);
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
  moduleName: "client-custom-fields",
  feature,
  catalog: clientCustomFieldsSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper.
    [CLIENT_CUSTOM_FIELDS_SCENARIO]:
      useClientCustomFields as unknown as NodeComposable,
    [CLIENT_CUSTOM_FIELD_IMAGE_SCENARIO]:
      useClientCustomFieldImage as unknown as NodeComposable,
    [CLIENT_CUSTOM_FIELD_IMAGE_2_SCENARIO]:
      useClientCustomFieldImage as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
