// @vitest-environment happy-dom
// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC8 coverage gate over the client-emails page (Task 22)
 *
 * ## Job To Be Done
 * Every non-exempt action the LIVE `useClientEmails` cell publishes has a
 * scenario proving it. The `GateInput` is assembled from four real sources and
 * nothing declared for the test's convenience: `Object.keys(cell.useActions())`
 * off a cell booted behind a real seeded session, `parsePlaygroundTags` over the
 * module's real actions source, `useInternals().actionSchemas`, and the step
 * catalog's own `coveredActionIds`.
 *
 * The cell is reached at the one site that holds the raw composable — the
 * registry binding the generic `useModulePort(entry)` loop boots from.
 *
 * ## What Breaks If These Fail
 * An action ships with no scenario and the client-emails page certifies a capability nobody
 * drove. The falsifiability control beside this file (`coverage-gate.must-fail.patch`)
 * removes one covered action and this suite must go red naming it.
 *
 * ## Lane
 * The task's stated read-back is `pnpm test:e2e`, but the live enumeration needs
 * a booted cell and the tag parse needs the module's source on disk — neither is
 * reachable from the browser lane. It runs where task 19's read-back runs, over
 * the same recorded corpus.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  integrationKits,
  integrationSetups,
  internalKits,
  stepModules
} from "@upmind-automation/headless/testing";
import {
  GATE_CAUSE,
  GATE_STATUS,
  parsePlaygroundTags,
  runGate,
  SCOPE_ACTOR
} from "@upmind-automation/scenario-harness";
import { CLIENT_EMAILS_SCENARIO } from "../../../useClientEmails/client-email.scenario";
import { registry } from "../../registry";
import { filter, find, keyBy, map, reject } from "lodash-es";
import type { GateVerdict } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const { installFilteredEmailsHandler, seedClientSession } =
  await integrationKits["client-email"]();
const { server } = await integrationSetups["client-email"]();
const { coveredActionIds } = stepModules["client-email"];

/** The module's own actions file, whose `@scenario` tags the gate parses. */
const CLIENT_EMAILS_ACTIONS_SOURCE = (await internalKits["client-email"]())
  .CLIENT_EMAILS_ACTIONS_SOURCE as string;

// -----------------------------------------------------------------------------

/** Action id → its input schema, as `useInternals()` publishes it. */
type ActionSchemaMap = Record<string, object | undefined>;

/** The exemption the module declares on its own cache-key member. */
const EXPECTED_EXEMPT = "invalidate";

/** The two write paths into the one query model — task 22's named expectation. */
const QUERY_ACTIONS = ["filterBy", "sortBy"] as const;

/** The live cell, booted behind a real seeded session over the recorded corpus. */
async function liveCell(): Promise<{
  actionKeys: string[];
  actionSchemas: ActionSchemaMap;
}> {
  const { clientId } = await seedClientSession();
  installFilteredEmailsHandler(server, clientId);

  const binding = registry[CLIENT_EMAILS_SCENARIO];
  // A page boots as SELF and declares no scope of its own — the seeded session
  // is what makes that the client.
  const cell = binding.useList().as(SCOPE_ACTOR.SELF);
  const actions = cell.useActions() as Record<string, () => Promise<unknown>>;
  await actions.isReady();

  // `useInternals()` publishes the map through a ref on some builds and plainly
  // on others; an unresolved ref reads as `{}` and silently disables the
  // input-taking arm of the gate.
  const internals = cell.useInternals?.() as {
    actionSchemas: ({ value?: ActionSchemaMap } & ActionSchemaMap) | undefined;
  };
  const published = internals?.actionSchemas;
  const actionSchemas = (published?.value ??
    published ??
    {}) as ActionSchemaMap;

  return { actionKeys: Object.keys(actions), actionSchemas };
}

async function verdicts(
  covered: readonly string[] = coveredActionIds
): Promise<readonly GateVerdict[]> {
  const { actionKeys, actionSchemas } = await liveCell();

  return runGate({
    actor: SCOPE_ACTOR.CLIENT,
    actionKeys,
    tags: parsePlaygroundTags(
      readFileSync(CLIENT_EMAILS_ACTIONS_SOURCE, "utf-8")
    ),
    actionSchemas: actionSchemas as never,
    coveredActionIds: covered
  }).verdicts;
}

// -----------------------------------------------------------------------------

describe(
  "@AC8 coverage gate — the client-emails page (Task 22)",
  { timeout: 60000 },
  () => {
    it("returns no red verdict for any live action", async () => {
      const reds = filter(await verdicts(), { status: GATE_STATUS.RED });

      expect(
        map(reds, red => `${red.actionId}: ${"cause" in red ? red.cause : ""}`)
      ).toEqual([]);
    });

    it("exempts only the member carrying a reasoned @scenario-exclude", async () => {
      const byAction = keyBy(await verdicts(), "actionId");

      expect(byAction[EXPECTED_EXEMPT].status).toBe(GATE_STATUS.EXEMPT);
      expect(byAction[EXPECTED_EXEMPT]).toHaveProperty("reason");
      expect(
        map(
          filter(await verdicts(), { status: GATE_STATUS.EXEMPT }),
          verdict => verdict.actionId
        )
      ).toEqual([EXPECTED_EXEMPT]);
    });

    it("requires the two @AC7 scenarios for the query write paths", async () => {
      const byAction = keyBy(await verdicts(), "actionId");

      for (const action of QUERY_ACTIONS) {
        expect(byAction[action]?.status, action).toBe(GATE_STATUS.COVERED);
      }
    });

    it("goes red naming the action when a scenario is withdrawn", async () => {
      const withdrawn = reject(coveredActionIds, id => id === "sortBy");
      const reds = filter(await verdicts(withdrawn), {
        status: GATE_STATUS.RED
      });

      expect(map(reds, red => red.actionId)).toEqual(["sortBy"]);
      expect(find(reds, { actionId: "sortBy" })).toMatchObject({
        cause: GATE_CAUSE.UNCOVERED
      });
    });

    it("goes red on a step naming an action the cell no longer publishes", async () => {
      const reds = filter(await verdicts([...coveredActionIds, "retire"]), {
        status: GATE_STATUS.RED
      });

      expect(map(reds, red => red.actionId)).toEqual(["retire"]);
      expect(find(reds, { actionId: "retire" })).toMatchObject({
        cause: GATE_CAUSE.DEAD_STEP
      });
    });

    it("keys input-taking off the schema map the module hands in", async () => {
      const { actionKeys, actionSchemas } = await liveCell();

      const untagged = runGate({
        actor: SCOPE_ACTOR.CLIENT,
        actionKeys,
        tags: {},
        actionSchemas: actionSchemas as never,
        coveredActionIds
      }).verdicts;

      expect(
        map(
          filter(untagged, { cause: GATE_CAUSE.UNTAGGED_INPUT_TAKING }),
          verdict => verdict.actionId
        ).sort()
      ).toEqual(["ensure", "remove", "setDefault", "verify"]);
    });
  }
);
