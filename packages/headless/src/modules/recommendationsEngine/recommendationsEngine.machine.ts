// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basket/helper";

// --- utils
import { useTime } from "../../utils";
import {
  parseBasketItem,
  parseRelatedProducts,
  parseRecommendation,
} from "./utils";
import {
  concat,
  defaultsDeep,
  filter,
  find,
  get,
  includes,
  isEmpty,
  isObject,
  map,
  reduce,
  reject,
  set,
  some,
  uniq,
  xorBy,
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
import type { BasketProduct } from "../basket";
import type { RecommendationsEngineContext, RelatedProduct } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    id: "recommendationsManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RecommendationsEngineContext,
    states: {
      subscribing: {
        entry: ["setContext", "clearLookups", "setBasketHelper", "getBasket"],
      },

      loading: {
        entry: ["clearError", "clearRecommendations", "fetchProducts"],
        on: {
          REFRESH: {
            // do nothing
          },
          FETCHED: [
            {
              target: "available",
              actions: ["setRecommendations"],
              cond: "hasData",
            },
            { target: "unavailable" },
          ],
          ERROR: {
            target: "error",
          },
        },
      },

      refreshing: {
        entry: ["clearError", "clearRecommendations", "fetchProducts"],
        on: {
          REFRESH: {
            // do nothing
          },
          FETCHED: [
            {
              target: "available",
              actions: ["setRecommendations"],
              cond: "hasData",
            },
            { target: "unavailable" },
          ],
          ERROR: {
            target: "error",
          },
        },
      },

      available: {
        always: {
          target: "unavailable",
          cond: "hasNoRecommendations",
        },
      },

      unavailable: {
        always: {
          target: "available",
          cond: "hasRecommendations",
        },
      },

      configuring: {
        on: {
          CANCEL: {
            target: "available",
            actions: ["clearItem"],
          },
        },
      },

      processing: {
        entry: ["clearError"],
        on: {
          REFRESH: {
            // do nothing
          },

          ADDED: {
            actions: ["setBasket", "setLookups"],
            target: "refreshing",
          },
          CANCEL: {
            target: "available",
            actions: ["clearItem"],
          },
          ERROR: [
            {
              target: "configuring",
              actions: ["setError", "setItem"],
              cond: "hasBasketItem",
            },
            {
              target: "error",
              actions: ["setError"],
            },
          ],
        },
      },

      error: {},
      // ---
      complete: {
        type: "final",
      },
    },
    on: {
      REFRESH: {
        target: "refreshing",
        actions: ["setBasket", "setLookups"],
        cond: "hasBasketChanged",
      },
      SEEN: {
        actions: ["setSeen"],
      },
      ADD: {
        target: "processing",
        actions: ["addToBasket", "setProcessing"],
        cond: "exists",
      },
      // PROCESSING: {
      //   target: "processing",
      // },
      STOP: {
        target: "complete",
      },
    },
  },
  {
    actions: {
      setContext: assign((context, _event) =>
        defaultsDeep(context, {
          model: [],
          raw: {
            products: [],
            related: [],
            seen: [],
          },
          recommendations: [],
          // ---
          error: undefined,
          // ---
          basketId: undefined,
          currencyId: undefined,
          promotions: [],
          // ---
          basketHelper: undefined,
          itemBuilder: undefined,
          basketItemMapper: undefined,
        })
      ),

      setBasket: assign({
        basketId: (_context, { data }: AnyEventObject) => {
          const basket = get(data, "basket", data);
          return basket.id;
        },
        currencyId: (_context, { data }: AnyEventObject) => {
          const basket = get(data, "basket", data);
          return basket?.currency_id;
        },
        promotions: (_context, { data }: AnyEventObject) => {
          const basket = get(data, "basket", data);
          return basket?.promotions;
        },
      }),
      // ---

      setBasketHelper: assign(({ basketHelper }: any) => {
        return {
          basketHelper: basketHelper || spawn(basketSubscription),
          itemBuilder: function (item: BasketProduct) {
            debugger;
            return parseBasketItem(item);
          },

          basketItemBuilder: (config: any) => {
            if (!config?.productId) return null;

            // TODO: map the provision field placeholders to the actual values from products withing the basket
            // config.provisionFields = config.provisionFields || {};
            return config;
          },

          basketItemMapper: (item: BasketProduct) => ({
            productId: item.productId,
          }),
        };
      }),

      getBasket: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, _event) => ({
          type: "INIT",
          context,
        })
      ),

      fetchRelated: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, { data }: AnyEventObject) => {
          return {
            type: "FETCH_RELATED",
            target: data.productId,
            context,
          };
        }
      ),

      fetchProducts: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, _event) => {
          const productIds = uniq(map(context.raw.related, "object_id"));
          return {
            type: "FETCH_SELECTED",
            target: productIds,
            context,
          };
        }
      ),

      addToBasket: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, { data }: AnyEventObject) => {
          const recommendation = find(context.recommendations, ["id", data]);
          const model = context.basketItemBuilder(recommendation.config);
          return {
            type: "ADD_UPDATE",
            target: model,
            context: {
              ...context,
              recommendation,
            },
          };
        }
      ),

      setProcessing: assign({
        recommendations: (
          { recommendations }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const recommendation = find(recommendations, ["id", data]);
          if (recommendation) set(recommendation, "meta.processing", true);
          return recommendations;
        },
      }),

      // ---

      setItem: assign({
        basketItem: (_context, { data }: AnyEventObject) => {
          return data?.basketItem;
        },
      }),

      clearItem: assign({ basketItem: undefined }),

      // ---

      clearLookups: assign({
        raw: (
          _context: RecommendationsEngineContext,
          _event: AnyEventObject
        ) => {
          return {
            products: [],
            related: [],
            seen: [],
            added: [],
          };
        },
      }),

      setLookups: assign({
        raw: (
          { raw }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const basket = get(data, "basket", data);
          const products = basket?.products;
          const related = parseRelatedProducts(basket as IBasket);

          const added = reduce(
            related,
            (result: string[], item: RelatedProduct) => {
              // We considdr a product to be in the basket if it matches
              // the product_id
              // the billing_cycle_months (if specified)
              // the sub_pids (if specified
              const inBasket = some(products, product => {
                const productMatches =
                  product.product_id == item.object_id &&
                  item.object_type == "product";

                const bcmMatches =
                  !item?.config?.bcm ||
                  item.config.bcm == product.billing_cycle_months;

                const subproductsMatch =
                  isEmpty(item?.config?.sub_pids) ||
                  some(product.options, option => {
                    return includes(item.config?.sub_pids, option.product_id);
                  }) ||
                  some(product.attributes, attribute => {
                    return includes(
                      item.config?.sub_pids,
                      attribute.product_id
                    );
                  });

                return productMatches && bcmMatches && subproductsMatch;
              });

              if (inBasket) result.push(item.id);
              return result;
            },
            []
          );
          return {
            products,
            related,
            seen: raw?.seen ?? [],
            added: uniq(concat(raw.added, added)),
          };
        },
      }),

      setSeen: assign({
        raw: (
          { raw }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          // if data is empty assume weve seen ALL recommendations,
          //  otherwise if specified, move only the provided to the seen Recommendations
          const seen = isEmpty(data)
            ? raw.related
            : filter(raw.related, ({ object_id }) => includes(data, object_id));

          return {
            products: raw.products,
            related: raw.related,
            seen: map(seen, "id"),
            added: raw.added,
          };
        },
        recommendations: (
          { recommendations, raw }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const seen = isEmpty(data)
            ? raw.related
            : filter(raw.related, ({ object_id }) => includes(data, object_id));

          return reject(recommendations, ({ productId }) =>
            some(seen, ["object_id", productId])
          );
        },
      }),

      // resetSeen: assign({
      //   raw: (
      //     { raw }: RecommendationsEngineContext,
      //     _event: AnyEventObject
      //   ) => {
      //     set(raw, "seen", []);
      //     return raw;
      //   },
      // }),

      setRecommendations: assign({
        recommendations: (
          { raw }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const augmentedRecommendations = reduce(
            raw.related,
            (result: any[], rawRelated: any) => {
              rawRelated.product = find(data, ["id", rawRelated.object_id]);
              if (isEmpty(rawRelated.product)) return result;
              const added = includes(raw.added, rawRelated.id);
              const seen = includes(raw.seen, rawRelated.id);
              const processing = false;
              result.push(
                parseRecommendation(rawRelated, { added, seen, processing })
              );
              return result;
            },
            []
          );

          return augmentedRecommendations;
        },
      }),

      clearRecommendations: assign({ recommendations: [] }),

      setError: assign({
        error: (
          _context: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          // addError({
          //   title:
          //     data?.title ||
          //     "We experienced an error adding the product to your basket",
          //   copy: data?.message,
          //   data: data?.data,
          // });

          return data;
        },
      }),

      clearError: assign({ error: undefined }),
    },

    guards: {
      exists: (
        { recommendations }: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => some(recommendations, ["id", data]),

      hasData: (
        _context: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => !isEmpty(data),

      hasRecommendations: (
        { recommendations }: RecommendationsEngineContext,
        _event: AnyEventObject
      ) => !isEmpty(recommendations),

      hasNoRecommendations: (
        { recommendations }: RecommendationsEngineContext,
        _event: AnyEventObject
      ) => isEmpty(recommendations),

      hasBasketChanged: (
        { basketId, currencyId, promotions, raw }: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => {
        //  NB: data is raw basket data so use snake_case for comparison
        const basketChanged = basketId !== data?.id;
        const currencyChanged = currencyId !== data?.currency_id;
        const promotionsChanged = !isEmpty(
          xorBy(promotions, data?.promotions, "promotion_id")
        );
        const productsChanged = !isEmpty(
          xorBy(raw.products, data?.products, "product_id")
        );

        const value =
          basketChanged ||
          currencyChanged ||
          promotionsChanged ||
          productsChanged;

        return value;
      },

      hasBasketItem: (
        _context: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => isObject(data?.basketItem),
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
