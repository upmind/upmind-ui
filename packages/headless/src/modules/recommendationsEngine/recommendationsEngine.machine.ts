// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basket/helper";
import { authSubscription } from "../session";

// --- utils
import { useTime } from "../../utils";
import { parseBasketItem } from "./utils";
import {
  compact,
  concat,
  defaultsDeep,
  filter,
  find,
  first,
  get,
  has,
  includes,
  isEmpty,
  map,
  omit,
  reduce,
  reject,
  set,
  some,
  uniqBy,
  every,
} from "lodash-es";

// --- types
import type { BasketProduct } from "../basket";
import type {
  RecommendationsEngineContext,
  RecommendationsEngineEvents,
} from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    id: "RecommendationsEngine",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RecommendationsEngineContext,
    states: {
      subscribing: {
        entry: ["setContext", "ensurePrimary", "persistModel", "clearLookups"],
        always: {
          target: "loading",
          actions: ["setBasketHelper", "setAuthHelper"],
        },
      },

      loading: {
        entry: ["cancelController", "clearError"],
        always: [
          { target: "processing", cond: "hasSearchQuery" },
          { target: "invalid" },
        ],
      },
      // cancel any existing search via the controller then wait before starting a new search & controller
      processing: {
        id: "processing",
        entry: ["clearError", "cancelController", "newController"],
        invoke: {
          src: "search",
          onDone: {
            target: "invalid",
            actions: ["setSearchResults"],
          },
          onError: [
            {
              target: "error",
              actions: ["setError"],
              cond: "isNotCancelled",
            },
            {
              actions: ["setError"],
            },
          ],
        },
      },
      valid: {
        type: "final",
        always: [
          {
            target: "invalid",
            cond: "isInvalid",
            actions: assign({
              error: "Invalid RecommendationsEngine",
            }),
          },
        ],
        on: {
          SYNC: {
            target: "syncing",
            actions: ["syncBasket"],
          },
        },
      },
      invalid: {
        always: [{ target: "valid", cond: "isValid" }],
      },
      // ---
      syncing: {
        on: {
          REFRESH: {
            // do nothing
          },
          SYNCED: { target: "complete", actions: ["synced"] },
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
          target: ".valid",
          actions: ["add", "ensurePrimary"],
          cond: "isValidRecommendationsEngine",
        },
      ],
      REMOVE: {
        target: ".valid",
        actions: ["remove", "ensurePrimary"],
        cond: "isValid",
      },
      UPDATE: {
        target: ".valid",
        actions: ["setModel", "ensurePrimary"],
      },
      SEARCH: [
        {
          target: ".loading",
          actions: ["setSearchQuery"],
          cond: "validSearchQuery",
        },
        {
          actions: ["setSearchQuery"],
        },
      ],
      "SEARCH.OFFSET": {
        target: ".loading",
        actions: ["setSearchOffset"],
        cond: "validSearchOffset",
      },

      RESET: {
        target: ".invalid",
        actions: ["resetModel", "resetLookups", "clearSearch"],
      },

      REFRESH: {
        actions: ["setCurrency", "setPromotions"],
      },

      STOP: {
        target: "complete",
      },

      AUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
      UNAUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
    },
  },
  {
    actions: {
      setContext: assign((context, _event) =>
        defaultsDeep(context, {
          model: [],
          lookups: {
            products: [],
          },
          // ---
          currencyId: undefined,
          promotions: [],
          // ---
          controller: undefined,
          // ---
          error: undefined,
          // ---
          basketHelper: undefined,
          itemBuilder: undefined,
          itemMapper: undefined,
          basketItemBuilder: undefined,
          basketItemMapper: undefined,
        })
      ),

      persistModel: assign({
        // baseModel: ({ model }) => model,
      }),

      setCurrency: assign({
        currencyId: (_context, { data }: any) => {
          return data?.currency_id;
        },
      }),

      setPromotions: assign({
        promotions: (_context, { data }: any) => {
          return data?.promotions;
        },
      }),
      // ---

      setAuthHelper: assign(({ authHelper }: any) => {
        authHelper || spawn(authSubscription);
      }),

      setBasketHelper: assign(({ basketHelper }: any) => {
        return {
          basketHelper: basketHelper || spawn(basketSubscription),
          itemBuilder: function (item: BasketProduct) {
            return parseBasketItem(item);
          },
          itemMapper: (item: BasketProduct) => ({
            productId: item.productId,
            sld: item?.provisionFields?.sld,
          }),
          basketItemBuilder: (item: any) => {
            if (!item?.productId) return null;
            return {
              productId: item.productId,
              quantity: 1,
              term: {
                cycle: item.cycle,
              },
              options: item.options,
              attributes: item.attributes,
              provisionFields: {
                sld: item.sld,
              },
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
          const products = reduce(
            context.model,
            (result: any[], item: any) => {
              if (item?.productId) {
                const model = context.basketItemBuilder(item);
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

      // ---

      synced: assign({}),

      // ---

      // @ts-ignore
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

      // @ts-ignore
      remove: assign({
        // model: (
        //   { model }: RecommendationsEngineContext,
        //   { data }: RemoveEvent
        // ) => reject(model, ["RecommendationsEngine", data]),
      }),

      // ---

      // @ts-ignore
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
        // model: ({ baseModel }, _event) => {
        //   return baseModel;
        // },
      }),

      cancelController: assign({
        // @ts-ignore
        controller: ({ controller }) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return null;
        },
      }),

      newController: assign({
        controller: () => {
          return new AbortController();
        },
      }),

      setSearchQuery: assign({
        // @ts-ignore
        search: ({ search }, { data }) => {
          return {
            query: data,
            offset: 0,
            limit: search?.limit,
            total: 0,
          };
        },
      }),

      setSearchOffset: assign({
        // search: ({ search }: any, _event) => {
        //   search.offset += search?.limit;
        //   return search;
        // },
      }),

      clearSearch: assign({
        search: ({ search }: any, _event) => ({
          query: "",
          offset: 0,
          limit: search.limit,
          total: 0,
        }),
        lookups: ({ lookups }) => {
          // lookups.history = [];
          lookups.search = [];
          return lookups;
        },
      }),

      setSearchResults: assign({
        lookups: ({ lookups, model, search }: any, { data }: any) => {
          const previous = search.offset > 0 ? lookups.searched : [];

          const available = map(data?.available, item => {
            item.value = item.RecommendationsEngine;
            item.isOwned = some(lookups.owned, [
              "RecommendationsEngine",
              item.RecommendationsEngine,
            ]);
            item.inBasket = some(lookups.basket, [
              "RecommendationsEngine",
              item.RecommendationsEngine,
            ]);
            item.disabled = item.isOwned || item.inBasket;
            return item;
          });

          const persisted = filter(
            lookups.history,
            ({ RecommendationsEngine }) =>
              some(model, ["RecommendationsEngine", RecommendationsEngine])
          );

          set(
            lookups,
            "searched",
            uniqBy(
              compact(concat(persisted, previous, available)),
              "RecommendationsEngine"
            )
          );

          // store all previous searches
          set(
            lookups,
            "history",
            uniqBy(
              compact(concat(lookups.history, available)),
              "RecommendationsEngine"
            )
          );

          return lookups;
        },
        search: ({ search }, { data }) => {
          search.total = data.total;
          return search;
        },
        controller: null,
      }),

      clearLookups: assign({
        // @ts-ignore
        lookups: (_context: any, _event: any) => {
          return {
            searched: [],
            history: [],
            owned: [],
            basket: [],
          };
        },
      }),

      resetLookups: assign({
        lookups: ({ lookups }: any, _event: any) => {
          return {
            searched: [],
            history: [],
            owned: lookups.owned,
            basket: lookups.basket,
          };
        },
      }),

      setError: assign({
        error: (_context, _event) => {
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
      hasSearchQuery: ({ search }: any, _event) => {
        // @ts-ignore
        return data?.length > 2;
      },
      validSearchQuery: (_context, { data }) => {
        // @ts-ignore
        return data?.length >= 2;
      },
      validSearchOffset: ({ search }: any, _event) => {
        const offset = search.offset + search.limit;
        return offset < search.total;
      },

      isNotCancelled: (_context, { data }: any) => data?.name !== "AbortError",
    },

    delays: {
      // @ts-ignore
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services: services as any,
  }
);
