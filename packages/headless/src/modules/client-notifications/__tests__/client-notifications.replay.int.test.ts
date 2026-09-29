// -----------------------------------------------------------------------------
/**
 * @module client-notifications/__tests__/client-notifications.replay
 * @description The co-located `client-notifications.feature`, REPLAYED through
 * the module's own step catalog against the real composable — ONE scenario, ONE
 * recording (FE-3145, ADR 035). Each driven scenario plays its own
 * `scenarios/<slug>/` fixtures, step by step, and nothing else: before each
 * step, that step's recorded answers are armed. A request no step of the
 * scenario recorded fails the scenario by name. A scenario no step drives (every
 * `@todo` editor / emailed-link / denial capability) has no recording and is
 * skipped by name (spec-only, ADR-020 Am.5).
 *
 * The recordings come from `pnpm fixtures:generate client-notifications`, which
 * records every driven scenario against staging.
 *
 * ## What Breaks If These Fail
 * A fake step, a flag the composable does not publish, an action it does not
 * expose, or a module that now asks the API something its scenario never
 * recorded.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
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
import { useClientNotifications, useClientNotificationsManager } from "..";
import { replayFeature } from "../../../testing/replay-feature";
import {
  scenarioDir,
  stepDirDrift,
  stepFixturesDir
} from "../../../testing/scenario-fixtures";
import { seedSessionFor } from "../../../testing/session-seed";
import {
  resetClientNotificationsScopes,
  seedClientSession,
  seedGuestSession,
  topUpClientSession
} from "./client-notifications.int-helpers";
import {
  CLIENT_NOTIFICATIONS_MANAGER_SCENARIO,
  CLIENT_NOTIFICATIONS_SCENARIO,
  clientNotificationsSteps,
  setLinkToken
} from "./client-notifications.steps";
import { server } from "./setup.integration";
import { includes, reject } from "lodash-es";
import type { NodeComposable } from "../../../testing";
import type { FeatureScenario } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const feature = readFileSync(
  join(import.meta.dirname, "client-notifications.feature"),
  "utf-8"
);

/**
 * Starts a scenario on its own recording: the module's shared fixtures are
 * dropped, the owner boot recordings are armed, and a real authenticated client
 * session is seeded.
 */
let replay: ReturnType<typeof startScenarioReplay> | undefined;
let currentScenario = "";

/**
 * The link token a `@link` scenario (AC-8/10/18) boots with — read from that
 * scenario's OWN recording (the `?token=` a recorded request carried), so the
 * boot addresses the exact token the recording answers, whatever form the mint
 * masked it to. Never a literal a re-record would stale.
 */
function readLinkToken(scenario: FeatureScenario): string {
  const dir = scenarioDir(import.meta.dirname, scenario.name);
  for (const step of readdirSync(dir)) {
    const stepDir = join(dir, step);
    if (!statSync(stepDir).isDirectory()) continue;
    for (const file of readdirSync(stepDir)) {
      if (!file.endsWith(".json")) continue;
      const fixture = JSON.parse(
        readFileSync(join(stepDir, file), "utf-8")
      ) as {
        request?: { path?: string };
      };
      const query = (fixture.request?.path ?? "").split("?")[1] ?? "";
      const token = new URLSearchParams(query).get("token");
      if (token) return token;
    }
  }
  throw new Error(
    `"${scenario.name}" — no recorded \`?token=\` request to boot the link with`
  );
}

async function arrangeScenario(scenario: FeatureScenario): Promise<void> {
  currentScenario = scenario.name;
  if (!existsSync(scenarioDir(import.meta.dirname, scenario.name)))
    throw new Error(
      `"${scenario.name}" has no recording — record it with pnpm fixtures:generate client-notifications`
    );

  replay = startScenarioReplay(server);
  await seedSessionFor(scenario, seedClientSession, seedGuestSession);
  if (includes(scenario.tags, "@link")) setLinkToken(readLinkToken(scenario));
}

/**
 * Fails the scenario by its first capture gap, whatever else it failed on: a
 * request the recording lacks is the cause, and the check it broke is only the
 * symptom. The name is captured in `arrange`, because the failure path calls
 * cleanup without it.
 */
function cleanupScenario(): void {
  resetClientNotificationsScopes();

  const [gap] = replay?.gaps() ?? [];
  replay = undefined;

  if (gap) throw new Error(`"${currentScenario}" — ${gap}`);
}

