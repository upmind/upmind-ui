// --- utils
import { parseQuantity } from "../product/utils";
import { calculateBillingTerm } from "../product/services";
import { isEmpty, omit, toSafeInteger } from "lodash-es";
import { parseProductDetails, parseTermDetails } from "../product/utils";

// --- types
import type { Product } from "../product";
import type { IProduct } from "@upmind-automation/types";
import type { ProductDetails, TermDetails } from "../product";

// ---------------------------------------------------------------------------

/**
 * Parses the raw product data and transforms it into a structured `Product` object.
 *
 * @param {IProduct} raw - The raw product data object, containing all the information
 * about a product as received from the data source.
 *
 * @return {Product} The transformed and structured `Product` object containing
 * details, pricing information, and default configuration for basket addition.
 */
export function parseProduct(raw: IProduct): Product {
  const productDetails: ProductDetails = !isEmpty(raw)
    ? parseProductDetails(raw)
    : ({} as ProductDetails);

  const terms = parseTermDetails(raw?.prices);
  const term = !isEmpty(terms)
    ? calculateBillingTerm(productDetails?.cycle, terms)
    : ({} as TermDetails);

  // ---------------------------------------------------------------------------
  return {
    id: raw.id, // this is the internal id of the recommendation, with a fallback to a random uuid for the meta-generated recommendations; they don't have an id
    productDetails: omit(productDetails, ["uiCategoryMeta", "uiMeta"]),
    meta: term?.meta,
    promotions: term?.promotions,
    price: term?.price,
    pricing: [],
    details: [],
    // --- default config to be used when adding to a basket
    configuration: {
      productId: raw.id,
      quantity: parseQuantity(
        toSafeInteger(productDetails?.min || productDetails?.step || 1),
        productDetails
      ),
      term: term?.cycle ?? 0,
      coupons: [],
      subproducts: [],
      provisionFields: {},
    },
  } as Product;
}
