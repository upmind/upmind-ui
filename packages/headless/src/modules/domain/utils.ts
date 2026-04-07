// --- externals
import { parse } from "psl";

// --- internals
import { useBrand } from "../brand";
import {
  calculateBillingTerm,
  parseProductProps,
  parsePrice
} from "../product/utils";

// --- utils
import { parseProductDetails, parseTermDetails } from "../product/utils";
import {
  compact,
  filter,
  find,
  first,
  get,
  has,
  includes,
  isEmpty,
  isObject,
  map,
  reduce,
  some,
  sortBy,
  uniqBy
} from "lodash-es";

// --- types
import {
  type IBasketProduct,
  type IBlueprint,
  type IProduct,
  type IProductPrice,
  ProvisionCategoryCodes
} from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import type {
  DomainProduct,
  DomainModel,
  RegistrantDetails,
  RegistrantFieldMapEntry,
  IDomainSuggestionResult
} from "./types";
import { REGISTRANT_FIELD_MAP, REQUIRED_REGISTRANT_FIELDS } from "./types";
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
      details: [],
      rawProduct: raw
    } as DomainProduct;
  });

  // and ensure we don't have any duplicates or falsy
  return compact(uniqBy(available, "domain"));
}

/**
 * Maps the /suggestions API results into DomainProduct[].
 * Joins results to products via product_id, and uses the full
 * IProduct parsing utilities for proper billing cycle / pricing support.
 */
