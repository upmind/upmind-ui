// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContract/contract.types
 * @description What a record hands the shared contract summary.
 */

// -----------------------------------------------------------------------------

export type ContractSummarySource = {
  /** The `.../properties` scope of a wire `IContract`. */
  base: string;
  /** Labels name the contract — for a summary drawn inside another record. */
  prefixed?: boolean;
  /** The billing-cycle label's scope, where the record carries one. */
  billingCycle?: string;
  /** The payment method's name scope, where the record carries one. */
  paymentMethod?: string;
};
