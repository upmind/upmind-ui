// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();
// --- utils
import { useTime } from "../../utils";
import {
  find,
  has,
  isEmpty,
  map,
  omit,
  reduce,
  reject,
  some,
  unionBy,
  uniqBy,
} from "lodash-es";

// ---utils
import { parseDomain, parseValue, parseBasketItem, parseSld } from "./utils";
import { isArray } from "lodash-es";

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
    initial: "idle",
    context: {
      choices: DomainTypes,
      type: null,
      sync: null,
      values: [],
      available: [],
      total: 0,
      // ---
      search: null,
      currency: null,
      promotions: [],
      limit: 10,
      offset: 0,
      controller: null,
      // ---
      error: null,
    } as DomainContext,
    states: {
      // our initial state depends on if the machine has been forced to a type,
      // if we do then go to that types state, otherwise stay idle
      idle: {
        entry: ["checkChoices"],
        id: "idle",
        always: [
          {
            target: "register",
            cond: ({ type }) => type === "register",
          },
          {
            target: "transfer",
            cond: ({ type }) => type === "transfer",
          },

          {
            target: "existing",
            cond: ({ type }) => type === "existing",
          },
          {
            target: "basket",
            cond: ({ type }) => type === "basket",
          },
        ],
      },

      register: {
        id: "register",
        initial: "idle",
        states: {
          idle: {
            entry: ["cancelController", "clearError"],
          },
          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            id: "processing",
            initial: "cancelling",
            states: {
              cancelling: {
                entry: "cancelController",
                after: { wait: "searching" },
              },
              searching: {
                entry: ["clearAvailable", "clearError", "newController"],
                invoke: {
                  src: "search",
                  onDone: {
                    target: "#register.available",
                    actions: ["setAvailable"],
                  },
                  onError: [
                    {
                      target: "#register.error",
                      actions: ["setError"],
                      cond: "isNotCancelled",
                    },
                    {
                      actions: ["setError"],
                    },
                  ],
                },
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
            type: "final",
            always: {
              target: "available",
              cond: "hasNoValues",
            },
          },
          error: {},
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
        },
      },

      transfer: {
        id: "transfer",
        initial: "idle",
        states: {
          idle: {
            entry: ["cancelController", "clearError"],
          },
          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            id: "processing",
            initial: "cancelling",
            states: {
              cancelling: {
                entry: "cancelController",
                after: { wait: "searching" },
              },
              searching: {
                entry: ["clearAvailable", "clearError", "newController"],
                invoke: {
                  src: "search",
                  onDone: {
                    target: "#transfer.available",
                    actions: ["setAvailable"],
                  },
                  onError: [
                    {
                      target: "#transfer.error",
                      actions: ["setError"],
                      cond: "isNotCancelled",
                    },
                  ],
                },
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
            type: "final",
            always: {
              target: "available",
              cond: "hasNoValues",
            },
          },
          error: {},
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
          SEARCH: {
            target: ".processing",
            actions: ["setSearch"],
            cond: "isValidSearch",
          },
          REFRESH: {
            target: ".processing",
            actions: ["setCurrency", "setPromotions"],
          },
        },
      },

      existing: {
        entry: ["clearValues"],
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
          idle: {},
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
            type: "final",
            always: {
              target: "idle",
              cond: "hasNoValues",
            },
          },
          error: {},
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
            target: "#existing.valid",
            actions: ["remove"],
            cond: "hasValues",
          },
          UPDATE: {
            target: ".valid",
            actions: ["clearValues", "setValues"],
          },
          REFRESH: {
            target: ".loading",
            actions: ["setCurrency", "setPromotions"],
          },
        },
        exit: ["clearValues"],
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
          REFRESH: {
            target: ".valid",
            actions: ["setCurrency", "setPromotions"],
          },
        },
      },

      error: {
        id: "error",
        after: { error: "idle" },
      },

      complete: {
        type: "final",
      },
    },
    on: {
      CHOOSE: [
        {
          target: "error",
          cond: "isInvalidType",
        },
        {
          // do nothing
          cond: "isForced",
        },
        {
          target: "register",
          actions: ["setType"],
          cond: "isDomainRegister",
        },
        {
          target: "transfer",
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
            return omit(choices, "basket");
          }
          return choices;
        },
      }),

      setType: assign({
        type: (_context, { data }) => data,
      }),

      setCurrency: assign({
        currency: (_context, { data }) => data?.currency,
      }),

      setPromotions: assign({
        promotions: (_context, { data }) => data?.promotions,
      }),
      // ---
      sync: assign({
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
          if (!data?.length) return omit(choices, "basket");
          return choices;
        },
        // type: ({ type }, { data }) => (type || data.length ? "basket" : null)
      }),

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

      setAvailable: assign({
        available: (_context, { data }) => data.available,
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
        type: () => "existing",
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
      isForced: ({ choices }) => isEmpty(choices),

      // hasData: (_context, { data }) => isObject(data) && !isEmpty(data),

      isInvalidType: (_context, { data }) => {
        return !has(DomainTypes, data);
      },

      isValidDomain: (_context, { data }) => {
        return !isEmpty(parseDomain(data));
      },

      isValidSearch: (_context, { data }) => {
        const sld = parseSld(data?.domain || data);
        return sld?.length > 2;
      },

      hasValues: ({ values }) => {
        return !isEmpty(values);
      },

      hasNoValues: ({ values }) => {
        return isEmpty(values);
      },

      isNotCancelled: (_context, { data }) => data?.name !== "AbortError",

      isDomainTransfer: (_context, { data }: { data: string }) =>
        data === "transfer",

      isExistingDomain: (_context, { data }: { data: string }) =>
        data === "existing",

      isExistingPrimaryDomain: ({ sync, values }) => {
        const primary = some(
          values,
          item => item.is_primary && !item.product_id
        );
        return !sync && primary;
      },

      isDomainRegister: (_context, { data }: { data: string }) =>
        data === "register",

      isBasket: (_context, { data }: { data: string }) => data === "basket",
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
