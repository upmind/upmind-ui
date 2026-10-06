// -----------------------------------------------------------------------------
/**
 * @module portal/mock/forms/product-contexts
 * @description What one product's schema modules are handed (plan F4) — the
 * setup blueprint the provider published, and the cancellation choices this
 * brand and this product between them allow.
 *
 * Which cancellation options apply is a GATE, and gates are the dataset's
 * (plan R8): the brand decides whether a client may stop a product at once,
 * and legacy offered the other two to everybody.
 */

import { ContractStatusCodes } from "@upmind-automation/types";
import { CANCEL_OPTION } from "../contracts";
import { compact } from "lodash-es";
import type { CancellationContext, ContractCancelOption } from "../contracts";
import type { ProvisioningSetupContext } from "../contracts/contract-product-provisioning";
import type { MockDataset, MockProduct } from "../types";
// -----------------------------------------------------------------------------

/**
 * What `contract-product-provisioning`'s own setup builders are handed — the
 * product's own blueprint. A product with no fields still has a form: the
 * Confirm control is the whole of legacy's setup step for a provider that
 * asks nothing.
 */
export function provisioningSetupContext(
  product: MockProduct
): ProvisioningSetupContext {
  return { fields: product.provisioning.fields };
}

/** The choices this brand and this product between them allow. */
export function cancellationOptions(data: MockDataset): ContractCancelOption[] {
  return compact([
    CANCEL_OPTION.END_OF_BILLING_CYCLE,
    data.features.SUBSCRIPTIONS_ALLOW_IMMEDIATE_CANCELLATION &&
      CANCEL_OPTION.IMMEDIATELY,
    CANCEL_OPTION.SCHEDULED
  ]);
}

/**
 * What `client-contract-product`'s own cancellation builders are handed — the
 * options above, the brand's own questions on the way out, and the two facts
 * the immediate-cancellation warning is worded from (legacy's
 * `isHardCancellation && !isPendingContract`).
 */
export function cancellationFormContext(
  data: MockDataset,
  product: MockProduct
): CancellationContext {
  return {
    options: cancellationOptions(data),
    fields: data.cancellationFields,
    productName: product.name,
    isPending: product.status === ContractStatusCodes.PENDING
  };
}
