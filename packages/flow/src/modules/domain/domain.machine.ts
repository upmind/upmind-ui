// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";

// --- utils
import { useTime } from "../../utils";
import { isEmpty, reject, find, some, has } from "lodash-es";

// --- types
import { DomainTypes } from "./types.d";
import type { DomainContext, AddEvent, RemoveEvent } from "./types.d";
import { parseDomain } from "./utils";

// --------------------------------------------------------

export default (
  forceType?: DomainTypes | null,
  currency: string = "",
  promotions: string[] = []
) => {
  // safetycheck to ensure forcedType is valid
  forceType = has(DomainTypes, forceType) ? forceType : null;
  return createMachine(
    {
      /** @xstate-layout N4IgpgJg5mDOIC5QCcwEcCucAusCyAhgHYEzIDEAggCLUDaADALqKgAOA9rAJbbcdFWIAB6IA7GIB0AZjEAWaXIBM0hmICcS9XICsAGhABPRAEYlAX3MHUmHPmKkwySQQDGfAG5hyAYUoA5HwBRABlGFiQQTh4+ASFRBAA2HUl1aR0dXQkdeTlE9QNjBDl1E0lEk3UxRIYGHRNExWlLa3QsWFxCEjIXd24vcgAlIIAVQYBNcKFo3n5BSITk1PTMnLEcuTyCo0RpdUSZXQYlOuTEgA5pRRaQG3bOhx63T29hvAB5ADUgqciZ2PmoEWKQyeXOYhM6yuDEhhV2MMkamO5xMaiq0iUcksVhARA4EDgQjudi6jmQ0y4sziC0QAFoTHCENpJEp5GI9nJzjp1DoGGkbsSOvZuk5JNwIAAbMAUmJzeKIc5ySRmHSJZRaMRqNViRmYpSSHTnJEZaSQk6GgVtEmPUXPfrSv6UgHyhDVSTnc41HJqpSJE4oxncsrnbQlHmyQ31S22IWknquDgAWzYUuwDvYTrlNOKOp2CBMKINVWSnIYeSUmKx2KAA */
      tsTypes: {} as import("./domain.machine.typegen").Typegen0,
      id: "domainManager",
      predictableActionArguments: true,
      initial: forceType ? `active` : "idle",
      context: {
        choices: !forceType ? DomainTypes : null,
        type: forceType,
        values: [],
        available: [],
        total: 0,
        // ---
        search: null,
        currency,
        promotions,
        limit: 10,
        offset: 0,
        controller: null,
        tlds: [".com", ".net", ".org"], // limit the search to these tlds,
        // ---
        error: null
      } as DomainContext,
      states: {
        // our initial state depends on if the machine has any domains
        // If we have context > domains, we can skip to selected
        // otherwise we will await a domain
        // individual domain events are defined to allow for more granular control
        idle: {
          id: "idle"
        },

        // we have available and/or selected domains
        active: {
          initial: "loading",
          states: {
            loading: {
              always: [
                {
                  target: forceType,
                  cond: "isForced"
                }
              ]
            },
            register: {
              id: "register",
              initial: "idle",
              states: {
                idle: {},
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
                available: {},
                error: {}
              },
              on: {
                SEARCH: {
                  target: ".processing",
                  actions: ["setSearch"],
                  cond: "isValidSearch"
                }
              }
            },
            transfer: {
              id: "transfer",
              initial: "idle",
              states: {
                idle: {},
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
                available: {},
                error: {}
              },
              on: {
                SEARCH: {
                  target: ".processing",
                  actions: ["setSearch"],
                  cond: "isValidSearch"
                }
              }
            },
            existing: {
              id: "existing",
              initial: "idle",
              states: {
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
                available: {},
                error: {}
              },
              on: {
                ADD: [
                  {
                    target: ".processing",
                    actions: ["addExisting"],
                    cond: "isValidDomain"
                  },
                  {
                    target: ".error",
                    meta: {
                      message: "Invalid domain name"
                    }
                  }
                ]
              }
            }
          },
          on: {
            ADD: {
              actions: ["add"],
              cond: "hasAvailable"
            },
            REMOVE: {
              actions: ["remove"],
              cond: "hasValues"
            }
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
            target: "active",
            cond: "isForced"
          },
          {
            target: "active.register",
            actions: ["setType"],
            cond: "isDomainRegister"
          },
          {
            target: "active.transfer",
            actions: ["setType"],
            cond: "isDomainTransfer"
          },
          {
            target: "active.existing",
            actions: ["setType"],
            cond: "isExistingDomain"
          }
        ],

        STOP: {
          target: "complete"
        }
      }
    },
    {
      actions: {
        setType: assign({
          type: (_context, { data }) => data
        }),

        add: assign({
          values: (
            { values, available }: DomainContext,
            { data }: AddEvent
          ) => {
            // check if we already have the domain
            let domain = find(values, ["domain", data]);

            // if we dont then add it to our list of values, if it exists in available
            if (!domain) {
              domain = find(available, ["domain", data]);

              if (domain) values.push(domain);
            }

            // check in case...
            if (domain) domain.is_primary = !values.length;

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
          total: 0,
          available: []
        }),

        remove: assign({
          values: ({ values }: DomainContext, { data }: RemoveEvent) =>
            reject(values, ["domain", data])
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

        setError: assign({
          error: (_context, { data }) => data
        }),

        escalateError: escalate(({ error }) => error),

        clearError: assign({ error: null })
      },

      guards: {
        isForced: () => !!forceType,

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

        isNotCancelled: (_context, { data }) => data?.name !== "AbortError",

        isDomainTransfer: (_context, { data }: { data: string }) =>
          data === "transfer",

        isExistingDomain: (_context, { data }: { data: string }) =>
          data === "existing",

        isDomainRegister: (_context, { data }: { data: string }) =>
          data === "register"
      },

      delays: {
        error: () => useTime().SECOND * 3, // this allows us to read the error before continuing
        wait: () => useTime().MILLISECOND * 300 // this allows us to wait for a imperceptible amount of time before continuing
      },

      services
    }
  );
};
