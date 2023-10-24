// --- external
import { createMachine, assign, sendParent, sendUpdate } from "xstate";

// --- internal
import services from "./services.products";

// --utils
import { useTime } from "../../utils";
import {
  useProductAttributesParser,
  useProductConfigParser,
  useProductOptionsParser,
  useProductParser,
  useProductTermsParser,
  useProductValuesParser
} from "./utils.product";

import { get, set, map, defaultsDeep, toNumber } from "lodash-es";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with a product
export default values =>
  createMachine(
    {
      tsTypes: {} as import("./productConfig.machine.typegen").Typegen0,
      id: "productConfigurator",
      predictableActionArguments: true,
      initial: "loading",
      context: {
        // ---
        // the model use dto generate our coonfig,
        // but with better structure / more detail to make ut easier for any ui to consume,
        // and keep the generated config separate & clean
        values: useProductValuesParser(values),
        // ---
        // the various lookups that we are using in our configuation
        available: {
          product: null,
          terms: null,
          options: null,
          attributes: null
        },
        // ---
        error: null
      },
      states: {
        // first load our product
        loading: {
          invoke: {
            id: "load",
            src: "getProduct",
            onDone: {
              target: "configuring",
              actions: ["setAvailable"]
            },
            onError: { target: "error", actions: ["setError"] }
          }
        },

        // The product requires configuration
        configuring: {
          id: "configuring",
          type: "parallel",
          states: {
            quantity: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkQuantity",
                    onDone: { target: "valid", actions: ["setQuantity"] },
                    onError: { target: "invalid", actions: ["setError"] }
                  }
                },
                invalid: {},
                processing: {},
                error: {},
                valid: {
                  type: "final"
                }
              },
              on: {
                "UPDATE.QUANTITY": {
                  target: "quantity.checking",
                  actions: ["setQuantity"]
                }
              }
            },
            term: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkTerm",
                    onDone: { target: "valid", actions: ["setTerm"] },
                    onError: { target: "invalid", actions: ["setError"] }
                  }
                },
                invalid: {},
                processing: {
                  // invoke: {
                  //   src: "configureTerm",
                  //   onDone: {
                  //     target: "valid",
                  //     actions: []
                  //   },
                  //   onError: {
                  //     target: "error",
                  //     actions: ["setError"]
                  //   }
                  // }
                },
                error: {},
                valid: {
                  type: "final"
                }
              },
              on: {
                "UPDATE.TERM": {
                  target: "term.checking",
                  actions: ["setTerm"]
                }
              }
            },
            attributes: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkAttributes",
                    onDone: { target: "valid", actions: ["setAttributes"] },
                    onError: {
                      target: "invalid",
                      actions: ["setAttributes", "setError"]
                    }
                  }
                },
                invalid: {},
                processing: {
                  // invoke: {
                  //   src: "configureTerm",
                  //   onDone: {
                  //     target: "valid",
                  //     actions: []
                  //   },
                  //   onError: {
                  //     target: "error",
                  //     actions: ["setError"]
                  //   }
                  // }
                },
                error: {},
                valid: {
                  type: "final"
                }
              },
              on: {
                "UPDATE.ATTRIBUTES": {
                  target: "attributes.checking",
                  actions: ["setAttributes"]
                }
              }
            }
            //   //   options: {
            //   //     initial: "checking",
            //   //     states: {
            //   //       checking: {
            //   //         // invoke: {
            //   //         //   src: "checkOptions",
            //   //         //   onDone: {
            //   //         //     target: "valid"
            //   //         //   },
            //   //         //   onError: {
            //   //         //     target: "required",
            //   //         //     actions: []
            //   //         //   }
            //   //         // }
            //   //       },
            //   //       required: {
            //   //         // invoke: {
            //   //         //   src: "configureTerm",
            //   //         //   onDone: {
            //   //         //     target: "valid",
            //   //         //     actions: []
            //   //         //   },
            //   //         //   onError: {
            //   //         //     target: "error",
            //   //         //     actions: ["setError"]
            //   //         //   }
            //   //         // }
            //   //       },
            //   //       error: {},
            //   //       valid: {
            //   //         type: "final"
            //   //       }
            //   //     }
            //   //   },
          },

          onDone: { target: "configured" }
        },

        // this is our state where we are all good and can add/update this configuration to the basket
        configured: {
          entry: ["setConfig", sendUpdate(), "sendConfig"],
          on: {
            UPDATE: { target: "configuring", actions: ["setValues"] }
          }
        },

        // Handle errors
        error: {
          id: "error"
        },

        // Handle completion, stop the machine and prevent further products
        // also send a message to the parent machine to remove the product
        // with the config that has been generated, just in case...
        complete: {
          id: "valid",
          type: "final",
          data: ({ values }, _event) => useProductConfigParser(values)
        }
      },
      on: {
        // Raw update for the full product config....maybe individual updates for each of the above?
        // UPDATE: { target: "processing.update", actions: ["setValues"] },
        // ---
        // // syntax sugar to update the config
        // Raw update for the options
        // "OPTIONS.UPDATE": {
        //   target: "processing.update",
        //   actions: ["setValues"]
        // },
        // "OPTION.REMOVE": {
        //   target: "processing.update",
        //   actions: ["setValues"]
        // },
        // "OPTION.REMOVE": {
        //   target: "processing.update",
        //   actions: ["setValues"]
        // },
        // "OPTION.UPDATE": {
        //   target: "processing.update",
        //   actions: ["setValues"]
        // },
      }
    },
    {
      actions: {
        setConfig: assign({
          config: ({ values }, _event) => useProductConfigParser(values)
        }),

        sendConfig: sendParent(({ values }, _event) => ({
          type: "CONFIGURED",
          data: useProductConfigParser(values)
        })),

        // ---

        setQuantity: assign({
          values: ({ values }, { data }) => {
            const quantity: number = toNumber(get(data, "quantity", data)); // workaround to allow the same action to be used for different event sources
            set(values, "quantity", Math.max(1, quantity)); //todo min check? step check
            return values;
          }
        }),

        setTerm: assign({
          values: ({ values }, { data }) => {
            const term = get(data, "term", data); // workaround to allow the same action to be used for different event sources
            set(values, "term", term);
            return values;
          }
        }),

        setOptions: assign({
          values: ({ values }, { data }) => {
            set(values, "options", data);
            return values;
          }
        }),

        setAttributes: assign({
          values: ({ values }, { data }) => {
            const attributes = get(data, "attributes", data); // workaround to allow the same action to be used for different event sources
            set(values, "attributes", attributes);
            return values;
          }
        }),

        // ---

        // ---
        setAvailable: assign({
          available: (_contect, { data }) => {
            return {
              product: useProductParser(data),
              terms: useProductTermsParser(data.prices),
              options: useProductOptionsParser(data.products_options),
              attributes: useProductAttributesParser(data.products_attributes)
            };
          }
        }),

        // ---
        setError: assign({
          error: (context, { data }) => data?.errors || data || "Unknown error"
        }),
        clearError: assign({ error: null })
      },
      services,
      guards: {},
      delays: {
        wait: () => useTime().MILLISECOND * 100 // this allows us to wait for an imperceptible amount of time before continuing
      }
    }
  );
