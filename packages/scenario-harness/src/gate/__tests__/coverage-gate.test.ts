import { describe, expect, it } from "vitest";
import { OBJECT_SCHEMA_TYPE } from "../../archetype/archetype.types";
import { TAG_KIND } from "../../tags/tags.types";
import { SCOPE_ACTOR } from "../../world/scope-actor";
import { runGate } from "../coverage-gate";
import { GATE_CAUSE, GATE_STATUS } from "../gate.types";
import type { GateInput, GateVerdict } from "../gate.types";
import type { JsonSchema } from "@jsonforms/core";

const INPUT_TAKING_SCHEMA: JsonSchema = {
  type: OBJECT_SCHEMA_TYPE,
  properties: {}
};

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
    exemptAction: { kind: TAG_KIND.EXCLUDE, reason: "lifecycle" },
    coveredAction: { kind: TAG_KIND.INCLUDE },
    uncoveredIncluded: { kind: TAG_KIND.INCLUDE },
    noReasonExclude: { kind: TAG_KIND.EXCLUDE }
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
    expect(verdict).toMatchObject({
      status: GATE_STATUS.EXEMPT,
      reason: "lifecycle"
    });
  });

  it("an included action with a covering step is covered — the happy path", () => {
    const verdict = find(verdicts, "coveredAction");
    expect(verdict).toMatchObject({ status: GATE_STATUS.COVERED });
  });

  it("an included action with no covering step is red as uncovered", () => {
    const verdict = find(verdicts, "uncoveredIncluded");
    expect(verdict).toMatchObject({
      status: GATE_STATUS.RED,
      cause: GATE_CAUSE.UNCOVERED
    });
  });

  it("an untagged input-taking action is red as untagged-input-taking", () => {
    const verdict = find(verdicts, "untaggedInputTaking");
    expect(verdict).toMatchObject({
      status: GATE_STATUS.RED,
      cause: GATE_CAUSE.UNTAGGED_INPUT_TAKING
    });
  });

  it("an exclusion with no reason is red as missing-reason", () => {
    const verdict = find(verdicts, "noReasonExclude");
    expect(verdict).toMatchObject({
      status: GATE_STATUS.RED,
      cause: GATE_CAUSE.MISSING_REASON
    });
  });

  it("a step naming a non-live action is red as dead-step", () => {
    const verdict = find(verdicts, "ghostStep");
    expect(verdict).toMatchObject({
      status: GATE_STATUS.RED,
      cause: GATE_CAUSE.DEAD_STEP
    });
  });

  it("an untagged action with no input schema and no step defaults to included, red as uncovered — never untagged", () => {
    const verdict = find(verdicts, "uncoveredDefault");
    expect(verdict).toMatchObject({
      status: GATE_STATUS.RED,
      cause: GATE_CAUSE.UNCOVERED
    });
    expect(verdict).not.toMatchObject({
      cause: GATE_CAUSE.UNTAGGED_INPUT_TAKING
    });
  });
});

/**
 * @AC-7 — an action literally named after an `Object.prototype` member must
 * be read as honest, own data — never silently resolved via the prototype
 * chain (e.g. a `tags`/`actionSchemas` lookup that isn't `Object.hasOwn`-
 * guarded would read `Object.prototype.constructor`/`.toString` instead of
 * "no entry for this key").
 */
describe("@AC-7 runGate — Object.prototype-named actions are handled honestly", () => {
  const input: GateInput = {
    actor: SCOPE_ACTOR.CLIENT,
    actionKeys: ["constructor", "toString"],
    tags: {},
    actionSchemas: {},
    coveredActionIds: []
  };

  const { verdicts } = runGate(input);

  it("an untagged action named constructor with no input schema and no step is a real red-uncovered verdict, not silently skipped", () => {
    const verdict = find(verdicts, "constructor");
    expect(verdict).toMatchObject({
      status: GATE_STATUS.RED,
      cause: GATE_CAUSE.UNCOVERED
    });
  });

  it("an untagged action named toString with no input schema and no step is a real red-uncovered verdict, not silently skipped", () => {
    const verdict = find(verdicts, "toString");
    expect(verdict).toMatchObject({
      status: GATE_STATUS.RED,
      cause: GATE_CAUSE.UNCOVERED
    });
  });
});
