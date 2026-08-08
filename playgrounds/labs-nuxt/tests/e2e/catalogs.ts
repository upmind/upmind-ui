// -----------------------------------------------------------------------------
/**
 * @module tests/e2e/catalogs
 * @description Every engine-free `StepCatalog` this lane registers with
 * playwright-bdd. A module's `<module>.steps.ts` is colocated with its
 * `.feature` (ADR-027 Am.2) and listed here — the catalog itself never imports
 * playwright-bdd, and this file never asserts.
 *
 * Task 21 lands the client-emails catalog; until it does, this lane generates
 * no step for the feature that already sits beside it.
 */

import type { StepCatalog } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

export const catalogs: StepCatalog[] = [];
