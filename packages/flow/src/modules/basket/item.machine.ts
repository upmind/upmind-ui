// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import services from "./services.products";
import { useTime } from "../../utils";

// --utils
import {
  useBasketParser,
  useProductTermsParser,
  useProductOptionsParser,
  useProductAttributesParser,
  useProductParser,
  useProductConfigParser
} from "./utils";

import { set } from "lodash-es";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with an existing basket product
export default ({ name, basketId, product }) =>
  createMachine(
    {
      tsTypes: {} as import("./item.machine.typegen").Typegen0,
      id: "item",
      predictableActionArguments: true,
      initial: "loading",
      context: {
        name,
        basketId,
        product, // this starts life as an id, then is updated to the full product object from the DB,
        // ---
        config: {}, // this is the product config, which will be added to the basket
        id: null, // this is the id of the product in the basket, once it has been added
        // ---
        // syntax sugar to manage the product, easier for any ui to consume,
        // and keep the generated config as a separate object that is only used when adding to the basket
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
                    onError: { target: "required", actions: [] }
                  }
                },
                required: {},
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
            //   //   attributes: {
            //   //     initial: "checking",
            //   //     states: {
            //   //       checking: {
            //   //         // invoke: {
            //   //         //   src: "checkAttributes",
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
            //   //   provisioning: {
            //   //     initial: "checking",
            //   //     states: {
            //   //       checking: {
            //   //         // invoke: {
            //   //         //   src: "checkProvisioning",
            //   //         //   onDone: {
            //   //         //     target: "complete",
            //   //         //     actions: []
            //   //         //   },
            //   //         //   onError: {
            //   //         //     target: "required",
            //   //         //     actions: [""]
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
            //   //   }
          }
          // on: {
          //   // maybe individual updates for each of the above?
          //   // UPDATE: { target: "processing.update", actions: ["setConfig"] },
          //   // // syntax sugar to update the config
          //   // "UPDATE.TERM": {
          //   //   target: "processing.update",
          //   //   actions: ["setConfig"]
          //   // },
          //   // "UPDATE.OPTIONS": {
          //   //   target: "processing.update",
          //   //   actions: ["setConfig"]
          //   // },
          //   // "UPDATE.ATTRIBUTES": {
          //   //   target: "processing.update",
          //   //   actions: ["setConfig"]
          //   // },
          //   // "UPDATE.PROVISIONING": {
          //   //   target: "processing.update",
          //   //   actions: ["setConfig"]
          //   // }
          // }
          // onDone: "processing.add"
        },

        // The product configuration is being processed
        processing: {
          states: {
            update: {
              // invoke: {
              //   src: "update",
              //   onDone: {
              //     target: "#configuring",
              //     actions: ["setResponse"]
              //   },
              //   onError: { target: "#error", actions: ["setError"] }
              // }
            },
            add: {
              // invoke: {
              //   src: "add",
              //   onDone: {
              //     target: "provision",
              //     actions: [
              //       "setId",
              //       sendParent((_context, { data }) => ({
              //         type: "REFRESH",
              //         data
              //       }))
              //     ]
              //   },
              //   onError: { target: "#error", actions: ["setError"] }
              // }
            },
            provision: {
              // invoke: {
              //   src: "addProvisioning",
              //   onDone: {
              //     target: "#complete",
              //     actions: sendParent((_context, { data }) => ({
              //       type: "REFRESH",
              //       data
              //     }))
              //   },
              //   onError: { target: "#error", actions: ["setError"] }
              // }
            }
          }
        },

        // Handle errors
        error: {
          id: "error"
        },

        // Handle completion, stop the machine and prevent further products
        // also send a message to the parent machine to remove the product
        complete: {
          id: "complete",
          type: "final"
        }
      }
    },
    {
      actions: {
        setConfig: assign({
          config: (context, { data }) => useProductConfigParser(data)
        }),
        setTerm: assign({
          selected: ({ selected }, { data }) => {
            set(selected, "term", data);
            return selected;
          },
          config: ({ config }, { data }) => {
            set(config, "billing_cycle_months", data.billing_cycle_months);
            set(config, "quantity", 1); // todo use the options to set this, do we even need to set the quantity?
            set(config, "total", data.price); //todo calculate this base don price and quantity . Do we even need to set the total?
            return config;
          }
        }),
        setOptions: assign({
          config: ({ config }, { data }) => {
            set(config, "", data);
            return config;
          }
        }),
        setAttributes: assign({
          config: ({ config }, { data }) => {
            set(config, "", data);
            return config;
          }
        }),
        setProvisioning: assign({
          config: ({ config }, { data }) => {
            set(config, "", data);
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
        setResponse: assign({
          response: (context, { data }) => useBasketParser(data)
        }),

        // ---
        setError: assign({
          error: (context, { data }) => data || "Unknown error"
        }),
        clearError: assign({ error: null })
      },
      services,
      guards: {
        // needsConfiguring: ({ product }) => {
        //   // provision_setup_field_defer_mode; hidden | inherit | none | optional
        //   const hasProvider = !!product.provision_provider_id;
        //   const hasConfig = false; //!!product.config;
        //   return hasProvider && !hasConfig;
        // }
      },
      delays: {
        wait: () => useTime().MILLISECOND * 100 // this allows us to wait for an imperceptible amount of time before continuing
      }
    }
  );
