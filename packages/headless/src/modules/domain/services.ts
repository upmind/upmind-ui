// --- external

// --- internal
import {
  type DomainModel,
  type DomainProduct,
  useI18n,
  useQuery,
  useSession
} from "../..";

// --- utils
import {
  compact,
  filter,
  find,
  first,
  includes,
  isFunction,
  map,
  sortBy
} from "lodash-es";
import {
  getDomainRawBasketProducts,
  parseDomain,
  parseDomainParts,
  parseSuggestions
} from "./utils";
import productServices from "../basketProduct/services";
import { parseProductProps, parsePrice } from "../product/utils";

// --- types
import type {
  DomainContext,
  DacContext,
  IDomainAvailabilityResponse
} from "./types";
import { DomainTypes } from "./types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// Shared `with` parameter for API calls to include full product/price data
const DOMAIN_WITH_RELATIONS = "prices,options,options.prices,attributes";

// -----------------------------------------------------------------------------

/**
 * Builds a DomainProduct from an availability response.
 * Used in transfer mode where there are no suggestions — only a single
 * availability check that returns product data.
 */
function buildDomainProductFromAvailability(
  domain: string,
  availability: IDomainAvailabilityResponse,
  preferredCycle?: number
): DomainProduct {
  const { sld, tld } = parseDomainParts(domain);
  const parsed = parseDomain(domain);
  const product = availability.product;
  const prices = product?.prices ?? [];
  // Prefer 12-month price, then preferred cycle, then lowest term
  const sortedPrices = sortBy(prices, "billing_cycle_months");
  const priceEntry =
    find(prices, p => p.billing_cycle_months === 12) ??
    find(prices, p => p.billing_cycle_months === preferredCycle) ??
    sortedPrices[0];

  const priceFormatted = priceEntry?.price_formatted ?? "";
  const priceDiscountedFormatted =
    priceEntry?.price_discounted_formatted ?? null;
  const billingCycleMonths = priceEntry?.billing_cycle_months ?? 12;

  // For availability rows, use product.sub_product_id
  const subproducts: string[] = compact([product?.sub_product_id]);

  // Use parseProductProps to properly resolve subproducts into options/attributes
  // so they appear in the basket add payload
  const configuration = product
    ? parseProductProps(
        {
          productId: product.id,
          quantity: product.unit_quantity ?? 1,
          subproducts,
          provisionFields: { sld }
        },
        product as any,
        preferredCycle
      )
    : {
        productId: "",
        term: billingCycleMonths,
        quantity: 1,
        provisionFields: { sld }
      };

  return {
    domain: parsed?.domain ?? domain,
    sld: parsed?.sld ?? sld,
    tld: parsed?.tld ?? tld ?? "",
    configuration,
    price: priceEntry
      ? parsePrice(priceEntry)
      : {
          currentPrice: "",
          currentAmount: 0,
          regularPrice: "",
          regularAmount: 0,
          savingAmount: 0,
          savingPrice: "",
          savingPercent: ""
        },
    meta: {
      available: availability.can_register,
      canTransfer: !availability.can_register && availability.can_transfer,
      unavailable: !availability.can_register && !availability.can_transfer,
      checkedAvailability: true,
      disabled: !availability.can_register && !availability.can_transfer,
      exactMatch: true
    },
    productDetails: {
      id: product?.id ?? "",
      title: domain,
      name: product?.name ?? tld ?? ""
    },
    pricing: [],
    details: []
  } as unknown as DomainProduct;
}

// -----------------------------------------------------------------------------

