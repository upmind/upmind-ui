// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/__tests__/client-billing-settings.replay
 * @description The co-located `client-billing-settings.feature`, REPLAYED
 * through the module's own step catalog against the real composable — ONE
 * scenario, ONE recording (FE-3145, ADR 035). Each scenario plays its own
 * `scenarios/<scenario>/` fixtures, step by step, and nothing else: before each
 * step, that step's recorded answers are armed. A request no step of the
 * scenario recorded fails the scenario by name. A `@todo` scenario is skipped
 * by name (spec-only, ADR-020 Am.5).
 *
 * The composable (`useBillingSettings`) is booted under this module's
 * one scenario key: it loads the record on entry, so a read capability and an
 * edit capability are both driven through it. The recordings come from
 * `pnpm fixtures:generate client-billing-settings`.
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
import { scenarioTiming } from "@upmind-automation/test-fixtures/fixture-handlers";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import { useBillingSettings } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import {
  armBootStep,
  resetClientBillingSettingsScopes,
  seedClientSession
} from "./client-billing-settings.int-helpers";
import {
  CLIENT_BILLING_SETTINGS_SCENARIO,
  clientBillingSettingsSteps
} from "./client-billing-settings.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-billing-settings.feature"),
  "utf-8"
);

let replay: ReturnType<typeof startScenarioReplay> | undefined;

/** Starts a scenario on its own recording, behind a real client session. */
async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  if (!existsSync(scenarioDir(import.meta.dirname, scenario.name)))
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate client-billing-settings`
    );

  replay = startScenarioReplay(server);

  armBootStep(stepFixturesDir(import.meta.dirname, scenario, 0));
  await seedClientSession();
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is only the
 * symptom.
 */
function cleanupScenario(scenario: FeatureScenario): void {
  resetClientBillingSettingsScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${scenario?.name ?? "scenario"}" — ${gap}`);
}

/** Arms the answers THIS step recorded; a step that made no request has none. */
function armStep(scenario: FeatureScenario, index: number): void {
  replayStep(
    server,
    stepFixturesDir(import.meta.dirname, scenario, index),
    scenarioTiming(scenario.tags)
  );
}

// -----------------------------------------------------------------------------

/**
 * Every recorded scenario holds ONE folder per step, numbered in step order —
 * so a step added to or removed from the `.feature` fails here until the
 * scenario is recorded again.
 */
describe("client-billing-settings — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(clientBillingSettingsSteps);
  const recorded = reject(
    parseFeatureScenarios(feature),
    ({ name, tags }) =>
      includes(tags, "@todo") ||
      includes(tags, "@moved") ||
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
  moduleName: "client-billing-settings",
  feature,
  catalog: clientBillingSettingsSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper.
    [CLIENT_BILLING_SETTINGS_SCENARIO]:
      useBillingSettings as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
