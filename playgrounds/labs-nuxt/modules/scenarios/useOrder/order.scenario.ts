// -----------------------------------------------------------------------------
/**
 * @module scenarios/useOrder/order.scenario
 * @description One of a client's placed orders, read whole — the `orders`
 * module's single-record read (`useOrder`), booted as self with `.withId(oid)`
 * (FE-3237, design 8.12). The sibling of the COLLECTION page (`useOrders`).
 *
 * The shared playground draws it as a RECORD: `useManage` plus the declared
 * `presentation.record` (`order.presentation.ts`) route it to the record
 * surface, which boots `.withId(oid)` for the url's order and opens it on load.
 * The order is addressed by the `oid` route param only — `/useOrder/<oid>`, the
 * shape `useInvoice` uses — and the `?init=pay` overlay this page hosts reads
 * that same param.
 */

import { useOrder } from "@upmind-automation/headless";
import { orderRecord } from "./order.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const ORDER_SCENARIO = "order";

export default {
  key: ORDER_SCENARIO,
  useManage: useOrder,
  // `oid`, not `id`: the word `/order/:oid` uses and the `?init=pay` overlay
  // reads off its parent's params. UUID-shaped, because the scope suffix
  // follows it.
  params: ["oid([0-9a-fA-F-]{36})?"],
  presentation: {
    icon: "receipt",
    record: orderRecord
  }
} satisfies ScenarioDeclaration;
