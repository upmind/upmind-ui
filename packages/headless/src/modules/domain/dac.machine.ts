// --- external
import { createMachine, assign, spawn, sendTo, pure } from "xstate";

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";
import { authSubscription } from "../session/helper";
import { useFeedback } from "../feedback";

// --- utils
import { mapToHeadlessError, useTime } from "../../utils";
import {
  parseDomain,
  parseValue,
  parseSld,
  isDomainProduct,
  sanitiseDomainInput
} from "./utils";
import {
  fillRequiredOptionDefaults,
  parseProductProps
} from "../product/utils";
import {
  compact,
  concat,
  defaultsDeep,
  every,
  filter,
  find,
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
import { type IBasketProduct } from "@upmind-automation/types";
import {
  type DomainModel,
  type DacContext,
  type DomainProduct,
  DomainTypes
} from "./types";
import type { ProductProps } from "../product";
import { parseBasketProduct } from "../basketProduct/utils";
import { PAGINATION } from "../query";
import { useI18n } from "../system";

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
        entry: ["clearError"],
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
          SEARCH_COMPLETE: {
            target: "invalid"
          },
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
              target: "checking",
              actions: ["add", "setProcessing", "setCheckingDomain"],
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
              // Already availability-checked & transferable — skip re-check
              target: "valid",
              actions: ["add", "setProcessing", "addToBasket"],
              cond: "isAlreadyChecked"
            },
            {
              target: "checking",
              actions: ["add", "setProcessing", "setCheckingDomain"],
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
              // Already availability-checked & transferable — skip re-check
              target: "valid",
              actions: ["add", "setProcessing", "addToBasket"],
              cond: "isAlreadyChecked"
            },
            {
              target: "checking",
              actions: ["add", "setProcessing", "setCheckingDomain"],
              cond: "isValidDomain"
            }
          ]
        }
      },

      error: {},

      checking: {
        entry: ["clearError"],
        invoke: {
          src: "addDomainToBasket",
          // Order matters: error-code conditions are checked BEFORE the
          // generic `isDomainAvailable`. The error-only register/transfer
          // returns share the same `can_register`/`can_transfer` shape as
          // the success case (with an extra `error_code`), so without this
          // ordering `isDomainAvailable` would short-circuit and the row
          // would never flip.
          onDone: [
            {
              // 409 conflict — flip domain type (register↔transfer)
              // Keep checkedAvailability=false so next click retries addDomainToBasket
              target: "invalid",
              actions: ["clearCheckingProcessing", "flipDomainType"],
              cond: "isConflict"
            },
            {
              // web_hosting::domain_register_only — tried to transfer but domain
              // can only be registered → convert row to register so user can click and register
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setRegisterable"
              ],
              cond: "isDomainRegisterOnly"
            },
            {
              // web_hosting::domain_transfer_only — tried to register but domain
              // can only be transferred → convert row to transfer so user can click and transfer
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setTransferable"
              ],
              cond: "isDomainTransferOnly"
            },
            {
              // web_hosting::domain_not_for_sale — domain is not available at all
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setFullyUnavailable"
              ],
              cond: "isDomainNotForSale"
            },
            {
              // addDomainToBasket already added the product to the basket
              // via the API — keep processing=true until the basket subscription
              // confirms the add (setBasketProducts will clear processing)
              target: "valid",
              cond: "isDomainAvailable"
            },
            {
              // can_register=false BUT can_transfer=true → convert row to transfer
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setTransferable"
              ],
              cond: "isDomainTransferable"
            },
            {
              // can_register=false AND can_transfer=false → fully unavailable
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setFullyUnavailable"
              ]
            }
          ],
          onError: [
            {
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setError",
                "setFeedbackError"
              ],
              cond: "isNotCancelled"
            },
            {
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setError"
              ]
            }
          ]
        },
        on: {
          // Allow adding other domains while one is being checked —
          // fire-and-forget via basket helper so requests run in parallel
          ADD: [
            {
              actions: ["add", "setProcessing", "addToBasket"],
              cond: "isValidDomain"
            }
          ]
        }
      },

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

      // When `addToBasket` (basketHelper path, used for parallel domain
      // adds while another is in `checking`) fails with a domain-specific
      // API error code, flip the row in place — same behaviour as the
      // `checking → addDomainToBasket → onDone` flow. Otherwise fall back
      // to the generic error/feedback handling.
      ERROR: [
        {
          actions: ["flipDomainOnAddError"],
          cond: "isDomainAddError"
        },
        {
          actions: ["setError", "setFeedbackError"]
        }
      ],

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
        actions: ["setSearchOffset"],
        cond: "validSearchOffset"
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

        const baseModel = isFunction(context?.parseProductModel)
          ? context.parseProductModel(product)
          : product?.configuration;

        if (baseModel) {
          // Auto-pick the first option for any required option/attribute
          // category the model hasn't already filled (e.g. domain "Register"
          // group, ID protection, nameservers). Mirrors the same step in
          // addDomainToBasket so this fast-path (already-availability-checked
          // domains going straight through the basket helper) doesn't 422.
          const model = fillRequiredOptionDefaults(
            baseModel,
            product?.rawProduct
          );
          model.coupons = context.coupons ?? model.coupons ?? []; // NB ensure we pass any coupons from the context to the product being added
          model.silent = true; // NB ensure we add silently so we don't trigger provision field validation at this stage

          return sendTo(context.basketHelper, {
            type: "ADD_UPDATE",
            target: model,
            context
          });
        }
      }),

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

          // Merge by domain. Three scenarios drive this:
          //   1. Within one search round, /suggestions emits priceLoading rows
          //      and /suggestions/tlds re-emits the same rows priced — we
          //      need to upgrade the row in-place.
          //   2. /availability resolves after /suggestions and produces an
          //      authoritative version of the exact-match row (with
          //      `checkedAvailability=true`) — it must replace the suggestion-
          //      derived version even when both are "priced".
          //   3. Pagination (Load more) emits the next page; existing rows
          //      must NOT change. If the API happens to return overlapping
          //      domains in a later page, keep the already-loaded version.
          //
          // Rule: replace an existing row when the incoming row is **fresher**
          // (priceLoading-priced upgrade, or freshly availability-checked).
          // Otherwise leave the existing row alone. Truly new domains are
          // appended at the bottom.
          const updatedPrevious = map(previous, (prev: DomainProduct) => {
            const fresher = find(available, ["domain", prev.domain]);
            if (!fresher) return prev;
            const isPriceUpgrade =
              !!prev.meta?.priceLoading && !fresher.meta?.priceLoading;
            const isAvailabilityUpgrade =
              !prev.meta?.checkedAvailability &&
              !!fresher.meta?.checkedAvailability;
            return (
              isPriceUpgrade || isAvailabilityUpgrade ? fresher : prev
            ) as DomainProduct;
          });
          const newOnly = filter(
            available,
            (item: DomainProduct) => !find(previous, ["domain", item.domain])
          ) as DomainProduct[];

          set(lookups, "searched", compact(concat(updatedPrevious, newOnly)));

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

      setFeedbackError: (
        { error, lookups, checkingDomain }: DacContext,
        { data, sourceContext }
      ) => {
        const { t } = useI18n();

        // Try to find domain by productId + sld from basket helper's
        // sourceContext. Sibling .com domains share the same productId so
        // we must also match the SLD to identify the right row.
        let domainProduct = find(lookups.searched, (item: DomainProduct) => {
          const sameProductId =
            item.productDetails?.id ===
            (sourceContext as ProductProps)?.productId;
          const sameSld =
            item.configuration?.provisionFields?.sld ===
            (sourceContext as ProductProps)?.provisionFields?.sld;
          return sameProductId && sameSld;
        }) as DomainProduct | undefined;

        // Fallback: when called from the checking state's onError,
        // sourceContext is undefined — use checkingDomain from context instead
        if (!domainProduct && checkingDomain) {
          domainProduct = find(lookups.searched, ["domain", checkingDomain]) as
            | DomainProduct
            | undefined;
        }

        if (!data) return;

        useFeedback().addError({
          title: t("error.domain_add_failed"),
          copy: domainProduct?.domain ?? checkingDomain ?? ""
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

      setCheckingDomain: assign({
        checkingDomain: (_context: DacContext, { data }: AnyEventObject) => {
          const parsed = parseDomain(data);
          return parsed?.domain ?? data;
        }
      }),

      clearCheckingProcessing: assign({
        lookups: ({ lookups, checkingDomain }: DacContext) => {
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;
          if (product) product.meta.processing = false;
          return lookups;
        }
      }),

      removeCheckingDomain: assign({
        model: ({ model, checkingDomain }: DacContext) =>
          reject(model, ["domain", checkingDomain])
      }),

      // --- Availability fallback actions ---

      setRegisterable: assign({
        lookups: ({ lookups, checkingDomain }: DacContext) => {
          const { t } = useI18n();
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;

          if (product) {
            product.meta.available = true;
            product.meta.canTransfer = false;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;

            // Rebuild configuration with register sub_pids from setup_function_sub_ids
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
                  provisionFields: product.configuration?.provisionFields ?? {}
                },
                product.rawProduct
              );
            }
          }

          useFeedback().addError({
            title: t("error.domain_transfer_unavailable"),
            copy: checkingDomain ?? ""
          });

          return lookups;
        }
      }),

      setTransferable: assign({
        lookups: ({ lookups, checkingDomain }: DacContext) => {
          const { t } = useI18n();
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;

          if (product) {
            product.meta.available = false;
            product.meta.canTransfer = true;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;

            // Rebuild configuration with transfer sub_pids from setup_function_sub_ids
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
                  provisionFields: product.configuration?.provisionFields ?? {}
                },
                product.rawProduct
              );
            }
          }

          useFeedback().addError({
            title: t("error.domain_register_unavailable"),
            copy: checkingDomain ?? ""
          });

          return lookups;
        }
      }),

      setFullyUnavailable: assign({
        lookups: ({ lookups, checkingDomain }: DacContext) => {
          const { t } = useI18n();
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;

          if (product) {
            product.meta.available = false;
            product.meta.unavailable = true;
            product.meta.disabled = true;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;
          }

          useFeedback().addError({
            title: t("error.domain_unavailable"),
            copy: checkingDomain ?? ""
          });

          return lookups;
        }
      }),

      // 409 conflict: flip the domain type (register↔transfer)
      // Does NOT set checkedAvailability so the next click goes through
      // addDomainToBasket again instead of skipping to addToBasket.
      // Rebuilds the configuration with the new mode's sub_pids — without
      // this, the next click would still send the OLD mode's sub_pids and
      // hit the same 409 forever.
      flipDomainType: assign({
        lookups: (
          { lookups, checkingDomain }: DacContext,
          { data }: AnyEventObject
        ) => {
          const { t } = useI18n();
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;

          if (product) {
            product.meta.available = data?.can_register ?? false;
            product.meta.canTransfer = data?.can_transfer ?? false;
            product.meta.unavailable = false;
            product.meta.disabled = false;
            product.meta.checkedAvailability = false;
            product.meta.processing = false;

            // Rebuild configuration with the new mode's sub_pids.
            if (product.rawProduct) {
              const setupSubIds = product.rawProduct.setup_function_sub_ids;
              const mode: "register" | "transfer" = data?.can_register
                ? "register"
                : "transfer";
              const subproducts: string[] = compact(
                setupSubIds?.[mode] ?? [product.rawProduct.sub_product_id]
              );
              product.configuration = parseProductProps(
                {
                  productId: product.rawProduct.id,
                  quantity: product.rawProduct.unit_quantity,
                  subproducts,
                  provisionFields: product.configuration?.provisionFields ?? {}
                },
                product.rawProduct
              );
            }
          }

          // Notify user: domain type was flipped (e.g. register → transfer)
          const errorKey = data?.can_transfer
            ? "error.domain_register_unavailable"
            : "error.domain_transfer_unavailable";

          useFeedback().addError({
            title: t(errorKey),
            copy: checkingDomain ?? ""
          });

          return lookups;
        }
      }),

      // Fired when a basketHelper-routed Add (used for parallel domain adds
      // while another is still in `checking`) returns a domain-specific API
      // error code. Finds the row by `sourceContext.productId` +
      // `provisionFields.sld` (NOT by `checkingDomain` — that one belongs
      // to the row currently in the `checking` invocation, not this one)
      // and flips it in place. Mirrors the inline flips
      // setRegisterable / setTransferable / setFullyUnavailable but works
      // for any row, not just `checkingDomain`.
      flipDomainOnAddError: assign({
        lookups: (
          { lookups }: DacContext,
          { data, sourceContext }: AnyEventObject
        ) => {
          const apiCode = (data as { apiCode?: string })?.apiCode;
          if (!apiCode || !sourceContext) return lookups;

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
                provisionFields: product.configuration?.provisionFields ?? {}
              },
              product.rawProduct
            );
          };

          if (apiCode === "web_hosting::domain_register_only") {
            product.meta.available = true;
            product.meta.canTransfer = false;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;
            rebuildConfigForMode("register");
            useFeedback().addError({
              title: t("error.domain_transfer_unavailable"),
              copy: product.domain ?? ""
            });
          } else if (apiCode === "web_hosting::domain_transfer_only") {
            product.meta.available = false;
            product.meta.canTransfer = true;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;
            rebuildConfigForMode("transfer");
            useFeedback().addError({
              title: t("error.domain_register_unavailable"),
              copy: product.domain ?? ""
            });
          } else if (apiCode === "web_hosting::domain_not_for_sale") {
            product.meta.available = false;
            product.meta.unavailable = true;
            product.meta.disabled = true;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;
            useFeedback().addError({
              title: t("error.domain_unavailable"),
              copy: product.domain ?? ""
            });
          }

          return lookups;
        }
      })
    },

    guards: {
      // hasData: (_context, { data }:AnyEventObject) => isObject(data) && !isEmpty(data),

      isDomainAddError: (_context, { data }: AnyEventObject) => {
        const apiCode = (data as { apiCode?: string })?.apiCode;
        return (
          apiCode === "web_hosting::domain_register_only" ||
          apiCode === "web_hosting::domain_transfer_only" ||
          apiCode === "web_hosting::domain_not_for_sale"
        );
      },

      // Guards sanitise the raw input before validating so that user input
      // like `.upmind.com` (leading dot) or `https://upmind.com/page` is
      // treated the same way `setSearchQuery` / `setCheckingDomain` will
      // store it. Without this, the guard rejects but the assign action
      // still sanitises — the query ends up in context with no transition,
      // and the search call never fires.
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
        if (mode === DomainTypes.transfer) {
          return !isEmpty(parseDomain(query));
        }
        const sld = parseSld(query);
        return sld?.length > 2;
      },
      validSearchQuery: ({ mode }: DacContext, { data }: AnyEventObject) => {
        const sanitised = sanitiseDomainInput(data ?? "");
        if (mode === DomainTypes.transfer) {
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

      isNotCancelled: (_context, { data }: AnyEventObject) =>
        data?.name !== "AbortError",

      isDomainAvailable: (_context, { data }: AnyEventObject) =>
        data?.can_register === true,

      isDomainTransferable: (_context, { data }: AnyEventObject) =>
        data?.can_register === false && data?.can_transfer === true,

      isAlreadyChecked: ({ lookups }: DacContext, { data }: AnyEventObject) => {
        const domain = parseDomain(data);
        if (!domain) return false;
        const product = find(lookups.searched, [
          "domain",
          domain.domain
        ]) as DomainProduct;
        return !!product?.meta?.checkedAvailability;
      },

      isConflict: (_context: DacContext, { data }: AnyEventObject) =>
        data?.conflict === true,

      isDomainRegisterOnly: (_context: DacContext, { data }: AnyEventObject) =>
        data?.error_code === "web_hosting::domain_register_only",

      isDomainTransferOnly: (_context: DacContext, { data }: AnyEventObject) =>
        data?.error_code === "web_hosting::domain_transfer_only",

      isDomainNotForSale: (_context: DacContext, { data }: AnyEventObject) =>
        data?.error_code === "web_hosting::domain_not_for_sale"
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
