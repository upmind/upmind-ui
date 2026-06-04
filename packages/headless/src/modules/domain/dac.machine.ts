// --- external
import { createMachine, assign, spawn, sendTo, pure } from "xstate";

// --- internal
import services from "./services";
import { applyConfigDefaults } from "../product";
import { basketSubscription } from "../basketProduct/helper";
import { authSubscription } from "../session/helper";
import { useDataLayer } from "../system";
import { useFeedback } from "../feedback";

// --- utils
import { mapToHeadlessError, useTime } from "../../utils";
import {
  buildCommonMeta,
  domainAvailabilityHelper,
  hasTransferSetup,
  mergeDomainSearchResults,
  parseDomain,
  parseValue,
  parseSld,
  isDomainProduct,
  sanitiseDomainInput
} from "./utils";
import { parseProductProps } from "../product/utils";
import {
  cloneDeep,
  compact,
  concat,
  defaultsDeep,
  every,
  filter,
  find,
  findIndex,
  first,
  has,
  isEmpty,
  isFunction,
  isObject,
  map,
  reduce,
  reject,
  set,
  some,
  uniqBy
} from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { IBasketProduct } from "@upmind-automation/types";
import {
  type DomainModel,
  type DacContext,
  type DomainProduct,
  DomainMode
} from "./types";
import type { ProductProps } from "../product";
import { parseBasketProduct } from "../basketProduct/utils";
import { isAbortError, PAGINATION } from "../query";
import { useI18n } from "../system";

// -----------------------------------------------------------------------------

/**
 * API-side domain-availability error codes that the basket POST can return.
 * Single source of truth so the `isDomainAddError` guard and
 * `flipDomainOnAddError` action don't drift on the spelling.
 *
 * `DomainAddErrorCode` preserves the literal union so adding a new entry
 * here surfaces as an unhandled case in `flipDomainOnAddError` rather
 * than passing the guard and silently hanging the row in `processing`.
 */
const DOMAIN_ADD_ERROR_CODES = {
  registerOnly: "web_hosting::domain_register_only",
  transferOnly: "web_hosting::domain_transfer_only",
  notForSale: "web_hosting::domain_not_for_sale"
} as const;

type DomainAddErrorCode =
  (typeof DOMAIN_ADD_ERROR_CODES)[keyof typeof DOMAIN_ADD_ERROR_CODES];

// Typed as `ReadonlySet<string>` so `.has(value)` accepts the narrowed
// `string` without a cast — `Set.prototype.has` does strict equality at
// runtime regardless of the type slot.
const DOMAIN_ADD_ERROR_CODE_SET: ReadonlySet<string> = new Set(
  Object.values(DOMAIN_ADD_ERROR_CODES)
);

