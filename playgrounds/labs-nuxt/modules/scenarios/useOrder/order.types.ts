// -----------------------------------------------------------------------------
/**
 * @module scenarios/useOrder/order.types
 * @description Type definitions for the client order page.
 */

import type { UseOrderManagerActions } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

export type OrderPaymentProps = {
  /** The page's one manager instance — the component calls its `usePayment()`. */
  actions: UseOrderManagerActions;
};
