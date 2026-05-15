// --- external

// --- internal
import {
  type DomainModel,
  type DomainProduct,
  useFeedback,
  useI18n,
  useQuery,
  useSession
} from "../..";

// --- utils
import { compact, find, isEmpty, keyBy, map, omitBy, reject } from "lodash-es";
import {
  applyDacTransferOverride,
  buildAddToBasketModel,
  buildFallbackPricing,
  getDacTransferLabel,
  makePlaceholderProductDetails,
  parseAvailable,
  parseDomain,
  parseDomainParts,
  parseSuggestions
} from "./utils";
import { buildCommonMeta, pushDacEvent } from "./gtm";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";
import { PAGINATION, SUGGESTIONS_PAGE_SIZE } from "../query";
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
  DacContext,
  DomainContext,
  DomainEnvelopeResponse
} from "./types";
import { DomainTypes } from "./types";
import type {
  IDomainAvailabilityResponse,
  IDomainSuggestionResult,
  IProduct
} from "@upmind-automation/types";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// Shared `with` parameter for API calls to include full product/price data
const DOMAIN_WITH_RELATIONS = "prices,options,options.prices,attributes";

/**
 * `omitBy` predicate for URL query params.
 *
 * Drops `null`/`undefined`/empty-string/empty-array values, but **preserves
 * numbers and booleans**. Lodash's `isEmpty` would treat any number (including
 * `1`) as empty, which silently strips pagination params (`page`, `tlds_page`,
 * `limit`) from the URL.
 */
const isEmptyParam = (value: unknown): boolean =>
  value == null || value === "" || (Array.isArray(value) && value.length === 0);

// -----------------------------------------------------------------------------

/**
 * Builds a `priceLoading` placeholder row for the exact-match domain while
 * `/availability` is in flight. Reserves the top of the list so the suggestion
 * data never leaks through with conflicting flags (e.g. transfer-able from
 * suggestions but actually unavailable per availability). The merge in
 * `setSearchResults` upgrades this row in place once the authoritative
 * availability-derived version arrives (`checkedAvailability=true`).
 */
function buildExactMatchPlaceholder(
  rawDomain: string,
  sld: string,
  tld?: string
): DomainProduct {
  // Display the exact string the user typed — don't run it through
  // `parseDomain` (psl), which strips subdomains
  // (e.g. "ddd.ominik.com" → "ominik.com").
  return {
    domain: rawDomain,
    sld,
    tld: tld ?? "",
    configuration: {
      productId: "",
      term: 12,
      quantity: 1,
      provisionFields: { sld }
    },
    price: {
      currentPrice: "",
      currentAmount: 0,
      regularPrice: "",
      regularAmount: 0,
      savingAmount: 0,
      savingPrice: "",
      savingPercent: ""
    },
    meta: {
      exactMatch: true,
      priceLoading: true
    },
    productDetails: makePlaceholderProductDetails({
      domain: rawDomain,
      name: tld ?? ""
    }),
    pricing: [],
    details: []
  };
}

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
  // Display the exact string the user typed for the row — don't run it
  // through `parseDomain` (psl), which strips subdomains
  // (e.g. "ddd.ominik.com" → "ominik.com"). `parseDomainParts` keeps the
  // full TLD chain (".ominik.com") which matches what the user sees.
  const { sld, tld } = parseDomainParts(domain);
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
      product,
      preferredCycle
    );

    return {
      domain,
      sld,
      tld: tld ?? "",
      configuration,
      price: termDetails.price,
      meta: {
        ...(termDetails.meta ?? {}),
        available: availability.can_register,
        canTransfer: !availability.can_register && availability.can_transfer,
        unavailable: !availability.can_register && !availability.can_transfer,
        checkedAvailability: true,
        disabled: !availability.can_register && !availability.can_transfer,
        exactMatch: true,
        transferLabel: getDacTransferLabel(product)
      },
      productDetails: {
        ...productDetails,
        title: domain
      },
      pricing: [],
      details: [],
      rawProduct: product
    };
  }

  // Fallback when product is missing (no `product_id` in /availability).
  // Without a product we have no sub_pids, no real price, and the basket
  // call would fail — so the row is treated as **fully unavailable**
  // regardless of the API's `can_register` / `can_transfer` flags. The
  // user can't act on it from this surface.
  // Use availability.product to avoid TS narrowing (product is `never` after the early return)
  const { price, billingCycleMonths } = buildFallbackPricing(
    availability.product?.prices ?? [],
    preferredCycle
  );

  return {
    domain,
    sld,
    tld: tld ?? "",
    configuration: {
      productId: "",
      term: billingCycleMonths,
      quantity: 1,
      provisionFields: { sld }
    },
    price,
    meta: {
      available: false,
      canTransfer: false,
      unavailable: true,
      checkedAvailability: true,
      disabled: true,
      exactMatch: true,
      transferLabel: getDacTransferLabel(availability.product)
    },
    productDetails: makePlaceholderProductDetails({
      domain,
      name: tld ?? ""
    }),
    pricing: [],
    details: []
  };
}

