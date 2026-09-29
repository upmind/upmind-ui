// -----------------------------------------------------------------------------
/**
 * @module contract-product/__tests__/contract-product.replay
 * @description The co-located `contract-product.feature`, REPLAYED through the
 * module's own step catalog against the real `useContractProducts` and
 * `useContractProduct`, booted through the barrel, over the module's recorded
 * corpus served by the ONE shared replay — the same fake API the labs pages
 * arm. Every scenario a step drives runs here; a scenario no step drives is
 * skipped by name (spec-only, ADR-020 Am.5).
 *
 * ## What Breaks If These Fail
 * A fake step, a flag the composable does not publish, an action it does not
 * expose, or an assertion the recordings cannot meet — the drift the
 * traceability gate, which matches step TEXT against catalog PATTERNS, can
 * never see.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useContractProduct, useContractProducts } from "..";
import {
  installCorpusReplay,
  loadModuleCorpus
} from "../../../testing/corpus-replay";
import { replayFeature } from "../../../testing/replay-feature";
import {
  resetContractProductScopes,
  seedClientSession
} from "./contract-product.int-helpers";
import {
  CONTRACT_PRODUCTS_SCENARIO,
  CONTRACT_PRODUCT_SCENARIO,
  contractProductSteps
} from "./contract-product.steps";
import { server } from "./setup.integration";
import type { NodeComposable } from "../../../testing";

// -----------------------------------------------------------------------------

/** @see fixtures/get-contract-products-id.json — the one recorded product read. */
const RECORDED_PRODUCT_ID = "de78642d-e539-7147-e37a-21208469530d";

async function arrangeRecordedCorpus(): Promise<void> {
  await seedClientSession();
  installCorpusReplay(server, await loadModuleCorpus("contract-product"));
}

// -----------------------------------------------------------------------------

replayFeature({
  moduleName: "contract-product",
  feature: readFileSync(
    join(import.meta.dirname, "contract-product.feature"),
    "utf-8"
  ),
  catalog: contractProductSteps,
  composables: {
    // The scope builder types `.as()` narrowly to each composable's own
    // matrix; `NodeComposable` is the erased shape the World boots. One
    // widening cast at the seam, never a loosening of the helper.
    [CONTRACT_PRODUCTS_SCENARIO]:
      useContractProducts as unknown as NodeComposable,
    // The manager page is addressed by its url (`/useContractProduct/<id>`),
    // which the labs world folds in as `.withId(id)`. This replay has no url,
    // so the recorded product's id is bound here — `.withId()` is offered
    // before `.as()` (ADR-001, 2026-08-19 amendment).
    [CONTRACT_PRODUCT_SCENARIO]: (() =>
      useContractProduct().withId(
        RECORDED_PRODUCT_ID
      )) as unknown as NodeComposable
  },
  arrange: arrangeRecordedCorpus,
  cleanup: resetContractProductScopes,
  timeoutMs: 60000
});
