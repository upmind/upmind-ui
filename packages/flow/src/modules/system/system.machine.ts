// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { SystemContext, SystemEvent } from "./types.d";

// --- utils
import { useTime } from "../../utils";
import { set, unset } from "lodash-es";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./system.machine.typegen").Typegen0,
    id: "systemManager",
    predictableActionArguments: true,
    initial: "processing",
    context: {
      currencies: null,
      billingCycles: null,
      // ---
      error: {}
    } as SystemContext,

    type: "parallel",
    states: {
      currencies: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchCurrencies",
              onDone: {
                target: "complete",
                actions: ["setCurrencies"]
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ error }: SystemContext, { data }: SystemEvent) => {
                    set(error, "currencies", data || "Unknown error");
                    return error;
                  }
                })
              }
            }
          },
          complete: {},
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "currencies");
                    return error;
                  }
                })
              }
            }
          }
        }

        // Currencies
        // /currencies?limit=0&lang=en
      },
      billingCycles: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchBillingCycles",
              onDone: {
                target: "complete",
                actions: ["setBillingCycles"]
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ error }: SystemContext, { data }: SystemEvent) => {
                    set(error, "billingCycles", data || "Unknown error");
                    return error;
                  }
                })
              }
            }
          },
          complete: {},
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "billingCycles");
                    return error;
                  }
                })
              }
            }
          }
        }
      }
    }
  },
  {
    actions: {
      setCurrencies: assign({
        currencies: (_context: SystemContext, { data }: SystemEvent) => data
      }),
      setBillingCycles: assign({
        billingCycles: (_context: SystemContext, { data }: SystemEvent) => data
      })
      // ---
    },
    guards: {},
    delays: {
      wait: () => useTime().MILLISECOND * 100 // this allows us to wait for a imperceptible amount of time before continuing
    },
    services
  }
);
