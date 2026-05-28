// --- externals
import { parse } from "psl";
import { computed } from "vue";

import type { Ref } from "vue";

// --- internals
import { useBrand } from "../brand";
import { useLocale } from "../system";
import { calculateBillingTerm, parseProductProps } from "../product/utils";
import services from "./services";

// --- utils
import {
  fillRequiredOptionDefaults,
  parseProductDetails,
  parseTermDetails
} from "../product/utils";
import {
  compact,
  filter,
  find,
  first,
  get,
  has,
  isEmpty,
  isFunction,
  isObject,
  map,
  sortBy,
  uniqBy
} from "lodash-es";

// --- types
import {
  BrandConfigKeys,
  DomainSearchMethod,
  type IBasketProduct,
  type IBlueprint,
  type IDomainSuggestionResult,
  type IDomainSuggestionResultProduct,
  type IProduct,
  ProvisionCategoryCodes
} from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import {
  DomainTypes,
  type DacContext,
  type DacEventContext,
  type DomainProduct,
  type DomainModel
} from "./types";
import { type ProductDetails, type ProductProps } from "../product";
import { responseCodes } from "../../utils";

// ----------------------------------------------------------------------------

/**
 * Defaults for the required `ProductDetails` fields that placeholder /
 * fallback domain rows don't carry (no full `IProduct` to parse from).
 * Keeping the defaults in one place stops every literal from drifting on
 * what counts as "minimum viable product details" for a placeholder row.
 */
export function makePlaceholderProductDetails(overrides: {
  domain: string;
  name?: string;
  id?: string;
}): ProductDetails {
  return {
    id: overrides.id ?? "",
    title: overrides.domain,
    name: overrides.name ?? "",
    brand: "",
    categoryId: "",
    category: "",
    cycle: 12,
    quantifiable: false,
    quantity: 1,
    step: 1,
    min: 1,
    max: 1
  };
}

// ----------------------------------------------------------------------------

/**
 * Builds the basket model used to add a domain product to the basket.
 *
 * Resolves the base model (from a custom parser or the product's stored
 * `configuration`), auto-fills any *required* option/attribute categories
 * the model hasn't already specified, then applies `coupons` and the
 * `silent` flag so the basket API accepts the add request.
 *
 * Both `addDomainToBasket` (services.ts) and the dac machine's
 * `addToBasket` fast-path action route through this so the required-options
 * fix stays in one place — a new add-to-basket path won't silently
 * regress 422s from missing required groups.
 *
 * Returns `null` if no base model can be resolved.
 */
export function buildAddToBasketModel(
  product: DomainProduct | undefined,
  parseProductModel:
    | ((item: DomainProduct) => ProductProps | undefined)
    | undefined,
  coupons: string[] | undefined
): ProductProps | null {
  const baseModel = isFunction(parseProductModel)
    ? parseProductModel(product!)
    : product?.configuration;

  if (!baseModel) return null;

  const model = fillRequiredOptionDefaults(baseModel, product?.rawProduct);
  model.coupons = coupons ?? model.coupons ?? [];
  model.silent = true;
  return model;
}

// ----------------------------------------------------------------------------

/**
 * Merges a freshly-emitted batch of search results into the previously-rendered
 * list, by `domain`. Three upstream emit scenarios drive the rules:
 *
 *  1. Within one search round, `/suggestions` emits `priceLoading` rows and
 *     `/suggestions/tlds` re-emits the same rows priced — the row must
 *     upgrade in-place so the UI re-renders skeletons → real prices.
 *  2. `/availability` resolves after `/suggestions` and produces an
 *     authoritative version of the exact-match row (with
 *     `checkedAvailability=true`). It must replace the suggestion-derived
 *     version even when both are "priced".
 *  3. Pagination (Load more) emits the next page; existing rows must NOT
 *     change. If the API happens to return overlapping domains in a later
 *     page, keep the already-loaded version.
 *
 * Rule: replace an existing row when the incoming row is **strictly fresher**:
 *   - `priceLoading` → not `priceLoading` (price upgrade), OR
 *   - `!checkedAvailability` → `checkedAvailability` (availability upgrade).
 *
 * Otherwise leave the existing row alone. Truly new domains are appended.
 *
 * Pure — both inputs must be pre-flagged (owned/added/disabled etc.) by
 * the caller; this function only resolves the merge ordering.
 */
