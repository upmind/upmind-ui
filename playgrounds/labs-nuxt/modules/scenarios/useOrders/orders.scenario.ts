// -----------------------------------------------------------------------------
/**
 * @module scenarios/useOrders/orders.scenario
 * @description A client's order history — the `orders` collection
 * (`useOrders`) as the shared list, filterable, sortable and paged, its
 * rows opening into the self-drawn manager page (`useOrder`). An order IS
 * an invoice, so this pair is the twin of `useInvoices`/`useInvoice`.
 *
 * The FILE is named for the module it declares and the DIRECTORY is the url
 * segment and the route name (`/useOrders`), so nothing here declares a
 * route. No scope is declared: the page boots as self with no context.
 *
 * No `useMutate` — the collection has no generic write (pay and cancel are the
 * manager's own). `useDetail: useOrder` lets `view` fetch one order's full
 * record: the manager boots `.withId(<row.id>)` and publishes it as `data`, the
 * detail overlay's own default feed, so no `siblings` is declared.
 */

import { useOrder, useOrders } from "@upmind-automation/headless";
import {
  actionsUischema,
  cardUischema,
  detailUischema,
  tableUischema
} from "./orders.presentation";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This scenario's key — the identity a `.feature` and the BDD world name it by. */
export const ORDERS_SCENARIO = "orders";

export default {
  key: ORDERS_SCENARIO,
  useList: useOrders,
  useDetail: useOrder,
  persistCriteria: true,
  // The MODULE whose committed `.feature` and step catalog this page plays.
  tracks: "orders",
  presentation: {
    icon: "receipt",
    table: tableUischema,
    card: cardUischema,
    detail: detailUischema,
    actions: actionsUischema
  }
} satisfies ScenarioDeclaration;
