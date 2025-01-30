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
  parseRelationships,
  checkInBasket,
} from "./utils";
import {
  concat,
  defaultsDeep,
  filter,
  find,
  findLast,
  first,
  get,
  includes,
  isEmpty,
  isObject,
  has,
  map,
  reduce,
  set,
  some,
  uniq,
  uniqBy,
  xorBy,
  unset,
  reject,
} from "lodash-es";

// --- types
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
import type { BasketProduct } from "../basket";
import type { RecommendationsEngineContext, Recommendation } from "./types";
import { mapValues } from "xstate/lib/utils";

// --------------------------------------------------------

export default createMachine(
  {
    id: "recommendationsEngine",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RecommendationsEngineContext,
    states: {
      subscribing: {
        entry: ["setContext", "clearLookups", "setBasketHelper", "getBasket"],
      },

      refreshing: {
        after: {
          wait: "available",
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
            actions: ["setBasket", "setLookups", "setRecommendations"],
            cond: "hasBasketProductsChanged",
          },

          ADDED: {
            actions: ["setBasket", "setLookups", "setRecommendations"],
            target: "available",
          },
          CANCEL: {
            target: "available",
            actions: ["clearItem", "setRecommendations"],
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
      REFRESH: [
        {
          target: "refreshing",
          actions: ["setBasket", "setLookups", "setRecommendations"],
          cond: "hasBasketChanged",
        },
        {
          actions: ["setBasket", "setLookups", "setRecommendations"],
          cond: "hasBasketProductsChanged",
        },
      ],
      FETCH: {
        actions: ["fetchProduct"],
        cond: "canFetch",
      },
      FETCHED: {
        actions: ["setRecommendation"],
        cond: "hasData",
      },
      ERROR: {
        actions: ["setError", "removeRelated", "setRecommendations"],
        cond: "hasDataWithContext",
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
            relationships: {},
            seen: [],
            added: [],
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

      setBasketHelper: assign(({ basketHelper, raw }: any) => {
        return {
          basketHelper: basketHelper || spawn(basketSubscription),
          itemBuilder: function (item: BasketProduct) {
            return parseBasketItem(item);
          },

          basketItemBuilder: (
            recommendation: Recommendation,
            products: IBasketProduct
          ) => {
            if (!recommendation?.config && !recommendation.config?.productId)
              return null;

            recommendation.config.provisionFields = mapValues(
              recommendation.config?.provisionFields ?? {},
              (value: any) => {
                // get any dynamic properties that we need to resolve
                const dynamicProperty: string = first(
                  value.match(/(?<=\$\{).+?(?=\})/)
                );
                const product = findLast(products, product =>
                  has(product, dynamicProperty)
                );
                if (dynamicProperty && product) {
                  const resolved = get(product, dynamicProperty, null);
                  return resolved;
                }

                return value;
              }
            );
            return recommendation.config;
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

      fetchProduct: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        ({ recommendations }, { data }: AnyEventObject) => {
          const context = find(recommendations, ["id", data]);

          // ensure we add our configured coupons to the recommendation and remove the config as it's not needed
          set(context, "promotions", context?.config?.coupons);
          unset(context, "config");

          return {
            type: "FETCH",
            target: context.productId,
            context,
          };
        }
      ),

      fetchProducts: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, { data }: AnyEventObject) => {
          const productIds =
            data ?? uniq(map(context.raw.related, "object_id"));
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

          const relationships = get(
            context.raw.relationships,
            recommendation.id,
            []
          );

          const relatedProducts = filter(context.raw.added, product => {
            return includes(relationships, product.id);
          });

          const model = context.basketItemBuilder(
            recommendation,
            relatedProducts
          );
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
          { raw }: RecommendationsEngineContext,
          _event: AnyEventObject
        ) => {
          return {
            products: [],
            related: [],
            relationships: {},
            seen: [],
            added: raw.added,
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
          const relationships = parseRelationships(basket as IBasket);
          const added = products; //parseAddedProducts(related, products);

          return {
            products: raw?.products ?? [],
            related,
            relationships,
            seen: raw?.seen ?? [], // TODO: retrieve from local storage
            added,
            // added: uniq(concat(raw.added, added)),
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
            relationships: raw.relationships,
            seen: map(seen, "id"),
            added: raw.added,
          };
        },
        recommendations: (
          { recommendations }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const markAll = isEmpty(data);

          return map(recommendations, recommendation => {
            const isSeen = markAll || includes(data, recommendation.id);

            set(recommendation, "meta.seen", isSeen);

            return recommendation;
          });
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
      // }),§

      setRecommendations: assign({
        recommendations: (
          { raw }: RecommendationsEngineContext,
          _event: AnyEventObject
        ) =>
          reduce(
            raw.related,
            (result: any[], rawRelated: any) => {
              const product = find(raw.products, ["id", rawRelated.object_id]);
              rawRelated.product = product;
              const added = checkInBasket(rawRelated, raw.added);
              const seen = includes(raw.seen, rawRelated.id);
              const processing = false;
              const loading = isEmpty(rawRelated.product);
              const parsed = parseRecommendation(rawRelated, {
                added,
                seen,
                processing,
                loading,
              });
              result.push(parsed);
              return result;
            },
            []
          ),
      }),

      setRecommendation: assign({
        raw: (
          { raw }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          raw.products = uniqBy(concat(raw.products, data), "id");
          return raw;
        },
        recommendations: (
          { raw }: RecommendationsEngineContext,
          { data, context }: AnyEventObject
        ) => {
          const augmentedRecommendations = reduce(
            raw.related,
            (result: any[], rawRelated: any) => {
              if (context?.id == rawRelated?.id) rawRelated.product = data;
              const added = checkInBasket(rawRelated, raw.added);
              const seen = includes(raw.seen, rawRelated.id);
              const processing = false;
              const loading = isEmpty(rawRelated.product);
              const parsed = parseRecommendation(rawRelated, {
                added,
                seen,
                processing,
                loading,
              });
              result.push(parsed);
              return result;
            },
            []
          );
          return augmentedRecommendations;
        },
      }),

      removeRelated: assign({
        raw: (
          { raw }: RecommendationsEngineContext,
          { context }: AnyEventObject
        ) => {
          raw.related = reject(raw.related, ["id", context.id]);
          return raw;
        },
      }),

      setError: assign({
        error: (
          { recommendations }: RecommendationsEngineContext,
          { data, context }: AnyEventObject
        ) => {
          if (!isEmpty(context)) {
            const recommendation = find(recommendations, ["id", context?.id]);
            if (recommendation) set(recommendation, "meta.error", true);
          }
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

      canFetch: (
        { recommendations }: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) =>
        some(recommendations, recommendation => {
          return recommendation?.id === data && !!recommendation?.meta?.loading;
        }),

      hasData: (
        _context: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => !isEmpty(data),

      hasDataWithContext: (
        _context: RecommendationsEngineContext,
        { data, context }: AnyEventObject
      ) => !isEmpty(data) && !isEmpty(context),

      hasRecommendations: (
        { raw }: RecommendationsEngineContext,
        _event: AnyEventObject
      ) => !isEmpty(raw.related),

      hasNoRecommendations: (
        { raw }: RecommendationsEngineContext,
        _event: AnyEventObject
      ) => isEmpty(raw.related),

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

        const value = basketChanged || currencyChanged || promotionsChanged;

        return value;
      },

      hasBasketProductsChanged: (
        { raw }: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => {
        //  NB: data is raw basket data so use snake_case for comparison
        return !isEmpty(xorBy(raw.added, data?.products, "product_id"));
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
