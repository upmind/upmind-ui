// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.replay
 * @description The co-located `client-email-history.feature`, REPLAYED through
 * the module's own step catalog against the real collection composable — ONE
 * scenario, ONE recording (FE-3145, ADR 035). Each scenario plays its own
 * `scenarios/<scenario>/` fixtures, step by step, and nothing else: before each
 * step, that step's recorded answers are armed. A request no step of the
 * scenario recorded fails the scenario by name. A scenario no step drives is
 * skipped by name (spec-only, ADR-020 Am.5) — including the single-read and the
 * `@todo` / `@moved` capabilities, which carry no steps.
 *
 * The recordings come from `pnpm fixtures:generate client-email-history`, which
 * records every driveable scenario against staging.
 *
 * ## What Breaks If These Fail
 * A fake step, a flag the collection does not publish, an action it does not
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
import { useClientReceivedEmail, useClientReceivedEmails } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import {
  resetClientEmailHistoryScopes,
  seedClientSession,
  seedGuestSession
} from "./client-email-history.int-helpers";
import { seedSessionFor, SIGNED_OUT_TAG } from "../../../testing/session-seed";
import {
  arrangeState,
  CLIENT_EMAIL_HISTORY_SCENARIO,
  CLIENT_RECEIVED_EMAIL_SCENARIO,
  clientEmailHistorySteps
} from "./client-email-history.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-email-history.feature"),
  "utf-8"
);

/**
 * Starts a scenario on its own recording: the module's shared fixtures are
 * dropped, and a real authenticated client session is seeded.
 */
let replay: ReturnType<typeof startScenarioReplay> | undefined;
let currentScenario = "";

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  currentScenario = scenario.name;
  const signedOut = includes(scenario.tags, SIGNED_OUT_TAG);
  arrangeState.errored = includes(scenario.tags, "@errored");
  if (
    !signedOut &&
    !existsSync(scenarioDir(import.meta.dirname, scenario.name))
  )
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate client-email-history`
    );

  replay = startScenarioReplay(server);
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is only the
 * symptom. The scenario name is captured in `arrange`, because the failure path
 * calls cleanup without it.
 */
function cleanupScenario(): void {
  resetClientEmailHistoryScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${currentScenario}" — ${gap}`);
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
describe("client-email-history — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(clientEmailHistorySteps);
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
  moduleName: "client-email-history",
  feature,
  catalog: clientEmailHistorySteps,
  composables: {
    // The scope builder types `.as()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper.
    [CLIENT_EMAIL_HISTORY_SCENARIO]:
      useClientReceivedEmails as unknown as NodeComposable,
    [CLIENT_RECEIVED_EMAIL_SCENARIO]:
      useClientReceivedEmail as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
