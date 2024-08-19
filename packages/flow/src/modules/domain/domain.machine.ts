// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
import { syncSubscription } from "../basket/helper";

const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime } from "../../utils";
import { parseDomain, parseValue, parseBasketItem, parseSld } from "./utils";
import {
  compact,
  concat,
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
import { DomainTypes } from "./types.d";
import type { DomainContext, AddEvent, RemoveEvent } from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./domain.machine.typegen").Typegen0,
    id: "domainManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      choices: DomainTypes,
      type: undefined,
      sync: undefined,
      model: [],
      lookups: {
        searched: [],
        history: [],
        owned: [],
        basket: [],
      },
      total: 0,
      // ---
      currency: undefined,
      promotions: [],
      // ---
      search: undefined,
      limit: 10,
      offset: 0,
      controller: undefined,
      // ---
      error: undefined,
      // ---
      basketHelper: undefined,
      itemBuilder: undefined,
      itemMapper: undefined,
      basketItemBuilder: undefined,
      basketItemMapper: undefined,

      // ---
    } as DomainContext,

    entry: ["checkModel", "ensurePrimary", "persistModel", "clearLookups"],
    states: {
      subscribing: {
        always: [
          {
            target: "loading",
            actions: "setBasketHelper",
            cond: "needsBasketHelper",
          },
          {
            target: "idle",
          },
        ],
      },

      loading: {
        entry: ["fetchBasket"],
        on: {
          FETCHED: {
            target: "idle",
            actions: ["setBasketItems"],
          },
          ERROR: {
            target: "idle",
          },
        },

        // invoke: {
        //   src: "load",
        //   onDone: {
        //     target: "idle",
        //     actions: ["setModel"],
        //   },
        //   onError: {
        //     target: "idle",
        //   },
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
              { target: "processing", cond: "hasValidSearch" },
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
                actions: ["setSearched"],
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
              SYNCED: [{ target: "loading", actions: ["synced"] }],
              ERROR: {
                target: "error",
                actions: ["setError"],
              },
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
              target: ".processing",
              actions: ["setSearch"],
              cond: "isValidSearch",
            },
            {
              actions: ["setSearch"],
            },
          ],
          REFRESH: {
            target: ".processing",
            actions: ["setCurrency", "setPromotions"],
          },
          RESET: {
            target: ".invalid",
            actions: ["resetModel", "clearLookups", "clearSearch"],
          },
        },
      },

      existing: {
        id: "existing",
        initial: "loading",
        states: {
          loading: {
            entry: ["cancelController", "clearError", "newController"],
            invoke: {
              src: "getClientDomains",
              onDone: {
                target: "invalid",
                actions: ["setOwned"],
              },
              onError: [
                {
                  target: "error",
                  actions: ["setError"],
                  cond: "isNotCancelled",
                },
              ],
            },
          },

          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            entry: "cancelController",
            after: { wait: "invalid" },
          },

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
            target: ".valid",
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
                  "setBasket",
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
                target: "error",
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
    },
  },
  {
    actions: {
      persistModel: assign({
        baseModel: ({ model }) => model,
      }),

      checkModel: assign({
        model: ({ model }) => map(compact(model), parseDomain),
      }),

      ensurePrimary: assign({
        model: ({ model }) => {
          if (!!model?.length && !some(model, "is_primary")) {
            first(model).is_primary = true;
          }
          return model;
        },
      }),

      checkChoices: assign({
        choices: ({ basketItems }) => {
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
      }),

      setCurrency: assign({
        currency: (_context, { data }) => {
          return data?.currency;
        },
      }),

      setPromotions: assign({
        promotions: (_context, { data }) => {
          return data?.promotions;
        },
      }),
      // ---

      setBasketHelper: assign(context => {
        return {
          basketHelper: spawn(syncSubscription),
          itemBuilder: function (item) {
            return parseBasketItem(item);
          },
          itemMapper: item => ({
            product_id: item.product_id,
            sld: item?.sld || item?.provision_fields?.sld,
          }),
          basketItemBuilder: item => {
            if (!item?.product_id) return null;
            return {
              product_id: item.product_id,
              quantity: 1,
              term: {
                billing_cycle_months: item.billing_cycle_months,
              },
              options: item.options,
              provision_fields: {
                sld: item.sld,
              },
            };
          },
          basketItemMapper: item => ({
            product_id: item.product_id,
            "provision_fields.sld": item?.sld || item?.provision_fields?.sld,
          }),
        };
      }),

      setBasketItems: assign({
        basketItems: (_context, { data }) => data,
      }),

      syncBasket: sendTo(
        ({ basketHelper }, _event) => basketHelper,
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
        ({ basketHelper }, _event) => basketHelper,
        (context, _event) => ({
          type: "FETCH",
          context,
        })
      ),

      // ---

      synced: assign({
        lookups: ({ lookups }, { data }) => {
          lookups.basket = data;
          return lookups;
        },
        type: ({ type }, { data }) => {
          return data?.length ? DomainTypes.basket : type;
        },
      }),

      // ---

      add: assign({
        model: (
          { model, lookups, type }: DomainContext,
          { data }: AddEvent
        ) => {
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
        model: ({ model, lookups, type }: DomainContext, { data }: AddEvent) =>
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

              const domain = parseValue(item, model, available);

              // ensure we persist any prev selected/primary domain
              if (domain) {
                const exists = find(model, ["domain", domain.domain]);
                domain.is_primary = exists?.is_primary;
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

      setSearch: assign({
        search: (_context, { data }) => data?.domain || "",
        offset: (_context, { data }) => data?.offset || 0,
      }),

      clearSearch: assign({
        search: null,
        offset: 0,
        total: 0,
        lookups: ({ lookups }) => {
          lookups.history = [];
          return lookups;
        },
      }),

      setSearched: assign({
        lookups: ({ lookups, model }, { data }) => {
          const available = map(data?.available, item => {
            item.value = item.domain;
            return item;
          });

          const persisted = filter(lookups.history, ({ domain }) =>
            some(model, ["domain", domain])
          );

          set(
            lookups,
            "searched",
            uniqBy(compact(concat(persisted, available)), "domain")
          );

          // store all previous searches
          set(
            lookups,
            "history",
            uniqBy(compact(concat(lookups.history, available)), "domain")
          );

          return lookups;
        },
        total: (_context, { data }) => data.total,
        controller: null,
      }),

      setOwned: assign({
        lookups: ({ lookups }, { data }) => {
          const available = map(data?.available, item => {
            item.value = item.domain;
            item.persist = true;
            return item;
          });
          set(lookups, "owned", available);
          return lookups;
        },
      }),

      setBasket: assign({
        lookups: ({ lookups }, { data }) => {
          const available = map(data, item => {
            item.value = item.domain;
            return item;
          });

          set(lookups, "basket", available);
          return lookups;
        },
      }),

      clearLookups: assign({
        lookups: (_context, _event) => {
          return {
            searched: [],
            history: [],
            owned: [],
            basket: [],
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
      needsBasketHelper: ({ sync, basketHelper }) =>
        Boolean(sync && !basketHelper),

      // hasData: (_context, { data }) => isObject(data) && !isEmpty(data),

      isInvalidType: ({ choices }, { data }) => {
        return isEmpty(choices) || !has(DomainTypes, data);
      },

      isValidDomain: (_context, { data }) => !isEmpty(parseDomain(data)),

      hasValidSearch: ({ search }, _event) => {
        const sld = parseSld(search);
        return sld?.length > 2;
      },
      isValidSearch: (_context, { data }) => {
        const sld = parseSld(data?.domain || data);
        return sld?.length >= 2;
      },

      hasModel: ({ model }) => {
        return !isEmpty(model);
      },

      hasNoModel: ({ model }) => {
        return isEmpty(model);
      },

      hasItems: (_context, { data }) => {
        return !!data?.length;
      },

      isNotCancelled: (_context, { data }) => data?.name !== "AbortError",

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
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
