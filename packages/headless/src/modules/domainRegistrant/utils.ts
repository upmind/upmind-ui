// --- utils
import { defaultsDeep, get } from "lodash-es";

// --- types
import type { Address, Company } from "../client";
import type { ProductModel } from "../product/types";

// -----------------------------------------------------------------------------
/**
 * @module domainRegistrant/utils
 * @description Utility functions for domain registrant data mapping.
 */

// -----------------------------------------------------------------------------

/**
 * Maps billing source (Address or Company) to provision fields.
 *
 * @param billing - Address or Company entity
 * @param baseModel - Existing provision fields to check for nullish values
 * @returns Record of provision field key → value pairs
 */
export function mapBillingToProvisionFields(
  billing: Address | Company,
  baseModel: ProductModel["provisionFields"]
): ProductModel["provisionFields"] {
  if (!billing) return {};

  const result = defaultsDeep(
    {
      registrant_organisation: get(billing, "name"),
      registrant_address_1: get(billing, "address.address1"),
      registrant_city: get(billing, "address.city"),
      registrant_state: get(billing, "address.state"),
      registrant_postcode: get(billing, "address.postcode")
    },
    baseModel
  ) as ProductModel["provisionFields"];

  return result;
}
