// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/catalogs
 * @description The adopted spec pairs this lane executes. A module's
 * `<module>.steps.ts` is colocated with its `.feature` (ADR-027 Am.2) and both
 * halves are registered here, so the feature glob and the catalog can never
 * name different sets.
 *
 * Registering the FEATURES explicitly is what keeps the lane off a module's
 * spec-only `.feature` files — `client-email.feature` is an ADR-020 capability
 * record with no steps beside it, and a directory glob would hand it to the
 * Gherkin parser and fail generation.
 *
 * The catalogs themselves never import playwright-bdd, and this file never
 * asserts.
 */

import { clientEmailsSteps } from "@upmind-automation/headless-test-kit/client-emails.steps";
import type { StepCatalog } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const catalogs: StepCatalog[] = [clientEmailsSteps];

/** Feature globs, relative to this playground's root. */
export const features: string[] = [
  "../../packages/headless/src/modules/client-email/__tests__/client-emails.feature"
];

/**
 * The generated page the canary pair is driven on. The world and the rendered
 * table share one scope-registry cell, so a step that fires an action moves the
 * rows the operator is looking at — which is the whole point of the canary.
 */
export const canaryRoute = "/useClientEmails/as/client";
