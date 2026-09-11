// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContractProduct/contract-product.scenario
 * @description One contracted product — the screen a client lands on from an
 * emailed upgrade link, and the host `?init=upgrade` opens the migrations
 * surface over.
 *
 * STUB until CT-1 (FE-3029) + CT-2 (FE-3206). There is no contracts module in
 * `packages/headless/src/modules` yet, so this module DRAWS ITSELF and boots no
 * composable: inventing a product shape for CT-1 to contradict is worse than
 * standing in for it. The route, the url segment and the sidebar entry are real
 * — only the data is pending.
 */

import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const CONTRACT_PRODUCT_SCENARIO = "contract_product";

export default {
  key: CONTRACT_PRODUCT_SCENARIO,
  presentation: {
    icon: "box"
  }
} satisfies ScenarioDeclaration;
