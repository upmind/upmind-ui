// --- externals
import { parse, type ParsedDomain } from "psl";

// --- internals
import { useBrand } from "../brand";
import { calculateBillingTerm } from "../product/services";

// --- utils
import {
  parseProductDetails,
  parseQuantity,
  parseTermDetails,
} from "../product/utils";
import {
  compact,
  find,
  first,
  get,
  has,
  isEmpty,
  isNil,
  subtract,
  isObject,
  map,
  orderBy,
  reduce,
  set,
  uniqBy,
} from "lodash-es";

// --- types
import {
  IBasketProduct,
  IProduct,
  IProductPrice,
} from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import type { DomainProduct, DomainModel } from "./types";

// ----------------------------------------------------------------------------
const DOMAIN_PATTERN =
  /^(((?!-))(xn--|_)?[a-z0-9-]{0,61}[a-z0-9]{1,1}\.)*(xn--)?([a-z0-9][a-z0-9\-]{0,60}|[a-z0-9-]{1,30}\.[a-z]{2,})$/i;

export function parseDomain(raw: any, force = false): DomainModel | undefined {
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

export async function parseAvailable(
  sld: string,
  results: IProduct[] = [],
  preferredCycle?: number // If we have chosen a term then we need to try use that term
): Promise<DomainProduct[]> {
  const { getDefaultPaymentPeriod } = useBrand();
  const defaultPaymentPeriod = preferredCycle ?? getDefaultPaymentPeriod();

  const available = await Promise.all(
    map(results, (raw: IProduct) => {
      // This is where we map our domain search result raw to a format that we can use in our basket
      // The mapping is pretty simple, except for the term, which we need to calculate the billing cycle years
      // The CRITICAL part is actually the  subproduct choices:
      // We only include the sub_product_id given to us by the API, and we only include the choices that match that sub_product_id
      // This is how the TRANSFER domain works, we have a sub_product_id for the domain transfer option.
      // To be 100% safe we check for the sub_product_id in our OPTIONS and ATTRIBUTES, and only include the choices that match that sub_product_id
      // ---

      const domain = `${sld}${raw.tld}`;
      const parsedDomain = parseDomain(domain);
      const productDetails = parseProductDetails(raw);
      const terms = parseTermDetails(raw.prices);
      const termDetails = calculateBillingTerm(
        defaultPaymentPeriod || raw.default_payment_period,
        terms
      );

      return {
        // ---
        configuration: {
          productId: raw.id, //raw.product_id,
          quantity: raw.unit_quantity ?? 1,
        },
        // ---
        domain: parsedDomain?.domain ?? domain,
        sld: parsedDomain?.sld ?? sld,
        tld: parsedDomain?.tld ?? raw.tld,
        // ---
        meta: {
          ...(termDetails.meta ?? {}),
          available: raw?.domain_available,
        },
        productDetails: {
          ...productDetails,
          title: domain,
        },
        price: termDetails.price,
        pricing: [],
        details: [],
      } as DomainProduct;
    })
  );

  // and ensure we don't have any duplicates or falsy
  return compact(uniqBy(available, "domain"));
}

export function parseValue(
  raw: (DomainModel | DomainProduct) | string,
  values: (DomainModel | DomainProduct)[] = [],
  available: any[] = []
): DomainModel {
  // parse the domain name provided
  const value = (isObject(raw) ? get(raw, "domain") : raw)?.toLowerCase();
  // check if we already have the domain
  let domain: DomainModel = find(values, ["domain", value]) as DomainModel;

  // if we dont then add it to our list of values, if it exists in available
  domain ??= find(available, ["domain", value]);

  // finally parse the domain name provided and check if its a valid domain
  domain ??= parseDomain(value) as DomainModel;

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
