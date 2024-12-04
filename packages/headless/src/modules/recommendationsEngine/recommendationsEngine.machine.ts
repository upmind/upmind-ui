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
  defaultsDeep,
  reduce,
  isEmpty,
  map,
  xorBy,
  find,
  uniq,
  concat,
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
import type { BasketProduct } from "../basket";
import type { RecommendationsEngineContext } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    id: "RecommendationsEngine",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RecommendationsEngineContext,
    states: {
      subscribing: {
        entry: ["setContext", "clearLookups", "setBasketHelper", "getBasket"],
        on: {
          // REFRESH: {
          //   target: "loading",
          //   actions: ["setBasket", "setLookups"],
          // },
        },
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
          target: "processing",
          cond: "hasRecommendations",
        },
      },

      // cancel any existing search via the controller then wait before starting a new search & controller
      processing: {
        on: {
          REFRESH: {
            // do nothing
          },
          SYNCED: [
            {
              target: "available",
              actions: ["synced"],
              cond: "hasNewRecommendations",
            },
            { target: "complete", actions: ["synced"] },
          ],
          ERROR: { actions: ["setError"] },
        },
      },

      error: {},
      // ---
      complete: {
        type: "final",
      },
    },
    on: {
      // FETCH: {
      //   // target: ["fetching"],
      //   cond: "isValid",
      // },

      ADD: [
        {
          actions: ["add"],
          cond: "isValid",
        },
      ],

      REMOVE: {
        actions: ["remove"],
        cond: "isValid",
      },

      RESET: {
        actions: ["resetModel"],
      },

      REFRESH: {
        target: "loading",
        actions: ["setBasket", "setLookups"],
        cond: "hasBasketChanged",
      },

      // SEEN: {
      //   actions: ["setSeenLookups"],
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
            categoryMeta: [],
            productMeta: [],
          },
          recommendations: [],
          // ---
          controller: undefined,
          // ---
          error: undefined,
          // ---
          basketId: undefined,
          currencyId: undefined,
          promotions: [],
          // ---
          basketHelper: undefined,
          itemBuilder: undefined,
          itemMapper: undefined,
          basketItemMapper: undefined,
        })
      ),

      setBasket: assign({
        basketId: (_context, { data }: AnyEventObject) => data.id,
        currencyId: (_context, { data }: AnyEventObject) => data?.currency_id,
        promotions: (_context, { data }: AnyEventObject) =>
          data?.promotions ?? [],
      }),
      // ---

      setBasketHelper: assign(({ basketHelper }: any) => {
        return {
          basketHelper: basketHelper || spawn(basketSubscription),
          itemBuilder: function (item: BasketProduct) {
            debugger;
            return parseBasketItem(item);
          },
          itemMapper: (item: BasketProduct) => {
            debugger;
            return {
              productId: item.productId,
            };
          },

          basketItemMapper: (item: BasketProduct) => ({
            productId: item.productId,
            "provisionFields.sld": item.provisionFields?.sld,
          }),
        };
      }),

      syncBasket: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, _event) => {
          // not all values might be products, eg an exiting RecommendationsEngine value,
          // so we need to filter out any non product values
          // and then map them to a be a basket item model
          debugger;
          const products = reduce(
            context.model,
            (result: any[], item: any) => {
              debugger;
              if (item?.productId) {
                const model = context.itemMapper(item);
                result.push(model);
              }
              return result;
            },
            []
          );

          return {
            type: "SYNC",
            target: products,
            context,
          };
        }
      ),

      getBasket: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, _event) => ({
          type: "INIT",
          context,
        })
      ),

      fetchRelated: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, { data }) => {
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

      // ---

      synced: assign({}),

      // ---

      add: assign({
        // model: (
        //   { model, raw, type }: RecommendationsEngineContext,
        //   { data }: AddEvent
        // ) => {
        //   let available: any[] = [];
        //   switch (type) {
        //     case RecommendationsEngineTypes.register:
        //       available = raw?.searched || [];
        //       break;
        //     case RecommendationsEngineTypes.transfer:
        //       available = raw?.searched || [];
        //       break;
        //     // case RecommendationsEngineTypes.existing/owned:
        //     //   available = raw?.owned;
        //     //   break;
        //     case RecommendationsEngineTypes.basket:
        //       available = raw?.basket || [];
        //       break;
        //   }
        //   const RecommendationsEngine = parseValue(data, model, available);
        //   model ??= [];
        //   if (RecommendationsEngine) model.push(RecommendationsEngine);
        //   return model;
        // },
      }),

      remove: assign({
        // model: (
        //   { model }: RecommendationsEngineContext,
        //   { data }: RemoveEvent
        // ) => reject(model, ["RecommendationsEngine", data]),
      }),

      // ---
      setModel: assign({
        // model: ({ model, raw, type }: any, { data }: AddEvent) =>
        //   reduce(
        //     data,
        //     (result, item) => {
        //       let available = [];
        //       switch (type) {
        //         case RecommendationsEngineTypes.register:
        //           available = raw?.searched;
        //           break;
        //         case RecommendationsEngineTypes.transfer:
        //           available = raw?.searched;
        //           break;
        //         case RecommendationsEngineTypes.existing:
        //           available = raw?.owned;
        //           break;
        //         case RecommendationsEngineTypes.basket:
        //           available = raw?.basket;
        //           break;
        //       }
        //       const RecommendationsEngine: any = parseValue(
        //         item,
        //         model,
        //         available
        //       );
        //       // ensure we persist any prev selected/primary RecommendationsEngine
        //       if (RecommendationsEngine) {
        //         const exists = find(model, [
        //           "RecommendationsEngine",
        //           RecommendationsEngine.RecommendationsEngine,
        //         ]);
        //         RecommendationsEngine.isPrimary = exists?.isPrimary;
        //         // @ts-ignore
        //         result.push(RecommendationsEngine);
        //       }
        //       return result;
        //     },
        //     []
        //   ),
      }),

      resetModel: assign({
        model: (
          _context: RecommendationsEngineContext,
          _event: AnyEventObject
        ) => {
          return [];
        },
      }),

      cancelController: assign({
        controller: (
          { controller }: RecommendationsEngineContext,
          _event: AnyEventObject
        ) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return undefined;
        },
      }),

      clearLookups: assign({
        raw: (
          _context: RecommendationsEngineContext,
          _event: AnyEventObject
        ) => {
          return {
            products: [],
            related: [],
            categoryMeta: [],
            productMeta: [],
          };
        },
      }),

      setLookups: assign({
        raw: (
          _context: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const products = data?.products ?? [];
          const related = parseRelatedProducts(data as IBasket);

          return {
            products,
            related,
            categoryMeta: [], //TODO: add products recommended for this category via META
            productMeta: [], // TODO: add products recommended for this product via META
          };
        },
      }),

      // setSeen: assign({
      //   recommendations: (
      //     { raw }: RecommendationsEngineContext,
      //     { data }: AnyEventObject
      //   ) => {
      //     // if data is empty assume weve seen ALL recommendations,
      //     //  otherwise if specified, move only the provided to the seen Recommendations
      //     const seen = isEmpty(data)
      //       ? (raw.recommendations ?? [])
      //       : remove(raw.recommendations ?? [], ({ productId }) =>
      //           some(data.products, ["productId", productId])
      //         );

      //     return {
      //       products: raw.products ?? [],
      //       recommendations: raw.recommendations ?? [],
      //       added: raw.added ?? [],
      //       seen,
      //     };
      //   },
      // }),

      // resetSeen: assign({
      //   raw: (
      //     { raw }: RecommendationsEngineContext,
      //     _event: AnyEventObject
      //   ) => {
      //     return {
      //       products: raw?.products,
      //       seen: [],
      //       recommendations: raw?.recommendations,
      //       added: raw?.added,
      //     };
      //   },
      // }),

      setRecommendations: assign({
        recommendations: (
          { raw }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const augmentedRecommendations = reduce(
            raw.related,
            (result: any[], raw: any) => {
              raw.product = find(data, ["id", raw.object_id]);
              result.push(parseRecommendation(raw));
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
          _event: AnyEventObject
        ) => {
          // addError({
          //   title: data?.title || "We experienced an error getting RecommendationsEngine",
          //   copy: data?.message,
          //   data: data?.data,
          // });
          // return data;
        },
      }),

      clearError: assign({ error: null }),
    },

    guards: {
      isNotCancelled: (
        _context: RecommendationsEngineContext,
        { data }: AnyEventObject
      ) => data?.name !== "AbortError",

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
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
