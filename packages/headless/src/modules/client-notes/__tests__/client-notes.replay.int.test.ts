// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.replay
 * @description The co-located `client-notes.feature`, REPLAYED through the
 * module's own step catalog against the real composable — ONE scenario, ONE
 * recording (FE-3145, ADR 035). Each scenario plays its own `scenarios/<slug>/`
 * fixtures, step by step, and nothing else: before each step, that step's
 * recorded answers are armed. A request no step of the scenario recorded fails
 * the scenario by name. A scenario no step drives is skipped by name (spec-only,
 * ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate client-notes`, which records
 * every scenario against staging.
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
import { useClientNoteManager, useClientNotes } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor } from "../../../testing/session-seed";
import {
  resetClientNoteScopes,
  seedClientSession,
  seedGuestSession
} from "./client-notes.int-helpers";
import {
  CLIENT_NOTE_MANAGER_SCENARIO,
  CLIENT_NOTES_SCENARIO,
  clientNotesSteps
} from "./client-notes.steps";
import { server } from "./setup.integration";
import { includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-notes.feature"),
  "utf-8"
);

/**
 * Starts a scenario on its own recording: the module's shared fixtures are
 * dropped, the owner boot recordings are armed, and a real authenticated client
 * session is seeded.
 */
let replay: ReturnType<typeof startScenarioReplay> | undefined;
let currentScenario = "";

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  currentScenario = scenario.name;
  if (!existsSync(scenarioDir(import.meta.dirname, scenario.name)))
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate client-notes`
    );

  replay = startScenarioReplay(server);
  // The @vault-gate scenario (AC-14) records its own accumulated-key gate read
  // (allow_vault:false) in its "I look at my vault" step, armed by armStep like
  // any other step — no bundle arming here.
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is only the
 * symptom. The scenario name is captured in `arrange`, because the failure path
 * (a hang, a thrown step) calls cleanup without it.
 */
function cleanupScenario(): void {
  resetClientNoteScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${currentScenario}" — ${gap}`);
}

/**
 * Arms the answers THIS step recorded; a step that made no request has none.
 * A `@held-brand` scenario (AC-33) has its brand-config answer HELD by `delayMs`
 * so the boot observes the vault waiting on its brand settings, not prematurely
 * unavailable — the hold is keyed by the scenario tag, never by step text.
 */
function armStep(scenario: FeatureScenario, index: number): void {
  const dir = stepFixturesDir(import.meta.dirname, scenario, index);
  if (!existsSync(dir)) return;
  const heldBrand = includes(scenario.tags, "@held-brand");
  replayStep(
    server,
    dir,
    heldBrand
      ? {
          delayMs: (request: Request) =>
            /config\/brand\/values/.test(request.url) ? 1500 : 0
        }
      : undefined
  );
}

// -----------------------------------------------------------------------------

/**
 * Each driven scenario is proven here with an EXPLICIT, literal `AC-<n>` test
 * title — the form the traceability gate scans source for — so this replay file
 * is the proving test a driven scenario replaces its old integration test with,
 * without coverage falling (operator ruling 2026-09-24). Each asserts its
 * scenario is recorded and holds one folder per step; `replayFeature` below then
 * drives it against those steps.
 */
