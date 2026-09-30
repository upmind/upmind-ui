// -----------------------------------------------------------------------------
/**
 * @module tickets/__tests__/tickets.replay
 * @description The co-located `tickets.feature`, REPLAYED through the
 * module's own step catalog against the real composables — ONE scenario, ONE
 * recording (FE-3145, ADR 035 Am.1). Both scenario keys are served: the
 * COLLECTION (`useTickets`, the `tickets` key) and the MANAGER (`useTicket`,
 * the `ticket` key, booted by a literal id — `WorldScope.id` resolves to
 * `.as(actor).withId(id)`, the same boot shape `invoices.steps.ts` uses for
 * its own `.withId(id)` detail read). Each scenario plays its own
 * `scenarios/<scenario>/` fixtures, step by step: before each step, that
 * step's recorded answers are armed. A request no step of the scenario
 * recorded fails the scenario by name. A scenario no step drives is skipped
 * by name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate tickets`, which records
 * every driven scenario against staging.
 *
 * ## What is still NOT recorded here, and why (disclosed, not laundered)
 *
 * - **Two-argument writes** (`editMessage(id, body)`, `deleteMessage(id,
 *   reason)`, `deleteAttachment(messageId, fileId)`, `reply(body, {files})`)
 *   and the file-upload flows (`uploadFile(file: File)`, needing a real
 *   `File` a step may not author) — `World.fire(actionId, input?)` invokes an
 *   action with exactly ONE opaque input. AC-17 (files/conflict), AC-18,
 *   AC-19, AC-20, AC-21, AC-23 (all four). Stays proven by
 *   `tickets.manager.int.test.ts` / `tickets.upload-attachment.int.test.ts`.
 * - **The locked guards** (AC-24/AC-27 `@guard`) need a recorded LOCKED
 *   ticket; no client-facing action locks one on this staging brand, and
 *   hand-editing a recorded body's `settings.lock` is the fabrication ADR 035
 *   forbids. Stays proven by `tickets.manager.int.test.ts`.
 * - **The status-log feed** (AC-22), **the poll** (AC-29, all four), **the
 *   path law** (AC-PATH), **the overview list** (AC-8, no covered action),
 *   **create-with-product/scheduled** (AC-9, brand disables send-later —
 *   verified live this run) and the **dropped capabilities** (AC-6 body
 *   search, AC-26, AC-28) are request-shape/absence/feed-order assertions
 *   `World.fire`/`expectMeta` cannot observe. Stay proven by
 *   `tickets.manager.int.test.ts` / `tickets.collection.int.test.ts` /
 *   `tickets.dropped.int.test.ts`.
 *
 * Not every capability is a driven scenario yet, so the capability
 * `*.int.test.ts` files stay (ADR 035 Am.1 clause 2 applies once the LAST one
 * closes, not before).
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
import { useTicket, useTickets } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { resetTicketsScopes, seedClientSession } from "./tickets.int-helpers";
import {
  TICKETS_SCENARIO,
  TICKET_SCENARIO,
  ticketsSteps
} from "./tickets.steps";
import { server } from "./setup.integration";
import { forEach, includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "tickets.feature"),
  "utf-8"
);

/**
 * Starts a scenario on its own recording: the module's scopes are evicted,
 * and a real authenticated client session is seeded.
 */
let replay: ReturnType<typeof startScenarioReplay> | undefined;

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  if (!existsSync(scenarioDir(import.meta.dirname, scenario.name)))
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate tickets`
    );

  replay = startScenarioReplay(server);
  await seedClientSession();
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is only
 * the symptom.
 */
function cleanupScenario(scenario: FeatureScenario): void {
  void resetTicketsScopes();

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
describe("tickets — each recording reads one for one as its scenario", () => {
  const matcher = createStepMatcher(ticketsSteps);
  const recorded = reject(
    parseFeatureScenarios(feature),
    ({ name, tags }) =>
      includes(tags, "@todo") ||
      includes(tags, "@dropped") ||
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
  moduleName: "tickets",
  feature,
  catalog: ticketsSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper.
    [TICKETS_SCENARIO]: useTickets as unknown as NodeComposable,
    [TICKET_SCENARIO]: useTicket as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
