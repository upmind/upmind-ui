// --- external

// --- internal
import {
  type DomainModel,
  type DomainProduct,
  useFeedback,
  useI18n,
  useQuery,
  useSession,
  useSystem
} from "../..";

// --- utils
import {
  cloneDeep,
  compact,
  filter,
  first,
  isEmpty,
  keyBy,
  map,
  omitBy,
  reject
} from "lodash-es";
import {
  applyDacTransferOverride,
  buildFallbackPricing,
  getDacTransferLabel,
  getDomainRawBasketProducts,
  getTransferOptionPrice,
  hasTransferSetup,
  isBasketTransfer,
  makePlaceholderProductDetails,
  parseAvailable,
  parseDomain,
  parseDomainParts,
  parseSuggestions
} from "./utils";
import { parsePromotionsOrCoupons } from "../basketProduct/utils";
import { isAbortError, PAGINATION } from "../query";
import productServices from "../basketProduct/services";
import {
  calculateBillingTerm,
  parseProductDetails,
  parseProductProps,
  parseTermDetails
} from "../product/utils";
import { applyConfigDefaults } from "../product";
import { useBrand } from "../brand";

// --- types
import type {
  DacContext,
  DomainContext,
  DomainEnvelopeResponse
} from "./types";
import { DomainMode } from "./types";
import type {
  IDomainAvailabilityResponse,
  IDomainSuggestionResult,
  IDomainSuggestionResultProduct,
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

  // For availability rows, use product.sub_product_id
  const subproducts: string[] = compact([product?.sub_product_id]);

  // When a full product is available, use proper term/pricing parsing
  // so promotions, savings, and "Was X, now Y" descriptions are computed
  if (product) {
    const productDetails = parseProductDetails(product);
    const terms = parseTermDetails(product);
    const termDetails = calculateBillingTerm(
      preferredCycle ?? product.default_payment_period,
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

    // Route can_transfer through the override so brand-config blocks AND
    // products with no `setup_function_sub_ids.transfer` collapse to false.
    const canTransferEffective = applyDacTransferOverride(
      availability.can_transfer,
      product
    );
    const isAvailable = !!availability.can_register;
    const isFullyUnavailable = !isAvailable && !canTransferEffective;

    // Brand-supplied transfer-price override (see `parseSuggestions` for the
    // matching DAC-side path). Returns `{ price, isFree }` or undefined; the
    // two fields land separately on `meta` so the UI can swap free/paid copy
    // without locale-sniffing the formatted label.
    const transferOption = getTransferOptionPrice(
      product as IDomainSuggestionResultProduct,
      product.prices?.[0]?.currency_code
    );

    return {
      domain,
      sld,
      tld: tld ?? "",
      configuration,
      price: termDetails.price,
      meta: {
        ...(termDetails.meta ?? {}),
        available: isAvailable,
        canTransfer: !isAvailable && canTransferEffective,
        unavailable: isFullyUnavailable,
        checkedAvailability: true,
        disabled: isFullyUnavailable,
        exactMatch: true,
        transferLabel: getDacTransferLabel(product),
        transferOptionPrice: transferOption?.price,
        transferOptionIsFree: transferOption?.isFree
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
    const limit = search.limit ?? 20;

    // Cancel any in-flight calls from a previous search round so they
    // can't `sendResult()` with stale data after the user has typed more
    // characters. `cancelQueries` signals TanStack to abort the active
    // `queryFn` — propagation to `fetch` relies on each `queryFn` below
    // accepting `({ signal })` and forwarding it via `init.signal`. Don't
    // remove the signal-forwarding without re-checking this contract.
    cancel(["domains", "suggestions"]);
    cancel(["domains", "suggestions", "tlds"]);
    cancel(["domains", "availability"]);

    // --- TRANSFER mode: only checkAvailability, no suggestions
    if (mode === DomainMode.transfer) {
      const domain = search.query;
      // `EXACT_MATCH_CHECK` / `EXACT_MATCH_RESULT` are tracking-only events
      // — the machine catches them and fires `upm.dac_exact_match_*`. We
      // emit from inside the resolution callbacks (success + non-abort
      // error) so aborted searches don't leave a dangling check event
      // without a matching result event.
      checkAvailability({
        ...context,
        checkingDomain: domain
      } as DacContext)
        .then(availability => {
          sendBack({ type: "EXACT_MATCH_CHECK", data: { domain } });
          sendBack({
            type: "EXACT_MATCH_RESULT",
            data: {
              domain,
              pid: availability?.product?.id ?? null,
              is_available: !!availability?.can_register,
              can_transfer: !!availability?.can_transfer,
              has_error: false
            }
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
          sendBack({
            type: "SEARCH_COMPLETE",
            data: { resultsCount: 1, hasExactMatch: true, hasError: false }
          });
        })
        .catch(error => {
          if (isAbortError(error)) return;
          sendBack({ type: "EXACT_MATCH_CHECK", data: { domain } });
          sendBack({
            type: "EXACT_MATCH_RESULT",
            data: {
              domain,
              pid: null,
              is_available: false,
              can_transfer: false,
              has_error: true
            }
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

    // --- REGISTER mode: fire suggestions + tlds (and availability when
    //     a TLD is in the query) in parallel via a single callback service.
    //
    // `upm.dac_search` itself is pushed by the machine on `searching` entry
    // — see `pushDacSearch` in dac.machine.ts. The service only emits the
    // search-completion event with the row counts.
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
    // Tracks whether /tlds (the product-pricing side of the split flow) has
    // settled — once it has, any suggestion row whose `product_id` still
    // isn't in `productsMap` will never get a price, so it must NOT keep
    // rendering as `priceLoading` forever. See `buildResult` below.
    let tldsResolved = false;

    const promocodes = parsePromotionsOrCoupons(coupons).join();
    const { queryClient, request, useUrl } = useQuery();

    const buildResult = () => {
      let data: DomainProduct[] = parseSuggestions(
        suggestionsList ?? [],
        productsMap,
        preferredCycle
      );

      // Once /tlds has settled, any row still flagged `priceLoading` is
      // a row whose `product_id` will never resolve to a product (the
      // /suggestions endpoint can include rows that /tlds doesn't price).
      // Drop them — leaving them in the list renders an unactionable
      // skeleton forever ("infinity loading"). Before /tlds resolves we
      // intentionally keep them so the user sees progress.
      if (tldsResolved) {
        data = filter(data, item => !item.meta?.priceLoading);
      }

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
        // `dac_exact_match_result` event. Result counts ride on the
        // `SEARCH_COMPLETE` event data so the machine can pick between
        // `dac_search_results` and `dac_no_results` via guard.
        const merged = buildResult();
        const resultsCount = merged.data.length;
        sendBack({
          type: "SEARCH_COMPLETE",
          data: {
            resultsCount,
            hasExactMatch: !!merged.exactDomain,
            hasError: suggestionsErrored
          }
        });
      }
    };

    // --- /suggestions call (lightweight rows: domain, sld, tld, product_id)
    //
    // Uses `fetchQuery` directly (rather than `get`) so the raw envelope —
    // including the domain-shaped `meta.total_pages` — is reachable
    // locally. `QueryResponse.meta` is loosely typed (`Record<string, any>`);
    // the domain envelope extension (`DomainEnvelopeResponse`) narrows it.
    // Mirrors the `/tlds` call below for consistency.
    queryClient
      .fetchQuery<DomainEnvelopeResponse<IDomainSuggestionResult[]>>({
        queryKey: ["domains", "suggestions", sld, page],
        // Accept TanStack's `signal` and forward it to `fetch` via `init`,
        // so the `cancel(["domains", "suggestions"])` call above actually
        // aborts the HTTP request when the user types another character.
        // Without this, the stale fetch completes silently and its `.then`
        // can clobber the newer search's results.
        queryFn: ({ signal }) =>
          request<IDomainSuggestionResult[]>({
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
            init: { signal },
            withAccessToken: true,
            withCurrency: true
          }) as Promise<DomainEnvelopeResponse<IDomainSuggestionResult[]>>
      })
      .then(envelope => ({
        data: envelope.data ?? [],
        totalPages: envelope.meta?.total_pages ?? 1
      }))
      .then(({ data, totalPages }) => {
        suggestionsList = data;
        suggestionsTotalPages = totalPages;
        sendResult();
      })
      .catch(error => {
        if (isAbortError(error)) return;

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
    // `QueryResponse.related` is loosely typed (`Record<string, any>`); the
    // domain envelope extension (`DomainEnvelopeResponse`) narrows it.
    queryClient
      .fetchQuery<DomainEnvelopeResponse<IProduct[]>>({
        queryKey: ["domains", "suggestions", "tlds", sld, page],
        // See the `/suggestions` queryFn above — same contract: accept
        // TanStack's `signal` and forward it to `fetch` so the previous
        // round's request can actually abort when search restarts.
        queryFn: ({ signal }) =>
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
            init: { signal },
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
        tldsResolved = true;
        sendResult();
      })
      .catch(error => {
        if (isAbortError(error)) return;
        // Tlds failed — treat it as resolved so suggestion rows whose
        // product never arrived collapse out of `priceLoading` instead of
        // spinning forever. Then unblock SEARCH_COMPLETE.
        tldsResolved = true;
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
          sendBack({
            type: "EXACT_MATCH_CHECK",
            data: { domain: exactDomainForCheck }
          });
          sendBack({
            type: "EXACT_MATCH_RESULT",
            data: {
              domain: exactDomainForCheck,
              pid: availability?.product?.id ?? null,
              is_available: !!availability?.can_register,
              can_transfer: !!availability?.can_transfer,
              has_error: false
            }
          });
          sendResult();
        })
        .catch(error => {
          if (isAbortError(error)) return;
          availabilityData = {
            can_register: false,
            can_transfer: false
          } as IDomainAvailabilityResponse;
          sendBack({
            type: "EXACT_MATCH_CHECK",
            data: { domain: exactDomainForCheck }
          });
          sendBack({
            type: "EXACT_MATCH_RESULT",
            data: {
              domain: exactDomainForCheck,
              pid: null,
              is_available: false,
              can_transfer: false,
              has_error: true
            }
          });
          sendResult();
        });
    }
  };
}

/**
 * Performs a `/availability` lookup for `checkingDomain`.
 *
 * Cancellation
 * ------------
 * Pass `signal` to make the in-flight fetch cancellable. Aborted calls
 * reject with a standard `AbortError` (`err.name === "AbortError"`) AND
 * are recognised by the codebase's canonical `isAbortError` helper —
 * either detection pattern is supported.
 *
 * `signal` lives on the first arg (the same context-shaped object every
 * existing caller already passes) rather than a second parameter, so the
 * function stays compatible with XState's `invoke` call shape
 * (`(context, event) => ...`) — see `domain.machine.ts`.
 *
 * Recommended caller pattern (e.g. cancel-on-keystroke when the user is
 * typing a domain fast enough to overlap requests, so the last-keystroke
 * result wins instead of whichever response happens to land first):
 *
 * ```ts
 * const controllerRef = ref<AbortController | undefined>();
 * function check(domain: string) {
 *   controllerRef.value?.abort();
 *   controllerRef.value = new AbortController();
 *   checkAvailability({
 *     checkingDomain: domain,
 *     ...,
 *     signal: controllerRef.value.signal
 *   }).catch(err => {
 *     if (isAbortError(err)) return;     // expected when superseded
 *     throw err;                          // real failure
 *   });
 * }
 * ```
 *
 * Note: the function deliberately uses `queryClient.fetchQuery` rather than
 * `useQuery().get` so the raw envelope (`related.products`) is reachable
 * for the sideloaded-product splice below. Do NOT switch to `useQuery` —
 * see FE-2804 / `useDac` notes.
 */
async function checkAvailability({
  checkingDomain,
  basketId,
  brandId,
  coupons,
  signal
}: Pick<DacContext, "checkingDomain" | "basketId" | "brandId" | "coupons"> & {
  signal?: AbortSignal;
}) {
  const { t } = useI18n();
  const { queryClient, request, useUrl } = useQuery();

  if (!checkingDomain)
    return Promise.reject(
      new DetailedError(
        t("error.domain_availability_required"),
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
      // TanStack passes its own `signal` here (aborted by `cancelQueries`,
      // used by `search()` to drop the previous round's /availability when
      // the user types again). The function also accepts a caller-provided
      // `signal` (FE-2804) for explicit cancel-on-keystroke. Combine the
      // two with `AbortSignal.any` so EITHER source aborts the fetch — if
      // only one is supplied, that one is used directly.
      queryFn: ({ signal: tanstackSignal }) => {
        const composedSignal = signal
          ? AbortSignal.any([signal, tanstackSignal])
          : tanstackSignal;
        return request<Record<string, any>>({
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
          init: { signal: composedSignal },
          withAccessToken: true,
          withCurrency: true
        }) as Promise<DomainEnvelopeResponse<Record<string, any>>>;
      }
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
    })
    .catch(err => {
      // `doFetch` flattens fetch's native `AbortError` into a bare
      // `Promise.reject()` (see `query/services.ts`) — that shape is fine
      // for the codebase's `isAbortError` helper but doesn't expose
      // `err.name === "AbortError"`. When the caller's signal was the
      // cause, re-throw a `DetailedError` with `code: Aborted` AND
      // `name: "AbortError"` so BOTH detection patterns work and the
      // error is localized like every other DetailedError raised here.
      // Falls through with the original error for any other failure.
      if (signal?.aborted) {
        const abortErr = new DetailedError(
          t("error.domain_availability_aborted"),
          responseCodes.Aborted,
          ErrorOrigin.Headless
        );
        abortErr.name = "AbortError";
        throw abortErr;
      }
      throw err;
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

    // `upm.dac_search` is pushed by the machine on `searching` entry —
    // see `pushDacSearch` in dac.machine.ts.

    getList<IProduct[], DomainProduct[]>({
      url: useUrl("modules/web_hosting/domains/search", params),
      queryKey: ["domains", "search", { ...params }],
      pagination: {
        limit: search?.limit ?? 20,
        offset: search?.offset ?? PAGINATION.offset
      },
      withAccessToken: true,
      withCurrency: true,
      select: data => parseAvailable(sld, data ?? [], preferredCycle)
    })
      .then(response => {
        const rows = response.data ?? [];
        sendBack({
          type: "SEARCH_RESULTS",
          data: {
            data: rows,
            total: response.total ?? 0
          }
        });
        // Legacy /search doesn't surface a separate exact-match row — it's
        // inline in the result list, so we can't reliably detect it without
        // re-parsing. Report `hasExactMatch: false` to match the doc's
        // "first-batch snapshot" semantics. Result counts ride on the event
        // data so the machine can split `dac_search_results` vs
        // `dac_no_results` via guard.
        sendBack({
          type: "SEARCH_COMPLETE",
          data: {
            resultsCount: rows.length,
            hasExactMatch: false,
            hasError: false
          }
        });
      })
      .catch(error => {
        if (!isAbortError(error)) {
          sendBack({ type: "SEARCH_ERROR", data: error });
        }
      });
  };
}

// -----------------------------------------------------------------------------

async function getClientDomains(_context: DomainContext | DacContext) {
  const { get, useUrl } = useQuery();
  const { meta } = useSession();
  const { ensureBillingCycles } = useSystem();

  // FE-1698: domain/dac flows downstream call parseProductProps, which
  // depends on sync getBillingCycle(). The DAC machine's `loading` state
  // gates `searching` on this service, so ensuring here covers all DAC
  // entry paths. See system/docs/gotchas.md#1.
  await ensureBillingCycles();

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
 *
 * Identifies the just-added basket product by:
 *   1. Diffing pre/post basket — the new bpid is one that wasn't in
 *      `lookups.basket` snapshotted as a transfer for this domain before
 *      the POST. This is the primary signal.
 *   2. If the diff fails to identify a new row (e.g. the API was
 *      idempotent and returned an unchanged basket), the function REJECTS
 *      rather than returning a pre-existing bpid — adopting a pre-existing
 *      transfer would let a later REMOVE_TRANSFER delete the user's prior
 *      legitimate transfer.
 *   3. If multiple new rows match the diff (concurrent adds), the
 *      function REJECTS with a Conflict — picking arbitrarily would
 *      cross-wire the bpid to another caller's product.
 *
 * Always resolves with a defined `bpid`; rejects with a typed
 * `DetailedError` on any disambiguation failure so the caller never
 * enters the `transferred` state with an undefined `transferProductId`.
 */
async function addExistingTransfer(
  context: DomainContext
): Promise<{ bpid: string }> {
  const { t } = useI18n();
  const {
    checkingDomain,
    basketId,
    availability,
    coupons,
    preferredCycle,
    lookups
  } = context;

  if (!checkingDomain || !availability?.product)
    return Promise.reject(
      new DetailedError(
        t("error.domain_transfer_data_missing"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // A product without `setup_function_sub_ids.transfer` can't actually be
  // transferred (no sub_pids to send). Reject upfront with the same shape
  // dac.machine's `flipDomainOnAddError` uses for `transferOnly` — without
  // this the basket POST would silently go out with register sub_pids and
  // the BE would either 422 or, worse, process it as a fresh registration.
  // `setup_function_sub_ids` is sideloaded onto IProduct by the
  // /availability endpoint but isn't part of the canonical IProduct type
  // — cast via unknown to access it (same pattern as `parseSuggestions`).
  if (
    !hasTransferSetup(
      availability.product as unknown as {
        setup_function_sub_ids?: { transfer?: string[] };
      }
    )
  ) {
    return Promise.reject(
      new DetailedError(
        t("error.domain_transfer_unavailable"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  }

  const domainProduct = buildDomainProductFromAvailability(
    checkingDomain,
    availability,
    preferredCycle
  );

  // Override the baseModel sub_pids with the transfer-specific ones.
  // `buildDomainProductFromAvailability` defaults to `product.sub_product_id`
  // unconditionally — fine when the product is a bundle (register sub_pid),
  // wrong when we're firing a transfer. Two product shapes need handling:
  //   - Bundle: `setup_function_sub_ids.transfer` carries the transfer sub_pids
  //   - Single-mode transfer product (`setup_function_name === "transfer"`):
  //     `sub_product_id` IS the transfer sub_pid, no `setup_function_sub_ids`
  //     field is sent at all (e.g. `.com` transfer product from /availability)
  // Mirrors dac.machine's `flipRowToTransfer` rebuild but with the
  // single-mode fallback added — same case `hasTransferSetup` accepts.
  const transferProduct = availability.product as unknown as {
    setup_function_sub_ids?: { transfer?: string[] };
    setup_function_name?: string;
    sub_product_id?: string;
  };
  const transferSubIds = compact(
    transferProduct.setup_function_sub_ids?.transfer ??
      (transferProduct.setup_function_name === "transfer"
        ? [transferProduct.sub_product_id]
        : [])
  );
  const baseModel = domainProduct.configuration
    ? ({
        ...domainProduct.configuration,
        subproducts: transferSubIds
      } as typeof domainProduct.configuration)
    : undefined;

  if (!baseModel)
    return Promise.reject(
      new DetailedError(
        t("error.domain_transfer_product_model_missing"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // Apply the canonical schema/parse defaulting so required option/
  // attribute categories get pre-filled — same pipeline dac.machine's
  // addToBasket uses. No-op for typical TLDs (no required categories).
  // Wrap in try/catch because a malformed `availability.product` would
  // bubble a raw TypeError from `parseProductDetails`/`parseTermDetails`
  // out as an untyped rejection — fall back to a CLONE of baseModel so
  // the basket POST still happens AND the subsequent `model.coupons` /
  // `model.silent` mutations don't corrupt baseModel by reference.
  let model: typeof baseModel;
  try {
    model = applyConfigDefaults(baseModel, availability.product);
  } catch (err) {
    console.warn(
      "[domain] addExistingTransfer: applyConfigDefaults threw — falling back to baseModel",
      err
    );
    model = cloneDeep(baseModel);
  }
  // Context coupons override the model's coupons — same precedence as
  // dac.machine's `addToBasket` action. Using `??=` would skip the
  // assignment when `model.coupons` is a non-nullish empty array carried
  // in from baseModel (the schema doesn't inject coupons, but the parser
  // preserves them via `defaultsDeep + compactDeep`'s `preserveContainers`).
  model.coupons = coupons ?? model.coupons ?? [];
  model.silent = true;

  // Snapshot the pre-existing transfer bpids for this domain so we can
  // disambiguate when more than one transfer product ends up in the post-
  // update basket (rare but possible under concurrent flows).
  const existingTransferBpids = new Set(
    map(
      filter(
        lookups?.basket,
        p => p.domain === checkingDomain && p.meta?.isTransfer === true
      ),
      "id"
    )
  );

  const updatedBasket = await productServices.update(basketId, model);

  // Identify the just-added transfer by domain + isTransfer flag. The
  // invariant is one transfer per domain, so a single match is the
  // expected case.
  const updatedDomainProducts = getDomainRawBasketProducts(
    updatedBasket.products
  );
  const transferProducts = filter(
    updatedDomainProducts,
    p => p.service_identifier === checkingDomain && isBasketTransfer(p)
  );

  // Only rows that weren't in the pre-existing transfer set are candidate
  // "just added" products. Pre-existing transfers must NEVER be adopted as
  // the new one — they were owned by an earlier add and have their own
  // bpid wired into another row's `transferProductId`.
  const newTransfers = filter(
    transferProducts,
    p => !existingTransferBpids.has(p.id)
  );

  // Concurrent flows produced multiple new transfers for the same domain
  // — picking arbitrarily would cross-wire this caller's bpid to another
  // caller's product.
  if (newTransfers.length > 1) {
    return Promise.reject(
      new DetailedError(
        t("error.domain_transfer_ambiguous"),
        responseCodes.Conflict,
        ErrorOrigin.Headless
      )
    );
  }

  // No fresh row — either the POST was idempotent (the basket already
  // had the transfer, e.g. a retry after a previous success that
  // basketHelper already REFRESHed into `lookups.basket`) or the API
  // silently swallowed the add. We do NOT adopt a pre-existing bpid
  // here: in a multi-tab / concurrent flow the existing transfer may
  // belong to another caller, and wiring its bpid into THIS machine's
  // `transferProductId` would let a later REMOVE_TRANSFER delete that
  // other flow's legitimate transfer. Reject — the basketHelper REFRESH
  // will re-route the UI based on what the basket actually shows.
  if (newTransfers.length === 0) {
    const alreadyTransferred = transferProducts.length > 0;
    console.warn("[domain] addExistingTransfer: no new transfer identified", {
      checkingDomain,
      alreadyTransferred,
      transferProductCount: transferProducts.length,
      existingTransferBpidCount: existingTransferBpids.size
    });
    return Promise.reject(
      new DetailedError(
        alreadyTransferred
          ? t("error.domain_transfer_ambiguous")
          : t("error.domain_transfer_add_failed"),
        alreadyTransferred
          ? responseCodes.Conflict
          : responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  }

  // Single fresh transfer — the expected case. Defensive bpid check:
  // a malformed API row with no id is a real error worth distinguishing
  // from the "no fresh row" path above.
  const bpid = first(newTransfers)?.id;
  if (!bpid) {
    console.warn(
      "[domain] addExistingTransfer: new transfer row has no usable id",
      { checkingDomain, transferProductCount: transferProducts.length }
    );
    return Promise.reject(
      new DetailedError(
        t("error.domain_transfer_add_failed"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );
  }
  return { bpid };
}

/**
 * Removes a transfer product from the basket.
 * Requires an exact transferProductId — does NOT fall back to domain-name lookup.
 */
async function removeExistingTransfer(context: DomainContext): Promise<void> {
  const { t } = useI18n();
  const { basketId, transferProductId } = context;

  if (!transferProductId)
    return Promise.reject(
      new DetailedError(
        t("error.domain_transfer_product_id_missing"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  await productServices.remove(basketId!, transferProductId!);
}

/**
 * Adds a registration product to the basket for the existing domain flow.
 * Used when a domain typed in the "existing" input turns out to be available
 * for registration (can_register=true).
 */
async function addExistingRegistration(
  context: DomainContext
): Promise<{ domain: string }> {
  const { t } = useI18n();
  const { checkingDomain, basketId, availability, coupons, preferredCycle } =
    context;

  if (!checkingDomain || !availability?.product)
    return Promise.reject(
      new DetailedError(
        t("error.domain_register_data_missing"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const domainProduct = buildDomainProductFromAvailability(
    checkingDomain,
    availability,
    preferredCycle
  );

  // Resolve register sub_pids explicitly. `buildDomainProductFromAvailability`
  // defaults to `product.sub_product_id` which is the canonical register
  // sub_pid for most TLDs, but when `setup_function_sub_ids.register` is
  // present it's the authoritative source — mirror dac.machine's
  // `flipRowToRegister` rebuild so both add paths derive sub_pids the
  // same way.
  const setupSubIds = (
    availability.product as unknown as {
      setup_function_sub_ids?: { register?: string[] };
      sub_product_id?: string;
    }
  ).setup_function_sub_ids;
  const registerSubIds = compact(
    setupSubIds?.register ?? [
      (availability.product as unknown as { sub_product_id?: string })
        .sub_product_id
    ]
  );
  const baseModel = domainProduct.configuration
    ? ({
        ...domainProduct.configuration,
        subproducts: registerSubIds
      } as typeof domainProduct.configuration)
    : undefined;

  if (!baseModel)
    return Promise.reject(
      new DetailedError(
        t("error.domain_register_product_model_missing"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  // Apply the canonical schema/parse defaulting so required option/
  // attribute categories get pre-filled — same pipeline dac.machine's
  // addToBasket uses. No-op for typical TLDs (no required categories).
  // Wrap in try/catch because a malformed `availability.product` would
  // bubble a raw TypeError from `parseProductDetails`/`parseTermDetails`
  // out as an untyped rejection — fall back to a CLONE of baseModel so
  // the basket POST still happens AND the subsequent `model.coupons` /
  // `model.silent` mutations don't corrupt baseModel by reference.
  let model: typeof baseModel;
  try {
    model = applyConfigDefaults(baseModel, availability.product);
  } catch (err) {
    console.warn(
      "[domain] addExistingRegistration: applyConfigDefaults threw — falling back to baseModel",
      err
    );
    model = cloneDeep(baseModel);
  }
  // Context coupons override the model's coupons — same precedence as
  // dac.machine's `addToBasket` action. Using `??=` would skip the
  // assignment when `model.coupons` is a non-nullish empty array carried
  // in from baseModel (the schema doesn't inject coupons, but the parser
  // preserves them via `defaultsDeep + compactDeep`'s `preserveContainers`).
  model.coupons = coupons ?? model.coupons ?? [];
  model.silent = true;

  await productServices.update(basketId, model);

  return { domain: checkingDomain };
}

// -----------------------------------------------------------------------------

export default {
  search,
  legacySearch,
  checkAvailability,
  addExistingTransfer,
  addExistingRegistration,
  removeExistingTransfer,
  getClientDomains
};
