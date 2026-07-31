import { describe, expect, it } from "vitest";
import { SCOPE_ACTOR } from "../../world/scope-actor";
import { runGate } from "../coverage-gate";
import type { GateInput, GateVerdict } from "../gate.types";
import type { JsonSchema } from "@jsonforms/core";

const INPUT_TAKING_SCHEMA: JsonSchema = { type: "object", properties: {} };

/**
 * @AC-7 — one shared fixture covering all six verdict behaviours, each
 * asserted as its own case — the transcript this suite prints IS the @AC-7
 * read-back.
 */
const INPUT: GateInput = {
  actor: SCOPE_ACTOR.CLIENT,
  actionKeys: [
    "exemptAction",
    "coveredAction",
    "uncoveredIncluded",
    "untaggedInputTaking",
    "noReasonExclude",
    "uncoveredDefault"
  ],
  tags: {
    exemptAction: { kind: "exclude", reason: "lifecycle" },
    coveredAction: { kind: "include" },
    uncoveredIncluded: { kind: "include" },
    noReasonExclude: { kind: "exclude" }
  },
  actionSchemas: {
    untaggedInputTaking: INPUT_TAKING_SCHEMA
  },
  coveredActionIds: ["coveredAction", "ghostStep"]
};

function find(verdicts: readonly GateVerdict[], actionId: string): GateVerdict {
  const verdict = verdicts.find(v => v.actionId === actionId);
  if (!verdict) throw new Error(`no verdict recorded for "${actionId}"`);
  return verdict;
}

describe("@AC-7 runGate — the six coverage-gate verdicts", () => {
  const { verdicts } = runGate(INPUT);

  it("an excluded action is skipped with its reason recorded", () => {
    const verdict = find(verdicts, "exemptAction");
    expect(verdict).toMatchObject({ status: "exempt", reason: "lifecycle" });
  });

  it("an included action with a covering step is covered — the happy path", () => {
    const verdict = find(verdicts, "coveredAction");
    expect(verdict).toMatchObject({ status: "covered" });
  });

  it("an included action with no covering step is red as uncovered", () => {
    const verdict = find(verdicts, "uncoveredIncluded");
    expect(verdict).toMatchObject({ status: "red", cause: "uncovered" });
  });

  it("an untagged input-taking action is red as untagged-input-taking", () => {
    const verdict = find(verdicts, "untaggedInputTaking");
    expect(verdict).toMatchObject({
      status: "red",
      cause: "untagged-input-taking"
    });
  });

  it("an exclusion with no reason is red as missing-reason", () => {
    const verdict = find(verdicts, "noReasonExclude");
    expect(verdict).toMatchObject({ status: "red", cause: "missing-reason" });
  });

  it("a step naming a non-live action is red as dead-step", () => {
    const verdict = find(verdicts, "ghostStep");
    expect(verdict).toMatchObject({ status: "red", cause: "dead-step" });
  });

  it("an untagged action with no input schema and no step defaults to included, red as uncovered — never untagged", () => {
    const verdict = find(verdicts, "uncoveredDefault");
    expect(verdict).toMatchObject({ status: "red", cause: "uncovered" });
    expect(verdict).not.toMatchObject({ cause: "untagged-input-taking" });
  });
});
