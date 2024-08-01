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
  concat,
  compact,
  find,
  filter,
  has,
  includes,
  isEmpty,
  map,
  omit,
  reduce,
  reject,
  some,
  unionBy,
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
      values: [],
      available: [],
      history: [],
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
      basketHelper: undefined,
      itemBuilder: undefined,
      itemMapper: undefined,
      basketItemBuilder: undefined,
      basketItemMapper: undefined,

      // ---
    } as DomainContext,

    states: {
      subscribing: {
        always: [
          {
            target: "idle",
            actions: "setBasketHelper",
            cond: "needsBasketHelper",
          },
          {
            target: "idle",
          },
        ],
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
        initial: "idle",
        states: {
          idle: {
            entry: ["cancelController", "clearError"],
            always: [
              { target: "available", cond: "hasAvailable" },
              { target: "processing", cond: "hasValidSearch" },
            ],
          },
          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            id: "processing",
            entry: [
              "clearAvailable",
              "clearError",
              "cancelController",
              "newController",
            ],
            invoke: {
              src: "search",
              onDone: {
                target: "available",
                actions: ["setAvailable"],
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
          available: {
            always: {
              target: "valid",
              cond: "hasValues",
            },
          },
          valid: {
            type: "final",
            always: {
              target: "available",
              cond: "hasNoValues",
            },
            on: {
              SYNC: {
                target: "syncing",
                actions: ["syncBasket"],
              },
            },
          },
          // ---
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
          ADD: [
            {
              target: ".valid",
              actions: ["add"],
              cond: "isValidDomain",
            },
          ],
          REMOVE: {
            target: ".valid",
            actions: ["remove"],
            cond: "hasValues",
          },
          UPDATE: {
            target: ".valid",
            actions: ["setValues"],
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
            target: ".idle",
            actions: ["clearValues", "clearAvailable", "clearSearch"],
          },
        },
      },

      existing: {
        entry: ["clearValues", "clearAvailable"],
        id: "existing",
        initial: "loading",
        states: {
          loading: {
            entry: [
              "cancelController",
              "clearAvailable",
              "clearError",
              "newController",
            ],
            invoke: {
              src: "getClientDomains",
              onDone: {
                target: "#existing.idle",
                actions: ["setAvailable"],
              },
              onError: [
                {
                  target: "#existing.error",
                  actions: ["setError"],
                  cond: "isNotCancelled",
                },
              ],
            },
          },
          idle: {
            always: [{ target: "available", cond: "hasAvailable" }],
          },
          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            id: "processing",
            initial: "cancelling",
            states: {
              cancelling: {
                entry: "cancelController",
                after: { wait: "#existing.available" },
              },
            },
          },
          available: {
            always: {
              target: "valid",
              cond: "hasValues",
            },
          },
          valid: {
            always: [
              {
                target: "invalid",
                cond: "hasNoValues",
                actions: assign({
                  error: "Invalid domain",
                }),
              },
            ],
          },
          invalid: {},
          error: {},
        },
        on: {
          ADD: [
            {
              target: ".valid",
              actions: ["clearError", "add"],
              cond: "isValidDomain",
            },
            { target: ".valid" },
          ],
          REMOVE: {
            target: ".valid",
            actions: ["clearError", "remove"],
            cond: "hasValues",
          },
          UPDATE: {
            target: ".valid",
            actions: ["clearError", "clearValues", "setValues"],
          },
        },
        exit: ["clearValues", "clearAvailable"],
      },

      basket: {
        id: "basket",
        initial: "loading",
        states: {
          loading: {
            always: [
              {
                target: "#idle",
                cond: "hasNoValues",
              },

              {
                target: "valid",
              },
            ],
          },
          updating: {
            after: {
              wait: "loading",
            },
          },
          valid: {
            type: "final",
            always: {
              target: "#idle",
              cond: "hasNoValues",
            },
          },
        },
        on: {
          SELECT: [
            {
              target: ".updating",
              actions: ["setPrimary"],
              cond: "hasValues",
            },
          ],
        },
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
      checkChoices: assign({
        choices: ({ choices, sync }) => {
          if (!sync) {
            return omit(choices, DomainTypes.basket);
          }
          return choices;
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
            return {
              product_id: item.product_id,
              options: item.options,
              quantity: item.quantity,
              tld: item?.name,
              sld: item?.provision_fields?.sld,
              term: {
                billing_cycle_months:
                  item?.billing_cycle_months ||
                  item?.term?.billing_cycle_months ||
                  item?.term,
              },
            };
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

      syncBasket: sendTo(
        ({ basketHelper }, _event) => basketHelper,
        (context, _event) => ({
          type: "SYNC",
          data: context,
          target: "values",
        })
      ),

      // addToBasket: sendTo(
      //   ({ basketHelper }, _event) => basketHelper,
      //   (context, _event) => ({
      //     type: "ADD",
      //     data: context,
      //     target: "values",
      //   })
      // ),
      // removeFromBasket: sendTo(
      //   ({ basketHelper }, _event) => basketHelper,
      //   (context, _event) => ({
      //     type: "REMOVE",
      //     data: context,
      //     target: "values",
      //   })
      // ),

      // updateBasket: sendTo(
      //   ({ basketHelper }, _event) => basketHelper,
      //   (context, _event) => ({
      //     type: "UPDATE",
      //     data: context,
      //     target: "values",
      //   })
      // ),

      // ---

      synced: assign({
        values: ({ values }, { data }) => {
          // merge the values and data, preserving any existing properties in values
          const domains = unionBy(
            map(data, item => {
              let domain = parseBasketItem(item);
              // merge any existing values with the new data
              const exists = find(values, ["domain", domain.domain]);
              if (exists) {
                domain = Object.assign({}, exists, domain);
              }
              return domain;
            }),
            values, // this will include any values NOT in data
            "domain"
          );

          return domains;
        },
        sync: false,
        choices: ({ choices }, { data }) => {
          if (!data?.length) return omit(choices, DomainTypes.basket);
          return choices;
        },
        // type: ({ type }, { data }) => (type || data.length ? "basket" : null)
      }),

      // ---

      add: assign({
        values: ({ values, available }: DomainContext, { data }: AddEvent) => {
          const domain = parseValue(data, values, available);
          // check in case...
          // ensure we have at least one primary domain
          if (domain) {
            domain.is_primary = !some(values, "is_primary");
            values.push(domain);
          }

          return values;
        },
      }),

      remove: assign({
        values: ({ values }: DomainContext, { data }: RemoveEvent) => {
          const newValues = reject(values, ["domain", data]);
          if (newValues?.length && !some(newValues, "is_primary")) {
            newValues[0].is_primary = true;
          }
          return newValues;
        },
      }),

      // ---

      setValues: assign({
        values: ({ values, available }: DomainContext, { data }: AddEvent) => {
          // check if we already have the domain
          return reduce(
            data,
            (result, item) => {
              const domain = parseValue(item, values, available);

              // ensure we have at least one primary domain
              if (domain) {
                domain.is_primary = !some(values, "is_primary");
                result.push(domain);
              }
              return result;
            },
            []
          );
        },
      }),
      clearValues: assign({
        values: (_context, _event) => {
          return [];
        },
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
        history: [],
      }),

      setAvailable: assign({
        available: ({ history, values }, { data }) => {
          const persisted = filter(history, ({ domain }) =>
            some(values, ["domain", domain])
          );
          return uniqBy(compact(concat(persisted, data.available)), "domain");
        },
        history: ({ history }, { data }) =>
          uniqBy(compact(concat(history, data.available)), "domain"),

        total: (_context, { data }) => data.total,

        controller: null,
      }),

      clearAvailable: assign({
        available: (_context, _event) => {
          return [];
        },
      }),

      setPrimary: assign({
        values: ({ values }, { data }) => {
          const primary = find(values, ["domain", data]);
          return map(values, value => {
            value.is_primary = value === primary;
            return value;
          });
        },
      }),

      import: assign({
        values: ({ values }, { data }) => {
          const domain = parseDomain(data);
          values.push(domain);

          return map(values, value => {
            value.is_primary = value === domain;
            return value;
          });
        },
        type: () => DomainTypes.existing,
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
      needsBasketHelper: ({ sync, basketHelper }) => sync && !basketHelper,

      // hasData: (_context, { data }) => isObject(data) && !isEmpty(data),

      isInvalidType: ({ choices }, { data }) => {
        return isEmpty(choices) || !has(DomainTypes, data);
      },

      isValidDomain: (_context, { data }) => {
        return !isEmpty(parseDomain(data));
      },

      hasValidSearch: ({ search }, _event) => {
        const sld = parseSld(search);
        return sld?.length > 2;
      },
      isValidSearch: (_context, { data }) => {
        const sld = parseSld(data?.domain || data);
        return sld?.length > 2;
      },

      hasAvailable: ({ available }) => {
        return !isEmpty(available);
      },

      hasValues: ({ values }) => {
        return !isEmpty(values);
      },

      hasNoValues: ({ values }) => {
        return isEmpty(values);
      },

      isNotCancelled: (_context, { data }) => data?.name !== "AbortError",

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
