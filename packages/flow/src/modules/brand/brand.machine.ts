// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { BrandContext, BrandEvent } from "./types.d";

// --- utils
import { useBrandParser } from "./utils";
import { useTime } from "../../utils";
import { set, unset } from "lodash-es";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./brand.machine.typegen").Typegen0,
    id: "brandManager",
    predictableActionArguments: true,
    initial: "processing",
    context: {
      currencies: null,
      // ---
      //  we dont have a set type for this yet as its 100% dynamic from the API
      //  on fetch we will inject the data into the context
      // ---
      error: {}
    } as BrandContext,

    states: {
      processing: {
        id: "processing",
        type: "parallel",
        states: {
          organisation: {
            initial: "fetching",
            states: {
              fetching: {
                invoke: {
                  src: "fetchOrganisationConfig",
                  onDone: {
                    target: "success",
                    actions: ["setOrganisation"]
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "organisation", data || "Unknown error");
                        return error;
                      }
                    })
                  }
                }
              },
              success: { type: "final" },
              error: {
                on: {
                  RETRY: {
                    target: "fetching",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
                        unset(error, "organisation");
                        return error;
                      }
                    })
                  }
                }
              }
            }
          },
          settings: {
            initial: "fetching",
            states: {
              fetching: {
                invoke: {
                  src: "fetchBrandSettings",
                  onDone: {
                    target: "success",
                    actions: ["setSettings"]
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "settings", data || "Unknown error");
                        return error;
                      }
                    })
                  }
                }
              },
              success: { type: "final" },
              error: {
                on: {
                  RETRY: {
                    target: "fetching",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
                        unset(error, "settings");
                        return error;
                      }
                    })
                  }
                }
              }
            }

            // Brand Settings
            // /brand/settings?lang=en
          },
          config: {
            initial: "fetching",
            states: {
              fetching: {
                invoke: {
                  src: "fetchBrandConfig",
                  onDone: {
                    target: "success",
                    actions: ["setConfig"]
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "config", data || "Unknown error");
                        return error;
                      }
                    })
                  }
                }
              },
              success: { type: "final" },
              error: {
                on: {
                  RETRY: {
                    target: "fetching",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
                        unset(error, "config");
                        return error;
                      }
                    })
                  }
                }
              }
            }

            // Brand values
            // /config/brand/values?keys=analytics.google.measurement_id,analytics.gtm.container_id,ui.basket.default_currency,billing.gateway.force_auto_payment_for_stored_details,billing.gateway.force_card_storage,ui.checkout.checkout_flow,ui.checkout.hide_promotions_field,ui.checkout.checkout_summary_color_stop1,ui.checkout.checkout_summary_color_stop2,ui.checkout.checkout_summary_contrast_mode,ui.client_area.allow_vault,ui.client_area.homepage,ui.client_area.hide_registration_forms,billing.gateway.allow_card_removal_replacement,ui.client_registration.require_phone,ui.basket.truncate_product_description,ui.client_area.show_catalog,tickets.support.support_pin_enabled,ui.client_area.disable_support_system,ui.client_area.page_after_login,ui.client_area.payment_term_descriptions,ui.client_area.enter_key_action,ui.client_area.price_before_discount_position&lang=en
          },
          modules: {
            initial: "fetching",
            states: {
              fetching: {
                invoke: {
                  src: "fetchModules",
                  onDone: {
                    target: "success",
                    actions: ["setModules"]
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "modules", data || "Unknown error");
                        return error;
                      }
                    })
                  }
                }
              },
              success: { type: "final" },
              error: {
                on: {
                  RETRY: {
                    target: "fetching",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
                        unset(error, "modules");
                        return error;
                      }
                    })
                  }
                }
              }
            }

            // Modules
            // /org/modules?lang=en
          },
          currencies: {
            initial: "fetching",
            states: {
              fetching: {
                invoke: {
                  src: "fetchCurrencies",
                  onDone: {
                    target: "success",
                    actions: ["setCurrencies"]
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "currencies", data || "Unknown error");
                        return error;
                      }
                    })
                  }
                }
              },
              success: { type: "final" },
              error: {
                on: {
                  RETRY: {
                    target: "fetching",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
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
          }
        },
        onDone: "#processed"
      },
      // Use a transient state to indicate a successful process
      // We have an imperceptible delay to allow the components to understand the process is complete
      processed: {
        id: "processed",
        after: {
          wait: "complete"
        }
      },

      complete: {
        // type: "final" //NB: dont use final here as we want to  have the machine available
      }
    }
  },
  {
    actions: {
      setOrganisation: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),
      setSettings: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),
      setConfig: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),
      setModules: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),
      setCurrencies: assign({
        currencies: (_context: BrandContext, { data }: BrandEvent) => data
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
