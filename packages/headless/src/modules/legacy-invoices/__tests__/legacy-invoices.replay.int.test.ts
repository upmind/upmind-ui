// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/__tests__/legacy-invoices.replay
 * @description The co-located `legacy-invoices.feature`, REPLAYED through the
 * module's own step catalog against BOTH cells — the `useLegacyInvoices`
 * collection and the `useLegacyInvoice` single read (wired below) — ONE scenario,
 * ONE recording (FE-3145, ADR 035 Am.1). Each scenario plays its own
 * `scenarios/<slug>/` fixtures, step by step: before each step, that step's
 * recorded answers are armed. A request no step of the scenario recorded fails
 * the scenario by name. A scenario no step drives, or one tagged `@todo` /
 * `@moved`, is skipped by name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate legacy-invoices`, which
 * records every driven scenario against staging. The single-read scenarios
 * (open / absent / paid / overdue / download) are driven here off the single
 * read; this module keeps no capability `*.int.test.ts` — only this replay spec.
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
import { useLegacyInvoice, useLegacyInvoices } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor } from "../../../testing/session-seed";
import {
  armBootStep,
  resetLegacyInvoiceScopes,
  seedClientSession,
  seedGuestSession
} from "./legacy-invoices.replay-helpers";
import {
  LEGACY_INVOICES_SCENARIO,
  LEGACY_INVOICE_SCENARIO,
  legacyInvoicesSteps
} from "./legacy-invoices.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "legacy-invoices.feature"),
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
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate legacy-invoices`
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
  resetLegacyInvoiceScopes();

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
describe("legacy-invoices — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(legacyInvoicesSteps);
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
  moduleName: "legacy-invoices",
  feature,
  catalog: legacyInvoicesSteps,
  composables: {
    // Two cells: the COLLECTION (`useLegacyInvoices`) and the single read
    // (`useLegacyInvoice`, booted by `.withId(id)`). The scope builder types
    // `.as()` narrowly to this module's own matrix; `NodeComposable` is the
    // erased structural shape the World boots. One widening cast per cell at the
    // seam, never a loosening of the helper.
    [LEGACY_INVOICES_SCENARIO]: useLegacyInvoices as unknown as NodeComposable,
    [LEGACY_INVOICE_SCENARIO]: useLegacyInvoice as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
