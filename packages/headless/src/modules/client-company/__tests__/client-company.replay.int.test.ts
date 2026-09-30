// -----------------------------------------------------------------------------
/**
 * @module client-company/__tests__/client-company.replay
 * @description The co-located `client-company.feature`, REPLAYED through the
 * module's own step catalog against the real composable — ONE scenario, ONE
 * recording (FE-3145, ADR 035). Each driveable scenario plays its own
 * `scenarios/<scenario>/` fixtures, step by step, and nothing else: before each
 * step, that step's recorded answers are armed. A request no step of the
 * scenario recorded fails the scenario by name. A scenario no step drives is
 * skipped by name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate client-company`, which
 * records every driven scenario against staging.
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
import { useClientCompanies, useClientCompanyManager } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor } from "../../../testing/session-seed";
import {
  resetClientCompanyScopes,
  seedClientSession,
  seedGuestSession
} from "./client-company.int-helpers";
import {
  clientCompaniesSteps,
  CLIENT_COMPANIES_SCENARIO,
  CLIENT_COMPANY_MANAGER_SCENARIO
} from "./client-company.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-company.feature"),
  "utf-8"
);

let replay: ReturnType<typeof startScenarioReplay> | undefined;

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  if (!existsSync(scenarioDir(import.meta.dirname, scenario.name)))
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate client-company`
    );

  replay = startScenarioReplay(server);
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

function cleanupScenario(scenario: FeatureScenario): void {
  resetClientCompanyScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${scenario?.name ?? "scenario"}" — ${gap}`);
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
describe("client-company — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(clientCompaniesSteps);
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
  moduleName: "client-company",
  feature,
  catalog: clientCompaniesSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to each composable's
    // own actor×context matrix; `NodeComposable` is the erased structural shape
    // the World boots. One widening cast per seam, never a loosening of the
    // helper. Both surfaces are booted: the collection under its key, the form
    // editor under its own (a scenario boots the one it drives).
    [CLIENT_COMPANIES_SCENARIO]:
      useClientCompanies as unknown as NodeComposable,
    [CLIENT_COMPANY_MANAGER_SCENARIO]:
      useClientCompanyManager as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
