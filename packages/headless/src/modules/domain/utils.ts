// --- externals

// --- utils
import { parseQuantity } from "../product/utils";
import {
  compact,
  find,
  first,
  get,
  isObject,
  map,
  orderBy,
  reduce,
  set,
  uniqBy,
  isNil,
} from "lodash-es";

// --- types
import type { DomainProduct, Domain } from "./types";
import type { BasketProduct } from "../basket";
// ----------------------------------------------------------------------------

export function parseDomain(raw: any, force = false) {
  if (isObject(raw)) raw = get(raw, "domain");

  const parsed = raw
    ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-.]?/gi, "")
    ?.toLowerCase();

  const value = {
    domain: parsed,
    tld: parsed?.match(/(?:^[^.]+)(\..{2,})/i)?.[1] || "",
    sld: (first(parsed?.split(".")) as string) || "",
  };

  if ((value.domain && value.tld && value.sld) || force) return value;

  return undefined;
}

export function parseSld(raw: string) {
  if (!raw?.length) return "";

  const parsed = raw
    ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-.]?/gi, "")
    ?.toLowerCase();

  const value = first(parsed?.split(".")) || "";
  return value;
}

export function parseAvailable(sld: string, results = [] as DomainProduct[]) {
  // parse the results
  const available = map(results, item => parseProduct({ ...item, sld }));

  // and ensure we don't have any duplicates or falsy
  return compact(uniqBy(available, "domain"));
}

export function parseValue(
  raw: any,
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

export function parseProduct(raw: any) {
  // This is where we map our domain search result raw to a format that we can use in our basket
  // The mapping is pretty simple, except for the term, which we need to calculate the billing cycle years
  // The CRITICAL part is actually the  subproduct choices:
  // We only include the sub_product_id given to us by the API, and we only include the choices that match that sub_product_id
  // This is how the TRANSFER domain works, we have a sub_product_id for the domain transfer option.
  // To be 100% safe we check for the sub_product_id in our OPTIONS and ATTRIBUTES, and only include the choices that match that sub_product_id
  // ---
  // we may not have a service identifier ( if the domain is not in the basket yet)
  const name = [raw.sld, raw.tld].join("");
  const parsed = parseDomain(name);
  const result: DomainProduct = {
    productId: raw.product_id,
    quantity: raw.quantity,
    options: mapSubproductChoices(raw?.options, raw?.sub_product_id),
    attributes: mapSubproductChoices(raw?.attributes, raw?.sub_product_id),
    // ---
    tld: parsed?.tld || "",
    sld: parsed?.sld || "",
    domain: parsed?.domain || "",
  };
  // TODO: Not This! we should use a util from the product module for consistency
  // also we may need to calculate the correct term and not just use the first one
  const term = first(orderBy(raw.prices, "billing_cycle_months", "asc"));
  result.cycle = raw?.billing_cycle_months || term?.billing_cycle_months;

  result.summary = {
    isAvailable: raw?.domain_available,
    currentAmount: term?.price_discounted ?? term.price,
    currentPrice: term?.price_discounted_formatted ?? term.price_formatted,
    regularAmount: term?.price,
    regularPrice: term?.price_formatted,
    meta: {
      discounted: (term?.price_discounted ?? term.price) != term.price,
      free: (term.price_discounted ?? term.price) == 0,
      oneoff: term?.billing_cycle_months == 0,
    },
  };

  return result;
}

export function parseBasketItem(data: BasketProduct): DomainProduct {
  const name = data.product.serviceIdentifier;
  const parsed = parseDomain(name);

  const result = {
    productId: data.productId,
    tld: parsed?.tld,
    sld: parsed?.sld,
    domain: parsed?.domain,
  };

  return result;
}

export const mapSubproductChoices = (values: any, requiredId: string) => {
  return reduce(
    values,
    (result, value) => {
      if (requiredId == value.id)
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
// ---
