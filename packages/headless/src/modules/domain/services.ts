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
import { compact, find, isEmpty, isFunction, map, omitBy } from "lodash-es";
import {
  parseAvailable,
  parseDomain,
  parseDomainParts,
  parseSuggestions
} from "./utils";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";
import { PAGINATION } from "../query";
import productServices from "../basketProduct/services";
import {
  calculateBillingTerm,
  parseProductDetails,
  parseProductProps,
  parseTermDetails
} from "../product/utils";
import { useBrand } from "../brand";

// --- types
import type {
  DomainContext,
  DacContext,
  IDomainAvailabilityResponse
} from "./types";
import { DomainTypes } from "./types";
import type { IProduct } from "@upmind-automation/types";
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
  const { defaultPaymentPeriod } = useBrand();
  const paymentPeriod = preferredCycle ?? defaultPaymentPeriod.value;

  // For availability rows, use product.sub_product_id
  const subproducts: string[] = compact([product?.sub_product_id]);

  // When a full product is available, use proper term/pricing parsing
  // so promotions, savings, and "Was X, now Y" descriptions are computed
  if (product) {
    const productDetails = parseProductDetails(product);
    const terms = parseTermDetails(product);
    const termDetails = calculateBillingTerm(
      paymentPeriod || product.default_payment_period,
      terms
    );

    const configuration = parseProductProps(
      {
        productId: product.id,
        quantity: product.unit_quantity ?? 1,
        subproducts,
        provisionFields: { sld }
      },
      product as any,
      preferredCycle
    );

    return {
      domain: parsed?.domain ?? domain,
      sld: parsed?.sld ?? sld,
      tld: parsed?.tld ?? tld ?? "",
      configuration,
      price: termDetails.price,
      meta: {
        ...(termDetails.meta ?? {}),
        available: availability.can_register,
        canTransfer: !availability.can_register && availability.can_transfer,
        unavailable: !availability.can_register && !availability.can_transfer,
        checkedAvailability: true,
        disabled: !availability.can_register && !availability.can_transfer,
        exactMatch: true
      },
      productDetails: {
        ...productDetails,
        title: domain
      },
      pricing: [],
      details: [],
      rawProduct: product
    } as unknown as DomainProduct;
  }

  // Fallback when product is missing (unavailable domains)
  const prices = product?.prices ?? [];
  const sortedPrices = [...prices].sort(
    (a, b) => a.billing_cycle_months - b.billing_cycle_months
  );
  const priceEntry =
    prices.find(p => p.billing_cycle_months === 12) ??
    prices.find(p => p.billing_cycle_months === preferredCycle) ??
    sortedPrices[0];

  const priceFormatted = priceEntry?.price_formatted ?? "";
  const billingCycleMonths = priceEntry?.billing_cycle_months ?? 12;

  return {
    domain: parsed?.domain ?? domain,
    sld: parsed?.sld ?? sld,
    tld: parsed?.tld ?? tld ?? "",
    configuration: {
      productId: "",
      term: billingCycleMonths,
      quantity: 1,
      provisionFields: { sld }
    },
    price: {
      currentPrice: priceFormatted,
      currentAmount: 0,
      regularPrice: priceFormatted,
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
      id: "",
      title: domain,
      name: tld ?? ""
    },
    pricing: [],
    details: []
  } as unknown as DomainProduct;
}

// -----------------------------------------------------------------------------

