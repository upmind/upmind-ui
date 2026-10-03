// -----------------------------------------------------------------------------
/**
 * @module stats/__tests__/stats.replay
 * @description The co-located `stats.feature`, REPLAYED through the module's own
 * step catalog against the real `useStats` — ONE scenario, ONE recording
 * (FE-3145, ADR 035 Am.1). Each scenario plays its own `scenarios/<slug>/`
 * fixtures, step by step: before each step, that step's recorded answers are
 * armed. A request no step of the scenario recorded fails the scenario by name.
 * A scenario no step drives, or one tagged `@todo` / `@moved`, is skipped by
 * name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate stats`, which records every
 * driven scenario against staging. This module keeps no capability
 * `*.int.test.ts` — only this replay spec and the pure `stats.utils.test.ts`.
 *
 * The clock and the Upmind-host allowlist are frozen for the whole lane by
 * `setup.integration.ts` (`RECORDED_DATE` / `VITE_APP_UPMIND_HOSTNAMES`), so
 * every `date_to`-bound stat read and the host-gated usage read replay as they
 * were captured.
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
import { useStats } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor } from "../../../testing/session-seed";
import { server } from "./setup.integration";
import {
  armBootStep,
  resetStatsScopes,
  seedClientSession,
  seedGuestSession
} from "./stats.replay-helpers";
import { STATS_SCENARIO, statsSteps } from "./stats.steps";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "stats.feature"),
  "utf-8"
);

let replay: ReturnType<typeof startScenarioReplay> | undefined;

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  const signedOut = includes(scenario.tags, "@signed-out");
  if (
    !signedOut &&
    !existsSync(scenarioDir(import.meta.dirname, scenario.name))
  )
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate stats`
    );

  replay = startScenarioReplay(server);
  // Step 01 answers the seed's own boot reads when a scenario arranged a
  // distinct `/self`, so it is armed before the session is seeded, not after.
  armBootStep(stepFixturesDir(import.meta.dirname, scenario, 0));
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is the
 * symptom.
 */
function cleanupScenario(scenario: FeatureScenario): void {
  resetStatsScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${scenario?.name ?? "<scenario>"}" — ${gap}`);
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
describe("stats — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(statsSteps);
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
  moduleName: "stats",
  feature,
  catalog: statsSteps,
  composables: {
    // The scope builder types `.as()` narrowly to this module's own matrix;
    // `NodeComposable` is the erased structural shape the World boots. One
    // widening cast at the seam, never a loosening of the helper.
    [STATS_SCENARIO]: useStats as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