export function mergeDomainSearchResults(
  previous: DomainProduct[],
  available: DomainProduct[]
): DomainProduct[] {
  const updatedPrevious = map(previous, (prev: DomainProduct) => {
    const fresher = find(available, ["domain", prev.domain]);
    if (!fresher) return prev;
    const isPriceUpgrade =
      !!prev.meta?.priceLoading && !fresher.meta?.priceLoading;
    const isAvailabilityUpgrade =
      !prev.meta?.checkedAvailability && !!fresher.meta?.checkedAvailability;
    return (
      isPriceUpgrade || isAvailabilityUpgrade ? fresher : prev
    ) as DomainProduct;
  });

  const newOnly = filter(
    available,
    (item: DomainProduct) => !find(previous, ["domain", item.domain])
  ) as DomainProduct[];

  return compact([...updatedPrevious, ...newOnly]);
}

// ----------------------------------------------------------------------------

/**
 * Resolves the brand's domain-search flow from `DOMAIN_SEARCH_METHOD`.
 *
 * Falls back to `LEGACY_LOOKUP` so the legacy `/domains/search` path
 * runs by default — the new `/suggestions` + `/suggestions/tlds` flow
 * only kicks in when the brand explicitly opts into `SMART_SUGGEST`.
 *
 * Single source of truth for both `useDomain` (parent) and `useDac`
 * (child), so the flag derivation can't drift between entry points.
 */
export function useDomainSearchMethod() {
  const { getConfigValue } = useBrand();

  const searchMethod =
    getConfigValue<DomainSearchMethod>(BrandConfigKeys.DOMAIN_SEARCH_METHOD) ??
    DomainSearchMethod.LEGACY_LOOKUP;
  const useSuggestions = searchMethod === DomainSearchMethod.SMART_SUGGEST;

  return { searchMethod, useSuggestions };
}

// ----------------------------------------------------------------------------

/**
 * Selects the best price entry from a list of prices and builds a
 * zeroed-savings price object. Used as a fallback when full product
 * term/promotion parsing is unavailable or fails.
 *
 * Priority: 12-month → preferred cycle → lowest term.
 */
export function buildFallbackPricing(
  prices: any[],
  preferredCycle?: number
): { price: DomainProduct["price"]; billingCycleMonths: number } {
  const sortedPrices = sortBy(prices, "billing_cycle_months");
  const priceEntry =
    find(prices, ["billing_cycle_months", 12]) ??
    find(prices, ["billing_cycle_months", preferredCycle]) ??
    sortedPrices[0];

  const priceFormatted = priceEntry?.price_formatted ?? "";
  const priceDiscountedFormatted =
    priceEntry?.price_discounted_formatted ?? null;
  const billingCycleMonths = priceEntry?.billing_cycle_months ?? 12;

  return {
    price: {
      currentPrice: priceDiscountedFormatted ?? priceFormatted,
      currentAmount: 0,
      regularPrice: priceFormatted,
      regularAmount: 0,
      savingAmount: 0,
      savingPrice: "",
      savingPercent: ""
    },
    billingCycleMonths
  };
}

// ----------------------------------------------------------------------------

/**
 * Returns true if the product is actually configured for transfer — i.e.
 * `setup_function_sub_ids.transfer` is a non-empty array. When this is
 * missing or empty the basket POST would have no `sub_pids` to send for the
 * transfer flow, so the row must be treated as non-transferable regardless
 * of what `/availability` reported.
 */
export function hasTransferSetup(
  product?: { setup_function_sub_ids?: { transfer?: string[] } } | null
): boolean {
  const transferIds = product?.setup_function_sub_ids?.transfer;
  return Array.isArray(transferIds) && transferIds.length > 0;
}

/**
 * Brand/product owners can disable transfer for a specific TLD (or an entire
 * category) by setting `meta.overrides.dac.canTransfer: false` on the product
 * or its category. When that flag is present and false, ignore whatever the
 * `/availability` API returns for `can_transfer` and treat the domain as
 * non-transferable.
 *
 * Only a literal `false` blocks — `undefined` / missing means "no override,
 * use the API value as-is".
 *
 * Also gates on `hasTransferSetup`: a product whose `setup_function_sub_ids`
 * has no `transfer` entry can't actually be transferred (no sub_pids to send),
 * so any `can_transfer: true` from the API is treated as `false`.
 */
