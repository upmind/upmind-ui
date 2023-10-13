// --- external
import { createMachine, assign, sendParent } from "xstate";
// --- internal
import services from "./services.products";
import { useTime } from "../../utils";

// --utils
import { useBasketParser } from "./utils";
import { isEmpty } from "lodash-es";
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
        product, // this is the full product object from the DB,
        configurationFields: null,
        model: null, // this is the product model, which will be added to the basket
        error: null
      },
      states: {
        // first load our product
        loading: {
          invoke: {
            id: "load",
            src: "load",
            onDone: [
              { target: "configuring", actions: ["setProduct", "setModel"] },
              { target: "error", actions: ["setError"] }
            ]
          }
        },

        // The product requires configuration
        configuring: {
          // TODO
          type: "parallel",
          states: {
            term: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkTerm",
                    onDone: {
                      target: "complete"
                    },
                    onError: {
                      target: "required",
                      actions: []
                    }
                  }
                },
                required: {
                  invoke: {
                    src: "configureTerm",
                    onDone: {
                      target: "complete",
                      actions: ["clearConfigurationFields"]
                    },
                    onError: {
                      target: "error",
                      actions: ["setError"]
                    }
                  }
                },
                error: {},
                complete: {
                  type: "final"
                }
              }
            },
            options: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkOptions",
                    onDone: {
                      target: "complete"
                    },
                    onError: {
                      target: "required",
                      actions: []
                    }
                  }
                },
                required: {
                  invoke: {
                    src: "configureTerm",
                    onDone: {
                      target: "complete",
                      actions: ["clearConfigurationFields"]
                    },
                    onError: {
                      target: "error",
                      actions: ["setError"]
                    }
                  }
                },
                error: {},
                complete: {
                  type: "final"
                }
              }
            },
            attributes: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkAttributes",
                    onDone: {
                      target: "complete"
                    },
                    onError: {
                      target: "required",
                      actions: []
                    }
                  }
                },
                required: {
                  invoke: {
                    src: "configureTerm",
                    onDone: {
                      target: "complete",
                      actions: ["clearConfigurationFields"]
                    },
                    onError: {
                      target: "error",
                      actions: ["setError"]
                    }
                  }
                },
                error: {},
                complete: {
                  type: "final"
                }
              }
            },
            provisioning: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkProvisioning",
                    onDone: {
                      target: "complete",
                      actions: ["clearConfigurationFields"]
                    },
                    onError: {
                      target: "required",
                      actions: ["setConfigurationFields"]
                    }
                  }
                },
                required: {
                  invoke: {
                    src: "configureTerm",
                    onDone: {
                      target: "complete",
                      actions: ["clearConfigurationFields"]
                    },
                    onError: {
                      target: "error",
                      actions: ["setError"]
                    }
                  }
                },
                error: {},
                complete: {
                  type: "final"
                }
              }
            }
          },
          on: {
            // maybe individual updates for each of the above?
            UPDATE: { target: "updating", actions: ["clearError", "setModel"] }
          },
          onDone: "adding"
        },

        // The product configuration is being updated
        updating: {
          invoke: {
            src: "update",
            onDone: {
              target: "configuring",
              actions: ["setResponse", "clearModel"]
            },
            onError: { target: "error", actions: ["setError"] }
          }
        },

        // The product is being added to the basket
        adding: {
          id: "adding",
          invoke: {
            id: "process",
            src: "add",
            onDone: {
              target: "complete",
              actions: sendParent((_context, { data }) => ({
                type: "REFRESH",
                data
              }))
            },
            onError: { target: "error", actions: ["setError"] }
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
        setModel: assign({
          model: (context, { data }) => data
        }),
        clearModel: assign({
          model: null
        }),
        // ---
        setProduct: assign({
          product: (context, { data }) => data
        }),
        // ---
        setConfigurationFields: assign({
          configurationFields: (context, { data }) => data
        }),
        clearConfigurationFields: assign({
          configurationFields: null
        }),
        // ---
        setResponse: assign({
          response: (context, { data }) => useBasketParser(data)
        }),
        clearResponse: assign({
          response: null
        }),
        // ---
        setError: assign({
          error: (context, { data }) => data || "Unknown error"
        }),
        clearError: assign({ error: null })
      },
      services,
      guards: {
        isNew: ({ basket_id, product }) => !!basket_id && !isEmpty(product),

        needsConfiguring: ({ product }) => {
          // provision_setup_field_defer_mode; hidden | inherit | none | optional

          const hasProvider = !!product.provision_provider_id;
          const hasConfig = false; //!!product.config;
          return hasProvider && !hasConfig;
        }
      },
      delays: {
        wait: () => useTime().MILLISECOND * 100 // this allows us to wait for an imperceptible amount of time before continuing
      }
    }
  );
