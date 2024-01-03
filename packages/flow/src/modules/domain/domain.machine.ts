// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";

// --- utils
import { useTime } from "../../utils";
import {
  isEmpty,
  reject,
  find,
  some,
  has,
  map,
  omit,
  unionBy
} from "lodash-es";

// --- types
import { DomainTypes } from "./types.d";
import type { DomainContext, AddEvent, RemoveEvent } from "./types.d";
import { parseDomain, parseDomainItem } from "./utils";

// --------------------------------------------------------

export default createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
    tsTypes: {} as import("./domain.machine.typegen").Typegen0,
    id: "domainManager",
    predictableActionArguments: true,
    initial: "loading",
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
      error: null
    } as DomainContext,
    states: {
      loading: {
        entry: ["checkChoices"],
        always: [
          {
            target: "#existing.valid",
            actions: assign({ type: () => "existing" }),
            cond: "isExistingPrimaryDomain"
          },
          {
            target: "basket",
            actions: assign({ type: () => "basket" }),
            cond: ({ sync, values }) => !sync && !!values.length
          },
          {
            target: "idle",
            cond: ({ sync }) => !sync
          }
        ],
        on: {
          SYNC: { actions: ["sync"] }
        }
      },

      // our initial state depends on if the machine has been forced to a type,
      // if we do then go to that types state, otherwise stay idle
      idle: {
        id: "idle",
        always: [
          {
            target: "register",
            cond: ({ type, sync }) => !sync && type === "register"
          },
          {
            target: "transfer",
            cond: ({ type, sync }) => !sync && type === "transfer"
          },

          {
            target: "existing",
            cond: ({ type, sync, values }) => !sync && type === "existing"
          },
          {
            target: "basket",
            cond: ({ type, sync }) => !sync && type === "basket"
          }
        ]
      },

      register: {
        id: "register",
        initial: "idle",
        states: {
          idle: {
            entry: ["cancelController", "clearAvailable", "clearError"]
          },
          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            id: "processing",
            initial: "cancelling",
            states: {
              cancelling: {
                entry: "cancelController",
                after: { wait: "searching" }
              },
              searching: {
                entry: ["clearAvailable", "clearError", "newController"],
                invoke: {
                  src: "search",
                  onDone: {
                    target: "#register.available",
                    actions: ["setAvailable"]
                  },
                  onError: [
                    {
                      target: "#register.error",
                      actions: ["setError"],
                      cond: "isNotCancelled"
                    }
                  ]
                }
              }
            }
          },
          available: {
            always: {
              target: "valid",
              cond: "hasValues"
            }
          },
          valid: {
            type: "final",
            always: {
              target: "available",
              cond: "hasNoValues"
            }
          },
          syncing: {},
          error: {}
        },
        on: {
          ADD: {
            target: "#register.valid",
            actions: ["add"],
            cond: "hasAvailable"
          },
          REMOVE: {
            target: "#register.available",
            actions: ["remove"],
            cond: "hasValues"
          },
          SEARCH: {
            target: ".processing",
            actions: ["setSearch"],
            cond: "isValidSearch"
          },
          SYNC: { target: "#register.syncing" },
          REFRESH: { target: "#register.available" }
        }
      },

      transfer: {
        id: "transfer",
        initial: "idle",
        states: {
          idle: {
            entry: ["cancelController", "clearAvailable", "clearError"]
          },
          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            id: "processing",
            initial: "cancelling",
            states: {
              cancelling: {
                entry: "cancelController",
                after: { wait: "searching" }
              },
              searching: {
                entry: ["clearAvailable", "clearError", "newController"],
                invoke: {
                  src: "search",
                  onDone: {
                    target: "#transfer.available",
                    actions: ["setAvailable"]
                  },
                  onError: [
                    {
                      target: "#transfer.error",
                      actions: ["setError"],
                      cond: "isNotCancelled"
                    }
                  ]
                }
              }
            }
          },
          available: {
            always: {
              target: "valid",
              cond: "hasValues"
            }
          },
          valid: {
            type: "final",
            always: {
              target: "available",
              cond: "hasNoValues"
            }
          },
          syncing: {},
          error: {}
        },
        on: {
          ADD: {
            target: "#transfer.valid",
            actions: ["add"],
            cond: "hasAvailable"
          },
          REMOVE: {
            target: "#transfer.available",
            actions: ["remove"],
            cond: "hasValues"
          },
          SEARCH: {
            target: ".processing",
            actions: ["setSearch"],
            cond: "isValidSearch"
          },
          SYNC: { target: "#transfer.syncing" },
          REFRESH: { target: "#transfer.available" }
        }
      },

      existing: {
        id: "existing",
        initial: "loading",
        states: {
          loading: {
            entry: [
              "cancelController",
              "clearAvailable",
              "clearError",
              "newController"
            ],
            invoke: {
              src: "getClientDomains",
              onDone: {
                target: "#existing.idle",
                actions: ["setAvailable"]
              },
              onError: [
                {
                  target: "#existing.error",
                  actions: ["setError"],
                  cond: "isNotCancelled"
                }
              ]
            }
          },
          idle: {},
          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            id: "processing",
            initial: "cancelling",
            states: {
              cancelling: {
                entry: "cancelController",
                after: { wait: "#existing.available" }
              }
            }
          },
          available: {
            always: {
              target: "valid",
              cond: "hasValues"
            }
          },
          valid: {
            type: "final",
            always: {
              target: "available",
              cond: "hasNoValues"
            }
          },
          syncing: {},
          error: {}
        },
        on: {
          ADD: [
            {
              target: "#existing.valid",
              actions: ["addExisting"],
              cond: "isValidDomain"
            },
            {
              target: "#existing.error",
              meta: {
                message: "Invalid domain name"
              }
            }
          ],
          REMOVE: {
            target: "#existing.available",
            actions: ["remove"],
            cond: "hasValues"
          },
          SYNC: { target: "#existing.syncing" },
          REFRESH: { target: "#existing.available" }
        }
      },

      basket: {
        id: "basket",
        initial: "loading",
        states: {
          loading: {
            always: [
              {
                target: "#idle",
                cond: "hasNoValues"
              },

              {
                target: "valid"
              }
            ]
          },
          updating: {
            after: {
              wait: "loading"
            }
          },
          syncing: {},
          valid: {
            type: "final",
            always: {
              target: "#idle",
              cond: "hasNoValues"
            }
          }
        },
        on: {
          SELECT: [
            {
              target: "#basket.updating",
              actions: ["setPrimary"],
              cond: "hasValues"
            }
          ],
          SYNC: { target: "#basket.syncing" },
          REFRESH: { target: "#basket.valid" }
        }
      },

      error: {
        id: "error",
        after: { error: "idle" }
      },

      complete: {
        type: "final"
      }
    },
    on: {
      CHOOSE: [
        {
          target: "error",
          cond: "isInvalidType"
        },
        {
          // do nothing
          cond: "isForced"
        },
        {
          target: "register",
          actions: ["setType"],
          cond: "isDomainRegister"
        },
        {
          target: "transfer",
          actions: ["setType"],
          cond: "isDomainTransfer"
        },
        {
          target: "existing",
          actions: ["setType"],
          cond: "isExistingDomain"
        },
        {
          target: "basket",
          actions: ["setType"],
          cond: "isBasket"
        }
      ],

      STOP: {
        target: "complete"
      }
    }
  },
  {
    actions: {
      checkChoices: assign({
        choices: ({ choices, sync }) => {
          if (!sync) return omit(choices, "basket");
          return choices;
        }
      }),
      setType: assign({
        type: (_context, { data }) => data
      }),

      sync: assign({
        values: ({ values }, { data }) => {
          // merge the values and data, preserving any existing properties in values
          const domains = unionBy(
            map(data, item => {
              let domain = parseDomainItem(item);
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
        }
        // type: ({ type }, { data }) => (type || data.length ? "basket" : null)
      }),

      add: assign({
        values: ({ values, available }: DomainContext, { data }: AddEvent) => {
          // check if we already have the domain
          let domain = find(values, ["domain", data.toLowerCase()]);

          // if we dont then add it to our list of values, if it exists in available
          if (!domain) {
            domain = find(available, ["domain", data.toLowerCase()]);

            if (domain) values.push(domain);
          }

          // check in case...
          if (domain) domain.is_primary = !some(values, "is_primary");

          return values;
        }
      }),

      addExisting: assign({
        values: ({ values }: DomainContext, { data }: AddEvent) => {
          // check if we already have the domain
          let domain = some(values, ["domain", data]);

          // if we dont then add it to our list of values, if it exists in available
          // NB: existing domains will always be 1 value, so we can just replace it
          if (!domain) {
            domain = parseDomain(data);
            domain.is_primary = true;
            values = [domain];
          }

          return values;
        },
        // reset all the search/available vars, as we dont show any available domains
        search: "",
        offset: 0,
        total: 0
      }),

      remove: assign({
        values: ({ values }: DomainContext, { data }: RemoveEvent) => {
          const newValues = reject(values, ["domain", data]);
          if (newValues?.length && !some(newValues, "is_primary")) {
            newValues[0].is_primary = true;
          }
          return newValues;
        }
      }),

      cancelController: assign({
        controller: ({ controller }) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return null;
        }
      }),

      newController: assign({
        controller: () => {
          return new AbortController();
        }
      }),

      setSearch: assign({
        search: (_context, { data }) => data?.domain || "",
        offset: (_context, { data }) => data?.offset || 0
      }),

      setAvailable: assign({
        available: (_context, { data }) => data.available,
        total: (_context, { data }) => data.total,
        controller: null
      }),

      clearAvailable: assign({
        available: (_context, { data }) => {
          return [];
        }
      }),

      setPrimary: assign({
        values: ({ values }, { data }) => {
          const primary = find(values, ["domain", data]);
          return map(values, value => {
            value.is_primary = value === primary;
            return value;
          });
        }
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
        type: () => "existing"
      }),

      setError: assign({
        error: (_context, { data }) => data
      }),

      clearError: assign({ error: null })
    },

    guards: {
      isForced: ({ choices }) => isEmpty(choices),

      // hasData: (_context, { data }) => isObject(data) && !isEmpty(data),

      isInvalidType: (_context, { data }) => {
        return !has(DomainTypes, data);
      },

      isValidDomain: (_context, { data }) => {
        const value = parseDomain(data);
        return !!value?.sld && !!value?.tld;
      },

      isValidSearch: (_context, { data }) => {
        return data?.domain?.length > 2;
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

      isBasket: (_context, { data }: { data: string }) => data === "basket"
    },

    delays: {
      error: () => useTime().SECOND * 3, // this allows us to read the error before continuing
      wait: () => useTime().MILLISECOND * 300 // this allows us to wait for a imperceptible amount of time before continuing
    },

    services
  }
);
