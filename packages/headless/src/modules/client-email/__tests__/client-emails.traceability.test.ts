// -----------------------------------------------------------------------------
/**
 * @fileoverview client-emails spec pair — feature ↔ steps traceability (Task 21)
 *
 * ## Job To Be Done
 * The executed pair cannot drift: every step written in
 * `client-email.canary.feature` is matched by a `StepDef` in
 * `client-email.canary.steps.ts`, and every `StepDef` is exercised by at least
 * one feature step. Both directions, by name, using the same
 * cucumber-expression engine the runner matches with at registration time.
 *
 * ## What Breaks If These Fail
 * A feature step nobody implements is an undefined step at generation time; a
 * step definition nobody calls is a capability the `.feature` no longer claims —
 * and the coverage gate's `coveredActionIds` would then over-report.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceabilityCheck } from "@upmind-automation/scenario-harness";
import {
  clientEmailsSteps,
  coveredActionIds
} from "./client-email.canary.steps";

// -----------------------------------------------------------------------------

const featureText = readFileSync(
  join(import.meta.dirname, "client-email.canary.feature"),
  "utf-8"
);

// -----------------------------------------------------------------------------

describe("client-emails spec pair — feature ↔ steps traceability (Task 21)", () => {
  it("matches every feature step to a step definition, and back", () => {
    const result = createTraceabilityCheck(featureText, clientEmailsSteps);

    expect(
      result.unmatchedFeatureSteps.map(step => `${step.line}: ${step.text}`)
    ).toEqual([]);
    expect(result.orphanStepDefs.map(step => step.pattern)).toEqual([]);
    expect(result.malformedStepDefs).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("fires every action it declares as covered", () => {
    const stepsSource = readFileSync(
      join(import.meta.dirname, "client-email.canary.steps.ts"),
      "utf-8"
    );

    const unfired = coveredActionIds.filter(
      actionId =>
        !stepsSource.includes(`fire(CLIENT_EMAILS_COVERED_ACTIONS.${actionId}`)
    );

    expect(
      unfired,
      `declared covered but fired by no step: ${unfired.join(", ")}`
    ).toEqual([]);
  });
});
