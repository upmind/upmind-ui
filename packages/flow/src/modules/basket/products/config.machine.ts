// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- internal
import services from "./services";

// --utils
import { useTime } from "../../../utils";
import {
  useProductAttributesParser,
  useProductConfigParser,
  useProductOptionsParser,
  useProductParser,
  useProductTermsParser,
  useProductValuesParser
} from "./utils";

import { get, set, map, toNumber, find } from "lodash-es";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with a product
export default values =>
  createMachine(
    {
      tsTypes: {} as import("./config.machine.typegen").Typegen0,
      id: "productConfigurator",
      predictableActionArguments: true,
      initial: "loading",
      context: {
        // ---
        // the model use dto generate our coonfig,
        // but with better structure / more detail to make ut easier for any ui to consume,
        // and keep the generated config separate & clean
        values: useProductValuesParser(values),

        // we mark the config with flags to help us determine what to do with it
        // once we have finished configuring it
        isNew: !values?.id,
        isDirty: false,

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
        // first load our product, we do this even if we are given a configured set of values
        //  as we need the additional 'with' properties
        loading: {
          invoke: {
            id: "load",
            src: "getProduct",
            onDone: [
              // {
              //   target: "configured",
              //   actions: ["setAvailable"],
              //   cond: ({ values }) => !!values?.id
              // },
              { target: "configuring", actions: ["setAvailable"] }
            ],
            onError: { target: "#error", actions: ["setError"] }
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
                  //     actions: ["setError"]
                  //   }
                  // }
                },
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
                  //     actions: ["setError"]
                  //   }
                  // }
                },
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
            },
            options: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkOptions",
                    onDone: { target: "valid", actions: ["setOptions"] },
                    onError: {
                      target: "invalid",
                      actions: ["setOptions", "setError"]
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
                  //     actions: ["setError"]
                  //   }
                  // }
                },
                valid: {
                  type: "final"
                }
              },
              on: {
                "UPDATE.OPTIONS": {
                  target: "options.checking",
                  actions: ["setOptions"]
                }
              }
            }
          },

          onDone: { target: "configured" }
        },

        // this is our state where we are all good and can add/update this configuration to the basket
        configured: {
          entry: ["setConfig", "sendConfig"],
          on: {
            REFRESH: {
              target: "loading",
              actions: ["setValues", "setClean"]
            },
            // ---

            "UPDATE.QUANTITY": {
              target: "configuring.quantity.checking",
              actions: ["setQuantity", "setDirty"]
            },
            "UPDATE.TERM": {
              target: "configuring.term.checking",
              actions: ["setTerm", "setDirty"]
            },
            "UPDATE.ATTRIBUTES": {
              target: "configuring.attributes.checking",
              actions: ["setAttributes", "setDirty"]
            },
            "UPDATE.OPTIONS": {
              target: "configuring.options.checking",
              actions: ["setOptions", "setDirty"]
            }
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
      }
    },
    {
      actions: {
        setValues: assign({
          values: ({ values }, { data }) => useProductValuesParser(data)
        }),

        // ---

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
            set(values, "quantity", Math.max(1, quantity)); //TODO: min check? step check
            return values;
          }
        }),

        setTerm: assign({
          values: ({ values }, { data }) => {
            const term = get(data, "term", data); // workaround to allow the same action to be used for different event sources
            set(values, "term", term);
            return values;
          },
          available: ({ available }, { data }) => {
            // set the price for the available options based on the term selected
            const term = get(data, "term", data); // workaround to allow the same action to be used for different event sources
            available.options = map(available.options, option => {
              option.values = map(option.values, value => {
                value.price = find(value.prices, [
                  "billing_cycle_months",
                  term
                ]);
                return value;
              });

              return option;
            });
            return available;
          }
        }),

        setAttributes: assign({
          values: ({ values }, { data }) => {
            const attributes = get(data, "attributes", data); // workaround to allow the same action to be used for different event sources
            set(values, "attributes", attributes);
            return values;
          }
        }),

        setOptions: assign({
          values: ({ values }, { data }) => {
            let options = get(data, "options", data); // workaround to allow the same action to be used for different event sources
            set(values, "options", options);
            return values;
          }
        }),

        // ---

        setDirty: assign({ isDirty: true }),
        setClean: assign({ isDirty: false }),

        // ---
        setAvailable: assign({
          available: (_context, { data }) => {
            return {
              product: useProductParser(data),
              terms: useProductTermsParser(data.prices),
              attributes: useProductAttributesParser(data.products_attributes),
              options: useProductOptionsParser(data.products_options)
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
