// --- externals
import { parse, type ParsedDomain } from "psl";

// --- internals
import { useBrand } from "../brand";

// --- utils
import { parseQuantity } from "../product/utils";
import {
  compact,
  find,
  first,
  get,
  has,
  isEmpty,
  isNil,
  isObject,
  map,
  orderBy,
  reduce,
  set,
  uniqBy,
} from "lodash-es";

// --- types
import { IBasketProduct, IProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import type { DomainProduct, Domain } from "./types";

// ----------------------------------------------------------------------------
const DOMAIN_PATTERN =
  /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i;

export function parseDomain(raw: any, force = false): Domain | undefined {
  let domain = (isObject(raw) ? get(raw, "domain") : raw) ?? "";

  if (isEmpty(domain) || !DOMAIN_PATTERN.test(domain)) return undefined;

  const parsed = parse(domain);
  if ("error" in parsed || !parsed?.domain) return undefined;

  return {
    tld: `.${parsed.tld}`, // need to ad dthe "." back in
    sld: parsed.sld ?? "",
    domain: parsed.domain,
  };
}

export function parseSld(raw: string): string {
  const parsed = parseDomain(raw ?? "");
  const sld = !parsed?.sld ? first(raw?.split(".")) || "" : parsed.sld;
  return sld?.replace(/[^a-zA-Z0-9-]/g, "");
}

export function parseAvailable(
  sld: string,
  results: IProduct[] = []
): DomainProduct[] {
  const { checkIncludesTax } = useBrand();
  const available = map(results, raw => {
    // This is where we map our domain search result raw to a format that we can use in our basket
    // The mapping is pretty simple, except for the term, which we need to calculate the billing cycle years
    // The CRITICAL part is actually the  subproduct choices:
    // We only include the sub_product_id given to us by the API, and we only include the choices that match that sub_product_id
    // This is how the TRANSFER domain works, we have a sub_product_id for the domain transfer option.
    // To be 100% safe we check for the sub_product_id in our OPTIONS and ATTRIBUTES, and only include the choices that match that sub_product_id
    // ---

    const domain = `${sld}${raw.tld}`;
    const parsedDomain = parseDomain(domain);

    // TODO: Not This! we should use a util from the product module for consistency
    // also we may need to calculate the correct term and not just use the first one
    const term = first(orderBy(raw.prices, "billing_cycle_months", "asc"));
    const discounted = (term?.price_discounted ?? term?.price) != term?.price;
    const savingsAmount =
      discounted && term?.price
        ? ((term.price - (term?.price_discounted ?? term.price)) / term.price) *
          100
        : 0;

    const result: DomainProduct = {
      productId: raw.id, //raw.product_id,
      quantity: 1,
      term: raw?.billing_cycle_months ?? term?.billing_cycle_months ?? 0,
      options: parseSubproductChoices(
        raw?.products_options,
        raw?.sub_product_id
      ),
      attributes: parseSubproductChoices(
        raw?.products_attributes,
        raw?.sub_product_id
      ),
      // ---
      domain: parsedDomain?.domain ?? "",
      sld: parsedDomain?.sld ?? "",
      tld: parsedDomain?.tld ?? "",
      // ---
      summary: {
        currentAmount: term?.price_discounted ?? term?.price,
        currentPrice: term?.price_discounted_formatted ?? term?.price_formatted,
        regularAmount: term?.price,
        regularPrice: term?.price_formatted,
        currentSavingAmount: Math.round(savingsAmount * 100) / 100,
        currentSaving: discounted ? `${Math.round(savingsAmount)}%` : "",

        meta: {
          // @ts-ignore - NB this does actually exist on the raw product
          available: raw?.domain_available,
          discounted,
          includesTax: checkIncludesTax(),
          free: (term?.price_discounted ?? term?.price) == 0,
          oneoff: term?.billing_cycle_months == 0,
        },
      },
    };

    return result;
  });

  // and ensure we don't have any duplicates or falsy
  return compact(uniqBy(available, "domain"));
}

export function parseValue(
  raw: (Domain | DomainProduct) | string,
  values: (Domain | DomainProduct)[] = [],
  available: any[] = []
) {
  // parse the domain name provided
  const value = (isObject(raw) ? get(raw, "domain") : raw)?.toLowerCase();
  // check if we already have the domain
  let domain: any = find(values, ["domain", value]);

  // if we dont then add it to our list of values, if it exists in available
  domain ??= find(available, ["domain", value]);
  // finally parse the domain name provided and check if its a valid domain
  domain ??= parseDomain(value);

  return domain;
}

export const parseSubproductChoices = (values: any, subproductId?: string) => {
  return reduce(
    values,
    (result, value) => {
      if (subproductId == value.id)
        set(result, [value.category_id, value.id], {
          productId: value.id,
          unitQuantity: parseQuantity(value.unit_quantity, value),
          cycle: value.billing_cycle_months,
        });
      return result;
    },
    {}
  );
};
