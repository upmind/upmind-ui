// --- external
import { createMachine, assign, spawn, sendTo, pure } from "xstate";

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";
import { authSubscription } from "../session/helper";
import { useFeedback } from "../feedback";
const { addError } = useFeedback();

// --- utils
import {
  mapToHeadlessError,
  responseCodes,
  ResponseError,
  useTime
} from "../../utils";
import { parseDomain, parseValue, parseSld, isDomainProduct } from "./utils";
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
  remove,
  set,
  some,
  uniqBy
} from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import {
  ProvisionCategoryCodes,
  type IBasket,
  type IBasketProduct
} from "@upmind-automation/types";
import { DomainTypes } from "./types";
import type { DomainModel, DacContext, DomainProduct } from "./types";
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
        entry: ["setContext", "clearLookups"],
        always: {
          target: "loading",
          actions: ["setBasketHelper", "setAuthHelper", "loadBasket"]
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
          src: "search",
          onDone: {
            target: "invalid",
            actions: ["setSearchResults"]
          },
          onError: [
            {
              target: "error",
              actions: ["setError"],
              cond: "isNotCancelled"
            },
            {
              actions: ["setError"]
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
        ]
      },

      invalid: {
        always: [{ target: "valid", cond: "isValid" }]
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
      ADD: [
        {
          target: "valid",
          actions: ["add", "setProcessing", "addToBasket"],
          cond: "isValidDomain"
        }
      ],

      UPDATED: {
        actions: ["setBasketProducts"]
      },

      CANCEL: {
        actions: ["clearProcessing", "remove"]
      },

      ERROR: {
        actions: ["setError", "setFeedbackError"]
      },

      REMOVE: {
        actions: ["setProcessing", "removeFromBasket"]
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
        actions: ["setBasketProducts", "refreshContext"]
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
              total: 0
            },
            // ---
            error: undefined,
            // ---
            authHelper: undefined,
            basketHelper: undefined,
            parseBasketProduct: undefined,
            parseProductModel: undefined
          }) as DacContext
      ),

      refreshContext: assign(
        (_context: DacContext, { data }: AnyEventObject) => {
          const { id: basketId, brand_id: brandId, currency } = data as IBasket;

          const newContext = {
            basketId,
            brandId,
            currency: currency.code
          };

          return newContext;
        }
      ),

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
                blueprintCode: raw?.product?.provision_blueprint?.code,
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

        const model = isFunction(context?.parseProductModel)
          ? context.parseProductModel(product)
          : product?.configuration;

        if (model) {
          model.coupons ??= context.coupons ?? []; // NB ensure we pass any coupons from the context to the product being added
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
          const product = find(lookups.searched, [
            "productDetails.id",
            (data as ProductProps)?.productId
          ]) as DomainProduct;

          if (product) product.meta.processing = false;

          return lookups;
        }
      }),

      remove: assign({
        model: ({ model, lookups }: DacContext, { data }: AnyEventObject) => {
          const domainProduct = find(lookups.searched, [
            "productDetails.id",
            (data as ProductProps)?.productId
          ]) as DomainProduct;

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
            query: data?.slice(0, 63), // max domain length is 63 characters as per BE
            offset: PAGINATION.offset,
            limit: search?.limit ?? PAGINATION.limit,
            total: 0
          };
        }
      }),

      setSearchOffset: assign({
        search: ({ search }: DacContext, _event: AnyEventObject) => {
          const current = search ?? {
            offset: PAGINATION.offset,
            limit: PAGINATION.limit,
            total: 0
          };

          return {
            query: current.query,
            limit: current.limit,
            offset: current.offset + (current.limit ?? PAGINATION.limit),
            total: current.total
          };
        }
      }),

      clearSearch: assign({
        search: ({ search }: DacContext, _event: AnyEventObject) => ({
          query: undefined,
          offset: PAGINATION.offset,
          limit: search?.limit ?? PAGINATION.limit,
          total: 0
        }),
        lookups: ({ lookups }) => {
          // lookups.history = [];
          lookups.searched = [];
          return lookups;
        }
      }),

      setSearchResults: assign({
        lookups: (
          { lookups, model, search }: DacContext,
          { data: response }: AnyEventObject
        ) => {
          const previous = (search?.offset ?? 0 > 0) ? lookups.searched : [];

          const available: DomainProduct[] = map(
            response?.data,
            (item: DomainProduct) => {
              item.meta.owned = some(lookups.owned, ["domain", item.domain]);
              item.meta.added = some(lookups.basket, ["domain", item.domain]);
              item.meta.disabled = item.meta.owned;

              if (search?.query && search.query === item.domain) {
                item.meta.exactMatch = true;
              }

              return item as DomainProduct;
            }
          );

          const persisted = filter(lookups.history, ({ domain }) =>
            some(model, ["domain", domain])
          );

          set(
            lookups,
            "searched",
            uniqBy(compact(concat(persisted, previous, available)), "domain")
          );

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
            total: response?.total || 0
          };
        }
      }),

      setOwned: assign({
        lookups: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          const available = map(data, (item: DomainModel) => {
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

      setFeedbackError: ({ error, lookups }: DacContext, { data, context }) => {
        const { t } = useI18n();

        const domainProduct = find(lookups.searched, [
          "productDetails.id",
          (context as ProductProps)?.productId
        ]) as DomainProduct;

        addError({
          title: t("error.domain_add_failed"),
          copy: domainProduct?.domain ?? ""
        });
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => mapToHeadlessError(data)
        // model: ({ model }, { data, context }: AnyEventObject) => {
        //
        //   // if we are passed a context, vie the event, then we can use that to understand what triggered the error
        //   // this is useful for marking the triggering product as erroring
        //   if (context) {
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

      clearError: assign({ error: undefined })
    },

    guards: {
      // hasData: (_context, { data }:AnyEventObject) => isObject(data) && !isEmpty(data),

      isValidDomain: (_context, { data }: AnyEventObject) =>
        !isEmpty(parseDomain(data)),

      hasSearchQuery: ({ search }: DacContext, _event: AnyEventObject) => {
        const sld = parseSld(search?.query ?? "");
        return sld?.length > 2;
      },
      validSearchQuery: (_context, { data }: AnyEventObject) => {
        const sld = parseSld(data ?? "");
        return sld?.length > 2 && sld.length <= 63;
      },
      validSearchOffset: ({ search }: DacContext, _event: AnyEventObject) => {
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
        data?.name !== "AbortError"
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
