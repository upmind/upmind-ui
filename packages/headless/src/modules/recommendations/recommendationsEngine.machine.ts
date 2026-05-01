// --- external
import { createMachine, assign, spawn, sendTo, pure } from "xstate";

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";

import { useDataLayer } from "../system";

// --- utils
import { mapToHeadlessError, useTime } from "../../utils";
import {
  parseRelatedProducts,
  parseRecommendation,
  parseRelationships,
  checkInBasket
} from "./utils";
import {
  concat,
  defaultsDeep,
  filter,
  find,
  get,
  has,
  includes,
  isArray,
  isEmpty,
  isEqual,
  isNil,
  isObject,
  map,
  reduce,
  reject,
  set,
  some,
  uniq,
  uniqBy,
  xorBy
} from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../basketProduct";
import type { ProductModel } from "../product";
import type { RecommendationsEngineContext, Recommendation } from "./types";
import { transformProductDynamicValues } from "../basketProduct/utils";

// ---
export default createMachine(
  {
    id: "recommendationsEngine",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RecommendationsEngineContext,
    states: {
      subscribing: {
        entry: ["setContext", "clearLookups", "setBasketHelper", "loadBasket"],
        on: {
          REFRESH: [
            {
              target: "available",
              actions: ["setBasket", "setLookups", "setRecommendations"],
              // Only transition to available when products have `related` data.
              // POST responses don't include `related`, so we wait for the
              // full basket refresh before considering data ready.
              cond: "hasRelatedData"
            },
            {
              // Data is incomplete (missing `related`), update context but
              // stay in subscribing and wait for complete data
              actions: ["setBasket", "setLookups", "setRecommendations"]
            }
          ],
          ERROR: {
            actions: ["setError"]
            // target: "unavailable",
          }
        }
      },

      refreshing: {
        after: {
          wait: "available"
        }
      },

      // Briefly held while the basket is mid-refresh. Entered via the
      // PROCESSING event forwarded by basketSubscription as soon as the
      // basket enters its own refreshing.processing state, and exited when
      // the eventual REFRESH event arrives. Blocks `isReady` so callers
      // don't read derived state from a stale basket snapshot.
      syncing: {
        on: {
          REFRESH: [
            {
              target: "refreshing",
              actions: [
                "setBasket",
                "clearProducts",
                "setLookups",
                "setRecommendations",
                "refreshProducts"
              ],
              cond: "hasBasketChanged"
            },
            {
              target: "available",
              actions: ["setBasket", "setLookups", "setRecommendations"]
            }
          ]
        }
      },

      available: {
        on: {
          PROCESSING: { target: "syncing" }
        },
        always: {
          target: "unavailable",
          cond: "hasNoRecommendations"
        }
      },

      unavailable: {
        on: {
          PROCESSING: { target: "syncing" }
        },
        always: {
          target: "available",
          cond: "hasRecommendations"
        }
      },

      configuring: {
        on: {
          CANCEL: {
            target: "available",
            actions: ["clearFailed"],
            cond: "hasNoData"
          }
        }
      },

      processing: {
        entry: ["clearError"],
        on: {
          REFRESH: {
            actions: ["setBasket", "setLookups", "setRecommendations"],
            cond: "hasBasketProductsChanged"
          },

          UPDATED: {
            actions: ["setBasket", "setLookups", "setRecommendations"],
            target: "available"
          },
          CANCEL: {
            target: "available",
            actions: ["clearFailed", "setRecommendations"]
          },
          ERROR: [
            {
              target: "configuring",
              actions: ["setError", "setFailed"],
              cond: "hasFailed"
            },
            {
              target: "error",
              actions: ["setError"]
            }
          ]
        }
      },

      error: {},
      // ---
      complete: {
        type: "final"
      }
    },
    on: {
      REFRESH: [
        {
          target: "refreshing",
          actions: [
            "setBasket",
            "clearProducts",
            "setLookups",
            "setRecommendations",
            "refreshProducts"
          ],
          cond: "hasBasketChanged"
        },
        {
          actions: ["setBasket", "setLookups", "setRecommendations"],
          cond: "hasBasketProductsChanged"
        }
      ],
      FETCH: {
        actions: ["fetchProduct"],
        cond: "canFetch"
      },
      FETCHED: {
        actions: ["setRecommendation"],
        cond: "hasData"
      },
      ERROR: {
        actions: ["setError", "removeRelated", "setRecommendations"],
        cond: "hasSourceContext"
      },
      SEEN: {
        actions: ["setSeen"]
      },
      ADD: {
        target: "processing",
        actions: ["addToBasket", "setProcessing"],
        cond: "exists"
      },
      STOP: {
        target: "complete"
      }
    }
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
            added: []
          },
          recommendations: [],
          // ---
          error: undefined,
          // ---
          basketId: undefined,
          currency: undefined,
          promotions: [],
          // ---
          basketHelper: undefined,
          parseBasketProductComparison: undefined
        })
      ),

      setBasket: assign({
        basketId: (_context, { data }: AnyEventObject) => {
          const basket = get(data, "basket", data);
          return basket?.id;
        },
        currency: (_context, { data }: AnyEventObject) => {
          const basket = get(data, "basket", data);
          return basket?.currency;
        },
        promotions: (_context, { data }: AnyEventObject) => {
          const basket = get(data, "basket", data);
          return basket?.promotions;
        }
      }),
      // ---

      setBasketHelper: assign(({ basketHelper, raw }: any) => {
        return {
          basketHelper: basketHelper || spawn(basketSubscription),

          parseProductModel: (
            recommendation: Recommendation,
            products: IBasketProduct[]
          ): ProductModel | undefined =>
            transformProductDynamicValues(
              recommendation.configuration,
              products
            ),

          parseBasketProductComparison: (item: BasketProduct) => ({
            productId: item.configuration.productId
          })
        };
      }),

      loadBasket: pure(
        ({ basketHelper }: RecommendationsEngineContext, _event) => {
          if (!basketHelper) return;
          return sendTo(basketHelper, {
            type: "INIT"
          });
        }
      ),

      fetchProduct: pure(
        (
          { basketHelper, recommendations }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const context = find(recommendations, ["id", data]);
          if (!basketHelper || !context) return;

          // ensure we add our configured coupons to the recommendation ( in the format of IBasketPromotion)
          set(
            context,
            "promotions",
            map(context.configuration.coupons, coupon => ({
              promotion: { code: coupon }
            }))
          );

          // and remove the config as it's not needed
          // unset(context, "configuration");

          return sendTo(basketHelper, {
            type: "FETCH",
            target: context.configuration.productId,
            context
          });
        }
      ),

      fetchProducts: pure(
        (context: RecommendationsEngineContext, { data }: AnyEventObject) => {
          if (!context.basketHelper) return;

          const productIds =
            data ?? uniq(map(context.raw.related, "object_id"));

          return sendTo(context.basketHelper, {
            type: "FETCH_SELECTED",
            target: productIds,
            context
          });
        }
      ),

      refreshProducts: pure(
        (context: RecommendationsEngineContext, _event: AnyEventObject) => {
          if (!context.basketHelper) return;

          const productIds = uniq(
            map(context.recommendations, "productDetails.id")
          );
          return sendTo(context.basketHelper, {
            type: "FETCH_SELECTED",
            target: productIds,
            context
          });
        }
      ),

      addToBasket: pure(
        (context: RecommendationsEngineContext, { data }: AnyEventObject) => {
          const recommendation = find(context.recommendations, ["id", data]);
          if (
            !context.basketHelper ||
            !context.parseProductModel ||
            !recommendation
          )
            return;

          const relationships = get(
            context.raw.relationships,
            recommendation.id,
            []
          );
          const relatedProducts = filter(context.raw.added, product => {
            return includes(relationships, product.id);
          });

          const model = context.parseProductModel(
            recommendation,
            relatedProducts
          );

          model.silent = true; // NB: we dont want to be blocked by the machine but rather let he backend handle this

          return sendTo(context.basketHelper, {
            type: "ADD_UPDATE",
            target: model,
            context: {
              ...context,
              recommendation
            }
          });
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
        }
      }),

      // ---

      setFailed: assign({
        failedProduct: (_context, { sourceContext }: AnyEventObject) => {
          return sourceContext;
        }
      }),

      clearFailed: assign({ failedProduct: undefined }),

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
            added: raw.added
          };
        }
      }),

      clearProducts: assign({
        raw: ({ raw }: RecommendationsEngineContext) => ({
          ...raw,
          products: []
        })
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
            added
            // added: uniq(concat(raw.added, added)),
          };
        }
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
            added: raw.added
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
        }
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
          _event: AnyEventObject
        ) => {
          const parsed = reduce(
            raw.related,
            (result: any[], rawRelated: any) => {
              // because we may have the same raw recommendation multiple times ( due to multiple products having the same related )
              // we need to check if we have already added it so the parsed recommendations are deduped
              if (some(result, ["id", rawRelated.id])) return result;

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
                loading
              });
              result.push(parsed);
              return result;
            },
            []
          );
          return parsed;
        }
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
          { data, sourceContext }: AnyEventObject
        ) => {
          const augmentedRecommendations = reduce(
            raw.related,
            (result: any[], rawRelated: any) => {
              // because we may have the same raw recommendation multiple times ( due to multiple products having the same related )
              // we need to check if we have already added it so the parsed recommendations are deduped
              if (some(result, ["id", rawRelated.id])) return result;

              if (isArray(data)) {
                // FETCH_SELECTED: data is array of products, sourceContext is full RecommendationsEnginesourceContext
                rawRelated.product = find(data, ["id", rawRelated.object_id]);
              } else if (sourceContext?.id == rawRelated?.id) {
                // FETCH: data is single product, context has the recommendation id
                rawRelated.product = data;
              }

              const added = checkInBasket(rawRelated, raw.added);
              const seen = includes(raw.seen, rawRelated.id);
              const processing = false;
              const loading = isEmpty(rawRelated.product);
              const parsed = parseRecommendation(rawRelated, {
                added,
                seen,
                processing,
                loading
              });
              result.push(parsed);
              return result;
            },
            []
          );
          return augmentedRecommendations;
        }
      }),

      removeRelated: assign({
        raw: (
          { raw }: RecommendationsEngineContext,
          { sourceContext }: AnyEventObject
        ) => {
          raw.related = reject(raw.related, ["id", sourceContext.id]);
          return raw;
        }
      }),

      // --- Datalayer
      // when a new product is added for configuration, but has not been saved/added to the basket
      pushViewRecommendations: (
        { raw, currency }: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => {
        const product = data; //TODO: check / parse the data is a basket item
        useDataLayer()
          .dataLayer({
            event: "view_item_list",
            currency: currency?.code,
            item_list_id: "recommendations",
            // item_list_name: "Recommendations",
            items: raw.related
          })
          .push();
      },

      // ---

      setError: assign({
        error: (
          { recommendations }: RecommendationsEngineContext,
          { data, sourceContext }: AnyEventObject
        ) => {
          if (!isEmpty(sourceContext)) {
            const recommendation = find(recommendations, [
              "id",
              sourceContext?.id
            ]);
            if (recommendation) set(recommendation, "meta.error", true);
          }

          return mapToHeadlessError(data);
        }
      }),

      clearError: assign({ error: undefined })
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

      hasNoData: (
        _context: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => isEmpty(data),
      hasSourceContext: (
        _context: RecommendationsEngineContext,
        { sourceContext }: AnyEventObject
      ) => !isEmpty(sourceContext),

      hasRecommendations: (
        { raw }: RecommendationsEngineContext,
        _event: AnyEventObject
      ) => !isEmpty(raw.related),

      hasNoRecommendations: (
        { raw }: RecommendationsEngineContext,
        _event: AnyEventObject
      ) => isEmpty(raw.related),

      hasBasketChanged: (
        { basketId, currency, promotions, raw }: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => {
        //  NB: data is raw basket data so use snake_case for comparison
        const basketChanged = basketId !== data?.id;
        const currencyChanged = currency?.id !== data?.currency_id;
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
        const productsChanged = !isEmpty(
          xorBy(raw.added, data?.products, "product_id")
        );
        const relatedChanged = !isEqual(
          map(raw.added, "product.related"),
          map(data?.products, "product.related")
        );
        return productsChanged || relatedChanged;
      },

      // Check if all basket products have `related` data populated.
      // POST/PUT responses don't include `related` (they don't support `with`),
      // so we use this to wait for the full basket refresh before transitioning
      // to available state.
      hasRelatedData: (
        _context: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => {
        const basket = get(data, "basket", data);
        const basketProducts = basket?.products ?? [];
        // If no products, data is complete (nothing to wait for)
        if (isEmpty(basketProducts)) return true;
        // Check that all products have `related` defined (not undefined)
        return some(
          basketProducts,
          (basketProduct: IBasketProduct) =>
            !isNil(basketProduct?.product?.related)
        );
      },

      hasFailed: (
        _context: RecommendationsEngineContext,
        { sourceContext }: AnyEventObject
      ) => {
        return isObject(sourceContext) && has(sourceContext, "productId");
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