function search(context: DacContext) {
  const { search, preferredCycle, mode } = context;
  const { t } = useI18n();
  const { cancel } = useQuery();

  // --- Callback-based service: sends events as each call completes
  return (sendBack: (event: any) => void) => {
    if (!search?.query?.length) {
      sendBack({
        type: "SEARCH_ERROR",
        data: new DetailedError(
          t("error.query_not_found"),
          responseCodes.Unprocessable_Entity,
          ErrorOrigin.Headless
        )
      });
      return;
    }

    const { sld, tld } = parseDomainParts(search.query);

    cancel(["domains", "suggestions"]);

    // --- TRANSFER mode: only checkAvailability, no suggestions
    if (mode === DomainTypes.transfer) {
      const domain = search.query;
      checkAvailability({
        ...context,
        checkingDomain: domain
      } as DacContext)
        .then(availability => {
          const product = buildDomainProductFromAvailability(
            domain,
            availability,
            preferredCycle
          );
          sendBack({
            type: "SEARCH_RESULTS",
            data: {
              data: [product],
              total: 1,
              availability,
              exactDomain: domain
            }
          });
        })
        .catch(error => {
          if (error?.name === "AbortError") return;
          // Show the exact match row as unavailable instead of erroring
          const unavailableProduct = buildDomainProductFromAvailability(
            domain,
            {
              can_register: false,
              can_transfer: false
            } as IDomainAvailabilityResponse,
            preferredCycle
          );
          sendBack({
            type: "SEARCH_RESULTS",
            data: {
              data: [unavailableProduct],
              total: 1,
              availability: null,
              exactDomain: domain
            }
          });
        });
      return;
    }

    // --- REGISTER mode: fire both calls independently

    const rawExactDomain = tld ? `${sld}${tld}` : undefined;
    const parsedExact = rawExactDomain
      ? parseDomain(rawExactDomain)
      : undefined;
    const exactDomain = parsedExact?.domain ?? rawExactDomain;

    let suggestionsData: DomainProduct[] | null = null;
    let availabilityData: IDomainAvailabilityResponse | null = null;
    let pending = tld ? 2 : 1; // suggestions always, availability only with TLD

    // Helper: build the merged result from whatever data is available
    const buildResult = () => {
      // Clone suggestion data to avoid mutating TanStack cache
      let data: DomainProduct[] = map(
        suggestionsData ?? [],
        (item: DomainProduct) => ({
          ...item,
          meta: { ...item.meta, exactMatch: false }
        })
      ) as DomainProduct[];

      if (exactDomain && availabilityData) {
        data = filter(
          data,
          (item: DomainProduct) => item.domain !== exactDomain
        );
        const exactProduct = buildDomainProductFromAvailability(
          rawExactDomain!,
          availabilityData,
          preferredCycle
        );
        data.unshift(exactProduct);
      }

      return {
        data,
        total: data.length,
        availability: availabilityData,
        exactDomain
      };
    };

    // Helper: send partial results + SEARCH_COMPLETE when all pending calls done
    const sendResult = () => {
      pending--;
      sendBack({ type: "SEARCH_RESULTS", data: buildResult() });
      if (pending <= 0) {
        sendBack({ type: "SEARCH_COMPLETE" });
      }
    };

    // --- Suggestions call
    const { get: getData, useUrl } = useQuery();
    getData<any, any>({
      url: useUrl(`modules/web_hosting/domains/suggestions`, {
        query: sld,
        with: DOMAIN_WITH_RELATIONS
      }),
      queryKey: ["domains", "suggestions", sld],
      withAccessToken: true,
      withCurrency: true,
      select: ((results: any, related?: any) => {
        const productsMap = related?.products ?? {};
        const data = parseSuggestions(
          results ?? [],
          productsMap,
          preferredCycle,
          "register"
        );
        return { data, total: data.length };
      }) as any
    })
      .then(suggestions => {
        suggestionsData = suggestions.data;
        sendResult();
      })
      .catch(error => {
        if (error?.name !== "AbortError") {
          sendBack({ type: "SEARCH_ERROR", data: error });
        }
      });

    // --- Availability call (only when query has a TLD)
    if (tld) {
      checkAvailability({
        ...context,
        checkingDomain: `${sld}${tld}`
      } as DacContext)
        .then(availability => {
          availabilityData = availability;
          sendResult();
        })
        .catch(() => {
          // Availability check failed — show the exact match as unavailable
          // so the user can still see the domain they searched for
          availabilityData = {
            can_register: false,
            can_transfer: false
          } as IDomainAvailabilityResponse;
          sendResult();
        });
    }
  };
}

