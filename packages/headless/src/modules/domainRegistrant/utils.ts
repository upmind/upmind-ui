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
  model: Address | Company,
  baseModel: ProductModel["provisionFields"]
): NonNullable<ProductModel["provisionFields"]> {
  if (!model) return {};

  const result = defaultsDeep(
    {
      registrant_organisation: get(model, "name"),
      registrant_address_1: get(model, "address.address1"),
      registrant_city: get(model, "address.city"),
      registrant_state: get(model, "address.state"),
      registrant_postcode: get(model, "address.postcode")
    },
    baseModel
  ) as NonNullable<ProductModel["provisionFields"]>;

  return result;
}

/**
 * Maps billing source (Address or Company) to provision fields.
 *
 * @param billing - Address or Company entity
 * @param baseModel - Existing provision fields to check for nullish values
 * @returns Record of provision field key → value pairs
 */
export function mapProvisionFields(
  model: ProductModel["provisionFields"],
  baseModel: ProductModel["provisionFields"]
): NonNullable<ProductModel["provisionFields"]> {
  const result = defaultsDeep(model, baseModel) as NonNullable<
    ProductModel["provisionFields"]
  >;

  return result;
}
