// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
import { basketSubscription } from "../basket/helper";
import { authSubscription } from "../session";

const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime } from "../../utils";
import { parseDomain, parseValue, parseBasketItem, parseSld } from "./utils";
import {
  values,
  isArray,
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
  cloneDeep,
} from "lodash-es";

// --- types
import type { BasketProduct } from "../basket";
import { DomainTypes } from "./types";
import type { DomainContext } from "./types";
import type { DomainProduct } from "./types";
import type { Domain } from "./types";
import type { ProductModel } from "../product";
import { isFunction } from "xstate/lib/utils";

// --------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./domain.machine.typegen").Typegen0,
    id: "domainManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as DomainContext,
    states: {
      subscribing: {
        entry: [
          "setContext",
          "checkModel",
          "ensurePrimary",
          "persistModel",
          "clearLookups",
        ],
        always: {
          target: "loading",
          actions: ["setBasketHelper", "setAuthHelper"],
        },
      },

      loading: {
        type: "parallel",
        states: {
          existing: {
            initial: "processing",
            states: {
              processing: {
                invoke: {
                  src: "getClientDomains",
                  onDone: {
                    target: "complete",
                    actions: ["setOwned"],
                  },
                  onError: { target: "complete" },
                },
              },
              complete: { type: "final" },
            },
          },
          basket: {
            initial: "processing",
            states: {
              processing: {
                entry: ["loadBasketProducts"],
                on: {
                  REFRESH: {
                    // do nothing
                  },
                  LOADED: {
                    target: "complete",
                    actions: ["setBasketProducts"],
                  },
                  ERROR: {
                    target: "complete",
                  },
                },
              },
              complete: { type: "final" },
            },
          },
        },
        onDone: "idle",
      },

      // our initial state depends on if the machine has been forced to a type,
      // if we do then go to that types state, otherwise stay idle
      idle: {
        entry: ["checkChoices"],
        id: "idle",
        always: [
          {
            target: "dac",
            cond: ({ type }) =>
              includes([DomainTypes.register, DomainTypes.transfer], type),
          },
          {
            target: "existing",
            cond: ({ type }) => type === DomainTypes.existing,
          },
          {
            target: "basket",
            cond: ({ type }) => type === DomainTypes.basket,
          },
        ],
      },

      dac: {
        id: "dac",
        initial: "loading",
        states: {
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
                  error: "Invalid domain",
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
              SYNCED: { target: "#basket", actions: ["synced"] },
              ERROR: { actions: ["setError"] },
            },
          },
          error: {},
          complete: {},
        },
        on: {
          ADD: [
            {
              target: ".valid",
              actions: ["add", "ensurePrimary"],
              cond: "isValidDomain",
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

          REFRESH: {
            target: ".loading",
            actions: ["loadBasketProducts", "setCurrency", "setPromotions"],
          },
          RESET: {
            target: ".invalid",
            actions: ["resetModel", "resetLookups", "clearSearch"],
          },
        },
        exit: ["resetModel"],
      },

      existing: {
        id: "existing",
        initial: "invalid",
        states: {
          valid: {
            always: [
              {
                target: "invalid",
                cond: "isInvalid",
                actions: assign({
                  error: "Invalid domain",
                }),
              },
            ],
          },
          invalid: {
            always: {
              target: "valid",
              cond: "isValid",
            },
          },
          error: {},
        },
        on: {
          UPDATE: {
            target: ".invalid",
            actions: ["clearError", "setExisting", "ensurePrimary"],
          },
        },
        exit: ["resetModel"],
      },

      basket: {
        id: "basket",
        initial: "loading",
        states: {
          loading: {
            entry: ["loadBasketProducts"],
            on: {
              LOADED: {
                target: "invalid",
                actions: [
                  "setBasketProducts",
                  "setModel",
                  "ensurePrimary",
                  "checkChoices",
                ],
              },
              ERROR: {
                target: "error",
                actions: ["setError"],
              },
            },
          },
          processing: {
            after: {
              wait: "invalid",
            },
          },
          valid: {
            always: {
              target: "invalid",
              cond: "isInvalid",
            },
            on: {
              SYNC: {
                target: "syncing",
                actions: ["syncBasket"],
              },
            },
          },
          invalid: {
            always: {
              target: "valid",
              cond: "isValid",
            },
          },
          syncing: {
            on: {
              REFRESH: {
                // do nothing
              },
              SYNCED: {
                target: "complete",
                actions: ["synced"],
              },
              ERROR: {
                actions: ["setError"],
              },
            },
          },
          error: {},
          complete: {},
        },
        on: {
          SELECT: [
            {
              target: ".processing",
              actions: ["setPrimary"],
              cond: "isValid",
            },
          ],
        },
        exit: ["resetModel"],
      },

      // ---
      complete: {
        type: "final",
      },
    },
    on: {
      REFRESH: {
        actions: ["loadBasketProducts", "setCurrency", "setPromotions"],
      },

      LOADED: {
        actions: ["setBasketProducts"],
      },

      CHOOSE: [
        {
          // do nothing
          cond: "isInvalidType",
        },
        {
          target: "dac",
          actions: ["setType"],
          cond: "isDomainRegister",
        },
        {
          target: "dac",
          actions: ["setType"],
          cond: "isDomainTransfer",
        },
        {
          target: "existing",
          actions: ["setType"],
          cond: "isExistingDomain",
        },
        {
          target: "basket",
          actions: ["setType"],
          cond: "isBasket",
        },
      ],

      STOP: {
        target: "complete",
      },

      AUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
      UNAUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
    },
  },
  {
    actions: {
      setContext: assign((context: DomainContext, _event) =>
        defaultsDeep(context, {
          choices: DomainTypes,
          type: undefined,
          model: [],
          lookups: {
            searched: [],
            history: [],
            owned: [],
            basket: [],
          },
          // ---
          currency: undefined,
          promotions: [],
          // ---
          search: {
            query: undefined,
            limit: 10,
            offset: 0,
            total: 0,
          },

          controller: undefined,
          // ---
          error: undefined,
          // ---
          authHelper: undefined,
          basketHelper: undefined,
          itemBuilder: undefined,
          basketItemBuilder: undefined,
          basketItemMapper: undefined,
        })
      ),

      persistModel: assign({
        baseModel: ({ model }: DomainContext) => cloneDeep(model), // we use spread to ensure its a new array
      }),

      checkModel: assign({
        model: ({ model }: DomainContext) =>
          map(compact(model), item => parseDomain(item)) as DomainProduct[],
      }),

      ensurePrimary: assign({
        model: ({ model }: DomainContext) => {
          if (!isEmpty(model) && !some(model, "isPrimary")) {
            const primaryDomain = first(model);
            if (primaryDomain) set(primaryDomain, "isPrimary", true);
          }
          return model;
        },
      }),

      checkChoices: assign({
        choices: ({ basketProducts }: DomainContext) => {
          if (!basketProducts?.length)
            return values(omit(DomainTypes, DomainTypes.basket));

          return values(DomainTypes);
        },
        type: ({ type, basketProducts, model }: DomainContext) => {
          const selected = find(model, "isPrimary") || first(model);
          const domain = get(selected, "domain");

          if (domain) {
            const inBasket = some(basketProducts, ["domain", domain]);
            if (inBasket) return DomainTypes.basket;

            return DomainTypes.existing;
          }

          return type;
        },
      }),

      setType: assign({
        type: (_context, { data }: AnyEventObject) => data,
        error: null,
      }),

      setCurrency: assign({
        currency: (_context, { data }: AnyEventObject) => {
          return data?.currency;
        },
      }),

      setPromotions: assign({
        promotions: (_context, { data }: AnyEventObject) => {
          return data?.promotions;
        },
      }),

      // ---

      setAuthHelper: assign(({ authHelper }: DomainContext) => ({
        authHelper: authHelper || spawn(authSubscription),
      })),

      setBasketHelper: assign(({ basketHelper }: DomainContext) => {
        return {
          basketHelper: basketHelper || spawn(basketSubscription),
          itemBuilder: (item: any) => parseBasketItem(item) as DomainProduct,
          basketItemBuilder: (item: DomainProduct) => {
            if (!item?.productId) return undefined;

            return {
              productId: item.productId,
              quantity: 1,
              term: item.cycle,
              options: item.options,
              attributes: item.attributes,
              provisionFields: {
                sld: item.sld,
              },
            } as ProductModel;
          },
          basketItemMapper: (item: BasketProduct) => ({
            productId: item.productId,
            "provisionFields.sld": item.provisionFields?.sld,
          }),
        };
      }),

      setBasketProducts: assign({
        basketProducts: (_context: DomainContext, { data }: AnyEventObject) =>
          data,
        lookups: ({ lookups }: DomainContext, { data }: AnyEventObject) => {
          const available = map(data, item => {
            item.value = item.domain;
            return item;
          });

          lookups ??= {
            searched: [],
            history: [],
            owned: [],
            basket: [],
          };

          set(lookups, "basket", available);
          return lookups;
        },
      }),

      syncBasket: sendTo(
        ({ basketHelper }: DomainContext, _event) => basketHelper,
        (context: DomainContext, _event) => {
          // not all values might be products, eg an exiting domain value,
          // so we need to filter out any non product values
          // and then map them to a be a basket item model
          const products = reduce(
            context.model?.filter(
              (item): item is DomainProduct => "productId" in item
            ),
            (result: any[], item: DomainProduct) => {
              if (item?.productId) {
                const model = isFunction(context?.basketItemBuilder)
                  ? context.basketItemBuilder(item)
                  : undefined;
                if (model) result.push(model);
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

      loadBasketProducts: sendTo(
        ({ basketHelper }: DomainContext, _event) => basketHelper,
        (context, _event) => ({
          type: "LOAD",
          context,
        })
      ),

      // ---

      synced: assign({
        type: (_context, _event) => DomainTypes.basket,
      }),

      // ---

      add: assign({
        model: (
          { model, lookups, type }: DomainContext,
          { data }: AnyEventObject
        ) => {
          let available: any[] = [];
          switch (type) {
            case DomainTypes.register:
              available = lookups?.searched || [];
              break;
            case DomainTypes.transfer:
              available = lookups?.searched || [];
              break;
            // case DomainTypes.existing/owned:
            //   available = lookups?.owned;
            //   break;
            case DomainTypes.basket:
              available = lookups?.basket || [];
              break;
          }
          const domain = parseValue(data, model, available);
          model ??= [];
          if (domain) model.push(domain);
          return model;
        },
      }),

      setExisting: assign({
        model: (_context: DomainContext, { data }: AnyEventObject) => {
          const value = isArray(data) ? first(data) : data;
          const parsed = parseDomain(value, true);
          const domain: Domain = {
            domain: parsed?.domain || "",
            tld: parsed?.tld || "",
            sld: parsed?.sld || "",
            isPrimary: true,
            type: DomainTypes.existing,
          };

          return [domain];
        },
      }),

      remove: assign({
        model: ({ model }: DomainContext, { data }: AnyEventObject) =>
          reject(model, ["domain", data]),
      }),

      // ---

      setModel: assign({
        model: ({ model, lookups, type }: any, { data }: AnyEventObject) =>
          reduce(
            data,
            (result: Domain[], item) => {
              let available = [];
              switch (type) {
                case DomainTypes.register:
                  available = lookups?.searched;
                  break;
                case DomainTypes.transfer:
                  available = lookups?.searched;
                  break;
                case DomainTypes.existing:
                  available = lookups?.owned;
                  break;
                case DomainTypes.basket:
                  available = lookups?.basket;
                  break;
              }

              const domain: Domain = parseValue(item, model, available);

              if (domain) result.push(domain);

              return result;
            },
            []
          ),
      }),

      resetModel: assign({
        model: ({ baseModel }, _event) => cloneDeep(baseModel),
      }),

      clearModel: assign({
        model: [],
      }),

      cancelController: assign({
        controller: ({ controller }: DomainContext) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return undefined;
        },
      }),

      newController: assign({
        controller: () => {
          return new AbortController();
        },
      }),

      setSearchQuery: assign({
        search: ({ search }: DomainContext, { data }: AnyEventObject) => {
          return {
            query: data ?? "",
            offset: 0,
            limit: search?.limit ?? 10,
            total: 0,
          };
        },
      }),

      setSearchOffset: assign({
        search: ({ search }: any, _event) => {
          search.offset += search?.limit;
          return search;
        },
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
            item.value = item.domain;
            item.isOwned = some(lookups.owned, ["domain", item.domain]);
            item.inBasket = some(lookups.basket, ["domain", item.domain]);
            item.disabled = item.isOwned || item.inBasket;
            return item;
          });

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
        search: ({ search }: DomainContext, { data }: AnyEventObject) => {
          return {
            query: search?.query ?? "",
            offset: search?.offset ?? 0,
            limit: search?.limit ?? 10,
            total: data?.total || 0,
          };
        },
        controller: undefined,
      }),

      setOwned: assign({
        lookups: ({ lookups }: any, { data }: any) => {
          const available = map(data, item => {
            item.value = item.domain;
            item.persist = true;
            return item;
          });
          set(lookups, "owned", available);
          return lookups;
        },
      }),

      clearLookups: assign({
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

      setPrimary: assign({
        model: ({ model }: DomainContext, { data }: any) => {
          const primary = find(model, ["domain", data]);
          return map(model, value => {
            value.isPrimary = value === primary;
            return value;
          });
        },
      }),

      // ---
      setSuccess: (_context, _event) => {
        // addSuccess("Successfully set Domain");
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          // addError({
          //   title: data?.title || "We experienced an error getting domains",
          //   copy: data?.message,
          //   data: data?.data,
          // });

          return data;
        },
      }),

      clearError: assign({ error: null }),
    },

    guards: {
      // hasData: (_context, { data }:AnyEventObject) => isObject(data) && !isEmpty(data),

      isInvalidType: ({ choices }: DomainContext, { data }: AnyEventObject) => {
        return isEmpty(choices) || !has(DomainTypes, data);
      },

      isValidDomain: (_context, { data }: AnyEventObject) =>
        !isEmpty(parseDomain(data)),

      hasSearchQuery: ({ search }: DomainContext, _event) => {
        const sld = parseSld(search?.query ?? "");
        return sld?.length > 2;
      },
      validSearchQuery: (_context, { data }: AnyEventObject) => {
        const sld = parseSld(data);
        return sld?.length >= 2;
      },
      validSearchOffset: ({ search }: DomainContext, _event) => {
        const offset = (search?.offset ?? 0) + (search?.limit ?? 0);
        return offset < (search?.total || 0);
      },

      isValid: ({ model }: DomainContext) => {
        return !isEmpty(model) && every(model, parseDomain);
      },

      isInvalid: ({ model }: DomainContext) => {
        return isEmpty(model) || !every(model, parseDomain);
      },

      isNotCancelled: (_context, { data }: AnyEventObject) =>
        data?.name !== "AbortError",

      // ---
      isDomainTransfer: (
        { choices }: DomainContext,
        { data }: AnyEventObject
      ) => !isEmpty(choices) && data === DomainTypes.transfer,

      isExistingDomain: (
        { choices }: DomainContext,
        { data }: AnyEventObject
      ) => !isEmpty(choices) && data === DomainTypes.existing,

      isDomainRegister: (
        { choices }: DomainContext,
        { data }: AnyEventObject
      ) => !isEmpty(choices) && data === DomainTypes.register,

      isBasket: ({ choices }: DomainContext, { data }: AnyEventObject) =>
        !isEmpty(choices) && data === DomainTypes.basket,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
