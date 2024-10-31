// --- external
import { createMachine, assign, spawn, actions, pure } from "xstate";
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
} from "lodash-es";

// --- types
import { DomainTypes } from "./types";
import type {
  DomainContext,
  AddEvent,
  RemoveEvent,
  DomainEvents,
} from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./domain.machine.typegen").Typegen0,
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
                entry: ["fetchBasket"],
                on: {
                  FETCHED: {
                    target: "complete",
                    actions: ["setBasketItems"],
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
                cond: "hasNoModel",
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
            always: [{ target: "valid", cond: "hasModel" }],
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
            cond: "hasModel",
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
            actions: ["setCurrency", "setPromotions"],
          },
          RESET: {
            target: ".invalid",
            actions: ["resetModel", "resetLookups", "clearSearch"],
          },
        },
      },

      existing: {
        id: "existing",
        initial: "invalid",
        states: {
          valid: {
            always: [
              {
                target: "invalid",
                cond: "hasNoModel",
                actions: assign({
                  error: "Invalid domain",
                }),
              },
            ],
          },
          invalid: {
            always: {
              target: "valid",
              cond: "hasModel",
            },
          },
          error: {},
        },
        on: {
          ADD: [
            {
              target: ".valid",
              actions: ["clearError", "add", "ensurePrimary"],
              cond: "isValidDomain",
            },
            { target: ".valid" },
          ],
          REMOVE: {
            target: ".invalid",
            actions: ["clearError", "remove", "ensurePrimary"],
            cond: "hasModel",
          },
          UPDATE: {
            target: ".valid",
            actions: ["clearError", "clearModel", "setModel", "ensurePrimary"],
          },
        },
        exit: ["clearModel"],
      },

      basket: {
        id: "basket",
        initial: "loading",
        states: {
          loading: {
            entry: ["fetchBasket"],
            on: {
              FETCHED: {
                target: "invalid",
                actions: [
                  "setBasketItems",
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
              cond: "hasNoModel",
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
              cond: "hasModel",
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
              cond: "hasModel",
            },
          ],
        },
        exit: ["clearModel"],
      },

      // ---
      complete: {
        type: "final",
      },
    },
    on: {
      REFRESH: {
        actions: ["setCurrency", "setPromotions"],
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
      setContext: assign((context, _event) =>
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
          itemMapper: undefined,
          basketItemBuilder: undefined,
          basketItemMapper: undefined,
        })
      ),

      persistModel: assign({
        baseModel: ({ model }) => model,
      }),

      checkModel: assign({
        model: ({ model }: any) => map(compact(model), parseDomain),
      }),

      ensurePrimary: assign({
        model: ({ model }) => {
          if (!!model?.length && !some(model, "is_primary")) {
            // @ts-ignore
            first(model).is_primary = true;
          }
          return model;
        },
      }),

      checkChoices: assign({
        choices: ({ basketItems }: any) => {
          if (!basketItems?.length)
            return omit(DomainTypes, DomainTypes.basket);

          return DomainTypes;
        },
        type: ({ type, basketItems, model }) => {
          const selected = find(model, "is_primary") || first(model);
          const domain = get(selected, "domain");

          if (domain) {
            const inBasket = some(basketItems, ["domain", domain]);
            if (inBasket) return DomainTypes.basket;

            return DomainTypes.existing;
          }

          return type;
        },
      }),

      setType: assign({
        type: (_context, { data }) => data,
        error: null,
      }),

      setCurrency: assign({
        currency: (_context, { data }: any) => {
          return data?.currency;
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
          itemBuilder: function (item: any) {
            return parseBasketItem(item);
          },
          itemMapper: (item: any) => ({
            product_id: item.product_id,
            sld: item?.sld || item?.provision_fields?.sld,
          }),
          basketItemBuilder: (item: any) => {
            if (!item?.product_id) return null;
            return {
              product_id: item.product_id,
              quantity: 1,
              term: {
                billing_cycle_months: item.billing_cycle_months,
              },
              options: item.options,
              attributes: item.attributes,
              provision_fields: {
                sld: item.sld,
              },
            };
          },
          basketItemMapper: (item: any) => ({
            product_id: item.product_id,
            "provision_fields.sld": item?.sld || item?.provision_fields?.sld,
          }),
        };
      }),

      setBasketItems: assign({
        basketItems: (_context: any, { data }: any) => data,
        lookups: ({ lookups }, { data }) => {
          const available = map(data, item => {
            item.value = item.domain;
            return item;
          });

          set(lookups, "basket", available);
          return lookups;
        },
      }),

      syncBasket: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, _event) => {
          // not all values might be products, eg an exiting domain value,
          // so we need to filter out any non product values
          const safeProducts = filter(
            context.model,
            item => !!item?.product_id
          );
          return {
            type: "SYNC",
            target: safeProducts,
            context,
          };
        }
      ),

      fetchBasket: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, _event) => ({
          type: "FETCH",
          context,
        })
      ),

      // ---

      synced: assign({
        type: (_context, _event) => DomainTypes.basket,
      }),

      // ---

      add: assign({
        model: ({ model, lookups, type }: any, { data }: AddEvent) => {
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
          const domain = parseValue(data, model, available);
          if (domain) model.push(domain);
          return model;
        },
      }),

      remove: assign({
        model: ({ model }: DomainContext, { data }: RemoveEvent) =>
          reject(model, ["domain", data]),
      }),

      // ---

      setModel: assign({
        model: ({ model, lookups, type }: any, { data }: AddEvent) =>
          reduce(
            data,
            (result, item) => {
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

              const domain: any = parseValue(item, model, available);

              // ensure we persist any prev selected/primary domain
              if (domain) {
                const exists = find(model, ["domain", domain.domain]);
                domain.is_primary = exists?.is_primary;
                // @ts-ignore
                result.push(domain);
              }
              return result;
            },
            []
          ),
      }),

      resetModel: assign({
        model: ({ baseModel }, _event) => {
          return baseModel;
        },
      }),

      clearModel: assign({
        model: [],
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
            item.is_owned = some(lookups.owned, ["domain", item.domain]);
            item.in_basket = some(lookups.basket, ["domain", item.domain]);
            item.disabled = item.is_owned || item.in_basket;
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
        search: ({ search }, { data }) => {
          search.total = data.total;
          return search;
        },
        controller: null,
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

      setPrimary: assign({
        model: ({ model }, { data }) => {
          const primary = find(model, ["domain", data]);
          return map(model, value => {
            value.is_primary = value === primary;
            return value;
          });
        },
      }),

      // ---
      // @ts-ignore
      setSuccess: (_context, _event) => {
        // addSuccess("Successfully set Domain");
      },

      setError: assign({
        error: (_context, { data }) => {
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
      // hasData: (_context, { data }) => isObject(data) && !isEmpty(data),

      isInvalidType: ({ choices }, { data }) => {
        return isEmpty(choices) || !has(DomainTypes, data);
      },

      isValidDomain: (_context, { data }) => !isEmpty(parseDomain(data)),

      hasSearchQuery: ({ search }: any, _event) => {
        const sld = parseSld(search.query);
        // @ts-ignore
        return sld?.length > 2;
      },
      validSearchQuery: (_context, { data }) => {
        const sld = parseSld(data);
        // @ts-ignore
        return sld?.length >= 2;
      },
      validSearchOffset: ({ search }: any, _event) => {
        const offset = search.offset + search.limit;
        return offset < search.total;
      },

      hasModel: ({ model }) => {
        return !isEmpty(model);
      },

      hasNoModel: ({ model }) => {
        return isEmpty(model);
      },

      // @ts-ignore
      hasItems: (_context, { data }: any) => {
        return !!data?.length;
      },

      isNotCancelled: (_context, { data }: any) => data?.name !== "AbortError",

      // ---
      isDomainTransfer: ({ choices }, { data }: { data: string }) =>
        !isEmpty(choices) && data === DomainTypes.transfer,

      isExistingDomain: ({ choices }, { data }: { data: string }) =>
        !isEmpty(choices) && data === DomainTypes.existing,

      isDomainRegister: ({ choices }, { data }: { data: string }) =>
        !isEmpty(choices) && data === DomainTypes.register,

      isBasket: ({ choices }, { data }: { data: string }) =>
        !isEmpty(choices) && data === DomainTypes.basket,
    },

    delays: {
      // @ts-ignore
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
