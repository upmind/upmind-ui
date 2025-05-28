// --- external

// --- internal
import { parseProductDetails, parseTermDetails } from "../product/utils";

// --- utils
import { isEmpty, omit } from "lodash-es";

// --- types
import type { Product } from "../product";
import { calculateBillingTerm } from "../product/services";
import { ProductDetails, TermDetails } from "../product";
import { IProduct } from "@upmind-automation/types";

// ---------------------------------------------------------------------------

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
    id: raw.id, // this is the  internal id of the recommendation, with a fallback to a random uuid for the meta generated recommendations, they dont have an id
    productDetails: omit(productDetails, ["uiCategoryMeta", "uiMeta"]),
    meta: term?.meta,
    promotions: term?.promotions,
    price: term?.price,
    pricing: [],
    details: [],
  } as Product;
}
