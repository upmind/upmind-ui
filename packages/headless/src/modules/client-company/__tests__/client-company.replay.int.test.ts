// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company — the co-located feature, REPLAYED
 * (every driveable scenario)
 *
 * ## Job To Be Done
 * Run the module's OWN `client-company.feature` through the module's OWN
 * `client-company.steps.ts`, against the REAL `useClientCompanies()` booted
 * THROUGH THE BARREL, over this module's own MSW-replayed staging recordings —
 * so a step naming a flag the collection does not publish, firing an action id
 * it does not own, or asserting a state the recorded corpus never reaches is
 * RED here, before any page exists.
 *
 * Per ADR-020 Amendment 5 the catalog decides, scenario by scenario, which of
 * the feature's scenarios are a playable TRACK. Only the criteria-channel
 * scenarios that a real `filterBy`/`sortBy` drives carry step definitions;
 * every capability proven at the unit/integration layer stays spec-only, and
 * `replayFeature` `it.skip`s any scenario no step of which matches — the
 * expected, correct outcome for a scenario nothing drives.
 *
 * ## What Breaks If These Fail
 * The module's behavioural source of truth stops describing the module: the
 * feature and its catalog drift away from the composable, and nothing says so
 * until a page is built on top of them.
 *
 * @reference `packages/headless/src/modules/client-billing-settings/__tests__/`
 * — the one built replay pair, read while authoring this file, never a match
 * target.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useClientCompanies } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  resetClientCompanyScopes,
  seedClientSession
} from "./client-company.int-helpers";
import {
  clientCompaniesSteps,
  CLIENT_COMPANIES_SCENARIO
} from "./client-company.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

/**
 * The corpus EVERY scenario starts from: a real authenticated client session
 * and this module's own recorded companies list, served alongside its real
 * `filter[name|like]=%Heg%` narrowed capture — so a `filterBy` search is a
 * genuine server-side re-query, not a client-side slice. Nothing here is built;
 * every body is a committed capture the kit already serves.
 */
async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("client-company"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "client-company",
  feature: readFileSync(
    join(import.meta.dirname, "client-company.feature"),
    "utf-8"
  ),
  catalog: clientCompaniesSteps,
  composables: {
    // The scope builder types `.as()` narrowly to this module's own
    // actor×context matrix; `NodeComposable` is the erased structural shape the
    // World boots. One widening cast at the seam, never a loosening of the
    // helper — mirrors the reference module's own widening.
    [CLIENT_COMPANIES_SCENARIO]: useClientCompanies as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetClientCompanyScopes,
  timeoutMs: 60000
});