export function parseSuggestions(
  results: IDomainSuggestionResult[],
  productsMap: Record<string, IProduct>,
  preferredCycle?: number,
  mode: "register" | "transfer" = "register"
): DomainProduct[] {
  const { defaultPaymentPeriod } = useBrand();
  const paymentPeriod = preferredCycle ?? defaultPaymentPeriod.value;

  const available = map(results, result => {
    const { domain, sld, tld, can_register, can_transfer, product_id } = result;
    const fullDomain = `${sld}.${tld}`;
    const parsedDomain = parseDomain(fullDomain);
    const product = productsMap[product_id];

    if (product) {
      try {
        // Full IProduct available — use proper product parsing
        const productDetails = parseProductDetails(product);
        const terms = parseTermDetails(product);
        const termDetails = calculateBillingTerm(
          paymentPeriod || product.default_payment_period,
          terms
        );

        // Extract sub_pids from setup_function_sub_ids based on mode
        const setupSubIds = product.setup_function_sub_ids;
        const subproducts: string[] = compact(
          setupSubIds?.[mode] ?? [product.sub_product_id]
        );

        return {
          configuration: parseProductProps(
            {
              productId: product.id,
              quantity: product.unit_quantity,
              subproducts,
              provisionFields: { sld }
            },
            product,
            preferredCycle
          ),
          domain: parsedDomain?.domain ?? fullDomain,
          sld: parsedDomain?.sld ?? sld,
          tld: parsedDomain?.tld ?? `.${tld}`,
          meta: {
            ...(termDetails.meta ?? {}),
            available: can_register,
            canTransfer: can_transfer
          },
          productDetails: {
            ...productDetails,
            title: fullDomain
          },
          price: termDetails.price,
          pricing: [],
          details: [],
          rawProduct: product
        } as DomainProduct;
      } catch (err) {
        console.warn(
          `[parseSuggestions] Product parsing failed for ${fullDomain}, using fallback`,
          err
        );
      }
    }

    const prices = product?.prices ?? [];
    // Prefer 12-month price, then preferred cycle, then lowest term
    const sortedPrices = sortBy(prices, "billing_cycle_months");
    const priceEntry =
      find(prices, (p: IProductPrice) => p.billing_cycle_months === 12) ??
      find(
        prices,
        (p: IProductPrice) => p.billing_cycle_months === preferredCycle
      ) ??
      first(sortedPrices);

    const billingCycleMonths = priceEntry?.billing_cycle_months ?? 12;

    return {
      domain: parsedDomain?.domain ?? fullDomain,
      sld: parsedDomain?.sld ?? sld,
      tld: parsedDomain?.tld ?? `.${tld}`,
      configuration: {
        productId: product_id,
        term: billingCycleMonths,
        quantity: 1,
        provisionFields: { sld }
      },
      price: parsePrice(priceEntry as IProductPrice),
      meta: {
        available: can_register,
        canTransfer: can_transfer
      },
      productDetails: {
        id: product_id,
        title: fullDomain,
        name: product?.name ?? `.${tld}`
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

/**
 * Checks whether a product object indicates a domain transfer
 * by inspecting its name, code, or domain_operation_code fields.
 *
 * @param product - A raw product or catalog option object.
 * @returns `true` if the product is identified as a transfer product.
 */
export function hasTransferIndicator(product: any): boolean {
  if (!product) return false;
  const name = (product.name ?? "").toLowerCase();
  const code = (product.code ?? "").toLowerCase();
  const opCode = (product.domain_operation_code ?? "").toLowerCase();
  return (
    name.includes("transfer") ||
    code.includes("transfer") ||
    opCode === "transfer"
  );
}

/**
 * Determines whether a raw basket product represents a domain transfer.
 *
 * Uses a tiered approach:
 * 1. Match option product IDs against typed `setup_function_sub_ids.transfer`.
 * 2. Check option sideloaded products for transfer indicators.
 * 3. Match against catalog `products_options` for transfer indicators.
 *
 * @param raw - A raw basket product from the API.
 * @returns `true` if the basket product is a domain transfer.
 */
export function isBasketTransfer(raw: IBasketProduct): boolean {
  const transferSubIds = raw.product?.setup_function_sub_ids?.transfer ?? [];

  if (
    transferSubIds.length > 0 &&
    some(raw.options, (opt: any) => includes(transferSubIds, opt.product_id))
  ) {
    return true;
  }

  if (some(raw.options, (opt: any) => hasTransferIndicator(opt.product))) {
    return true;
  }

  const catalogOptions = raw.product?.products_options ?? [];
  return some(
    catalogOptions,
    (catOpt: any) =>
      some(raw.options, (opt: any) => opt.product_id === catOpt.id) &&
      hasTransferIndicator(catOpt)
  );
}

// -----------------------------------------------------------------------------
// Registrant mapping utilities (FE-2457)
// -----------------------------------------------------------------------------

/**
 * Creates an empty registrant details object with all fields as empty strings.
 */
export function emptyRegistrant(): RegistrantDetails {
  return {
    name: "",
    organisation: "",
    email: "",
    phone: "",
    address1: "",
    city: "",
    state: "",
    postcode: "",
    country: ""
  };
}

/**
 * Maps billing/client data to registrant details using REGISTRANT_FIELD_MAP.
 * Accepts a generic source object and resolves each field via the billingKey path.
 *
 * @param source - Flat or nested object with billing/client data
 * @returns Populated RegistrantDetails (unfound fields default to "")
 */
export function mapBillingToRegistrant(
  source: Record<string, any>
): RegistrantDetails {
  return reduce(
    REGISTRANT_FIELD_MAP,
    (result: RegistrantDetails, entry: RegistrantFieldMapEntry) => {
      const value = get(source, entry.billingKey, "");
      result[entry.registrantKey] = value?.toString() ?? "";
      return result;
    },
    emptyRegistrant()
  );
}

/**
 * Transforms registrant details into provision field values for the basket product API.
 * Uses REGISTRANT_FIELD_MAP to map registrantKey → provisionKey.
 *
 * @param registrant - The registrant details to transform
 * @returns Record of provision field key → value pairs
 */
export function mapRegistrantToProvisionFields(
  registrant: RegistrantDetails
): Record<string, string> {
  return reduce(
    REGISTRANT_FIELD_MAP,
    (result: Record<string, string>, entry: RegistrantFieldMapEntry) => {
      const value = registrant[entry.registrantKey];
      if (!isEmpty(value)) {
        result[entry.provisionKey] = value;
      }
      return result;
    },
    {}
  );
}

/**
 * Returns the list of required registrant field keys that are missing (empty) values.
 *
 * @param registrant - The registrant details to check (undefined → all required fields missing)
 * @returns Array of missing required field keys
 */
export function getMissingRegistrantFields(
  registrant?: RegistrantDetails
): (keyof RegistrantDetails)[] {
  if (!registrant) return [...REQUIRED_REGISTRANT_FIELDS];

  return filter(REQUIRED_REGISTRANT_FIELDS, (key: keyof RegistrantDetails) =>
    isEmpty(registrant[key]?.toString())
  );
}

/**
 * Returns `true` when all required registrant fields have non-empty values.
 *
 * @param registrant - The registrant details to validate
 * @returns `true` if complete, `false` otherwise
 */
export function hasAllRequiredRegistrantFields(
  registrant?: RegistrantDetails
): boolean {
  return isEmpty(getMissingRegistrantFields(registrant));
}
