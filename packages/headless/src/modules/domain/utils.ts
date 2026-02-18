// --- externals
import { parse } from "psl";

// --- internals
import { useBrand } from "../brand";
import { calculateBillingTerm, parseProductProps } from "../product/utils";

// --- utils
import { parseProductDetails, parseTermDetails } from "../product/utils";
import {
  compact,
  filter,
  find,
  first,
  get,
  has,
  isEmpty,
  isObject,
  map,
  uniqBy
} from "lodash-es";

// --- types
import {
  type IBasketProduct,
  type IBlueprint,
  type IProduct,
  ProvisionCategoryCodes
} from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import type {
  DomainProduct,
  DomainModel,
  IDomainSuggestionsResponse
} from "./types";
import { type ProductProps } from "../product";

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
    domain: parsed.domain
  };
}

export function parseSld(raw: string): string {
  const parsed = parseDomain(raw ?? "");
  const sld = !parsed?.sld ? first(raw?.split(".")) || "" : parsed.sld;
  return sld?.replace(/[^a-zA-Z0-9-]/g, "");
}

/**
 * Parses a raw domain string and extracts the second-level domain (SLD) and top-level domain (TLD).
 *
 * The function attempts to match and extract the SLD and TLD from a given string,
 * which may include protocol and subdomain prefixes. Non-alphanumeric characters
 * (except hyphens) are removed from the SLD.
 *
 * @param raw - The raw domain string to parse (may include protocol or subdomain).
 * @returns An object containing the extracted `sld` (second-level domain) and `tld` (top-level domain).
 */
export function parseDomainParts(raw: string): { sld: string; tld?: string } {
  const match = raw.match(
    /^(?:https?:\/{1,})?(?:w{3}\.)?([^\.]+)(\.[\.\w]{2,})?(?:.*)$/i
  );
  const [, sld, tld] = match ?? [];
  return { sld: sld?.replace(/[^a-zA-Z0-9-]/g, "") || "", tld };
}

export function parseAvailable(
  sld: string,
  results: IProduct[] = [],
  preferredCycle?: number // If we have chosen a term then we need to try use that term
) {
  const { defaultPaymentPeriod } = useBrand();
  const paymentPeriod = preferredCycle ?? defaultPaymentPeriod.value;
  const available = map(results, (raw: IProduct) => {
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
    const terms = parseTermDetails(raw);
    const termDetails = calculateBillingTerm(
      paymentPeriod || raw.default_payment_period,
      terms
    );

    return {
      // ---
      configuration: parseProductProps(
        {
          productId: raw.id,
          quantity: raw.unit_quantity,
          subproducts: compact([raw.sub_product_id]),
          provisionFields: { sld }
        },
        raw,
        preferredCycle
      ),
      // ---
      domain: parsedDomain?.domain ?? domain,
      sld: parsedDomain?.sld ?? sld,
      tld: parsedDomain?.tld ?? raw.tld,
      // ---
      meta: {
        ...(termDetails.meta ?? {}),
        available: raw?.domain_available
      },
      productDetails: {
        ...productDetails,
        title: domain
      },
      price: termDetails.price,
      pricing: [],
      details: []
    } as DomainProduct;
  });

  // and ensure we don't have any duplicates or falsy
  return compact(uniqBy(available, "domain"));
}

/**
 * Maps the new /suggestions API response shape into DomainProduct[].
 * Joins results[] to products[] via product_id, maps price_formatted /
 * price_discounted_formatted into the PriceDetail shape.
 */