describe("client-notes — each driven scenario replays its own per-step recording", () => {
  const matcher = createStepMatcher(clientNotesSteps);
  const byName = new Map(
    parseFeatureScenarios(feature).map(scenario => [scenario.name, scenario])
  );

  function provesRecorded(name: string): void {
    const scenario = byName.get(name);
    expect(
      scenario,
      `scenario "${name}" is missing from the feature`
    ).toBeDefined();
    expect(existsSync(scenarioDir(import.meta.dirname, name))).toBe(true);
    expect(stepDirDrift(import.meta.dirname, scenario!)).toStrictEqual({
      missing: [],
      extra: []
    });
  }

  it("records at least one scenario with no malformed step", () => {
    const recorded = reject(
      parseFeatureScenarios(feature),
      ({ name, tags }) =>
        includes(tags, "@todo") ||
        !existsSync(scenarioDir(import.meta.dirname, name))
    );
    expect(recorded).not.toHaveLength(0);
    expect(matcher.malformedStepDefs).toStrictEqual([]);
  });

  it("AC-1 — Read my own vault", () => provesRecorded("Read my own vault"));
  it("AC-3 — Narrow my vault by label", () =>
    provesRecorded("Narrow my vault by label"));
  it("AC-4 — Narrow my vault to pinned or unpinned assets", () =>
    provesRecorded("Narrow my vault to pinned or unpinned assets"));
  it("AC-7 — Order my vault by a column I choose", () =>
    provesRecorded("Order my vault by a column I choose"));
  it("AC-11 — Reveal one of my secrets, hide it again, and reveal it once more", () =>
    provesRecorded(
      "Reveal one of my secrets, hide it again, and reveal it once more"
    ));
  it("AC-16 — Know whether my vault is loading, empty, or errored", () =>
    provesRecorded("Know whether my vault is loading, empty, or errored"));
  it("AC-14 — My vault is unavailable when my brand switches it off", () =>
    provesRecorded("My vault is unavailable when my brand switches it off"));
  it("AC-2 AC-31 — I show only my notes, or only my secrets", () =>
    provesRecorded("I show only my notes, or only my secrets"));
  it("AC-5 — Narrow my vault to one product I bought", () =>
    provesRecorded("Narrow my vault to one product I bought"));
  it("AC-42 — I can narrow my vault to one of my products", () =>
    provesRecorded("I can narrow my vault to one of my products"));
  it("AC-6 — Read my vault a page at a time", () =>
    provesRecorded("Read my vault a page at a time"));
  it("AC-30 — Every way I can sort my vault actually sorts it", () =>
    provesRecorded("Every way I can sort my vault actually sorts it"));
  it("AC-8 — Pin and unpin an asset from my vault list", () =>
    provesRecorded("Pin and unpin an asset from my vault list"));
  it("AC-9 — Delete an asset from my vault list", () =>
    provesRecorded("Delete an asset from my vault list"));
  it("AC-10 — Turn one of my notes into a secret, and a secret back into a note", () =>
    provesRecorded(
      "Turn one of my notes into a secret, and a secret back into a note"
    ));
  it("AC-18 — Open one of my secrets for editing and see its real value", () =>
    provesRecorded(
      "Open one of my secrets for editing and see its real value"
    ));
  it("AC-25 — Know the state of the editor while I use it", () =>
    provesRecorded("Know the state of the editor while I use it"));
  it("AC-35 — Clearing the editor gives me a blank note, not the one I was editing", () =>
    provesRecorded(
      "Clearing the editor gives me a blank note, not the one I was editing"
    ));
  it("AC-19 AC-20 — I write a new note, or a new secret", () =>
    provesRecorded("I write a new note, or a new secret"));
  it("AC-21 — Change one of my existing vault assets", () =>
    provesRecorded("Change one of my existing vault assets"));
  it("AC-22 AC-41 — I attach one of my notes to a product I bought, and detach it", () =>
    provesRecorded(
      "I attach one of my notes to a product I bought, and detach it"
    ));
  it("AC-23 — Turn an unlabelled note into a secret by giving it a label", () =>
    provesRecorded(
      "Turn an unlabelled note into a secret by giving it a label"
    ));
  it("AC-24 — The form asks me for a label only when I am writing a secret", () =>
    provesRecorded(
      "The form asks me for a label only when I am writing a secret"
    ));
  it("AC-36 — What I wrote is still there when I come back to it", () =>
    provesRecorded("What I wrote is still there when I come back to it"));
  it("AC-17 — My vault never hangs waiting for a client that will not arrive", () =>
    provesRecorded(
      "My vault never hangs waiting for a client that will not arrive"
    ));
  it("AC-32 AC-34 — My vault reveals nothing to me once I am signed out", () =>
    provesRecorded("My vault reveals nothing to me once I am signed out"));
  it("AC-43 — The editor holds no secret of mine once I am signed out", () =>
    provesRecorded("The editor holds no secret of mine once I am signed out"));
  it("AC-33 — My vault waits for my brand's own settings before saying it is not ready", () =>
    provesRecorded(
      "My vault waits for my brand's own settings before saying it is not ready"
    ));
  it("AC-26 — What I save in the editor is my last edit, and my vault list shows it", () =>
    provesRecorded(
      "What I save in the editor is my last edit, and my vault list shows it"
    ));
  it("AC-27 — Everything I do acts on my own vault, as me", () =>
    provesRecorded("Everything I do acts on my own vault, as me"));
  it("AC-37 — The editor only offers me fields it will actually save", () =>
    provesRecorded("The editor only offers me fields it will actually save"));
});

replayFeature({
  moduleName: "client-notes",
  feature,
  catalog: clientNotesSteps,
  composables: {
    // The scope builder types `.as()`/`.for()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper.
    [CLIENT_NOTES_SCENARIO]: useClientNotes as unknown as NodeComposable,
    // The editor is a second scenario key: the manager composable boots beside
    // the collection, on an existing record via the `.for()` context path.
    [CLIENT_NOTE_MANAGER_SCENARIO]:
      useClientNoteManager as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