export function applyDacTransferOverride(
  canTransfer: boolean | undefined,
  product?: {
    meta?: any;
    category?: { meta?: any };
    setup_function_sub_ids?: { transfer?: string[] };
  } | null
): boolean {
  if (!product) return !!canTransfer;
  const productOverride = product.meta?.overrides?.dac?.canTransfer;
  const categoryOverride = product.category?.meta?.overrides?.dac?.canTransfer;
  if (productOverride === false || categoryOverride === false) return false;
  if (!hasTransferSetup(product)) return false;
  return !!canTransfer;
}

/**
 * Returns the brand-supplied transfer label (e.g. "Unavailable") from
 * `meta.overrides.dac.i18n.transfer`, falling back to the category-level
 * override. The UI can render this on the disabled transfer button when
 * `canTransfer` has been blocked by an override.
 *
 * Product-level wins over category-level so brands can override the
 * category default for individual TLDs.
 */
export function getDacTransferLabel(
  product?: { meta?: any; category?: { meta?: any } } | null
): string | undefined {
  if (!product) return undefined;
  const productLabel = product.meta?.overrides?.dac?.i18n?.transfer;
  if (typeof productLabel === "string" && productLabel.length > 0)
    return productLabel;
  const categoryLabel = product.category?.meta?.overrides?.dac?.i18n?.transfer;
  if (typeof categoryLabel === "string" && categoryLabel.length > 0)
    return categoryLabel;
  return undefined;
}

// ----------------------------------------------------------------------------

/**
 * Sanitises a raw domain input string — strips protocols, www, ports,
 * paths, query strings, fragments, and invalid characters.
 */