export function parseSuggestions(
  sld: string,
  response: IDomainSuggestionsResponse,
  preferredCycle?: number
): DomainProduct[] {
  const { results = [], products = [] } = response;

  const available = map(results, result => {
    const { tld, product_id, domain_available } = result;
    const domain = `${sld}${tld}`;
    const parsedDomain = parseDomain(domain);

    const product = find(products, ["id", product_id]);
    const prices = product?.prices ?? [];
    const priceEntry =
      find(prices, ["billing_cycle_months", preferredCycle]) ?? first(prices);

    const priceFormatted = priceEntry?.price_formatted ?? "";
    const priceDiscountedFormatted =
      priceEntry?.price_discounted_formatted ?? null;
    const billingCycleMonths = priceEntry?.billing_cycle_months ?? 12;

    return {
      domain: parsedDomain?.domain ?? domain,
      sld: parsedDomain?.sld ?? sld,
      tld: parsedDomain?.tld ?? tld,
      configuration: {
        productId: product_id,
        term: billingCycleMonths,
        quantity: 1,
        provisionFields: { sld }
      },
      price: {
        currentPrice: priceDiscountedFormatted ?? priceFormatted,
        currentAmount: 0,
        regularPrice: priceFormatted,
        regularAmount: 0,
        savingAmount: 0,
        savingPrice: "",
        savingPercent: ""
      },
      meta: {
        available: domain_available
      },
      productDetails: {
        id: product_id,
        title: domain,
        name: product?.name ?? tld
      },
      pricing: [],
      details: []
    } as unknown as DomainProduct;
  });

  return compact(uniqBy(available, "domain"));
}

export function parseValue(
  raw: (DomainModel | DomainProduct) | string,
  values: (DomainModel | DomainProduct)[] = [],
  available: DomainProduct[] = []
): DomainModel {
  // parse the domain name provided
  const value = (isObject(raw) ? get(raw, "domain") : raw)?.toLowerCase();

  // check if we already have the domain
  let found = find(values, ["domain", value]);

  // if we dont then check if it exists in our available domains ( searched )
  found ??= find(available, ["domain", value]);

  // return the parsed domain model
  return found
    ? (parseDomain(found.domain) as DomainModel)
    : (parseDomain(value) as DomainModel);
}

/**
 * Determines if a product is a domain product based on provided indicators.
 * We check against blueprint code and provision fields to make a determination.
 * However, if no indicators are provided, we fall back to parsing the service identifier.
 * @param params.blueprintCode - The blueprint code of the product.
 * @param params.provisionFields - The provision fields of the product.
 * @param params.serviceIdentifier - The fallback service identifier of the product.
 * @returns True if the product is identified as a domain product, false otherwise.
 */
export function isDomainProduct({
  blueprintCode,
  provisionFields,
  serviceIdentifier
}: {
  blueprintCode?: IBlueprint["code"];
  serviceIdentifier?: IBasketProduct["service_identifier"];
  provisionFields?: Record<string, any>;
}): boolean {
  const parsed = parseDomain(serviceIdentifier || "");

  // If we dont have any indicators then we need to return based on parsed domain
  if (!blueprintCode && !provisionFields) return !!parsed?.domain;

  // but if we do have indicators then we can be more certain
  return (
    blueprintCode === ProvisionCategoryCodes.DOMAIN_NAMES ||
    has(provisionFields, "sld")
  );
}

export function getDomainBasketProducts(
  products?: BasketProduct[]
): BasketProduct[] {
  if (isEmpty(products)) return [];

  // check if we have the parsed basket product structure
  return filter(products, raw => {
    return isDomainProduct({
      blueprintCode: raw?.productDetails.blueprintCode,
      serviceIdentifier: raw?.serviceIdentifier,
      provisionFields: raw?.configuration.provisionFields
    });
  });
}

export function getDomainRawBasketProducts(
  products?: IBasketProduct[]
): IBasketProduct[] {
  if (isEmpty(products)) return [];

  // check if we have the parsed basket product structure
  return filter(products, raw => {
    return isDomainProduct({
      blueprintCode: raw?.product?.provision_blueprint?.category?.code,
      provisionFields: raw?.provision_fields,
      serviceIdentifier: raw?.service_identifier ?? undefined
    });
  });
}
