// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the colocated feature, replayed
 *
 * ## Job To Be Done
 * Run the module's own `orders.feature` through its own
 * `orders.steps.ts`, against the real `useOrders()` collection
 * booted through the barrel, over this module's recorded corpus. The boot, the
 * default list and the page walk are answered by the flat corpus (the design
 * 8.8 captures); a criteria-writing scenario arms its own per-step recordings
 * (FE-3145) on top for the combined-criteria reads the flat corpus does not
 * hold. The six design 8.12 scenarios run. Every other scenario carries a
 * phrase the catalog does not define, so `replayFeature` skips it: a SKIP is a
 * spec-only contract scenario, proven by its sibling spec.
 *
 * ## What Breaks If These Fail
 * A step names a flag the collection does not publish, fires an action id it
 * does not own, or asserts a model the recorded corpus never reaches — so the
 * labs-nuxt `bdd` project would fail on the page before anyone saw why.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createStepMatcher,
  parseFeatureScenarios
} from "@upmind-automation/scenario-harness";
import { replayStep } from "@upmind-automation/test-fixtures/replay-server";
import { useOrders } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { resetOrderScopes, seedClientSession } from "./orders.int-helpers";
import { ORDERS_SCENARIO, ordersSteps } from "./orders.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "orders.feature"),
  "utf-8"
);

async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("orders"));
}

/** Arms the answers THIS step recorded; a step that made no request has none. */
function armStep(scenario: FeatureScenario, index: number): void {
  const dir = stepFixturesDir(import.meta.dirname, scenario, index);
  if (existsSync(dir)) replayStep(server, dir);
}

// -----------------------------------------------------------------------------

describe("orders — each per-step recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(ordersSteps);
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
  moduleName: "orders",
  feature,
  catalog: ordersSteps,
  composables: {
    [ORDERS_SCENARIO]: useOrders as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  beforeStep: armStep,
  cleanup: resetOrderScopes,
  timeoutMs: 60000
});
