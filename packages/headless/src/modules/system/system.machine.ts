// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { SystemContext } from "./types";

// --- utils
import { useTime } from "../../utils";
import { set, unset, keys, includes, every } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
// ---
export default createMachine(
  {
    //tsTypes: {} as import("./system.machine.typegen").Typegen0,
    id: "systemManager",
    predictableActionArguments: true,
    initial: "processing",
    context: {} as SystemContext,
    type: "parallel",
    states: {
      // --- obligatory: we need these to be loaded before we can do anything else

      currencies: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchCurrencies",
              onDone: {
                target: "processed",
                actions: ["setCurrencies"],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: (
                    { error }: SystemContext,
                    { data }: AnyEventObject
                  ) => {
                    set(error, "currencies", data);
                    return error;
                  },
                }),
              },
            },
          },
          processed: {
            after: {
              wait: "complete",
            },
          },
          complete: { type: "final" },
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "currencies");
                    return error;
                  },
                }),
              },
            },
          },
        },

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
                target: "processed",
                actions: ["setBillingCycles"],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: (
                    { error }: SystemContext,
                    { data }: AnyEventObject
                  ) => {
                    set(error, "billingCycles", data);
                    return error;
                  },
                }),
              },
            },
          },
          processed: {
            after: {
              wait: "complete",
            },
          },
          complete: { type: "final" },
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "billingCycles");
                    return error;
                  },
                }),
              },
            },
          },
        },
      },

      // --- ad hoc: these can be loaded at any time as needed

      countries: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "COUNTRIES.GET": "loading",
            },
          },
          loading: {
            invoke: {
              src: "fetchCountries",
              onDone: {
                target: "processed",
                actions: ["setCountries"],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: (
                    { error }: SystemContext,
                    { data }: AnyEventObject
                  ) => {
                    set(error, "countries", data);
                    return error;
                  },
                }),
              },
            },
          },
          processed: {
            after: {
              wait: "complete",
            },
          },
          complete: { type: "final" },
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "countries");
                    return error;
                  },
                }),
              },
            },
          },
        },
      },

      regions: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "REGIONS.GET": "loading",
            },
          },
          loading: {
            invoke: {
              src: "fetchRegions",
              onDone: {
                target: "processed",
                actions: ["setRegions"],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: (
                    { error }: SystemContext,
                    { data }: AnyEventObject
                  ) => {
                    set(error, "regions", data);
                    return error;
                  },
                }),
              },
            },
          },
          processed: {
            after: {
              wait: [
                { target: "complete", cond: "allRegionsLoaded" },
                { target: "idle" },
              ],
            },
          },
          complete: { type: "final" },
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "regions");
                    return error;
                  },
                }),
              },
            },
          },
        },
      },

      languages: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "LANGUAGES.GET": "loading",
            },
          },
          loading: {
            invoke: {
              src: "fetchLanguages",
              onDone: {
                target: "processed",
                actions: ["setLanguages"],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: (
                    { error }: SystemContext,
                    { data }: AnyEventObject
                  ) => {
                    set(error, "languages", data);
                    return error;
                  },
                }),
              },
            },
          },
          processed: {
            after: {
              wait: "complete",
            },
          },
          complete: { type: "final" },
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "languages");
                    return error;
                  },
                }),
              },
            },
          },
        },
      },

      statuses: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "STATUSES.GET": "loading",
            },
          },
          loading: {
            invoke: {
              src: "fetchStatuses",
              onDone: {
                target: "processed",
                actions: ["setStatuses"],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: (
                    { error }: SystemContext,
                    { data }: AnyEventObject
                  ) => {
                    set(error, "statuses", data);
                    return error;
                  },
                }),
              },
            },
          },
          processed: {
            after: {
              wait: "complete",
            },
          },
          complete: { type: "final" },
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "statuses");
                    return error;
                  },
                }),
              },
            },
          },
        },
      },

      departments: {
        initial: "idle",
        states: {
          idle: {
            on: {
              "DEPARTMENTS.GET": "loading",
            },
          },
          loading: {
            invoke: {
              src: "fetchDepartments",
              onDone: {
                target: "processed",
                actions: ["setDepartments"],
              },
              onError: {
                target: "error",
                actions: assign({
                  error: (
                    { error }: SystemContext,
                    { data }: AnyEventObject
                  ) => {
                    set(error, "departments", data);
                    return error;
                  },
                }),
              },
            },
          },
          processed: {
            after: {
              wait: "complete",
            },
          },
          complete: { type: "final" },
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: SystemContext) => {
                    unset(error, "departments");
                    return error;
                  },
                }),
              },
            },
          },
        },
      },

      // --- admin only endpoints

      // systemIPAddresses: {
      //   initial: "idle",
      //   states: {
      //     idle: {
      //      on: {
      //        "SYSTEMIPADDRESSES.GET": "loading"
      //      }
      //    },
      //     loading: {
      //       invoke: {
      //         src: "fetchSystemIPAddresses",
      //         onDone: {
      //           target: "processed",
      //           actions: ["setSystemIPAddresses"]
      //         },
      //         onError: {
      //           target: "error",
      //           actions: assign({
      //             error: ({ error }: SystemContext, { data }: AnyEventObject) => {
      //               set(error, "systemIPAddresses", data);
      //               return error;
      //             }
      //           })
      //         }
      //       }
      //     },
      //    processed: {
      //       after: {
      //         wait: "complete"
      //       }
      //     },
      //     complete: { type: "final" },
      //     error: {
      //       on: {
      //         RETRY: {
      //           target: "loading",
      //           actions: assign({
      //             error: ({ error }: SystemContext) => {
      //               unset(error, "systemIPAddresses");
      //               return error;
      //             }
      //           })
      //         }
      //       }
      //     }
      //   }
      // },

      // taxBusinessTypes: {
      //   initial: "idle",
      //   states: {
      //     idle: {
      //      on: {
      //        "TAXBUSINESSTYPES.GET": "loading"
      //      }
      // },
      //     loading: {
      //       invoke: {
      //         src: "fetchTaxBusinesstypes",
      //         onDone: {
      //           target: "processed",
      //           actions: ["setTaxBusinesstypes"]
      //         },
      //         onError: {
      //           target: "error",
      //           actions: assign({
      //             error: ({ error }: SystemContext, { data }: AnyEventObject) => {
      //               set(error, "taxBusinesstypes", data);
      //               return error;
      //             }
      //           })
      //         }
      //       }
      //     },
      //    processed: {
      //       after: {
      //         wait: "complete"
      //       }
      //     },
      //     complete: { type: "final" },
      //     error: {
      //       on: {
      //         RETRY: {
      //           target: "loading",
      //           actions: assign({
      //             error: ({ error }: SystemContext) => {
      //               unset(error, "taxBusinesstypes");
      //               return error;
      //             }
      //           })
      //         }
      //       }
      //     }
      //   }
      // }
    },
  },
  {
    actions: {
      setCurrencies: assign({
        currencies: (_context: SystemContext, { data }: AnyEventObject) => data,
      }),
      setBillingCycles: assign({
        billingCycles: (_context: SystemContext, { data }: AnyEventObject) =>
          data,
      }),
      setCountries: assign({
        countries: (_context: SystemContext, { data }: AnyEventObject) => data,
      }),
      setRegions: assign({
        regions: ({ regions }: SystemContext, { data }: AnyEventObject) => {
          regions ??= {}; // ensure we have a regions object
          set(regions, data.key, data.values);
          return regions;
        },
      }),
      setLanguages: assign({
        languages: (_context: SystemContext, { data }: AnyEventObject) => data,
      }),
      setStatuses: assign({
        statuses: (_context: SystemContext, { data }: AnyEventObject) => data,
      }),
      setDepartments: assign({
        departments: (_context: SystemContext, { data }: AnyEventObject) =>
          data,
      }),

      // --- admin only endpoints

      // setSystemIPAddresses: assign({
      //   systemIPAddresses: (_context: SystemContext, { data }: AnyEventObject) =>
      //     data
      // }),
      // setTaxBusinessTypes: assign({
      //   taxBusinessTypes: (_context: SystemContext, { data }: AnyEventObject) =>
      //     data
      // })

      // ---
    },
    guards: {
      allRegionsLoaded: (
        { countries, regions }: SystemContext,
        _event: AnyEventObject
      ) => {
        const existing = keys(regions);
        return (
          existing.length == countries?.length &&
          every(countries, ({ code }) => includes(existing, code))
        );
      },
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    services,
  }
);