// -----------------------------------------------------------------------------

function search(context: DacContext) {
  const {
    search,
    preferredCycle,
    mode,
    basketId,
    brandId,
    coupons,
    tlds,
    tldsSort
  } = context;
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
    const page = search.page ?? 1;
    // Both /suggestions and /suggestions/tlds always paginate at the BE's
    // fixed page size (regardless of PAGINATION.limit, which defaults to 10).
    const limit = SUGGESTIONS_PAGE_SIZE;

    cancel(["domains", "suggestions"]);
    cancel(["domains", "suggestions", "tlds"]);

    const commonMeta = buildCommonMeta(context);

    // --- TRANSFER mode: only checkAvailability, no suggestions
    if (mode === DomainTypes.transfer) {
      const domain = search.query;
      // `dac_exact_match_check` fires inside the resolution callbacks below
      // (success + non-abort error) so aborted searches don't leave a
      // dangling check without a matching result event.
      checkAvailability({
        ...context,
        checkingDomain: domain
      } as DacContext)
        .then(availability => {
          pushDacEvent("dac_exact_match_check", { ...commonMeta, domain });
          pushDacEvent("dac_exact_match_result", {
            ...commonMeta,
            domain,
            pid: availability?.product?.id ?? null,
            is_available: !!availability?.can_register,
            can_transfer: !!availability?.can_transfer,
            has_error: false
          });
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
              totalPages: 1,
              availability,
              exactDomain: domain
            }
          });
          sendBack({ type: "SEARCH_COMPLETE" });
        })
        .catch(error => {
          if (error?.name === "AbortError") return;
          pushDacEvent("dac_exact_match_check", { ...commonMeta, domain });
          pushDacEvent("dac_exact_match_result", {
            ...commonMeta,
            domain,
            pid: null,
            is_available: false,
            can_transfer: false,
            has_error: true
          });
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
              totalPages: 1,
              availability: null,
              exactDomain: domain
            }
          });
          sendBack({ type: "SEARCH_COMPLETE" });
        });
      return;
    }

    // dac_search fires for register-mode searches (transfer mode does an
    // exact-match check rather than a search and is intentionally excluded
    // per the widget contract).
    pushDacEvent("dac_search", {
      ...commonMeta,
      tlds: tlds ?? [],
      coupons: coupons ?? [],
      currency_code: context.currency ?? null
    });

    // --- REGISTER mode: fire suggestions + tlds (and availability when
    //     a TLD is in the query) in parallel via a single callback service.
    //
    // The state stays in `searching` until ALL calls have resolved — this
    // is required because XState cancels the callback service (and drops
    // any pending sendBack events) the moment we transition out. Each
    // call's resolution emits SEARCH_RESULTS with the merged-so-far rows
    // (using parseSuggestions, which produces priceLoading rows when the
    // products map is still empty). The list becomes visible as soon as
    // /suggestions emits — the UI renders cards based on `hasAvailable`,
    // not on the searching state itself, so price skeletons stay in place
    // until /suggestions/tlds arrives and SEARCH_RESULTS re-emits with
    // full pricing.

    const rawExactDomain = tld ? `${sld}${tld}` : undefined;
    const parsedExact = rawExactDomain
      ? parseDomain(rawExactDomain)
      : undefined;
    const exactDomain = parsedExact?.domain ?? rawExactDomain;

    let suggestionsList: IDomainSuggestionResult[] | null = null;
    // Seed from the cumulative map carried in context — page-N suggestions
    // often reference TLDs that were returned on an earlier /tlds page, so
    // the prior page's products must remain available when parsing this page.
    let productsMap: Record<string, IProduct> = {
      ...(context.productsMap ?? {})
    };
    let availabilityData: IDomainAvailabilityResponse | null = null;
    let suggestionsTotalPages = 0;
    let pending = tld ? 3 : 2; // suggestions + tlds (+ availability if tld)

    const promocodes = parsePromotionsOrCoupons(coupons).join();
    const { get: getData, queryClient, request, useUrl } = useQuery();

    const buildResult = () => {
      let data: DomainProduct[] = parseSuggestions(
        suggestionsList ?? [],
        productsMap,
        preferredCycle
      );

      data = map(data, item => ({
        ...item,
        meta: { ...item.meta, exactMatch: false as boolean }
      }));

      if (exactDomain) {
        // The exact-match row is always reserved for /availability — even
        // if /suggestions happens to return it, drop the suggestion-derived
        // version. We render a priceLoading placeholder until /availability
        // resolves, then replace it with the authoritative version.
        data = reject(data, ["domain", exactDomain]) as DomainProduct[];

        if (availabilityData) {
          const exactProduct = buildDomainProductFromAvailability(
            rawExactDomain!,
            availabilityData,
            preferredCycle
          );
          data.unshift(exactProduct);
        } else {
          data.unshift(buildExactMatchPlaceholder(rawExactDomain!, sld, tld));
        }
      }

      return {
        data,
        total: data.length,
        totalPages: suggestionsTotalPages,
        page,
        availability: availabilityData,
        exactDomain,
        // Pass the cumulative products map back so the machine can persist
        // it on context for the next paginated fetch.
        productsMap
      };
    };

    let suggestionsErrored = false;

    // Emits SEARCH_RESULTS with the latest merged state, and SEARCH_COMPLETE
    // once every parallel call has settled. We skip the SEARCH_RESULTS emit
    // until /suggestions has returned — otherwise there are no rows to render.
    const sendResult = () => {
      pending--;
      if (suggestionsList !== null) {
        sendBack({ type: "SEARCH_RESULTS", data: buildResult() });
      }
      if (pending <= 0) {
        // Snapshot the first-batch result list for the GTM event. Per the
        // widget doc `has_exact_match` reflects this initial snapshot — the
        // exact-match price/availability resolves separately via the
        // `dac_exact_match_result` event.
        const merged = buildResult();
        const resultsCount = merged.data.length;
        if (resultsCount === 0) {
          pushDacEvent("dac_no_results", commonMeta);
        } else {
          pushDacEvent("dac_search_results", {
            ...commonMeta,
            results_count: resultsCount,
            has_exact_match: !!merged.exactDomain,
            has_error: suggestionsErrored
          });
        }
        sendBack({ type: "SEARCH_COMPLETE" });
      }
    };

    // --- /suggestions call (lightweight rows: domain, sld, tld, product_id)
    getData<any, any>({
      url: useUrl(
        `modules/web_hosting/domains/suggestions`,
        omitBy(
          {
            query: sld,
            // `useUrl` bracket-serialises arrays (tlds[]=com&tlds[]=net),
            // so pass the array directly rather than joining ourselves.
            tlds,
            tlds_page: page,
            tlds_sort_by: tldsSort,
            limit,
            basket_id: basketId,
            brand_id: brandId,
            promotions: promocodes
          },
          isEmptyParam
        )
      ),
      queryKey: ["domains", "suggestions", sld, page],
      withAccessToken: true,
      withCurrency: true,
      select: (results, meta) => ({
        data: (results ?? []) as IDomainSuggestionResult[],
        totalPages: (meta?.total_pages as number) ?? 1
      })
    })
      .then(({ data, totalPages }) => {
        suggestionsList = data;
        suggestionsTotalPages = totalPages;
        sendResult();
      })
      .catch(error => {
        if (error?.name === "AbortError") return;

        // 409 from /suggestions means the brand has no domains available
        // for sale — surface the API's own message as a single toast
        // (the parallel /suggestions/tlds 409 is intentionally swallowed
        // so the user doesn't see the same error twice). Then settle the
        // search with an empty list rather than transitioning to the
        // machine's `error` state, so the UI renders the "no results"
        // empty state instead of an error screen.
        if (error?.status === 409 || error?.code === 409) {
          useFeedback().addError({
            title: error?.message ?? t("error.domain_unavailable")
          });
          suggestionsList = [];
          suggestionsTotalPages = 0;
          suggestionsErrored = true;
          sendResult();
          return;
        }

        sendBack({ type: "SEARCH_ERROR", data: error });
      });

    // --- /suggestions/tlds call (full IProduct entries — used to fill prices)
    //
    // Returns full IProduct entries in `data` plus extras in `related`.
    // We merge both into a single product_id → IProduct lookup map.
    //
    // Uses `request` directly (rather than `get`) so the raw envelope —
    // including the sideloaded `related.products` map — is available.
    // `QueryResponse` deliberately no longer types `related`; the domain
    // envelope extension (`DomainEnvelopeResponse`) covers it locally.
    queryClient
      .fetchQuery<DomainEnvelopeResponse<IProduct[]>>({
        queryKey: ["domains", "suggestions", "tlds", sld, page],
        queryFn: () =>
          request<IProduct[]>({
            url: useUrl(
              `modules/web_hosting/domains/suggestions/tlds`,
              omitBy(
                {
                  query: sld,
                  with: DOMAIN_WITH_RELATIONS,
                  tlds,
                  tlds_page: page,
                  tlds_sort_by: tldsSort,
                  limit,
                  basket_id: basketId,
                  brand_id: brandId,
                  promotions: promocodes
                },
                isEmptyParam
              )
            ),
            withAccessToken: true,
            withCurrency: true
          }) as Promise<DomainEnvelopeResponse<IProduct[]>>
      })
      .then(envelope => {
        const fromData = keyBy(envelope.data ?? [], "id") as Record<
          string,
          IProduct
        >;
        const fromRelated = envelope.related?.products ?? {};
        return { ...fromRelated, ...fromData };
      })
      .then(newProducts => {
        // Merge the new page's products into the cumulative map (don't
        // overwrite — earlier pages' products must remain available).
        productsMap = { ...productsMap, ...newProducts };
        sendResult();
      })
      .catch(error => {
        if (error?.name === "AbortError") return;
        // Tlds failed — keep priceLoading rows as-is and unblock SEARCH_COMPLETE.
        sendResult();
      });

    // --- Availability call (only when query has a TLD)
    if (tld) {
      const exactDomainForCheck = `${sld}${tld}`;
      // `dac_exact_match_check` fires inside the resolution callbacks below
      // (success + non-abort error) so aborted searches don't leave a
      // dangling check without a matching result event.
      checkAvailability({
        ...context,
        checkingDomain: exactDomainForCheck
      } as DacContext)
        .then(availability => {
          availabilityData = availability;
          pushDacEvent("dac_exact_match_check", {
            ...commonMeta,
            domain: exactDomainForCheck
          });
          pushDacEvent("dac_exact_match_result", {
            ...commonMeta,
            domain: exactDomainForCheck,
            pid: availability?.product?.id ?? null,
            is_available: !!availability?.can_register,
            can_transfer: !!availability?.can_transfer,
            has_error: false
          });
          sendResult();
        })
        .catch(error => {
          if (error?.name === "AbortError") return;
          availabilityData = {
            can_register: false,
            can_transfer: false
          } as IDomainAvailabilityResponse;
          pushDacEvent("dac_exact_match_check", {
            ...commonMeta,
            domain: exactDomainForCheck
          });
          pushDacEvent("dac_exact_match_result", {
            ...commonMeta,
            domain: exactDomainForCheck,
            pid: null,
            is_available: false,
            can_transfer: false,
            has_error: true
          });
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
  const { queryClient, request, useUrl } = useQuery();

  if (!checkingDomain)
    return Promise.reject(
      new DetailedError(
        "No domain specified for availability check",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const promocodes = parsePromotionsOrCoupons(coupons).join();

  // Bypasses `get` so the raw envelope — specifically `related.products` —
  // is reachable: when the product isn't on `data.product` directly, it's
  // sideloaded into `related.products[product_id]` and we splice it back.
  return queryClient
    .fetchQuery<DomainEnvelopeResponse<Record<string, any>>>({
      queryKey: ["domains", "availability", checkingDomain],
      queryFn: () =>
        request<Record<string, any>>({
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
          withAccessToken: true,
          withCurrency: true
        }) as Promise<DomainEnvelopeResponse<Record<string, any>>>
    })
    .then(envelope => {
      const record = (envelope.data ?? {}) as Record<string, any>;
      if (!record.product && record.product_id && envelope.related?.products) {
        record.product = envelope.related.products[record.product_id];
      }
      // Apply brand-level transfer override (product or category meta).
      // Mutating here means every downstream consumer — VERIFY_RESULT
      // guards, buildDomainProductFromAvailability, etc. — sees the
      // adjusted flag without each having to know about the override.
      record.can_transfer = applyDacTransferOverride(
        record.can_transfer,
        record.product
      );
      return record as IDomainAvailabilityResponse;
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

  const model = buildAddToBasketModel(product, parseProductModel, coupons);

  if (!model)
    return Promise.reject(
      new DetailedError(
        "Product model not found for domain",
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  try {
    // productServices.update handles missing basketId by generating a new basket
    await productServices.update(basketId, model);

    // Basket add succeeded → domain is available and now in basket
    return { can_register: true, can_transfer: false };
  } catch (error: any) {
    const status = error?.code ?? error?.status ?? error?.response?.status;
    const errorData = error?.data ?? error?.response?.data;

    // Try to extract the domain-specific error code. Prefer `apiCode` —
    // `handleError` preserves the API's structured `error.code` there
    // (e.g. `"web_hosting::domain_register_only"`). The other paths cover
    // edge cases where the error didn't go through the standard pipeline.
    const errorCode =
      error?.apiCode ??
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

    const commonMeta = buildCommonMeta(context);
    pushDacEvent("dac_search", {
      ...commonMeta,
      tlds: context.tlds ?? [],
      coupons: coupons ?? [],
      currency_code: context.currency ?? null
    });

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
        const rows = response.data ?? [];
        if (rows.length === 0) {
          pushDacEvent("dac_no_results", commonMeta);
        } else {
          pushDacEvent("dac_search_results", {
            ...commonMeta,
            results_count: rows.length,
            // Legacy /search doesn't surface a separate exact-match row —
            // it's already inline in the result list, so we can't reliably
            // detect it without re-parsing. Report false to match the doc's
            // "first-batch snapshot" semantics.
            has_exact_match: false,
            has_error: false
          });
        }
        sendBack({
          type: "SEARCH_RESULTS",
          data: {
            data: rows,
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