function search(context: DacContext) {
  const { search, preferredCycle, mode, basketId, brandId, coupons } = context;
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
          sendBack({ type: "SEARCH_COMPLETE" });
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
          sendBack({ type: "SEARCH_COMPLETE" });
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
      let data = (suggestionsData ?? []).map((item: DomainProduct) => ({
        ...item,
        meta: { ...item.meta, exactMatch: false as boolean }
      }));

      if (exactDomain && availabilityData) {
        data = data.filter(
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

    const promocodes = parsePromotionsOrCoupons(coupons).join();

    // --- Suggestions call
    const { get: getData, useUrl } = useQuery();
    getData<any, any>({
      url: useUrl(
        `modules/web_hosting/domains/suggestions`,
        omitBy(
          {
            query: sld,
            with: DOMAIN_WITH_RELATIONS,
            basket_id: basketId,
            brand_id: brandId,
            promotions: promocodes
          },
          isEmpty
        )
      ),
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
  checkingDomain,
  basketId,
  brandId,
  coupons
}: DacContext) {
  const { get, useUrl } = useQuery();

  if (!checkingDomain)
    return Promise.reject(
      new DetailedError(
        "No domain specified for availability check",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const promocodes = parsePromotionsOrCoupons(coupons).join();

  return get<any, IDomainAvailabilityResponse>({
    url: useUrl(
      `modules/web_hosting/domains/availability/${checkingDomain}`,
      omitBy(
        {
          with: DOMAIN_WITH_RELATIONS,
          basket_id: basketId,
          brand_id: brandId,
          promotions: promocodes
        },
        isEmpty
      )
    ),
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

  model.coupons = coupons ?? model.coupons ?? [];
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

    if (errorMessage.includes("cannot be registered")) {
      return {
        can_register: false,
        can_transfer: true,
        error_code: "web_hosting::domain_transfer_only"
      };
    }
    if (errorMessage.includes("cannot be transferred")) {
      return {
        can_register: true,
        can_transfer: false,
        error_code: "web_hosting::domain_register_only"
      };
    }
    if (
      errorMessage.includes("not for sale") ||
      errorMessage.includes("not available")
    ) {
      return {
        can_register: false,
        can_transfer: false,
        error_code: "web_hosting::domain_not_for_sale"
      };
    }

    // 409 = conflict — only treat as a register/transfer flip if the API
    // actually returned can_register / can_transfer in the response data.
    // If errorData is empty/null the 409 is likely a domain-specific error
    // whose error code was stripped by the error pipeline.
    if (
      status === 409 &&
      errorData &&
      ("can_register" in errorData || "can_transfer" in errorData)
    ) {
      return {
        can_register: errorData.can_register ?? false,
        can_transfer: errorData.can_transfer ?? false,
        conflict: true
      };
    }

    // 409 without can_register/can_transfer → treat as not-for-sale
    if (status === 409) {
      return {
        can_register: false,
        can_transfer: false,
        error_code: "web_hosting::domain_not_for_sale"
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

// -----------------------------------------------------------------------------

/**
 * Legacy search using the old /search endpoint.
 * Uses the same callback pattern (SEARCH_RESULTS / SEARCH_COMPLETE / SEARCH_ERROR)
 * as the new suggestions-based search so the machine handles both uniformly.
 */
function legacySearch(context: DacContext) {
  const { search, basketId, brandId, coupons, preferredCycle } = context;
  const { t } = useI18n();
  const { cancel, getList, useUrl } = useQuery();

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
    const promocodes = parsePromotionsOrCoupons(coupons).join();

    const params = omitBy(
      {
        sld,
        tld,
        with: DOMAIN_WITH_RELATIONS,
        basket_id: basketId,
        brand_id: brandId,
        promotions: promocodes
      },
      isEmpty
    );

    cancel(["domains", "search"]);

    getList<IProduct[], DomainProduct[]>({
      url: useUrl("modules/web_hosting/domains/search", params),
      queryKey: ["domains", "search", { ...params }],
      pagination: {
        limit: search?.limit ?? PAGINATION.limit,
        offset: search?.offset ?? PAGINATION.offset
      },
      withAccessToken: true,
      withCurrency: true,
      select: data => parseAvailable(sld, data ?? [], preferredCycle)
    })
      .then(response => {
        sendBack({
          type: "SEARCH_RESULTS",
          data: {
            data: response.data ?? [],
            total: response.total ?? 0
          }
        });
        sendBack({ type: "SEARCH_COMPLETE" });
      })
      .catch(error => {
        if (error?.name !== "AbortError") {
          sendBack({ type: "SEARCH_ERROR", data: error });
        }
      });
  };
}

// -----------------------------------------------------------------------------

export default {
  search,
  legacySearch,
  checkAvailability,
  addDomainToBasket,
  getClientDomains
};
