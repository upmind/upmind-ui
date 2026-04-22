// --- utils
import { every, filter, forEach, get, isEmpty } from "lodash-es";

// --- types
import type { Address, Company } from "../client";
import {
  DOMAIN_REGISTRANT_PRODUCT_STATUS,
  PROVISION_TO_BILLING_MAP,
  REQUIRED_REGISTRANT_FIELDS,
  type DomainRegistrantProductStatus
} from "./types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/utils
 * @description Utility functions for domain registrant data mapping and validation.
 */

// -----------------------------------------------------------------------------

/**
 * Maps billing source (Address or Company) to provision fields.
 * Uses PROVISION_TO_BILLING_MAP to resolve paths from the billing model.
 *
 * @param model - Address or Company entity
 * @returns Record of provision field key → value pairs
 */
export function mapBillingToProvisionFields(
  model: Address | Company | null
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!model) return result;

  forEach(PROVISION_TO_BILLING_MAP, (billingPath, provisionKey) => {
    const value = get(model, billingPath, "") as string | undefined;
    if (!isEmpty(value)) {
      result[provisionKey] = value ?? "";
    }
  });

  return result;
}

/**
 * Checks if a product's registrant data is complete based on required fields.
 *
 * @param data - Registrant data keyed by provision field name
 * @returns `true` if all required fields have values
 */
export function isProductComplete(data: Record<string, string>): boolean {
  return every(
    REQUIRED_REGISTRANT_FIELDS,
    (field: string) => !isEmpty(data[field])
  );
}

/**
 * Determines the status of a registrant product state.
 *
 * @param data - Registrant data
 * @param currentStatus - Current status (preserves "skipped" if set)
 * @returns Updated status
 */
export function determineStatus(
  data: Record<string, string>,
  currentStatus: DomainRegistrantProductStatus
): DomainRegistrantProductStatus {
  if (currentStatus === DOMAIN_REGISTRANT_PRODUCT_STATUS.SKIPPED) {
    return DOMAIN_REGISTRANT_PRODUCT_STATUS.SKIPPED;
  }
  return isProductComplete(data)
    ? DOMAIN_REGISTRANT_PRODUCT_STATUS.COMPLETE
    : DOMAIN_REGISTRANT_PRODUCT_STATUS.INCOMPLETE;
}

/**
 * Returns the list of required registrant fields that are missing values.
 *
 * @param data - Registrant data keyed by provision field name
 * @returns Array of missing required field keys
 */
export function getMissingRegistrantFields(
  data: Record<string, string>
): string[] {
  return filter(REQUIRED_REGISTRANT_FIELDS, (field: string) =>
    isEmpty(data[field])
  );
}
