// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/catalogs
 * @description The adopted spec pairs this lane executes. A module has ONE
 * `<module>.feature` and ONE `<module>.steps.ts`, colocated with its module
 * source, and both halves are registered here so the feature list and the
 * catalog can never name different sets.
 *
 * That one feature holds the module's driveable scenarios and its not-yet
 * driveable ones alike, so the lane runs with `missingSteps: "skip-scenario"`:
 * a scenario the catalog does not match is simply not a track.
 *
 * The catalogs themselves never import playwright-bdd, and this file never
 * asserts.
 */

import { clientEmailsSteps } from "@upmind-automation/headless/testing/client-email/steps";
import type { StepCatalog } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const catalogs: StepCatalog[] = [clientEmailsSteps];

/** Feature globs, relative to this playground's root. */
export const features: string[] = [
  "../../packages/headless/src/modules/client-email/__tests__/client-email.feature"
];

/**
 * The generated page the client-email pair is driven on. The world and the
 * rendered table share one scope-registry cell, so a step that fires an action
 * moves the rows the operator is looking at — which is the whole point of
 * driving the module through its own page.
 */
export const clientEmailsRoute = "/useClientEmails/as/client";