function isDomainAddErrorCode(value: unknown): value is DomainAddErrorCode {
  return typeof value === "string" && DOMAIN_ADD_ERROR_CODE_SET.has(value);
}

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./domain.machine.typegen").Typegen0,
    id: "DAC",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as DacContext,
    states: {
      subscribing: {
        entry: [
          "setContext",
          "clearLookups",
          "setBasketHelper",
          "setAuthHelper",
          "setAvailabilityHelper",
          "loadBasket"
        ],
        on: {
          REFRESH: [
            {
              target: "loading",
              actions: ["setBasketProducts", "setBasket"]
            }
          ],
          ERROR: {
            actions: ["setError"]
            // target: "unavailable",
          }
        }
      },

      loading: {
        invoke: {
          src: "getClientDomains",
          onDone: [
            { target: "searching", cond: "hasSearchQuery" },
            { target: "invalid" }
          ],
          onError: { target: "error", actions: ["setError"] }
        },
        exit: ["setOwned"]
      },

      searching: {
        id: "searching",
        entry: ["clearError", "pushDacSearch"],
        invoke: {
          src: (context: DacContext) =>
            context.useSuggestions === false
              ? services.legacySearch(context)
              : services.search(context)
        },
        on: {
          // /suggestions (lightweight rows) — stays in searching until COMPLETE
          SEARCH_RESULTS: {
            actions: ["setSearchResults"]
          },
          // Suggestions finished — transition out so the list renders.
          // /suggestions/tlds and the exact-match availability call may
          // still be in-flight; their results come in below as SEARCH_*.
          // Split tracking between `dac_search_results` (≥1 row) and
          // `dac_no_results` (0 rows) via the `hasSearchResults` guard.
          SEARCH_COMPLETE: [
            {
              target: "invalid",
              actions: ["pushDacSearchResults"],
              cond: "hasSearchResults"
            },
            {
              target: "invalid",
              actions: ["pushDacNoResults"]
            }
          ],
          SEARCH_ERROR: [
            {
              target: "error",
              actions: ["setError"],
              cond: "isNotCancelled"
            },
            {
              actions: ["setError"]
            }
          ],
          // Allow adding domains while second call is still loading
          ADD: [
            {
              // Already availability-checked — skip pre-check
              actions: [
                "add",
                "setProcessing",
                "pushDacAddToBasket",
                "addToBasket"
              ],
              cond: "isAlreadyChecked"
            },
            {
              // Fire pre-check via spawned helper so multiple parallel
              // clicks each get their own /availability call.
              actions: [
                "add",
                "setProcessing",
                "pushDacAvailabilityCheck",
                "verifyDomain"
              ],
              cond: "isValidDomain"
            }
          ]
        }
      },

      valid: {
        always: [
          {
            target: "invalid",
            cond: "isInvalid"
          }
        ],
        on: {
          ADD: [
            {
              // Already availability-checked — skip pre-check
              target: "valid",
              actions: [
                "add",
                "setProcessing",
                "pushDacAddToBasket",
                "addToBasket"
              ],
              cond: "isAlreadyChecked"
            },
            {
              // Fire pre-check via spawned helper so multiple parallel
              // clicks each get their own /availability call.
              actions: [
                "add",
                "setProcessing",
                "pushDacAvailabilityCheck",
                "verifyDomain"
              ],
              cond: "isValidDomain"
            }
          ]
        }
      },

      invalid: {
        always: [{ target: "valid", cond: "isValid" }],
        on: {
          ADD: [
            {
              // Already availability-checked — skip pre-check
              target: "valid",
              actions: [
                "add",
                "setProcessing",
                "pushDacAddToBasket",
                "addToBasket"
              ],
              cond: "isAlreadyChecked"
            },
            {
              // Fire pre-check via spawned helper so multiple parallel
              // clicks each get their own /availability call.
              actions: [
                "add",
                "setProcessing",
                "pushDacAvailabilityCheck",
                "verifyDomain"
              ],
              cond: "isValidDomain"
            }
          ]
        }
      },

      error: {},

      complete: {
        type: "final",
        data: ({ model, lookups }: DacContext) => {
          const domains = lookups.basket;
          const primary = first(model);

          return {
            basket: lookups.basket,
            domains: reduce(
              model,
              (result: DomainModel[], item) => {
                // ensure we mark the primary domain
                if (item.domain === primary?.domain) {
                  item.selected = true;
                }
                result.push(item);
                return result;
              },
              []
            )
          };
        }
      }
    },

    on: {
      UPDATED: {
        actions: ["setBasketProducts"]
      },

      CANCEL: {
        actions: ["clearProcessing", "remove"]
      },

      // When `addToBasket` (basketHelper path) fails with a domain-specific
      // API error code, flip the row in place. Otherwise fall back to the
      // generic error/feedback handling. (The failed domain is removed from
      // `model` by the `CANCEL` event that the basket helper fires alongside
      // every `ERROR`, so no `remove` is needed here.)
      ERROR: [
        {
          actions: ["flipDomainOnAddError"],
          cond: "isDomainAddError"
        },
        {
          actions: ["setError", "setFeedbackError"]
        }
      ],

      // Result of a pre-flight `/availability` check fired by the
      // `verifyDomain` action. The `data` field holds the domain string
      // and `availability` holds the API response. Branches mirror the
      // legacy `verifying.onDone` flow but operate on the per-event
      // domain rather than `checkingDomain` so multiple parallel results
      // can be processed independently. `remove` undoes the optimistic push
      // in `add` so the user must explicitly re-click in the corrected mode
      // (or accept that an unavailable row is genuinely unavailable) to
      // commit — failed adds don't ghost-leak into the parent's model.
      VERIFY_RESULT: [
        {
          actions: [
            "pushDacAvailabilityResult",
            "markRowUnavailable",
            "remove"
          ],
          cond: "isAvailabilityFullyUnavailable"
        },
        {
          actions: ["pushDacAvailabilityResult", "flipRowToTransfer", "remove"],
          cond: "shouldFlipRowToTransfer"
        },
        {
          actions: ["pushDacAvailabilityResult", "flipRowToRegister", "remove"],
          cond: "shouldFlipRowToRegister"
        },
        {
          // Availability matches the row mode → proceed with add to basket
          actions: [
            "pushDacAvailabilityResult",
            "pushDacAddToBasket",
            "addToBasket"
          ]
        }
      ],

      VERIFY_ERROR: {
        actions: [
          "pushDacAvailabilityResult",
          "clearRowProcessing",
          "setError",
          "setVerifyFeedbackError"
        ]
      },

      REMOVE: {
        actions: ["setProcessing", "removeFromBasket", "remove"]
      },

      UPDATE: {
        target: "valid"
        // actions: ["setModel"]
      },

      SEARCH: [
        {
          target: "loading",
          actions: ["setSearchQuery"],
          cond: "validSearchQuery"
        },
        { actions: ["setSearchQuery"] }
      ],

      "SEARCH.OFFSET": {
        target: "loading",
        actions: ["pushDacLoadMore", "setSearchOffset"],
        cond: "validSearchOffset"
      },

      // Pure-tracking events emitted from the search service's exact-match
      // `/availability` call. Carry no machine-state effect — they exist
      // only so the tracking action stays in this file.
      EXACT_MATCH_CHECK: {
        actions: ["pushDacExactMatchCheck"]
      },

      EXACT_MATCH_RESULT: {
        actions: ["pushDacExactMatchResult"]
      },

      RESET: {
        target: "invalid",
        actions: ["resetLookups", "clearSearch"]
      },

      REFRESH: {
        actions: ["setBasketProducts", "setBasket"]
      },

      STOP: { target: "complete" },

      AUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
      UNAUTHENTICATED: { target: "loading", actions: ["clearLookups"] }
    }
  },
  {
    actions: {
      setContext: assign(
        (context: DacContext, _event: AnyEventObject) =>
          defaultsDeep(context, {
            model: [],

            lookups: {
              searched: [],
              history: [],
              owned: [],
              basket: []
            },
            // ---
            currency: undefined,
            basketId: undefined,
            brandId: undefined,
            coupons: [],
            // ---
            search: {
              query: undefined,
              limit: PAGINATION.limit,
              offset: PAGINATION.offset,
              total: 0,
              page: 1,
              totalPages: 0
            },
            // ---
            productsMap: {},
            // ---
            useSuggestions: false,
            // ---
            error: undefined,
            // ---
            authHelper: undefined,
            basketHelper: undefined,
            parseBasketProduct: undefined,
            parseProductModel: undefined
          }) as DacContext
      ),

      setBasket: assign((_context: DacContext, { data }: AnyEventObject) => {
        const { id: basketId, brand_id: brandId, currency } = data ?? {};

        const newContext = {
          basketId,
          brandId,
          currency: currency?.code
        };

        return newContext;
      }),

      setAuthHelper: assign(({ authHelper }: DacContext) => ({
        authHelper: authHelper || spawn(authSubscription)
      })),

      setAvailabilityHelper: assign(({ availabilityHelper }: DacContext) => ({
        availabilityHelper:
          availabilityHelper ?? spawn(domainAvailabilityHelper)
      })),

      verifyDomain: pure((context: DacContext, { data }: AnyEventObject) => {
        if (!context.availabilityHelper) return;
        const parsed = parseDomain(data);
        const domain = parsed?.domain ?? data;
        if (!domain) return;

        return sendTo(context.availabilityHelper, {
          type: "VERIFY",
          data: domain,
          // Pass the bits checkAvailability needs (basketId / brandId /
          // coupons) without the actor refs so the helper has everything
          // it requires without copying state machine internals.
          context: {
            basketId: context.basketId,
            brandId: context.brandId,
            coupons: context.coupons
          }
        });
      }),

      // Push `upm.dac_availability_check` at the moment we kick off the
      // pre-flight `/availability` call. Reads `event.data` (the domain string)
      // so multiple parallel ADD clicks each emit their own tracking event.
      pushDacAvailabilityCheck: (
        context: DacContext,
        { data }: AnyEventObject
      ) => {
        const parsed = parseDomain(data);
        const domain = parsed?.domain ?? data;
        if (!domain) return;
        const product = find(context.lookups.searched, ["domain", domain]) as
          | DomainProduct
          | undefined;
        const action: "register" | "transfer" =
          product?.meta?.available === false && product?.meta?.canTransfer
            ? "transfer"
            : "register";
        useDataLayer()
          .dataLayer({
            event: "upm.dac_availability_check",
            meta: {
              ...buildCommonMeta(context),
              domain,
              pid: product?.productDetails?.id ?? null,
              action
            }
          })
          .push();
      },

      // Push `dac_availability_result` for any verify outcome (success or
      // error). Reads the row's pre-flip meta so the `action` field
      // reflects the user's original intent rather than the post-flip mode.
      pushDacAvailabilityResult: (
        context: DacContext,
        { data: domain, availability, error }: AnyEventObject
      ) => {
        const product = find(context.lookups.searched, ["domain", domain]) as
          | DomainProduct
          | undefined;
        const action: "register" | "transfer" =
          product?.meta?.available === false && product?.meta?.canTransfer
            ? "transfer"
            : "register";
        useDataLayer()
          .dataLayer({
            event: "upm.dac_availability_result",
            meta: {
              ...buildCommonMeta(context),
              domain,
              pid: product?.productDetails?.id ?? null,
              is_available: !!availability?.can_register,
              can_transfer: !!availability?.can_transfer,
              has_error: !!error,
              action
            }
          })
          .push();
      },

      loadBasket: pure(({ basketHelper }: DacContext, _event) => {
        if (!basketHelper) return;
        return sendTo(basketHelper, {
          type: "INIT"
        });
      }),

      setBasketHelper: assign(({ basketHelper }: DacContext) => {
        // only do this once, set up the basket helper
        return {
          basketHelper: basketHelper ?? spawn(basketSubscription),

          parseBasketProduct: (
            raw: IBasketProduct,
            primaryDomain?: string
          ): DomainProduct | undefined => {
            // First check if we have the blueprint code available that identifies domain products
            // This is not always present as it requites a 'with' when fetching the basket
            // and the basket returned after an update may not have it
            // The fallback is to check if we have and SLD provision field
            // OR we can parse the service identifier as a domain

            const parsed = parseDomain(raw?.service_identifier);

            if (
              !isDomainProduct({
                blueprintCode:
                  raw?.product?.provision_blueprint?.category?.code,
                provisionFields: raw?.provision_fields,
                serviceIdentifier: raw?.service_identifier ?? undefined
              })
            )
              return undefined;

            const basketProduct = parseBasketProduct(raw) as DomainProduct;
            basketProduct.tld = parsed!.tld;
            basketProduct.sld = parsed!.sld;
            basketProduct.domain = parsed!.domain;
            basketProduct.meta.added = true;
            basketProduct.productDetails.title = parsed!.domain;
            return basketProduct;
          },

          parseProductModel: (
            item: DomainProduct
          ): ProductProps | undefined => {
            if (!item?.configuration?.productId) return undefined;
            return item.configuration;
          }
        };
      }),

      setBasketProducts: assign({
        lookups: (
          { lookups, parseBasketProduct, model }: DacContext,
          { data }: AnyEventObject
        ) => {
          // Bail out if we have not been given a basket with products
          if (!isObject(data) || !has(data, "products")) return lookups;

          const primary = first(model) || first(lookups.basket);

          // 1st filter out only the domain products from the basket products
          const newBasketProducts: DomainProduct[] = reduce(
            data?.products,
            (acc: DomainProduct[], basketProduct: IBasketProduct) => {
              const parsed = parseBasketProduct(basketProduct, primary?.domain);
              if (parsed) acc.push(parsed);
              return acc;
            },
            []
          );

          lookups.searched = map(lookups.searched, (item: DomainProduct) => {
            const inBasket = some(newBasketProducts, ["domain", item.domain]);
            const wasInBasket = some(lookups.basket, ["domain", item.domain]);
            // determine if we are processing based on if its being added or removed
            // if its in the new basket and wasnt before, its being added
            // if its not in the new basket and was before, its being removed
            const isProcessing =
              !!item?.meta?.processing && (wasInBasket ? inBasket : !inBasket);

            item.meta.added = inBasket;
            item.meta.disabled = item.meta.owned || false;
            item.meta.processing = isProcessing;

            return item;
          });

          set(lookups, "basket", newBasketProducts);

          return lookups;
        }
      }),

      addToBasket: pure((context: DacContext, { data }: AnyEventObject) => {
        if (!context.basketHelper) return;

        const product = find(context.lookups.searched, [
          "domain",
          data
        ]) as DomainProduct;

        // Resolve baseModel via the context-provided parser (set up by
        // `setBasketHelper`) or fall back to the stored configuration.
        const baseModel = isFunction(context.parseProductModel)
          ? context.parseProductModel(product)
          : product?.configuration;

        if (!baseModel) return;

        // Run baseModel through the shared schema/parse pipeline so
        // required option/attribute categories get default values filled
        // in — same helper the existing-domain add paths use. Wrapped in
        // try/catch because this action body is `pure` (synchronous) — an
        // unhandled throw from a malformed `rawProduct` would propagate
        // through XState as an interpreter-level error and leave the row
        // stuck in `processing`. Fall back to a CLONE of baseModel (not
        // the reference) so the basket POST still happens AND the
        // subsequent `model.coupons` / `model.silent` mutations don't
        // corrupt the live `product.configuration` in `lookups.searched`
        // (parseProductModel at line 593 returns `item.configuration`
        // by reference).
        let model: ProductProps;
        try {
          model = applyConfigDefaults(baseModel, product?.rawProduct);
        } catch (err) {
          console.warn(
            "[dac] addToBasket: applyConfigDefaults threw — falling back to baseModel",
            err
          );
          model = cloneDeep(baseModel);
        }
        model.coupons = context.coupons ?? model.coupons ?? [];
        model.silent = true;

        return sendTo(context.basketHelper, {
          type: "ADD_UPDATE",
          target: model,
          context
        });
      }),

      // Push `upm.dac_add_to_basket` at the moment we commit to the basket
      // call — i.e. *after* a successful verify (VERIFY_RESULT branch) or
      // directly for already-checked rows that skip the verify. Mirrors the
      // widget doc's sequence where this event follows `dac_availability_result`
      // rather than the click itself.
      pushDacAddToBasket: (context: DacContext, { data }: AnyEventObject) => {
        const product = find(context.lookups.searched, ["domain", data]) as
          | DomainProduct
          | undefined;
        if (!product) return;
        const price = product?.price;
        const action: "register" | "transfer" =
          product?.meta?.available === false && product?.meta?.canTransfer
            ? "transfer"
            : "register";
        useDataLayer()
          .dataLayer({
            event: "upm.dac_add_to_basket",
            meta: {
              ...buildCommonMeta(context),
              domain: data,
              pid: product?.productDetails?.id ?? null,
              price_formatted: price?.regularPrice ?? null,
              price_discounted_formatted: price?.currentPrice ?? null,
              is_discounted:
                !!price?.savingAmount && (price?.savingAmount as number) > 0,
              percentage_saving: price?.savingPercent ?? null,
              is_exact_match: !!product?.meta?.exactMatch,
              billing_cycle_months: product?.configuration?.term ?? null,
              currency_code: context.currency ?? null,
              coupons: context.coupons ?? [],
              action
            }
          })
          .push();
      },

      // Push `upm.dac_search` when a search round starts (entry to the
      // `searching` state). Includes the active tld filter, coupons and
      // currency so analytics can tell why a specific result set came back.
      pushDacSearch: (context: DacContext) => {
        useDataLayer()
          .dataLayer({
            event: "upm.dac_search",
            meta: {
              ...buildCommonMeta(context),
              tlds: context.tlds ?? [],
              coupons: context.coupons ?? [],
              currency_code: context.currency ?? null
            }
          })
          .push();
      },

      // Push `upm.dac_search_results` once the search settles with rows.
      // Reads `event.data` (set by the search service on `SEARCH_COMPLETE`)
      // so the analytics payload mirrors the rendered first-batch snapshot.
      pushDacSearchResults: (context: DacContext, { data }: AnyEventObject) => {
        useDataLayer()
          .dataLayer({
            event: "upm.dac_search_results",
            meta: {
              ...buildCommonMeta(context),
              results_count: data?.resultsCount ?? 0,
              has_exact_match: !!data?.hasExactMatch,
              has_error: !!data?.hasError
            }
          })
          .push();
      },

      // Push `upm.dac_no_results` when the search settles with zero rows.
      pushDacNoResults: (context: DacContext) => {
        useDataLayer()
          .dataLayer({
            event: "upm.dac_no_results",
            meta: buildCommonMeta(context)
          })
          .push();
      },

      // Push `upm.dac_load_more` when the user paginates. The caller
      // (useDac.searchMore) sends the pre-load count and the resolved next
      // page index via `event.data` so the action stays pure tracking.
      pushDacLoadMore: (context: DacContext, { data }: AnyEventObject) => {
        useDataLayer()
          .dataLayer({
            event: "upm.dac_load_more",
            meta: {
              ...buildCommonMeta(context),
              results_count_before: data?.results_count_before ?? 0,
              next_page: data?.next_page ?? null
            }
          })
          .push();
      },

      // Push `upm.dac_exact_match_check` when the search service fires the
      // exact-match `/availability` call. The service emits an
      // `EXACT_MATCH_CHECK` event with the domain so this action stays
      // decoupled from the callback's internals.
      pushDacExactMatchCheck: (
        context: DacContext,
        { data }: AnyEventObject
      ) => {
        useDataLayer()
          .dataLayer({
            event: "upm.dac_exact_match_check",
            meta: { ...buildCommonMeta(context), domain: data?.domain }
          })
          .push();
      },

      // Push `upm.dac_exact_match_result` once the exact-match call resolves
      // (success or non-abort error). Mirrors `pushDacExactMatchCheck` —
      // the service emits `EXACT_MATCH_RESULT` with the resolved fields.
      pushDacExactMatchResult: (
        context: DacContext,
        { data }: AnyEventObject
      ) => {
        useDataLayer()
          .dataLayer({
            event: "upm.dac_exact_match_result",
            meta: {
              ...buildCommonMeta(context),
              domain: data?.domain,
              pid: data?.pid ?? null,
              is_available: !!data?.is_available,
              can_transfer: !!data?.can_transfer,
              has_error: !!data?.has_error
            }
          })
          .push();
      },

      removeFromBasket: pure(
        (context: DacContext, { data }: AnyEventObject) => {
          if (!context.basketHelper) return;

          const product = find(context.lookups.basket, ["domain", data]);

          if (product) {
            return sendTo(context.basketHelper, {
              type: "REMOVE",
              target: product,
              context
            });
          }
        }
      ),

      add: assign({
        model: ({ model, lookups }: DacContext, { data }: AnyEventObject) => {
          model ??= [];
          const domain = parseValue(data, model, lookups.searched);

          if (domain) model.push(domain);

          return model;
        }
      }),

      setProcessing: assign({
        lookups: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          const product = find(lookups.searched, [
            "domain",
            data
          ]) as DomainProduct;

          if (product) {
            product.meta.processing = true;
          }

          return lookups;
        }
      }),

      clearProcessing: assign({
        lookups: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          // Match by both `productDetails.id` AND `provisionFields.sld`.
          // All domains sharing the same TLD product (e.g. dominik.com and
          // mark.com both have the .com product id) would otherwise collide
          // — `find` would return the first matching row every time, and
          // subsequent CANCELs would clear processing on the wrong row,
          // leaving siblings stuck in an infinite loading state.
          const product = find(lookups.searched, (item: DomainProduct) => {
            const sameProductId =
              item.productDetails?.id === (data as ProductProps)?.productId;
            const sameSld =
              item.configuration?.provisionFields?.sld ===
              (data as ProductProps)?.provisionFields?.sld;
            return sameProductId && sameSld;
          }) as DomainProduct | undefined;

          if (product) product.meta.processing = false;

          return lookups;
        }
      }),

      remove: assign({
        model: ({ model, lookups }: DacContext, { data }: AnyEventObject) => {
          const domainProduct = find(
            lookups.searched,
            (product: DomainProduct) => {
              if (!isObject(data)) return product.domain == data;
              // Match on productId + sld (see clearProcessing for why).
              const sameProductId =
                product.productDetails?.id ===
                (data as ProductProps)?.productId;
              const sameSld =
                product.configuration?.provisionFields?.sld ===
                (data as ProductProps)?.provisionFields?.sld;
              return sameProductId && sameSld;
            }
          ) as DomainProduct | undefined;
          if (!domainProduct) return model;
          return reject(model, ["domain", domainProduct.domain]);
        }
      }),

      setModel: assign({
        model: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          return reduce(
            data,
            (result: DomainModel[], item) => {
              const domain = parseValue(item, data, lookups?.searched);
              if (domain) result.push(domain);
              return result;
            },
            []
          );
        }
      }),

      clearModel: assign({
        model: () => []
      }),

      setSearchQuery: assign({
        search: ({ search }: DacContext, { data }: AnyEventObject) => {
          return {
            query: sanitiseDomainInput(data ?? "").slice(0, 63), // sanitise + max domain length is 63 characters as per BE
            offset: PAGINATION.offset,
            limit: search?.limit ?? PAGINATION.limit,
            total: 0,
            page: 1,
            totalPages: 0
          };
        },
        // Reset the cumulative products map — a fresh query starts paginating
        // from page 1 with its own set of TLDs.
        productsMap: () => ({})
      }),

      setSearchOffset: assign({
        search: ({ search }: DacContext, _event: AnyEventObject) => {
          const current = search ?? {
            offset: PAGINATION.offset,
            limit: PAGINATION.limit,
            total: 0,
            page: 1,
            totalPages: 0
          };

          return {
            query: current.query,
            limit: current.limit,
            offset: current.offset + (current.limit ?? PAGINATION.limit),
            total: current.total,
            page: (current.page ?? 1) + 1,
            totalPages: current.totalPages ?? 0
          };
        }
      }),

      clearSearch: assign({
        search: ({ search }: DacContext, _event: AnyEventObject) => ({
          query: undefined,
          offset: PAGINATION.offset,
          limit: search?.limit ?? PAGINATION.limit,
          total: 0,
          page: 1,
          totalPages: 0
        }),
        lookups: ({ lookups }) => {
          // lookups.history = [];
          lookups.searched = [];
          return lookups;
        }
      }),

      setSearchResults: assign({
        // Persist the cumulative product_id → IProduct map back into context
        // so the next paginated search service invocation seeds from it
        // (page-N suggestions can reference TLDs returned on earlier pages).
        productsMap: (
          { productsMap }: DacContext,
          { data: response }: AnyEventObject
        ) => ({
          ...(productsMap ?? {}),
          ...(response?.productsMap ?? {})
        }),
        lookups: (
          { lookups, model, search }: DacContext,
          { data: response }: AnyEventObject
        ) => {
          // Keep prior rows when paginating: page > 1 (suggestions flow)
          // or offset > 0 (legacy flow).
          const isPaginated =
            (search?.page ?? 1) > 1 || (search?.offset ?? 0) > 0;
          const previous = isPaginated ? lookups.searched : [];

          const available: DomainProduct[] = map(
            response?.data,
            (item: DomainProduct) => {
              item.meta.owned = some(lookups.owned, ["domain", item.domain]);
              item.meta.added = some(lookups.basket, ["domain", item.domain]);
              // Only OR `owned` into disabled — don't overwrite. The row's
              // source (parseSuggestions / buildDomainProductFromAvailability /
              // placeholder) already set `disabled` correctly for unavailable
              // rows; clobbering it would re-enable the button.
              item.meta.disabled = item.meta.disabled || item.meta.owned;

              if (search?.query && search.query === item.domain) {
                item.meta.exactMatch = true;
              }

              // The exact-match row is built by buildDomainProductFromAvailability
              // (or buildExactMatchPlaceholder while /availability is in flight)
              // and its meta flags are authoritative — including the
              // `product_id: null → unavailable` rule. Re-applying raw
              // `can_register`/`can_transfer` flags here would bypass that.

              return item as DomainProduct;
            }
          );

          // Persisted rows: any history entry that matches a domain still in
          // the model (selected) — keeps a selected domain visible across a
          // fresh search even if /suggestions doesn't return it.
          const persisted = filter(lookups.history, ({ domain }) =>
            some(model, ["domain", domain])
          );

          // Merge by domain. See `mergeDomainSearchResults` for the rules
          // and the three upstream scenarios that drive them. Prepend
          // `persisted` so the merged result keeps any selected-but-not-in-
          // search domains visible; `uniqBy` drops duplicates if the same
          // domain also appears in the fresh merge.
          const mergedRows = uniqBy(
            compact(
              concat(persisted, mergeDomainSearchResults(previous, available))
            ),
            "domain"
          ) as DomainProduct[];

          // Exact-match invariant: when the user's query is a full domain
          // (sld + tld), the matching row MUST sit at index 0 regardless
          // of the merge order. `concat(persisted, ...)` above can prepend
          // selected/owned rows ahead of the exact match — hoist it back.
          const exactIdx = findIndex(
            mergedRows,
            (item: DomainProduct) => !!item.meta?.exactMatch
          );
          if (exactIdx > 0) {
            const [exactRow] = mergedRows.splice(exactIdx, 1);
            mergedRows.unshift(exactRow);
          }

          set(lookups, "searched", mergedRows);

          // store all previous searches
          set(
            lookups,
            "history",
            uniqBy(compact(concat(lookups.history, available)), "domain")
          );

          return lookups;
        },
        search: (
          { search }: DacContext,
          { data: response }: AnyEventObject
        ) => {
          return {
            query: search?.query ?? undefined,
            offset: search?.offset ?? 0,
            limit: search?.limit ?? PAGINATION.limit,
            total: response?.total || 0,
            page: response?.page ?? search?.page ?? 1,
            totalPages: response?.totalPages ?? search?.totalPages ?? 0
          };
        }
      }),

      setOwned: assign({
        lookups: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          const available = map(compact(data), (item: DomainModel) => {
            return {
              domain: item.domain,
              tld: item.tld,
              sld: item.sld,
              productDetails: {
                title: item.domain
              },
              meta: {
                owned: true,
                persisted: true
              }
            } as DomainProduct;
          });
          set(lookups, "owned", available);
          return lookups;
        }
      }),

      clearLookups: assign({
        lookups: (_context: DacContext, _event: AnyEventObject) => {
          return {
            searched: [],
            history: [],
            owned: [],
            basket: []
          };
        }
      }),

      resetLookups: assign({
        lookups: ({ lookups }: DacContext, _event: AnyEventObject) => {
          return {
            searched: [],
            history: [],
            owned: lookups.owned,
            basket: lookups.basket
          };
        }
      }),

      setFeedbackError: ({ lookups }: DacContext, { data, sourceContext }) => {
        const { t } = useI18n();

        // Find domain by productId + sld from basket helper's sourceContext.
        // Sibling .com domains share the same productId so we also match the
        // SLD to identify the right row.
        const domainProduct = find(lookups.searched, (item: DomainProduct) => {
          const sameProductId =
            item.productDetails?.id ===
            (sourceContext as ProductProps)?.productId;
          const sameSld =
            item.configuration?.provisionFields?.sld ===
            (sourceContext as ProductProps)?.provisionFields?.sld;
          return sameProductId && sameSld;
        }) as DomainProduct | undefined;

        if (!data) return;

        useFeedback().addError({
          title: t("error.domain_add_failed"),
          copy: domainProduct?.domain ?? ""
        });
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => mapToHeadlessError(data)
        // model: ({ model }, { data, sourceContext }: AnyEventObject) => {
        //
        //   // if we are passed a sourceContext, vie the event, then we can use that to understand what triggered the error
        //   // this is useful for marking the triggering product as erroring
        //   if (sourceContext) {
        //     const domainProduct = find(model, [
        //       "productDetails.id",
        //       (data as ProductProps)?.productId
        //     ]) as DomainProduct;

        //

        //     const domain = find(model, ["domain", domainProduct?.domain]);

        //     if (domain) {
        //       domain.processing = false;
        //       domain.error = true;
        //     }
        //     // return remove(model ?? [], item => {
        //     //
        //     //   return item.sld !== context.provisionFields.sld;
        //     // });
        //   }
        //   return model;
        // }
      }),

      clearError: assign({ error: undefined }),

      // Fired when a basketHelper-routed Add returns a domain-specific API
      // error code. Finds the row by `sourceContext.productId` +
      // `provisionFields.sld` (sibling .com domains share the same productId
      // so we also match the SLD to identify the right row) and flips it in
      // place to match what the API reports.
      flipDomainOnAddError: assign({
        lookups: (
          { lookups }: DacContext,
          { data, sourceContext }: AnyEventObject
        ) => {
          const rawApiCode = (data as { apiCode?: unknown })?.apiCode;
          if (!isDomainAddErrorCode(rawApiCode) || !sourceContext)
            return lookups;
          // `apiCode` now narrowed to `DomainAddErrorCode` — the
          // exhaustive switch below produces a compile-time error if
          // `DOMAIN_ADD_ERROR_CODES` gains a new entry without a branch.
          const apiCode: DomainAddErrorCode = rawApiCode;

          const ctx = sourceContext as ProductProps;
          const product = find(lookups.searched, (item: DomainProduct) => {
            const sameProductId = item.productDetails?.id === ctx?.productId;
            const sameSld =
              item.configuration?.provisionFields?.sld ===
              ctx?.provisionFields?.sld;
            return sameProductId && sameSld;
          }) as DomainProduct | undefined;

          if (!product) return lookups;

          const { t } = useI18n();

          const rebuildConfigForMode = (mode: "register" | "transfer") => {
            if (!product.rawProduct) return;
            const setupSubIds = product.rawProduct.setup_function_sub_ids;
            const subproducts: string[] = compact(
              setupSubIds?.[mode] ?? [product.rawProduct.sub_product_id]
            );
            product.configuration = parseProductProps(
              {
                productId: product.rawProduct.id,
                quantity: product.rawProduct.unit_quantity,
                subproducts,
                provisionFields: product.configuration?.provisionFields ?? {},
                term: product.configuration?.term
              },
              product.rawProduct
            );
          };

          switch (apiCode) {
            case DOMAIN_ADD_ERROR_CODES.registerOnly:
              product.meta.available = true;
              product.meta.canTransfer = false;
              product.meta.checkedAvailability = true;
              product.meta.processing = false;
              rebuildConfigForMode("register");
              useFeedback().addError({
                title: t("error.domain_transfer_unavailable"),
                copy: product.domain ?? ""
              });
              break;
            case DOMAIN_ADD_ERROR_CODES.transferOnly:
              // API says transfer-only — but if the product has no
              // `setup_function_sub_ids.transfer`, retrying the basket POST
              // as a transfer would fail the same way. Mark the row as fully
              // unavailable instead.
              if (hasTransferSetup(product.rawProduct)) {
                product.meta.available = false;
                product.meta.canTransfer = true;
                product.meta.checkedAvailability = true;
                product.meta.processing = false;
                rebuildConfigForMode("transfer");
                useFeedback().addError({
                  title: t("error.domain_register_unavailable"),
                  copy: product.domain ?? ""
                });
              } else {
                product.meta.available = false;
                product.meta.canTransfer = false;
                product.meta.unavailable = true;
                product.meta.disabled = true;
                product.meta.checkedAvailability = true;
                product.meta.processing = false;
                useFeedback().addError({
                  title: t("error.domain_unavailable"),
                  copy: product.domain ?? ""
                });
              }
              break;
            case DOMAIN_ADD_ERROR_CODES.notForSale:
              product.meta.available = false;
              product.meta.unavailable = true;
              product.meta.disabled = true;
              product.meta.checkedAvailability = true;
              product.meta.processing = false;
              useFeedback().addError({
                title: t("error.domain_unavailable"),
                copy: product.domain ?? ""
              });
              break;
            default: {
              // Exhaustiveness check — adding a new entry to
              // `DOMAIN_ADD_ERROR_CODES` without a switch arm here is a
              // compile error.
              const _exhaustive: never = apiCode;
              return _exhaustive;
            }
          }

          return lookups;
        }
      }),

      // --- VERIFY_RESULT actions (per-domain, sourced from event.data) ---

      // Flip a row to transfer-only mode after the /availability pre-check
      // shows it can't be registered. Uses the domain from event.data so it
      // works for parallel verifies (multiple rows being checked at once).
      flipRowToTransfer: assign({
        lookups: (
          { lookups }: DacContext,
          { data: domain }: AnyEventObject
        ) => {
          const { t } = useI18n();
          const product = find(lookups.searched, ["domain", domain]) as
            | DomainProduct
            | undefined;

          if (product) {
            product.meta.available = false;
            product.meta.canTransfer = true;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;

            if (product.rawProduct) {
              const setupSubIds = product.rawProduct.setup_function_sub_ids;
              const subproducts: string[] = compact(
                setupSubIds?.transfer ?? [product.rawProduct.sub_product_id]
              );
              product.configuration = parseProductProps(
                {
                  productId: product.rawProduct.id,
                  quantity: product.rawProduct.unit_quantity,
                  subproducts,
                  provisionFields: product.configuration?.provisionFields ?? {},
                  term: product.configuration?.term
                },
                product.rawProduct
              );
            }
          }

          useFeedback().addError({
            title: t("error.domain_register_unavailable"),
            copy: domain ?? ""
          });

          return lookups;
        }
      }),

      flipRowToRegister: assign({
        lookups: (
          { lookups }: DacContext,
          { data: domain }: AnyEventObject
        ) => {
          const { t } = useI18n();
          const product = find(lookups.searched, ["domain", domain]) as
            | DomainProduct
            | undefined;

          if (product) {
            product.meta.available = true;
            product.meta.canTransfer = false;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;

            if (product.rawProduct) {
              const setupSubIds = product.rawProduct.setup_function_sub_ids;
              const subproducts: string[] = compact(
                setupSubIds?.register ?? [product.rawProduct.sub_product_id]
              );
              product.configuration = parseProductProps(
                {
                  productId: product.rawProduct.id,
                  quantity: product.rawProduct.unit_quantity,
                  subproducts,
                  provisionFields: product.configuration?.provisionFields ?? {},
                  term: product.configuration?.term
                },
                product.rawProduct
              );
            }
          }

          useFeedback().addError({
            title: t("error.domain_transfer_unavailable"),
            copy: domain ?? ""
          });

          return lookups;
        }
      }),

      markRowUnavailable: assign({
        lookups: (
          { lookups }: DacContext,
          { data: domain }: AnyEventObject
        ) => {
          const { t } = useI18n();
          const product = find(lookups.searched, ["domain", domain]) as
            | DomainProduct
            | undefined;

          if (product) {
            product.meta.available = false;
            product.meta.unavailable = true;
            product.meta.disabled = true;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;
          }

          useFeedback().addError({
            title: t("error.domain_unavailable"),
            copy: domain ?? ""
          });

          return lookups;
        }
      }),

      clearRowProcessing: assign({
        lookups: (
          { lookups }: DacContext,
          { data: domain }: AnyEventObject
        ) => {
          const product = find(lookups.searched, ["domain", domain]) as
            | DomainProduct
            | undefined;
          if (product) product.meta.processing = false;
          return lookups;
        }
      }),

      setVerifyFeedbackError: (
        _context: DacContext,
        { data: domain, error }: AnyEventObject
      ) => {
        const { t } = useI18n();
        useFeedback().addError({
          title: t("error.domain_add_failed"),
          copy: domain ?? ""
        });
        // Surface the error reason via the standard error pipeline too
        if (error) mapToHeadlessError(error);
      }
    },

    guards: {
      // hasData: (_context, { data }:AnyEventObject) => isObject(data) && !isEmpty(data),

      // Splits SEARCH_COMPLETE tracking between `dac_search_results` and
      // `dac_no_results`. The search service includes `resultsCount` in the
      // event data so we don't have to derive it from machine context.
      hasSearchResults: (_context, { data }: AnyEventObject) =>
        (data?.resultsCount ?? 0) > 0,

      isDomainAddError: (_context, { data }: AnyEventObject) =>
        isDomainAddErrorCode((data as { apiCode?: unknown })?.apiCode),

      // Guards sanitise the raw input before validating so that user input
      // like `.upmind.com` (leading dot) or `https://upmind.com/page` is
      // treated the same way `setSearchQuery` will store it. Without this,
      // the guard rejects but the assign action still sanitises — the query
      // ends up in context with no transition, and the search call never
      // fires.
      isValidDomain: (_context, { data }: AnyEventObject) =>
        !isEmpty(parseDomain(sanitiseDomainInput(data ?? ""))),

      hasSearchQuery: (
        { search, mode }: DacContext,
        _event: AnyEventObject
      ) => {
        // Initial `search.query` comes from the URL param and may not be
        // sanitised yet (e.g. `?search=.fggg.com`). Sanitise before
        // validating so the load → searching transition fires on refresh.
        const query = sanitiseDomainInput(search?.query ?? "");
        if (mode === DomainMode.transfer) {
          return !isEmpty(parseDomain(query));
        }
        const sld = parseSld(query);
        return sld?.length > 2;
      },
      validSearchQuery: ({ mode }: DacContext, { data }: AnyEventObject) => {
        const sanitised = sanitiseDomainInput(data ?? "");
        if (mode === DomainMode.transfer) {
          return !isEmpty(parseDomain(sanitised));
        }
        const sld = parseSld(sanitised);
        return sld?.length > 2 && sld.length <= 63;
      },
      validSearchOffset: ({ search }: DacContext, _event: AnyEventObject) => {
        // Page-based (suggestions/tlds) flow: advance while page < totalPages
        if ((search?.totalPages ?? 0) > 0) {
          return (search?.page ?? 1) < (search?.totalPages ?? 0);
        }
        // Legacy offset-based flow
        const offset = (search?.offset ?? 0) + (search?.limit ?? 0);
        return offset < (search?.total || 0);
      },

      isValid: ({ model }: DacContext) => {
        const valid = !isEmpty(model) && every(model, parseDomain);
        return valid;
      },

      isInvalid: ({ model }: DacContext) =>
        isEmpty(model) || !every(model, parseDomain),

      // Use the shared `isAbortError` helper so the guard covers all three
      // abort shapes (bare-undefined doFetch reject, AbortError name,
      // structured Aborted code) — a narrower `name !== "AbortError"`
      // check would let bare-undefined aborts fall through and fire
      // SEARCH_ERROR on cancellations that should be silent.
      isNotCancelled: (_context, { data }: AnyEventObject) =>
        !isAbortError(data),

      isAlreadyChecked: ({ lookups }: DacContext, { data }: AnyEventObject) => {
        const domain = parseDomain(data);
        if (!domain) return false;
        const product = find(lookups.searched, [
          "domain",
          domain.domain
        ]) as DomainProduct;
        return !!product?.meta?.checkedAvailability;
      },

      // --- VERIFY_RESULT guards (pre-flight availability check)
      //
      // `data` is the domain string; `availability` is the API response.

      // Fully unavailable when neither register nor transfer is possible.
      // Also covers the case where the API says transfer-only but the
      // product isn't actually configured for transfer (no
      // `setup_function_sub_ids.transfer`) — we can't construct a valid
      // basket POST so the row must be treated as unavailable.
      isAvailabilityFullyUnavailable: (
        { lookups }: DacContext,
        { data: domain, availability }: AnyEventObject
      ) => {
        if (availability?.can_register !== false) return false;
        if (availability?.can_transfer === false) return true;
        // can_register=false && can_transfer=true → check product config
        const product = find(lookups.searched, ["domain", domain]) as
          | DomainProduct
          | undefined;
        return !hasTransferSetup(product?.rawProduct);
      },

      // Row is in register mode (meta.available === true) but the fresh
      // availability check says only transfer is possible — and the product
      // is actually configured for transfer.
      shouldFlipRowToTransfer: (
        { lookups }: DacContext,
        { data: domain, availability }: AnyEventObject
      ) => {
        const product = find(lookups.searched, ["domain", domain]) as
          | DomainProduct
          | undefined;
        const rowIsRegister = product?.meta?.available === true;
        return (
          rowIsRegister &&
          availability?.can_register === false &&
          availability?.can_transfer === true &&
          hasTransferSetup(product?.rawProduct)
        );
      },

      // Row is in transfer mode (meta.canTransfer === true && !meta.available)
      // but the fresh availability check says only register is possible.
      shouldFlipRowToRegister: (
        { lookups }: DacContext,
        { data: domain, availability }: AnyEventObject
      ) => {
        const product = find(lookups.searched, ["domain", domain]) as
          | DomainProduct
          | undefined;
        const rowIsTransfer =
          product?.meta?.available === false &&
          product?.meta?.canTransfer === true;
        return (
          rowIsTransfer &&
          availability?.can_register === true &&
          availability?.can_transfer === false
        );
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services: {
      search: services.search,
      getClientDomains: services.getClientDomains
    }
  }
);
