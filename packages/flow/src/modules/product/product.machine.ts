// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate, sendParent } = actions;

// --- internal
import services from "./services";

// --utils
import { useTime } from "../../utils";
import {
  useAttributesParser,
  useProductConfigParser,
  useOptionsParser,
  useProvisioningParser,
  useProductParser,
  useTermsParser,
  useValuesParser,
  useSummaryParser,
  useValidationParser,
  useDisplayPriceParser,
} from "./utils";

import { get, set, map, toNumber, find, merge, isEqual } from "lodash-es";

import { useBrand } from "../brand";

// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with a product
export default (values, currency_id, promotions) => {
  const { validateCurrency } = useBrand();
  return createMachine(
    {
      tsTypes: {} as import("./product.machine.typegen").Typegen0,
      id: "productConfigurator",
      predictableActionArguments: true,
      initial: "loading",
      context: {
        // ---
        // the model use dto generate our coonfig,
        // but with better structure / more detail to make ut easier for any ui to consume,
        // and keep the generated config separate & clean
        values: useValuesParser(values),

        // we mark the config with flags to help us determine what to do with it
        // once we have finished configuring it
        isNew: !values?.id,
        isDirty: false,
        needsCalculating: !values?.invoice_total_amount, //if we have been given totals, the nwe dont need to calculate

        // ---
        // the various lookups that we are using in our configuation
        available: {
          product: values?.product,
          terms: null,
          options: null,
          attributes: null,
          provision_fields: null,
        },

        // ---
        // the generated summary of the configuration,
        // including the totals formatted for display
        summary: useSummaryParser(values),

        // use any applied promotions when fetching the product to get the correct prices
        promotions,
        currency_id: validateCurrency(currency_id),
        // ---
        error: null,
      },
      states: {
        // first load our product, we do this even if we are given a configured set of values
        //  as we need the additional 'with' properties
        loading: {
          invoke: {
            id: "load",
            src: "getProduct",
            onDone: [{ target: "processed", actions: ["setAvailable"] }],
            onError: {
              target: "#error",
              actions: ["setError", "escalateError"],
            },
          },
        },

        processed: {
          after: {
            wait: "configuring",
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
                      actions: ["setQuantity", "setConfig"],
                    },
                    onError: {
                      target: "invalid",
                      actions: ["setError", "escalateError"],
                    },
                  },
                },
                invalid: {},
                valid: {
                  type: "final",
                },
              },
              on: {
                "UPDATE.QUANTITY": {
                  target: "quantity.checking",
                  actions: ["setQuantity", "setCalculating"],
                },
              },
            },
            term: {
              initial: "checking",
              states: {
                checking: {
                  invoke: {
                    src: "checkTerm",
                    onDone: { target: "valid", actions: ["setTerm"] },
                    onError: {
                      target: "invalid",
                      actions: ["setError", "escalateError"],
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
                  actions: ["setTerm", "setConfig", "setCalculating"],
                },
              },
            },
            attributes: {
              initial: "checking",
              states: {
                checking: {
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
                  actions: ["setOptions", "setCalculating"],
                },
              },
            },
            provisioning: {
              initial: "checking",
              states: {
                checking: {
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
          on: {
            REFRESH: {
              target: "loading",
              actions: ["setValues", "setClean"],
              cond: "hasChanged",
            },
            UPDATE: {
              target: "processed",
              actions: ["setValues", "setDirty", "setCalculating"],
            },
            PUT: [
              {
                target: "processed",
                actions: ["mergeValues", "setDirty", "setCalculating"],
                cond: "hasChanged",
              },
            ],
          },
          onDone: [
            { target: "calculating", cond: "needsRecalculating" },
            { target: "configured" },
          ],
        },

        calculating: {
          invoke: {
            src: "calculateSummary",
            onDone: {
              target: "configured",
              actions: ["setSummary", "clearCalculating"],
            },
            // onError: { target: "error", actions: ["setError"] }
          },
        },

        // this is our state where we are all good and can add/update this configuration to the basket
        configured: {
          entry: ["setConfig", "sendConfig"],
          on: {
            REFRESH: {
              target: "loading",
              actions: ["setValues", "setClean"],
              cond: "hasChanged",
            },
            // ---
            UPDATE: {
              target: "processed",
              actions: ["setValues", "setDirty", "setCalculating"],
            },
            PUT: [
              {
                target: "processed",
                actions: ["mergeValues", "setDirty", "setCalculating"],
                cond: "hasChanged",
              },
            ],

            "UPDATE.QUANTITY": {
              target: "configuring.quantity.checking",
              actions: ["setQuantity", "setDirty", "setCalculating"],
            },
            "UPDATE.TERM": {
              target: "configuring.term.checking",
              actions: ["setTerm", "setDirty", "setCalculating"],
            },
            "UPDATE.ATTRIBUTES": {
              target: "configuring.attributes.checking",
              actions: ["setAttributes", "setDirty"],
            },
            "UPDATE.OPTIONS": {
              target: "configuring.options.checking",
              actions: ["setOptions", "setDirty", "setCalculating"],
            },
            "UPDATE.PROVISIONING": {
              target: "configuring.provisioning.checking",
              actions: ["setProvisioning", "setDirty"],
            },
          },
        },

        // Handle errors
        error: {
          id: "error",
          after: {
            error: "#configuring",
          },
        },

        // Handle completion, stop the machine and prevent further products
        // also send a message to the parent machine to remove the product
        // with the config that has been generated, just in case...
        complete: {
          id: "valid",
          type: "final",
          data: ({ values }, _event) => useProductConfigParser(values),
        },
      },
      on: {
        ERROR: { target: "#error", actions: ["setError"] },
        "CLEAR.ERRORS": { actions: ["clearError"] },
      },
    },
    {
      actions: {
        // ---
        setAvailable: assign({
          available: (_context, { data }) => {
            return {
              product: useProductParser(data),
              terms: useTermsParser(data.prices),
              attributes: useAttributesParser(data.products_attributes),
              options: useOptionsParser(data.products_options),
              provision_fields: useProvisioningParser(
                data.products_provisioning
              ),
            };
          },

          summary: ({ summary, isNew }, { data }) =>
            !isNew ? summary : useDisplayPriceParser(data),
        }),

        setValues: assign({
          currency_id: ({ currency_id }, { data }) =>
            data?.currency_id || currency_id,
          promotions: ({ promotions }, { data }) =>
            data?.promotions || promotions || [],
          values: (_context, { data }) => useValuesParser(data?.product),
          summary: (_context, { data }) => useSummaryParser(data?.product),
        }),

        mergeValues: assign({
          values: ({ values }, { data }) => {
            const newValues = merge({}, values, useValuesParser(data));
            return newValues;
          },
        }),

        // ---

        setConfig: assign({
          config: ({ values }, _event) => useProductConfigParser(values),
        }),

        sendConfig: sendParent(({ values }, _event) => ({
          type: "CONFIGURED",
          data: useProductConfigParser(values),
        })),

        // ---
        setSummary: assign({
          summary: (_context, { data }) => data,
        }),

        setQuantity: assign({
          values: ({ values }, { data }) => {
            const quantity: number = toNumber(get(data, "quantity", data)); // workaround to allow the same action to be used for different event sources
            set(values, "quantity", Math.max(1, quantity)); //TODO: min check? step check
            return values;
          },
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
                  term?.billing_cycle_months,
                ]);
                return value;
              });

              return option;
            });
            return available;
          },
        }),

        setAttributes: assign({
          values: ({ values }, { data }) => {
            const attributes = get(data, "attributes", data); // workaround to allow the same action to be used for different event sources
            set(values, "attributes", attributes);
            return values;
          },
        }),

        setOptions: assign({
          values: ({ values }, { data }) => {
            const options = get(data, "options", data); // workaround to allow the same action to be used for different event sources
            set(values, "options", options);
            return values;
          },
        }),

        setProvisioning: assign({
          values: ({ values }, { data }) => {
            const provision_fields = get(data, "provision_fields", data); // workaround to allow the same action to be used for different event sources
            set(values, "provision_fields", provision_fields);
            return values;
          },
        }),

        // ---

        setCalculating: assign({
          needsCalculating: (_context, _event) => {
            // TODO: a more comprehensive check to see if values have actually changed.
            // For now we will always set this to true, as we need to recalculate the summary
            return true;
          },
        }),

        clearCalculating: assign({ needsCalculating: false }),
        setDirty: assign({ isDirty: true }),
        setClean: assign({
          isDirty: false,
          needsCalculating: false,
          error: null,
        }),

        // ---

        setError: assign({
          error: (context, { data }) => {
            let error = data?.error;
            if (error?.code == 422) {
              // lets parse/override our error message and data
              // this is to generate valid json schema validation errors
              error = useValidationParser(error);
            }

            return error;
          },
        }),

        escalateError: escalate(({ error }) => {
          if (error) {
            error.title = "We experienced an error configuring the product";
          }
          return error;
        }),

        clearError: assign({ error: null }),
      },
      services,
      guards: {
        needsRecalculating: ({ needsCalculating }) => needsCalculating,
        hasChanged: ({ values }, { data }) => {
          const newValues = merge({}, values, useValuesParser(data));
          return !isEqual(newValues, values);
        },
      },
      delays: {
        error: () => useTime().ERROR,
        wait: () => useTime().WAIT,
      },
    }
  );
};
