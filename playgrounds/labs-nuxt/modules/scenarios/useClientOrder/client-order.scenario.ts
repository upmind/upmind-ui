// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientOrder/client-order.scenario
 * @description One of a client's placed orders — the `client-orders` manager
 * (`useClientOrder`), booted as self with `.withId(oid)` (FE-3237, design
 * 8.12).
 *
 * This module DRAWS ITSELF: `client-order.page.vue` beside this file is the
 * route's component. It holds ONE scoped instance for the whole page and
 * re-reads it on each enter of the order view (D-12), which no generic
 * surface does. The order is addressed by the `oid` route param only —
 * `/useClientOrder/<oid>`, the shape `useInvoice` uses. `useManage` binds the
 * manager for booting only; the page plays no track, because the lane spec
 * drives the manager (D-27).
 */

import { useClientOrder } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_ORDER_SCENARIO = "client-order";

export default {
  key: CLIENT_ORDER_SCENARIO,
  useManage: useClientOrder,
  params: ["oid"],
  presentation: {
    icon: "receipt"
  }
} satisfies ScenarioDeclaration;