async function checkAvailability({
  checkingDomain
}: {
  checkingDomain?: string;
}) {
  const { get, useUrl } = useQuery();

  if (!checkingDomain)
    return Promise.reject(
      new DetailedError(
        "No domain specified for availability check",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  return get<any, IDomainAvailabilityResponse>({
    url: useUrl(`modules/web_hosting/domains/availability/${checkingDomain}`, {
      with: DOMAIN_WITH_RELATIONS
    }),
    queryKey: ["domains", "availability", checkingDomain],
    withAccessToken: true,
    withCurrency: true,
    select: ((data: any, related?: any) => {
      // The product may be in related.products (keyed by product_id)
      // rather than directly on the data object
      if (!data.product && data.product_id && related?.products) {
        data.product = related.products[data.product_id];
      }
      return data;
    }) as any
  });
}

/**
 * Adds a domain product to the basket via the real basket API.
 * On success → resolves with { can_register: true } so the machine knows it worked.
 * On error → checks for domain-specific error codes/messages from the API response.
 *
 * Error code detection:
 * The standard error pipeline (doFetch → handleError → DetailedError) strips the
 * string `error.code` from the API response, but preserves the `error.message`.
 * We check both the structured code (where available) and the message text to
 * detect domain-specific constraints:
 *   - "cannot be registered"  → web_hosting::domain_transfer_only
 *   - "cannot be transferred" → web_hosting::domain_register_only
 *   - "not for sale"          → web_hosting::domain_not_for_sale
 */
async function addDomainToBasket(context: DacContext) {
  const { checkingDomain, basketId, lookups, coupons, parseProductModel } =
    context;

  if (!checkingDomain)
    return Promise.reject(
      new DetailedError(
        "No domain specified",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // Find the product from search results and build the basket model
  const product = find(lookups?.searched ?? [], ["domain", checkingDomain]) as
    | DomainProduct
    | undefined;

  const model = isFunction(parseProductModel)
    ? parseProductModel(product!)
    : product?.configuration;

  if (!model)
    return Promise.reject(
      new DetailedError(
        "Product model not found for domain",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  model.coupons ??= coupons ?? [];
  model.silent = true;

  try {
    // productServices.update handles missing basketId by generating a new basket
    await productServices.update(basketId, model);

    // Basket add succeeded → domain is available and now in basket
    return { can_register: true, can_transfer: false };
  } catch (error: any) {
    const status = error?.code ?? error?.status ?? error?.response?.status;
    const errorData = error?.data ?? error?.response?.data;

    // Try to extract the domain-specific error code from every possible location.
    // The raw API response has: { error: { code: "web_hosting::..." } }
    // After processing through handleError, the code may survive in nested paths.
    const errorCode =
      errorData?.error?.code ??
      error?.error?.code ??
      error?.response?.data?.error?.code ??
      "";

    // 1. Check structured error code if available
    if (
      errorCode === "web_hosting::domain_register_only" ||
      errorCode === "web_hosting::domain_transfer_only" ||
      errorCode === "web_hosting::domain_not_for_sale"
    ) {
      return {
        can_register: errorCode === "web_hosting::domain_register_only",
        can_transfer: errorCode === "web_hosting::domain_transfer_only",
        error_code: errorCode
      };
    }

    // 2. Fallback: check the error message for known domain error patterns.
    //    handleError preserves the API's error.message in DetailedError.message,
    //    so this is a reliable way to detect domain-specific errors even when
    //    the error code string has been stripped from the error object.
    const errorMessage = (error?.message ?? "").toLowerCase();

    if (includes(errorMessage, "cannot be registered")) {
      return {
        can_register: false,
        can_transfer: true,
        error_code: "web_hosting::domain_transfer_only"
      };
    }
    if (includes(errorMessage, "cannot be transferred")) {
      return {
        can_register: true,
        can_transfer: false,
        error_code: "web_hosting::domain_register_only"
      };
    }
    if (
      includes(errorMessage, "not for sale") ||
      includes(errorMessage, "not available")
    ) {
      return {
        can_register: false,
        can_transfer: false,
        error_code: "web_hosting::domain_not_for_sale"
      };
    }

    // 409 = conflict — domain operation type needs to be flipped
    // (e.g. tried to register but should be transferred, or vice versa)
    if (status === 409 && errorData) {
      return {
        can_register: errorData.can_register ?? false,
        can_transfer: errorData.can_transfer ?? false,
        conflict: true
      };
    }

    // Other errors → reject so the machine goes to error state
    throw error;
  }
}

async function getClientDomains(_context: DomainContext | DacContext) {
  const { get, useUrl } = useQuery();
  const { meta } = useSession();

  // bail early if not authenticated: no point fetching
  if (!meta.value?.isAuthenticated) return [];

  return get<any, (DomainModel | undefined)[]>({
    url: useUrl("modules/web_hosting/domains/client_domains"),
    queryKey: ["domains", "owned"],
    select: data => map(data, ({ domain_name }) => parseDomain(domain_name)),
    withAccessToken: true,
    staleTime: 0,
    gcTime: 0
  });
}

/**
 * Adds a transfer product to the basket for the existing domain flow.
 * Builds the product model from the availability result, then diffs
 * pre/post basket state to extract the new basket product ID.
 */
export async function addExistingTransfer(
  context: DomainContext
): Promise<{ bpid?: string }> {
  const {
    checkingDomain,
    basketId,
    availabilityResult,
    coupons,
    preferredCycle
  } = context;

  if (!checkingDomain || !availabilityResult?.product) {
    throw new DetailedError(
      "No domain or availability data for transfer",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }
  const domainProduct = buildDomainProductFromAvailability(
    checkingDomain,
    availabilityResult,
    preferredCycle
  );

  const model = domainProduct.configuration;

  if (!model) {
    throw new DetailedError(
      "Product model not found for transfer domain",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  model.coupons ??= coupons ?? [];
  model.silent = true;

  // --- Pre-add snapshot ---
  // Read the current basket state without triggering a refresh.
  // Calling refreshBasket() here would trigger a reactive cascade that
  // causes the parent component to remount SmartDomainField, destroying
  // this machine instance mid-flight.
  const { useBasket } = await import("../basket");
  const { basket: basketRef } = useBasket();
  const domainProducts = getDomainRawBasketProducts(
    basketRef.value?.products ?? []
  );
  const existingBpids = new Set(
    map(
      filter(domainProducts, p => p.service_identifier === checkingDomain),
      "id"
    )
  );

  const updatedBasket = await productServices.update(basketId, model);

  // Find domain products matching our domain that are NEW (not in the pre-existing set).
  const updatedDomainProducts = getDomainRawBasketProducts(
    updatedBasket.products
  );
  const candidates = filter(
    updatedDomainProducts,
    p => p.service_identifier === checkingDomain && !existingBpids.has(p.id)
  );

  if (candidates.length === 1) {
    return { bpid: first(candidates)?.id };
  }
  if (candidates.length > 1) {
    console.warn(
      "[domain] addExistingTransfer: multiple new products found, cannot determine which was just added",
      {
        count: candidates.length,
        domain: checkingDomain,
        candidateIds: map(candidates, "id")
      }
    );
    throw new DetailedError(
      "Multiple matching products found — cannot determine which was just added. Please try again.",
      responseCodes.Conflict,
      ErrorOrigin.Headless
    );
  }

  // No new products found — extraction failed.
  console.warn(
    "[domain] addExistingTransfer: added product not found in basket response",
    {
      checkingDomain,
      productCount: updatedBasket.products?.length,
      existingBpidCount: existingBpids.size
    }
  );
  return {};
}

/**
 * Removes a transfer product from the basket.
 * Requires an exact transferProductId — does NOT fall back to domain-name lookup.
 */
export async function removeExistingTransfer(
  context: DomainContext
): Promise<void> {
  const { basketId, transferProductId } = context;

  if (!transferProductId) {
    throw new DetailedError(
      "Transfer product ID missing — cannot identify which basket item to remove. Please refresh and try again.",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  await productServices.remove(basketId!, transferProductId!);
}

/**
 * Adds a registration product to the basket for the existing domain flow.
 * Used when a domain typed in the "existing" input turns out to be available
 * for registration (can_register=true).
 */
export async function addExistingRegistration(
  context: DomainContext
): Promise<{ domain: string }> {
  const {
    checkingDomain,
    basketId,
    availabilityResult,
    coupons,
    preferredCycle
  } = context;

  if (!checkingDomain || !availabilityResult?.product) {
    throw new DetailedError(
      "No domain or availability data for registration",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  const domainProduct = buildDomainProductFromAvailability(
    checkingDomain,
    availabilityResult,
    preferredCycle
  );

  const model = domainProduct.configuration;

  if (!model) {
    throw new DetailedError(
      "Product model not found for registration domain",
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  }

  model.coupons ??= coupons ?? [];
  model.silent = true;

  await productServices.update(basketId, model);

  return { domain: checkingDomain };
}

// -----------------------------------------------------------------------------

export default {
  search,
  checkAvailability,
  addDomainToBasket,
  addExistingTransfer,
  addExistingRegistration,
  removeExistingTransfer,
  getClientDomains
};
