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
  useProductTermsParser
} from "./utils.product";

import { set, map, defaultsDeep } from "lodash-es";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with a product
export default ({ product, config }) =>
  createMachine(
    {
      tsTypes: {} as import("./productConfig.machine.typegen").Typegen0,
      id: "productConfigurator",
      predictableActionArguments: true,
      initial: "loading",
      context: {
        product, // this starts life as an id, then is updated to the full product object from the DB,
        config, // this is the product config, which will be generated to be used eg: when adding to the basket
        // ---
        // syntax sugar to manage the product, basically lookups, to make ut easier for any ui to consume,
        // and keep the generated config separate & clean
        selected: {
          term: null,
          options: [],
          attributes: []
        },
        available: {
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
              actions: ["setProduct", "setAvailable", "setConfig"]
            },
            onError: { target: "error", actions: ["setError"] }
          }
        },

        // The product requires configuration
        configuring: {
          id: "configuring",
          type: "parallel",
          states: {
            term: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkTerm",
                    onDone: { target: "complete", actions: ["setTerm"] },
                    onError: { target: "incomplete", actions: ["setError"] }
                  }
                },
                incomplete: {},
                processing: {
                  // invoke: {
                  //   src: "configureTerm",
                  //   onDone: {
                  //     target: "complete",
                  //     actions: []
                  //   },
                  //   onError: {
                  //     target: "error",
                  //     actions: ["setError"]
                  //   }
                  // }
                },
                error: {},
                complete: {
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
                    onDone: { target: "complete", actions: ["setAttributes"] },
                    onError: { target: "incomplete", actions: ["setError"] }
                  }
                },
                incomplete: {},
                processing: {
                  // invoke: {
                  //   src: "configureTerm",
                  //   onDone: {
                  //     target: "complete",
                  //     actions: []
                  //   },
                  //   onError: {
                  //     target: "error",
                  //     actions: ["setError"]
                  //   }
                  // }
                },
                error: {},
                complete: {
                  type: "final"
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
            //   //         //     target: "complete"
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
            //   //         //     target: "complete",
            //   //         //     actions: []
            //   //         //   },
            //   //         //   onError: {
            //   //         //     target: "error",
            //   //         //     actions: ["setError"]
            //   //         //   }
            //   //         // }
            //   //       },
            //   //       error: {},
            //   //       complete: {
            //   //         type: "final"
            //   //       }
            //   //     }
            //   //   },
          },

          onDone: { target: "configured" }
        },

        configured: {
          entry: [sendUpdate(), "sendConfig"],
          on: {
            UPDATE: { target: "configuring", actions: ["setConfig"] },
            KILL: { target: "complete" }
          }
        },
        // Handle errors
        error: {
          id: "error"
        },

        // Handle completion, stop the machine and prevent further products
        // also send a message to the parent machine to remove the product
        // with the config that has been generated
        complete: {
          id: "complete",
          type: "final",
          data: (context, event) => context.config
        }
      },
      on: {
        // Raw update for the full product config....maybe individual updates for each of the above?
        // UPDATE: { target: "processing.update", actions: ["setConfig"] },
        // ---
        // // syntax sugar to update the config
        // Raw update for the options
        // "OPTIONS.UPDATE": {
        //   target: "processing.update",
        //   actions: ["setConfig"]
        // },
        // "OPTION.REMOVE": {
        //   target: "processing.update",
        //   actions: ["setConfig"]
        // },
        // "OPTION.REMOVE": {
        //   target: "processing.update",
        //   actions: ["setConfig"]
        // },
        // "OPTION.UPDATE": {
        //   target: "processing.update",
        //   actions: ["setConfig"]
        // },
      }
    },
    {
      actions: {
        setConfig: assign({
          config: ({ config }, { data }) =>
            defaultsDeep(useProductConfigParser(data), config)
        }),

        sendConfig: sendParent((context, event) => ({
          type: "CONFIGURED",
          data: context.config
        })),
        // ---

        setTerm: assign({
          selected: ({ selected }, { data }) => {
            selected ??= {}; //safety check in case its doesnt exist yet
            set(selected, "term", data);
            return selected;
          },
          config: ({ config }, { data }) => {
            config ??= {}; //safety check in case its doesnt exist yet
            set(config, "billing_cycle_months", data.billing_cycle_months);
            return config;
          }
        }),

        setOptions: assign({
          selected: ({ selected }, { data }) => {
            selected ??= {}; //safety check in case its doesnt exist yet
            set(selected, "options", data);
            return selected;
          },
          config: ({ config }, { data }) => {
            // set(config, "quantity", 1); // todo use the options to set this, do we even need to set the quantity?
            config ??= {}; //safety check in case its doesnt exist yet
            const options = map(data, ({ id }) => ({ product_id: id }));
            set(config, "options", options);
            return config;
          }
        }),

        setAttributes: assign({
          selected: ({ selected }, { data }) => {
            selected ??= {}; //safety check in case its doesnt exist yet
            set(selected, "attributes", data);
            return selected;
          },
          config: ({ config }, { data }) => {
            config ??= {}; //safety check in case its doesnt exist yet
            const attributes = map(data, ({ id }) => ({ product_id: id }));
            set(config, "attributes", attributes);
            return config;
          }
        }),

        // ---
        setProduct: assign({
          product: (context, { data }) => useProductParser(data)
        }),

        // ---
        setAvailable: assign({
          available: ({ product, selected }, { data }) => {
            return {
              terms: useProductTermsParser(product.prices),
              options: useProductOptionsParser(product.products_options),
              attributes: useProductAttributesParser(
                product.products_attributes
              )
            };
          }
        }),

        // ---
        setError: assign({
          error: (context, { data }) => data || "Unknown error"
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
