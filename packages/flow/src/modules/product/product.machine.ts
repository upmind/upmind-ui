// --- external
import { createMachine, assign, actions } from "xstate";
const { sendParent } = actions;

// --- internal
import services from "./services";

// --utils
import { useTime } from "../../utils";
import {
  useBasketConfigParser,
  useSubproductParser,
  useProvisioningParser,
  useProductParser,
  useTermsParser,
  useModelParser,
  useSummaryParser,
  useValidationParser,
} from "./utils";

import {
  get,
  set,
  map,
  toNumber,
  find,
  merge,
  isEqual,
  unset,
  isEmpty,
  isNil,
} from "lodash-es";

import { useBrand } from "../brand";

// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with a product
export default (model, currency_id, promotions) => {
  const { validateCurrency } = useBrand();
  return createMachine(
    {
      tsTypes: {} as import("./product.machine.typegen").Typegen0,
      id: "productConfigurator",
      predictableActionArguments: true,
      initial: "loading",
      context: {
        // we mark the config with flags to help us determine what to do with it
        // once we have finished configuring it
        // TODO: should probably be state instead of context
        isNew: !model?.id,
        isDirty: false,
        needsCalculating: false,
        // ---
        currency_id: validateCurrency(currency_id),
        promotions,
        // the model used to generate our final config,
        // but with better structure / more detail to make ut easier for any ui to consume,
        // and keep the generated config separate & clean
        model: useModelParser(model),
        // ---
        // the various lookups that we are using in our configuation
        lookups: {
          product: model?.product,
          terms: null,
          options: null,
          attributes: null,
          provision_fields: null,
        },
        // ---
        // Dynamically generated summary/pricing/details of the configuration,
        config: {},
        summary: {},
        prices: {
          term: null,
          attributes: null,
          options: null,
        },
        // ---
        error: {},
      },
      states: {
        // first load our product, we do this even if we are given a configured set of values
        //  as we need the additional 'with' properties
        loading: {
          id: "loading",
          invoke: {
            id: "load",
            src: "load",
            onDone: [{ target: "configuring", actions: ["setLookups"] }],
            onError: {
              target: "#error",
              actions: "setError",
            },
          },
        },

        // The product requires configuration
        configuring: {
          id: "configuring",
          initial: "quantity",
          states: {
            quantity: {
              invoke: {
                src: "checkQuantity",
                onDone: {
                  target: "values",
                  actions: ["setQuantity", "setConfig"],
                },
                onError: {
                  actions: "setError",
                },
              },
            },
            values: {
              type: "parallel",
              states: {
                term: {
                  initial: "checking",
                  states: {
                    checking: {
                      entry: ({ error }) => unset(error, "term"),
                      invoke: {
                        src: "checkTerm",
                        onDone: {
                          target: "valid",
                          actions: ["setTerm", "setConfig"],
                        },
                        onError: {
                          target: "invalid",
                          actions: ["setTerm", "setConfig", "setError"],
                        },
                      },
                    },
                    invalid: {},
                    valid: {
                      type: "final",
                    },
                  },
                  on: {
                    "UPDATE.TERM": {
                      target: "term.checking",
                      actions: ["setTerm"],
                    },
                  },
                },
                attributes: {
                  initial: "checking",
                  states: {
                    checking: {
                      entry: ({ error }) => unset(error, "attributes"),
                      invoke: {
                        src: "checkAttributes",
                        onDone: {
                          target: "valid",
                          actions: ["setAttributes", "setConfig"],
                        },
                        onError: {
                          target: "invalid",
                          actions: ["setAttributes", "setConfig", "setError"],
                        },
                      },
                    },
                    invalid: {},
                    valid: {
                      type: "final",
                    },
                  },
                  on: {
                    "UPDATE.ATTRIBUTES": {
                      target: "attributes.checking",
                      actions: ["setAttributes"],
                    },
                  },
                },
                options: {
                  initial: "checking",
                  states: {
                    checking: {
                      entry: ({ error }) => unset(error, "options"),
                      invoke: {
                        src: "checkOptions",
                        onDone: {
                          target: "valid",
                          actions: ["setOptions", "setConfig"],
                        },
                        onError: {
                          target: "invalid",
                          actions: ["setOptions", "setConfig", "setError"],
                        },
                      },
                    },
                    invalid: {},
                    valid: {
                      type: "final",
                    },
                  },
                  on: {
                    "UPDATE.OPTIONS": {
                      target: "options.checking",
                      actions: ["setOptions"],
                    },
                  },
                },
                provisioning: {
                  initial: "checking",
                  states: {
                    checking: {
                      entry: ({ error }) => unset(error, "provision_fields"),
                      invoke: {
                        src: "checkProvisioning",
                        onDone: {
                          target: "valid",
                          actions: ["setProvisioning", "setConfig"],
                        },
                        onError: {
                          target: "invalid",
                          actions: ["setProvisioning", "setConfig", "setError"],
                        },
                      },
                    },
                    invalid: {},
                    valid: {
                      type: "final",
                    },
                  },
                  on: {
                    "UPDATE.PROVISIONING": {
                      target: "provisioning.checking",
                      actions: ["setProvisioning"],
                    },
                  },
                },
              },
              onDone: [
                { target: "calculating", cond: "needsRecalculating" },
                { target: "#configured" },
              ],
            },
            calculating: {
              invoke: {
                src: "calculateSummary",
                onDone: {
                  target: "#configured",
                  actions: ["setSummary", "clearCalculating"],
                },
                onError: {
                  target: "#error",
                  actions: ["setError"],
                },
              },
            },
          },
          on: {
            // PROCESSING: { target: "configured.processing" },
            "UPDATE.QUANTITY": {
              target: "configuring.quantity",
              actions: ["setQuantity"],
            },
            UPDATE: {
              target: "configuring",
              actions: ["setModel", "setDirty"],
            },
            PUT: [
              {
                target: "configuring",
                actions: ["mergeModel", "setDirty"],
                cond: "hasChanged",
              },
            ],
          },
        },

        // this is our state where we are all good and can add/update this configuration to the basket
        configured: {
          id: "configured",
          entry: ["setConfig", "sendConfig"],
          initial: "idle",
          states: {
            idle: {},
            // this is a state where we have been processed from a parent machine
            processing: {
              type: "final",
              on: {
                ERROR: { target: "error", actions: "setError" },
                REFRESH: {
                  target: "#configuring",
                  actions: [
                    "setModel",
                    "setCurrency",
                    "setPromotions",
                    "setClean",
                  ],
                },
              },
            },

            error: {},
          },

          on: {
            PROCESSING: { target: "configured.processing" },

            // ---
            UPDATE: {
              target: "configuring",
              actions: ["setModel", "setDirty"],
            },
            PUT: [
              {
                target: "configuring",
                actions: ["mergeModel", "setDirty"],
                cond: "hasChanged",
              },
            ],

            "UPDATE.QUANTITY": {
              target: "configuring.quantity",
              actions: ["setQuantity", "setDirty"],
            },
            "UPDATE.TERM": {
              target: "configuring.values.term.checking",
              actions: ["setTerm", "setDirty"],
            },
            "UPDATE.ATTRIBUTES": {
              target: "configuring.values.attributes.checking",
              actions: ["setAttributes", "setDirty"],
            },
            "UPDATE.OPTIONS": {
              target: "configuring.values.options.checking",
              actions: ["setOptions", "setDirty"],
            },
            "UPDATE.PROVISIONING": {
              target: "configuring.values.provisioning.checking",
              actions: ["setProvisioning", "setDirty"],
            },
          },
        },

        // this is a state where we hav ebeen deleted or are no longer available from a parent machine
        unavailable: {},
        // Handle errors
        error: {
          id: "error",
        },

        // Handle completion, stop the machine and prevent further products
        // also send a message to the parent machine to remove the product
        // with the config that has been generated, just in case...
        complete: {
          id: "valid",
          type: "final",
          data: ({ model }, _event) => useBasketConfigParser(model),
        },
      },
      on: {
        REFRESH: [
          {
            target: "loading",
            actions: ["setModel", "setCurrency", "setPromotions", "setClean"],
            cond: "hasChanged",
          },
          { actions: ["setClean"] },
        ],
        BIN: { target: "unavailable" },
      },
    },
    {
      actions: {
        // ---
        setLookups: assign({
          lookups: (_context, { data }) => {
            return {
              product: useProductParser(data),
              terms: useTermsParser(data.prices),
              attributes: useSubproductParser(data.products_attributes),
              options: useSubproductParser(data.products_options),
              provision_fields: useProvisioningParser(
                data.products_provisioning
              ),
            };
          },
          summary: ({ prices, model }, { data }) => {
            // use the display price as the initial price to use in the summary
            const dislay_price_formatted = data.display_price;
            const display_price = Number(
              data.display_price?.replace(/[^0-9.-]+/g, "")
            );
            return useSummaryParser({
              summary: {
                discount: 0,
                discount_formatted: "",
                subtotal: display_price,
                subtotal_formatted: dislay_price_formatted,
                total: display_price,
                total_formatted: dislay_price_formatted,
              },
              prices,
              model,
            });
          },
        }),

        setCurrency: assign({
          currency_id: ({ currency_id }, { data }) =>
            data?.currency_id || currency_id,
        }),

        setPromotions: assign({
          promotions: ({ promotions }, { data }) =>
            data?.promotions || promotions || [],
        }),

        setModel: assign({
          model: (_context, { data }) => useModelParser(data?.product),
        }),

        mergeModel: assign({
          model: ({ model }, { data }) =>
            merge({}, model, useModelParser(data)),
        }),

        // ---

        setConfig: assign({
          config: ({ model }, _event) => useBasketConfigParser(model),
        }),

        sendConfig: sendParent(({ model }, _event) => ({
          type: "CONFIGURED",
          data: useBasketConfigParser(model),
        })),

        // ---
        setSummary: assign({
          summary: ({ prices, model }, { data }) => {
            return useSummaryParser({
              summary: data,
              prices,
              model,
            });
          },
        }),

        setQuantity: assign({
          model: ({ model }, { data }) => {
            const quantity: number = toNumber(get(data, "quantity", data)); // workaround to allow the same action to be used for different event sources
            set(model, "quantity", Math.max(1, quantity)); //TODO: min check? step check
            return model;
          },
        }),

        setTerm: assign({
          model: ({ model }, { data }) => {
            const term = get(data, "term");
            set(model, "term", term);
            return model;
          },
          lookups: ({ lookups }, { data }) => {
            // set the price for the lookups options based on the term selected
            const term = get(data, "term");
            lookups.options = map(lookups.options, option => {
              option.values = map(option.values, value => {
                value.price = find(value.prices, [
                  "billing_cycle_months",
                  term?.billing_cycle_months,
                ]);
                return value;
              });

              return option;
            });
            return lookups;
          },
          prices: ({ prices }, { data }) => {
            if (!data?.price) return prices;
            return { ...prices, term: data.price };
          },
          needsCalculating: ({ prices, needsCalculating }, { data }) =>
            needsCalculating ||
            (data?.price && !isEqual(data?.price, prices?.term)),
        }),

        setAttributes: assign({
          model: ({ model }, { data }) => {
            const attributes = get(data, "attributes");
            set(model, "attributes", attributes);
            return model;
          },
          prices: ({ prices }, { data }) => {
            if (!data?.price) return prices;
            return { ...prices, attributes: data.price };
          },
          needsCalculating: ({ prices, needsCalculating }, { data }) =>
            needsCalculating ||
            (data?.price && !isEqual(data?.price, prices?.attributes)),
        }),

        setOptions: assign({
          model: ({ model }, { data }) => {
            const options = get(data, "options");
            set(model, "options", options);
            return model;
          },
          prices: ({ prices }, { data }) => {
            if (!data?.price) return prices;
            return { ...prices, options: data.price };
          },
          needsCalculating: ({ prices, needsCalculating }, { data }) =>
            needsCalculating ||
            (!!data?.price && !isEqual(data?.price, prices?.options)),
        }),

        setProvisioning: assign({
          model: ({ model }, { data }) => {
            const provision_fields = get(data, "provision_fields");
            set(model, "provision_fields", provision_fields);
            return model;
          },
        }),

        // ---

        clearCalculating: assign({ needsCalculating: false }),
        setDirty: assign({ isDirty: true }),
        setClean: assign({
          isDirty: false,
          needsCalculating: false,
          // error: {},
        }),

        // ---

        setError: assign({
          error: ({ error }, { data }) => {
            const err = data?.error || data;

            if (err?.code == 422) {
              // lets parse/override our error message and data
              // this is to generate valid json schema validation errors
              return {
                ...error,
                provision_fields: useValidationParser(err),
              };
            } else {
              return { ...error, ...err };
            }
          },
        }),

        clearError: assign({ error: {} }),
      },
      services,
      guards: {
        needsRecalculating: ({ needsCalculating, prices, summary }) =>
          (isEmpty(summary) || needsCalculating) &&
          !isNil(prices.term) &&
          !isNil(prices.attributes) &&
          !isNil(prices.options),
        hasCalculated: ({ needsCalculating, summary }) =>
          !needsCalculating && !isEmpty(summary),

        hasChanged: ({ model, basket_id, currency_id }, { data }) => {
          const newModel = merge({}, model, useModelParser(data));
          const value =
            !isEqual(newModel, model) ||
            basket_id !== data?.id ||
            currency_id !== data?.currency_id;
          return value;
        },
      },
      delays: {
        error: () => useTime().ERROR,
        wait: () => useTime().WAIT,
      },
    }
  );
};
