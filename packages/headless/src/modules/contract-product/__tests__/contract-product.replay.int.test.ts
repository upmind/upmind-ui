// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.replay
 * @description The co-located `contract-product.feature`, REPLAYED through the
 * module's own step catalog against the real `useContractProducts` (collection)
 * and `useContractProduct` (manager) — ONE scenario, ONE recording (FE-3145,
 * ADR 035 Am.1). Each scenario plays its own `scenarios/<slug>/` fixtures, step
 * by step: before each step, that step's recorded answers are armed. A request
 * no step of the scenario recorded fails the scenario by name. A scenario no
 * step drives is skipped by name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate contract-product`, which
 * records every driven scenario against staging.
 *
 * ## What Breaks If These Fail
 * A fake step, a flag the composable does not publish, an action it does not
 * expose, or a module that now asks the API something its scenario never
 * recorded.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  createStepMatcher,
  parseFeatureScenarios
} from "@upmind-automation/scenario-harness";
import {
  replayStep,
  startScenarioReplay
} from "@upmind-automation/test-fixtures/replay-server";
import { useContractProduct, useContractProducts } from "..";
import {
  observeRequestBodies,
  observeRequests
} from "../../../__tests__/criteria-int-kit";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor } from "../../../testing/session-seed";
import {
  armBootStep,
  resetContractProductScopes,
  seedClientSession,
  seedGuestSession
} from "./contract-product.int-helpers";
import {
  CONTRACT_PRODUCTS_SCENARIO,
  CONTRACT_PRODUCT_SCENARIO,
  contractProductSteps
} from "./contract-product.steps";
import { closeWire, openWire } from "./contract-product.wire";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "contract-product.feature"),
  "utf-8"
);

let replay: ReturnType<typeof startScenarioReplay> | undefined;

/**
 * The earliest `captured_at` across a scenario's step recordings — the instant
 * the scenario was recorded against staging. Replaying under this clock keeps
 * every now-relative read (AC-22's earliest-cancellation-date, which the module
 * derives from the product's next-due date and the current date) reading as it
 * did at capture, so the suite is deterministic on any calendar date.
 */
function recordedInstant(scenario: FeatureScenario): Date | undefined {
  const root = scenarioDir(import.meta.dirname, scenario.name);
  if (!existsSync(root)) return undefined;

  let earliest: number | undefined;
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!entry.name.endsWith(".json")) continue;
      const { captured_at } = JSON.parse(readFileSync(path, "utf-8")) as {
        captured_at?: string;
      };
      const ms = captured_at ? Date.parse(captured_at) : NaN;
      if (!Number.isNaN(ms) && (earliest === undefined || ms < earliest))
        earliest = ms;
    }
  };
  walk(root);

  return earliest === undefined ? undefined : new Date(earliest);
}

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  const signedOut = includes(scenario.tags, "@signed-out");
  if (
    !signedOut &&
    !existsSync(scenarioDir(import.meta.dirname, scenario.name))
  )
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate contract-product`
    );

  const instant = signedOut ? undefined : recordedInstant(scenario);
  if (instant) vi.useFakeTimers({ toFake: ["Date"], now: instant });

  replay = startScenarioReplay(server);
  openWire(
    scenario.name,
    observeRequests(server, "/api/"),
    observeRequestBodies(server, "/change")
  );
  // Step 01 answers the seed's own boot reads (brand settings, the session's
  // `/self`), so it is armed before the session is seeded, not after.
  armBootStep(stepFixturesDir(import.meta.dirname, scenario, 0));
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is the
 * symptom.
 */
function cleanupScenario(scenario: FeatureScenario): void {
  vi.useRealTimers();
  resetContractProductScopes();
  closeWire();

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
describe("contract-product — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(contractProductSteps);
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
  moduleName: "contract-product",
  feature,
  catalog: contractProductSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to each composable's own
    // matrix; `NodeComposable` is the erased shape the World boots. One widening
    // cast at the seam, never a loosening of the helper.
    [CONTRACT_PRODUCTS_SCENARIO]:
      useContractProducts as unknown as NodeComposable,
    [CONTRACT_PRODUCT_SCENARIO]: useContractProduct as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
