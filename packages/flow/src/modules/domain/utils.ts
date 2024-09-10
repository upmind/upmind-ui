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
} from "lodash-es";

// --- types
import type { IDomainProduct } from "./types.d";
// ----------------------------------------------------------------------------

export function parseDomain(data: any) {
  if (isObject(data)) data = get(data, "domain");

  const parsed = data
    ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-.]?/gi, "")
    ?.toLowerCase();

  const value = {
    domain: parsed,
    tld: parsed?.match(/(?:^[^.]+)(\..{2,})/i)?.[1] || "",
    sld: (first(parsed?.split(".")) as string) || "",
  };

  if (value.domain && value.tld && value.sld) return value;

  return undefined;
}

export function parseSld(data: string) {
  if (!data?.length) return "";

  const parsed = data
    ?.replace(/(^https?:\/\/)?(w{3}\.)?[^a-z0-9\-.]?/gi, "")
    ?.toLowerCase();

  const value = first(parsed?.split(".")) || "";
  return value;
}

export function parseAvailable(sld: string, results = [] as IDomainProduct[]) {
  // parse the results
  const available = map(results, item => parseProduct({ ...item, sld }));

  // and ensure we don't have any duplicates or falsy
  return compact(uniqBy(available, "domain"));
}

export function parseValue(data: any, values = [], available = []) {
  // parse the domain name provided
  // @ts-ignore
  const value = (isObject(data) ? data?.domain : data)?.toLowerCase();

  // check if we already have the domain
  let domain: any = find(values, ["domain", value]);

  // if we dont then add it to our list of values, if it exists in available
  domain ??= find(available, ["domain", value]);

  // finally parse the domain name provided and check if its a valid domain
  domain ??= parseDomain(value);

  return domain;
}

export function parseProduct(data: any) {
  // This is where we map our domain search result data to a format that we can use in our basket
  // The mapping is pretty simple, except for the term, which we need to calculate the billing cycle years
  // The CRITICAL part is actually the  subproduct choices:
  // We only include the sub_product_id given to us by the API, and we only include the choices that match that sub_product_id
  // This is how the TRANSFER domain works, we have a sub_product_id for the domain transfer option.
  // To be 100% safe we check for the sub_product_id in our OPTIONS and ATTRIBUTES, and only include the choices that match that sub_product_id
  // ---
  // we may not have a service identifier ( if the domain is not in the basket yet)
  const name = [data.sld, data.tld].join("");
  const parsed = parseDomain(name);

  const result: IDomainProduct = {
    product_id: data.product_id,
    quantity: data.quantity,
    options: mapSubproductChoices(data?.options, data?.sub_product_id),
    attributes: mapSubproductChoices(data?.attributes, data?.sub_product_id),
    is_available: data?.domain_available,
    // ---
    tld: parsed?.tld || "",
    sld: parsed?.sld || "",
    domain: parsed?.domain || "",
  };
  // TODO: Not This! we should use a util from the product module for consistency
  // also we may need to calculate the correct term and not just use the first one
  const term = first(orderBy(data.prices, "billing_cycle_months", "asc"));
  result.billing_cycle_months =
    data?.billing_cycle_months || term?.billing_cycle_months;
  result.is_discounted = !!term?.price_discounted;
  result.price_discounted = term?.price_discounted;
  result.price_discounted_formatted = term?.price_discounted_formatted;
  result.price = term?.price;
  result.price_formatted = term?.price_formatted;

  return result;
}

export function parseBasketItem(data: any) {
  // we may not have a service identifier ( if the domain is not in the basket yet)
  const name =
    data?.service_identifier ||
    [data?.provision_fields?.sld, data?.name].join("");

  const parsed = parseDomain(name);

  const result = {
    product_id: data.product_id,
    tld: parsed?.tld,
    sld: parsed?.sld,
    domain: parsed?.domain,
  };

  return result;
}

export const mapSubproductChoices = (values: any, required_id: string) => {
  return reduce(
    values,
    (result, value) => {
      if (required_id == value.id)
        set(result, [value.category_id, value.id], {
          product_id: value.id,
          unit_quantity: parseQuantity(value.unit_quantity, value),
          billing_cycle_months: value.billing_cycle_months,
        });
      return result;
    },
    {}
  );
};
// ---
