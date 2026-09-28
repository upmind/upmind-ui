// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientOrder/client-order.types
 * @description Type definitions for the client order page.
 */

import type { UseClientOrderManagerActions } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

export type ClientOrderPaymentProps = {
  /** The page's one manager instance — the component calls its `usePayment()`. */
  actions: UseClientOrderManagerActions;
};
