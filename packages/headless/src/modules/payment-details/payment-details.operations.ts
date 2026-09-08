/**
 * @module payment-details/payment-details.operations
 * @description The ADD flow's off-site redirect recovery — hold the pending
 * operation before leaving, and build the return url that carries its
 * reference back.
 *
 * Kept out of `payment-details.utils.ts`: that file imports every gateway
 * config, and the gateways import back into `payment-details`, so it already
 * sits in an import cycle. This file names the registry and nothing from
 * `payment-gateways`.
 */

import { QUERY_PARAMS } from "@upmind-automation/types";
import { useOperations } from "../system-operations/useOperations";
import { PAYMENT_DETAIL_ADD_KEY } from "./payment-details.constants";
import type { PendingOperation } from "./payment-details.types";

// -----------------------------------------------------------------------------

/**
 * Hold an ADD operation across an off-site redirect (3DS / SCA) and return the
 * reference that identifies it on the way back. Call BEFORE the redirect.
 */
export function registerOperation(operation: PendingOperation): string {
  return useOperations().createOperation<PendingOperation>(
    PAYMENT_DETAIL_ADD_KEY,
    operation
  );
}

/** Release a held operation after an inline completion (no redirect happened). */
export function clearOperation(oid: string): void {
  useOperations().clearOperation(oid);
}

/**
 * The return url carrying the operation's reference, so the machine reads THAT
 * operation back rather than whatever was held last.
 */
export function getOperationReturnUrl(oid: string): string {
  const returnUrl = new URL(window.location.href);
  returnUrl.searchParams.set(QUERY_PARAMS.OPERATION_ID, oid);
  return returnUrl.toString();
}