/**
 * Arms the answers THIS step recorded; a step that made no request has none.
 * For a `@session-topup` scenario (AC-16), the client session is added to the
 * store BEFORE the "session later resolves" step — WITHOUT evicting the
 * already-booted signed-out module — so the live instance reacts to the session
 * arriving rather than being reopened.
 */
async function armStep(
  scenario: FeatureScenario,
  index: number
): Promise<void> {
  if (
    includes(scenario.tags, "@session-topup") &&
    scenario.steps[index]?.text === "my session later resolves my identity"
  )
    await topUpClientSession();
  replayStep(server, stepFixturesDir(import.meta.dirname, scenario, index));
}

// -----------------------------------------------------------------------------

/**
 * Each driven scenario is proven here with an EXPLICIT, literal `AC-<n>` test
 * title — the form the traceability gate scans source for — so this replay file
 * is the proving test each driven scenario is anchored by. Each asserts its
 * scenario is recorded and holds one folder per step; `replayFeature` below then
 * drives it against those steps.
 */
describe("client-notifications — each driven scenario replays its own per-step recording", () => {
  const matcher = createStepMatcher(clientNotificationsSteps);
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

  it("AC-1 — See every topic, every channel, and the state of each pair", () =>
    provesRecorded(
      "See every topic, every channel, and the state of each pair"
    ));
  it("AC-2 — See the whole grid, never a first page of it", () =>
    provesRecorded("See the whole grid, never a first page of it"));
  it("AC-11 AC-1 — See my preferences settle, rather than wait on a check that never ends", () =>
    provesRecorded(
      "See my preferences settle, rather than wait on a check that never ends"
    ));
  it("AC-6 — See which of my topics are locked", () =>
    provesRecorded("See which of my topics are locked"));
  it("AC-12 — Find no filter or sort on my grid, because all of it is always shown", () =>
    provesRecorded(
      "Find no filter or sort on my grid, because all of it is always shown"
    ));
  it("AC-3 — Turn one channel off for one topic and save", () =>
    provesRecorded("Turn one channel off for one topic and save"));
  it("AC-3 AC-4 AC-5 — My saved change survives the save settling", () =>
    provesRecorded("My saved change survives the save settling"));
  it("AC-4 — Turn every channel back on for a topic at once", () =>
    provesRecorded("Turn every channel back on for a topic at once"));
  it("AC-5 — Abandon my unsaved changes", () =>
    provesRecorded("Abandon my unsaved changes"));
  it("AC-6 AC-14 — The editor refuses to opt out of an essential topic", () =>
    provesRecorded("The editor refuses to opt out of an essential topic"));
  it("AC-7 — Be told when my save fails, and keep the work to retry", () =>
    provesRecorded("Be told when my save fails, and keep the work to retry"));
  it("AC-3 — A second save always carries my whole current set, never an empty one", () =>
    provesRecorded(
      "A second save always carries my whole current set, never an empty one"
    ));
  it("AC-10 — See the topics and channels on offer when following an emailed link", () =>
    provesRecorded(
      "See the topics and channels on offer when following an emailed link"
    ));
  it("AC-8 — Manage my preferences from an emailed link without signing in", () =>
    provesRecorded(
      "Manage my preferences from an emailed link without signing in"
    ));
  it("AC-18 — My emailed link is never exposed anywhere else on the page", () =>
    provesRecorded(
      "My emailed link is never exposed anywhere else on the page"
    ));
  it("AC-16 — Open my preferences before I am signed in, and edit them once I am", () =>
    provesRecorded(
      "Open my preferences before I am signed in, and edit them once I am"
    ));
});

replayFeature({
  moduleName: "client-notifications",
  feature,
  catalog: clientNotificationsSteps,
  composables: {
    // The scope builder types `.as()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper.
    [CLIENT_NOTIFICATIONS_SCENARIO]:
      useClientNotifications as unknown as NodeComposable,
    // The editor is a second scenario key: the aggregate manager boots beside the
    // collection, bare (`.as(CLIENT)`, no `.for()` context).
    [CLIENT_NOTIFICATIONS_MANAGER_SCENARIO]:
      useClientNotificationsManager as unknown as NodeComposable
  },
  arrange: arrangeScenario,
  beforeStep: armStep,
  cleanup: cleanupScenario,
  timeoutMs: 60000
});