export function sanitiseDomainInput(value: string): string {
  return value
    .replace(/^https?:\/\//i, "") // remove protocol
    .replace(/^w{3}\./i, "") // remove www.
    .replace(/[:\/?#].*$/, "") // remove port, path, query, fragment
    .replace(/[^a-z0-9\-\.]/gi, "") // remove invalid chars
    .replace(/^[\.\-]+|[\.\-]+$/g, "") // strip leading + trailing dots/hyphens
    .replace(/-+\./g, ".") // strip trailing hyphens before dots (SLD)
    .replace(/\.-+/g, ".") // strip leading hyphens after dots (TLD)
    .replace(/\.{2,}/g, ".") // collapse consecutive dots
    .toLowerCase();
}

/**
 * Reactive domain parser — sanitises a raw domain input into its component
 * parts (full domain, SLD, TLD).
 */
export function useDomainParser(domain: Ref<string>) {
  const sanitisedDomain = computed(() => sanitiseDomainInput(domain.value));

  const sanitisedSld = computed(
    () => sanitisedDomain.value.split(".")[0] ?? ""
  );

  const sanitisedTld = computed(() => {
    const matches = sanitisedDomain.value.match(/(?:^[^\.]+)(\..{2,})/i);
    return matches?.[1] || "";
  });

  return { sanitisedDomain, sanitisedSld, sanitisedTld };
}

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
      preferredCycle ?? raw.default_payment_period,
      terms
    );

    return {
      // ---
      configuration: parseProductProps(
        {
          productId: raw.id,
          quantity: raw.unit_quantity,
          subproducts: compact([raw.sub_product_id]),
          provisionFields: { sld },
          term: termDetails.cycle
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
 *
 * Mode selection is **per row**, not global: a `can_register: true` row gets
 * `setup_function_sub_ids.register`, while a transfer-only row
 * (`can_register: false, can_transfer: true`) gets `setup_function_sub_ids.transfer`.
 * Without this, transfer-only suggestions would be added to the basket with
 * register sub_pids and the basket API would 422 / charge for the wrong action.
 */
export function parseSuggestions(
  results: IDomainSuggestionResult[],
  productsMap: Record<string, IProduct>,
  preferredCycle?: number
): DomainProduct[] {
  const { defaultPaymentPeriod } = useBrand();
  const available = map(results, result => {
    const { domain, sld, tld, can_register, can_transfer, product_id } = result;
    const fullDomain = `${sld}.${tld}`;
    const parsedDomain = parseDomain(fullDomain);
    const product = productsMap[product_id];
    // Honour any brand-level DAC transfer block on the product or category
    const canTransferEffective = applyDacTransferOverride(
      can_transfer,
      product
    );
    const transferLabel = getDacTransferLabel(product);

    if (product) {
      try {
        // Full IProduct available — use proper product parsing
        const productDetails = parseProductDetails(product);
        const terms = parseTermDetails(product);
        const termDetails = calculateBillingTerm(
          preferredCycle ?? product.default_payment_period,
          terms
        );

        // Pick the per-row mode: a row that can register uses register
        // sub_pids; a row that's transfer-only uses transfer sub_pids.
        const rowMode: "register" | "transfer" =
          can_register || !canTransferEffective ? "register" : "transfer";
        const setupSubIds = (product as IDomainSuggestionResultProduct)
          .setup_function_sub_ids;
        const subproducts: string[] = compact(
          setupSubIds?.[rowMode] ?? [product.sub_product_id]
        );

        return {
          configuration: parseProductProps(
            {
              productId: product.id,
              quantity: product.unit_quantity,
              subproducts,
              provisionFields: { sld },
              term: termDetails.cycle
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
            canTransfer: canTransferEffective,
            transferLabel
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

    // Fallback when product is missing or parsing failed.
    // The product may simply not have arrived yet (split suggestions/tlds flow):
    // mark the row as priceLoading so the card renders a price skeleton.
    const { price, billingCycleMonths } = buildFallbackPricing(
      product?.prices ?? [],
      preferredCycle
    );

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
      price,
      meta: {
        available: can_register,
        canTransfer: canTransferEffective,
        transferLabel,
        priceLoading: !product
      },
      productDetails: makePlaceholderProductDetails({
        id: product_id,
        domain: fullDomain,
        name: product?.name ?? `.${tld}`
      }),
      pricing: [],
      details: []
    };
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

// ----------------------------------------------------------------------------

/**
 * Resolves the widget-style search mode from a headless context. The
 * headless `mode` is an operation flow (register/transfer) and
 * `useSuggestions` is a boolean — surface them as a single label for
 * tracking.
 */
export function resolveWidgetMode(
  context: DacEventContext
): "suggest" | "search" | "transfer" | null {
  if (context.mode === DomainTypes.transfer) return "transfer";
  if (context.useSuggestions === true) return "suggest";
  if (context.useSuggestions === false) return "search";
  return null;
}

/**
 * Common DAC tracking fields spread into every DAC event's `meta` payload
 * (widget id, current route, locale, the sanitised search query, its parsed
 * parts, and the resolved widget mode). Caller adds event-specific fields
 * on top.
 */
export function buildCommonMeta(
  context: DacEventContext
): Record<string, unknown> {
  const query = sanitiseDomainInput(context.search?.query ?? "");
  const { sld, tld } = parseDomainParts(query);
  let locale: string | undefined;
  try {
    locale = useLocale().locale.value;
  } catch {
    locale = undefined;
  }
  return {
    widget: "dac",
    route:
      typeof window !== "undefined" ? (window.location?.pathname ?? "") : "",
    locale,
    query,
    sld,
    tld: tld ?? null,
    mode: resolveWidgetMode(context)
  };
}

// ----------------------------------------------------------------------------

/**
 * Spawned actor that runs `/availability` pre-flight checks in parallel.
 *
 * XState's `invoke` runs one service at a time per state, so when the user
 * clicks several suggestion rows in quick succession only the first click
 * could fire a pre-check. Routing every click through this helper instead
 * sidesteps that restriction — each `VERIFY` event triggers an independent
 * fire-and-forget `checkAvailability` call, and the result is dispatched
 * back to the parent machine as `VERIFY_RESULT` (or `VERIFY_ERROR`) keyed
 * by domain so rows can be correlated reliably even when results return
 * out of order.
 *
 * NB: Must be a plain function (NOT async). XState v4 treats an async
 * function passed to `spawn()` as a promise actor — `onReceiveEvent` would
 * never be registered and incoming `VERIFY` events would silently vanish.
 */
export function domainAvailabilityHelper(callback: any, onReceiveEvent: any) {
  const onReceive = (event: any) => {
    if (event.type !== "VERIFY") return;
    const { data: domain, context } = event;
    if (!domain) return;

    services
      .checkAvailability({
        ...(context ?? {}),
        checkingDomain: domain
      } as DacContext)
      .then(availability => {
        callback({
          type: "VERIFY_RESULT",
          data: domain,
          availability
        });
      })
      .catch(error => {
        if (error?.code === responseCodes.Aborted) return;
        callback({
          type: "VERIFY_ERROR",
          data: domain,
          error
        });
      });
  };

  onReceiveEvent(onReceive);
}
