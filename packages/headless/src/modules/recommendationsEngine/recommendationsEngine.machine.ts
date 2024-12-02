// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basket/helper";

// --- utils
import { useTime } from "../../utils";
import { parseBasketItem, parseRecommendations } from "./utils";
import { defaultsDeep, remove, reduce, some, isEmpty } from "lodash-es";

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
        entry: ["setContext", "clearLookups"],
        always: {
          target: "loading",
          actions: ["setBasketHelper"],
        },
        on: {
          REFRESH: {
            // do nothing
          },
        },
      },

      loading: {
        entry: ["cancelController", "clearError", "getBasket"],
        on: {
          REFRESH: [
            {
              target: "available",
              actions: ["setLookups"],
            },
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
        actions: ["resetModel", "resetLookups"],
      },

      REFRESH: {
        actions: ["setLookups"],
      },

      SEEN: {
        actions: ["setSeenLookups"],
      },
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
          lookups: {
            recommendations: [],
            seen: [],
            added: [],
          },
          // ---
          controller: undefined,
          // ---
          error: undefined,
          // ---
          basketHelper: undefined,
          itemBuilder: undefined,
          itemMapper: undefined,
          basketItemMapper: undefined,
        })
      ),

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

      // ---

      synced: assign({}),

      // ---

      add: assign({
        // model: (
        //   { model, lookups, type }: RecommendationsEngineContext,
        //   { data }: AddEvent
        // ) => {
        //   let available: any[] = [];
        //   switch (type) {
        //     case RecommendationsEngineTypes.register:
        //       available = lookups?.searched || [];
        //       break;
        //     case RecommendationsEngineTypes.transfer:
        //       available = lookups?.searched || [];
        //       break;
        //     // case RecommendationsEngineTypes.existing/owned:
        //     //   available = lookups?.owned;
        //     //   break;
        //     case RecommendationsEngineTypes.basket:
        //       available = lookups?.basket || [];
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
        // model: ({ model, lookups, type }: any, { data }: AddEvent) =>
        //   reduce(
        //     data,
        //     (result, item) => {
        //       let available = [];
        //       switch (type) {
        //         case RecommendationsEngineTypes.register:
        //           available = lookups?.searched;
        //           break;
        //         case RecommendationsEngineTypes.transfer:
        //           available = lookups?.searched;
        //           break;
        //         case RecommendationsEngineTypes.existing:
        //           available = lookups?.owned;
        //           break;
        //         case RecommendationsEngineTypes.basket:
        //           available = lookups?.basket;
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
        lookups: (
          _context: RecommendationsEngineContext,
          _event: AnyEventObject
        ) => {
          return {
            recommendations: [],
            seen: [],
            added: [],
          };
        },
      }),

      setLookups: assign({
        lookups: (
          { lookups }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          const recommendations = parseRecommendations(data as IBasket);
          const added = remove(recommendations, ({ productId }) =>
            some(data.products, ["productId", productId])
          );
          const seen = remove(recommendations, ({ productId }) =>
            some(lookups.seen, ["productId", productId])
          );

          debugger;
          return {
            recommendations,
            added,
            seen: lookups.seen ?? seen, // persist any seen Recommendations
          };
        },
      }),

      setSeenLookups: assign({
        lookups: (
          { lookups }: RecommendationsEngineContext,
          { data }: AnyEventObject
        ) => {
          // if data is empty assume weve seen ALL recommendations,
          //  otherwise if specified, move only the provided to the seen Recommendations
          const seen = isEmpty(data)
            ? (lookups.recommendations ?? [])
            : remove(lookups.recommendations ?? [], ({ productId }) =>
                some(data.products, ["productId", productId])
              );

          return {
            recommendations: lookups.recommendations ?? [],
            added: lookups.added ?? [],
            seen,
          };
        },
      }),

      resetLookups: assign({
        lookups: (
          { lookups }: RecommendationsEngineContext,
          _event: AnyEventObject
        ) => {
          return {
            seen: [],
            recommendations: lookups?.recommendations,
            added: lookups?.added,
          };
        },
      }),

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

      hasRecommendations: (
        { lookups }: RecommendationsEngineContext,
        _event: AnyEventObject
      ) => !isEmpty(lookups.recommendations),

      hasNoRecommendations: (
        { lookups }: RecommendationsEngineContext,
        _event: AnyEventObject
      ) => isEmpty(lookups.recommendations),
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
