// --- external
import { createMachine, assign, actions, spawn } from "xstate";
const { sendParent, sendTo, raise } = actions;

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
  clone,
  get,
  has,
  isEmpty,
  isEqual,
  merge,
  set,
  toNumber,
  unset,
} from "lodash-es";

import { useBrand } from "../brand";
import { calculateSubscription } from "./services";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with a product
export default (model, currency_id, promotions) => {
  const { validateCurrency } = useBrand();
  const baseModel = useModelParser(model);
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
        // ---
        currency_id: validateCurrency(currency_id),
        promotions,
        // the model used to generate our final config,
        // but with better structure / more detail to make ut easier for any ui to consume,
        // and keep the generated config separate & clean
        model: clone(baseModel),
        baseModel: baseModel,
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
          term: [],
          attributes: [],
          options: [],
        },
        calculateCallback: null,
        // ---
        error: {},
      },

      entry: assign({
        calculateCallback: (context, event) => spawn(calculateSubscription),
      }),

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
          type: "parallel",
          states: {
            quantity: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkQuantity",
                    onDone: {
                      target: "valid",
                      actions: [
                        "setQuantity",
                        raise("CHECK.TERM"),
                        raise("CHECK.OPTIONS"),
                      ],
                    },
                    onError: {
                      target: "invalid",
                      actions: "setError",
                    },
                  },
                },
                invalid: {},
                valid: { type: "final" },
              },
              on: {
                "CHECK.QUANTITY": {
                  target: "quantity.checking",
                },
                "UPDATE.QUANTITY": {
                  target: "quantity",
                  actions: ["setQuantity"],
                },
              },
            },
            term: {
              initial: "checking",
              states: {
                checking: {
                  entry: ({ error }) => unset(error, "term"),
                  invoke: {
                    src: "checkTerm",
                    onDone: [
                      {
                        target: ["valid"],
                        actions: [
                          "setTerm",
                          "setSummaryCalculating",
                          "calculate",
                          raise("CHECK.OPTIONS"),
                        ],
                        cond: "needsCalculating",
                      },

                      {
                        target: "valid",
                        actions: ["setTerm", raise("CHECK.OPTIONS")],
                      },
                    ],
                    onError: [
                      {
                        target: "invalid",
                        actions: [
                          "setTerm",
                          "setError",
                          "setSummaryCalculating",
                          "calculate",
                        ],
                        cond: "needsCalculating",
                      },
                      {
                        target: "invalid",
                        actions: ["setTerm", "setError"],
                      },
                    ],
                  },
                },
                invalid: {},
                valid: { type: "final" },
              },
              on: {
                "CHECK.TERM": {
                  target: "term.checking",
                },
                "UPDATE.TERM": {
                  target: "term.checking",
                  actions: ["setTerm"],
                },
              },
            },
            attributes: {
              id: "attributes",
              initial: "checking",
              states: {
                checking: {
                  entry: ({ error }) => unset(error, "attributes"),
                  invoke: {
                    src: "checkAttributes",
                    onDone: {
                      target: "valid",
                      actions: ["setAttributes"],
                    },
                    onError: {
                      target: "invalid",
                      actions: ["setAttributes", "setError"],
                    },
                  },
                },
                invalid: {},
                valid: { type: "final" },
              },
              on: {
                "CHECK.ATTRIBUTES": {
                  target: "attributes.checking",
                },
                "UPDATE.ATTRIBUTES": {
                  target: "attributes.checking",
                  actions: ["setAttributes"],
                },
              },
            },
            options: {
              id: "options",
              initial: "checking",
              states: {
                checking: {
                  entry: ({ error }) => unset(error, "options"),
                  invoke: {
                    src: "checkOptions",
                    onDone: [
                      {
                        target: "valid",
                        actions: [
                          "setOptions",
                          "setSummaryCalculating",
                          "calculate",
                        ],
                        cond: "needsCalculating",
                      },
                      {
                        target: "valid",
                        actions: ["setOptions"],
                      },
                    ],
                    onError: [
                      {
                        target: "invalid",
                        actions: [
                          "setOptions",
                          "setError",
                          "setSummaryCalculating",
                          "calculate",
                        ],
                        cond: "needsCalculating",
                      },
                      {
                        target: "invalid",
                        actions: ["setOptions", "setError"],
                      },
                    ],
                  },
                },
                invalid: {},
                valid: { type: "final" },
              },
              on: {
                "CHECK.OPTIONS": {
                  target: "options.checking",
                },
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
                      actions: ["setProvisioning"],
                    },
                    onError: {
                      target: "invalid",
                      actions: ["setProvisioning", "setError"],
                    },
                  },
                },
                invalid: {},
                valid: { type: "final" },
              },
              on: {
                "UPDATE.PROVISIONING": {
                  target: "provisioning.checking",
                  actions: ["setProvisioning"],
                },
              },
            },
          },
          on: {
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
          onDone: { target: "#configured" },
        },

        // this is our state where we are all good and can add/update this configuration to the basket
        configured: {
          id: "configured",
          entry: ["setConfig", "sendConfig"],
          initial: "idle",
          states: {
            idle: {},
            // this is a state where we have been processed from a parent machine
            // so we update our base model to reflect the current state
            //  that way we can alwatys reset to the original state
            processing: {
              type: "final",
              on: {
                ERROR: { target: "error", actions: "setError" },
                REFRESH: {
                  target: "#configuring",
                  actions: [
                    "setModel",
                    "setBaseModel",
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
            PROCESSING: {
              target: "configured.processing",
            },
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
              target: "configuring.quantity.checking",
              actions: ["setQuantity", "setDirty"],
            },
            "UPDATE.TERM": {
              target: "configuring.term.checking",
              actions: ["setTerm", "setDirty"],
            },
            "UPDATE.ATTRIBUTES": {
              target: "configuring.attributes.checking",
              actions: ["setAttributes", "setDirty"],
            },
            "UPDATE.OPTIONS": {
              target: "configuring.options.checking",
              actions: ["setOptions", "setDirty"],
            },
            "UPDATE.PROVISIONING": {
              target: "configuring.provisioning.checking",
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
        RESET: {
          target: "loading",
          actions: ["resetModel", "setClean"],
        },
        REFRESH: [
          {
            target: "loading",
            actions: ["setModel", "setCurrency", "setPromotions", "setClean"],
            cond: "hasChanged",
          },
          { actions: ["setClean"] },
        ],
        BIN: { target: "unavailable" },

        CALCULATED: {
          actions: ["setSummary"],
          cond: "hasSummaryData",
        },
      },
    },
    {
      actions: {
        // ---
        setLookups: assign({
          raw: (_context, { data }) => data,

          lookups: ({ model }, { data }) => {
            return {
              product: useProductParser(data),
              terms: useTermsParser(data.prices, data?.promotion_display_type),
              attributes: useSubproductParser(
                data.products_attributes,
                data?.promotion_display_type
              ),
              options: useSubproductParser(
                data.products_options,
                data?.promotion_display_type,
                model?.term?.billing_cycle_months
              ),
              provision_fields: useProvisioningParser(
                data.products_provisioning
              ),
            };
          },
          // summary: ({ model, lookups }, { data }) => {
          //   // use the display price as the initial price to use in the summary
          //   const display_price_formatted = data.display_price;
          //   const display_price = Number(
          //     data.display_price?.replace(/[^0-9.-]+/g, "")
          //   );
          //   return useSummaryParser({
          //     summary: {
          //       subtotal: display_price,
          //       subtotal_formatted: display_price_formatted,
          //       total: display_price,
          //       total_formatted: display_price_formatted,
          //     },
          //     model,
          //     lookups,
          //   });
          // },
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

        resetModel: assign({
          model: ({ baseModel }, _event) => clone(baseModel),
        }),

        setBaseModel: assign({
          baseModel: ({ model }, _event) => clone(model),
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
          summary: ({ model, lookups }, { data }) => {
            return useSummaryParser({
              summary: data,
              model,
              lookups,
            });
          },
        }),

        setSummaryCalculating: assign({
          summary: ({ summary }, _event) => {
            set(summary, "isCalculating", true);
            return summary;
          },
        }),

        calculate: sendTo(
          ({ calculateCallback }, _event) => calculateCallback,
          ({ currency_id, prices, model, lookups }, _event) => ({
            type: "CALCULATE",
            data: { currency_id, prices, model, lookups },
          })
        ),

        //  ---
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
          lookups: ({ lookups, raw }, { data }) => {
            // reset the lookup options options based on the term selected,
            //  as this may impact what price and options are available
            const billing_cycle_months = get(data, "term.billing_cycle_months");

            lookups.options = useSubproductParser(
              raw.products_options,
              raw?.promotion_display_type,
              billing_cycle_months
            );
            return lookups;
          },
          prices: ({ prices }, { data }) => {
            if (!data?.price) return prices;
            return { ...prices, term: data.price };
          },
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
        }),

        setProvisioning: assign({
          model: ({ model }, { data }) => {
            const provision_fields = get(data, "provision_fields");
            set(model, "provision_fields", provision_fields);
            return model;
          },
        }),

        // ---

        setDirty: assign({ isDirty: true }),
        setClean: assign({
          isDirty: false,
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
        hasChanged: (
          { model, basket_id, currency_id, promotions },
          { data }
        ) => {
          const newModel = merge({}, model, useModelParser(data));
          const value =
            !isEqual(newModel, model) ||
            basket_id !== data?.id ||
            currency_id !== data?.currency_id ||
            !isEqual(promotions, data?.promotions);
          return value;
        },
        needsCalculating: ({ prices }, { data }) => {
          // work out which property we need to compare
          let prop;
          prop ??= has(data, "term") ? "term" : null;
          prop ??= has(data, "options") ? "options" : null;
          prop ??= has(data, "attributes") ? "attributes" : null;

          return !!prop && data?.price && !isEqual(data?.price, prices[prop]);
        },
        hasSummaryData: (_context, { data }) => !isEmpty(data),
      },
      delays: {
        error: () => useTime().ERROR,
        wait: () => useTime().WAIT,
      },
    }
  );
};
