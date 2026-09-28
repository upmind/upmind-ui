// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientOrders/client-orders.scenario
 * @description A client's order history — the `client-orders` collection
 * (`useClientOrders`), booted as self (FE-3237, design 8.12).
 *
 * This module DRAWS ITSELF: `client-orders.page.vue` beside this file is the
 * route's component. What keeps it self-drawn is the test-key rule of design
 * 8.12 — each published member carries its own `client-orders-<member>` key,
 * which the shared renderer cannot give. `useManage` binds the collection for
 * booting only, so the scenario bar and the BDD world drive the same cell the
 * page draws. `tracks` names the module whose `.feature` the page plays.
 */

import { useClientOrders } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const CLIENT_ORDERS_SCENARIO = "client-orders";

export default {
  key: CLIENT_ORDERS_SCENARIO,
  useManage: useClientOrders,
  tracks: "client-orders",
  presentation: {
    icon: "receipt"
  }
} satisfies ScenarioDeclaration;
