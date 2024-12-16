// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basket/helper";
import { useFeedback } from "../feedback";
const { addError } = useFeedback();

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
  includes,
  isEmpty,
  isEqual,
  isObject,
  map,
  omit,
  reduce,
  reject,
  remove,
  some,
  uniq,
  xorBy,
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
import type { BasketProduct } from "../basket";
import type { RecommendationsEngineContext } from "./types";

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
            target: "loading",
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
        target: "loading",
        actions: ["setBasket", "setLookups"],
        cond: "hasBasketChanged",
      },
      SEEN: {
        actions: ["setSeen"],
      },
      ADD: {
        target: "processing",
        actions: ["addToBasket"],
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
        basketId: (_context, { data }: AnyEventObject) => data.id,
        currencyId: (_context, { data }: AnyEventObject) => data?.currency_id,
        promotions: (_context, { data }: AnyEventObject) => data?.promotions,
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
          const productIds = uniq(
            map(
              concat(
                context.raw.related,
                context.raw.productMeta,
                context.raw.categoryMeta
              ),
              "object_id"
            )
          );
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
            context,
          };
        }
      ),

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
          };
        },
      }),

      setLookups: assign({
        raw: (
          _context: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const products = data?.products;
          const related = parseRelatedProducts(data as IBasket);

          return {
            products,
            related,
            seen: [],
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
            : remove(raw.related, ({ object_id }) => includes(data, object_id));

          return {
            products: raw.products,
            related: raw.related,
            seen,
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
          const products = raw?.products;
          const augmentedRecommendations = reduce(
            raw.related,
            (result: any[], raw: any) => {
              raw.product = find(data, ["id", raw.object_id]);

              const added = !isEmpty(
                find(products, product => {
                  return product.product_id === raw.object_id;
                })
              );

              result.push({
                ...parseRecommendation(raw),
                added,
              });
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
