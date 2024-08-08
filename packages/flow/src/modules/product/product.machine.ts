// --- external
import { createMachine, assign, actions, spawn } from "xstate";
const { sendTo, raise } = actions;

// --- internal
import services from "./services";
import { syncSubscription } from "../basket/helper";

// --utils
import { useTime, isDeepEmpty } from "../../utils";
import {
  buildBasketItem,
  parseSubproduct,
  parseProvisioningSchema,
  parseProduct,
  useTermsParser,
  parseModel,
  parseBasketProduct,
  parseSummary,
  parseAddirtionalErrors,
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
  omitBy,
} from "lodash-es";

import { useBrand } from "../brand";
import { calculateSubscription } from "./services";

// ---types
import type { ProductConfigContext, ProductConfigEvent } from "./types.d";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with a product
export default createMachine(
  {
    tsTypes: {} as import("./product.machine.typegen").Typegen0,
    id: "productConfigurator",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {},

    // Parse our Basket/Config data into context
    entry: "setContext",
    states: {
      // this is our initial state where we are conditionally waiting for the basket helper to be created
      // this is so we can add/update our product to the basket
      subscribing: {
        always: [
          {
            target: "loading",
            actions: "setBasketHelper",
            cond: "needsBasketHelper",
          },
          {
            target: "loading",
          },
        ],
      },

      // first load our product, we do this even if we are given a configured set of values
      //  as we need the additional 'with' properties
      loading: {
        id: "loading",
        invoke: {
          id: "load",
          src: "load",
          onDone: [{ target: "available", actions: ["setLookups"] }],
          onError: {
            target: "error",
            actions: "setError",
          },
        },
      },

      available: {
        initial: "configuring",
        states: {
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
                on: {},
              },
            },

            onDone: [
              { target: "configured", cond: "isDirty" },
              { target: "complete" },
            ],
          },

          // this is our state where we are all good and can add/update this configuration to the basket
          configured: {},
          complete: {},
          error: {},
        },
        on: {
          UPDATE: {
            actions: sendTo(
              ({ basketHelper }, _event) => basketHelper,
              (context, _event) => ({
                type: "UPDATE",
                target: context.model,
                context,
              })
            ),
            target: "processing",
          },
          CALCULATED: {
            actions: ["setSummary"],
            cond: "hasSummaryData",
          },
          // ---
          SET: {
            target: "available.configuring",
            actions: ["setModel"],
          },
          "SET.QUANTITY": {
            target: "available.configuring.quantity.checking",
            actions: ["setQuantity"],
          },
          "SET.TERM": {
            target: "available.configuring.term.checking",
            actions: ["setTerm"],
          },
          "SET.ATTRIBUTES": {
            target: "available.configuring.attributes.checking",
            actions: ["setAttributes"],
          },
          "SET.OPTIONS": {
            target: "available.configuring.options.checking",
            actions: ["setOptions"],
          },
          "SET.PROVISIONING": {
            target: "available.configuring.provisioning.checking",
            actions: ["setProvisioning"],
          },
        },
      },

      error: {},

      // this is a state where we hav ebeen deleted or are no longer available from a parent machine
      processing: {},

      // Handle completion, stop the machine and prevent further products
      complete: {
        type: "final",
      },
    },
    on: {
      RESET: {
        target: "loading",
        actions: ["resetModel"],
      },
      REFRESH: {
        target: "loading",
        actions: ["setModel", "setBaseModel", "setCurrency", "setPromotions"],
        cond: "hasChanged",
      },
      REMOVE: {
        actions: sendTo(
          ({ basketHelper }, _event) => basketHelper,
          (context, _event) => ({
            type: "REMOVE",
            target: context.model,
            context,
          })
        ),
        target: "processing",
      },
      PROCESSING: {
        target: "processing",
      },
      ERROR: { target: "available.error", actions: "setError" },
      REMOVED: { target: "complete" },
      UPDATED: [
        { target: "complete", cond: "isNew" },
        { target: "available.complete" },
      ],
    },
  },
  {
    actions: {
      setContext: assign(
        (
          {
            id,
            model,
            basket_product,
            currency_id,
            promotions,
            lookups,
          }: ProductConfigContext,
          _event
        ) => {
          console.debug("product.machine", "setContext", {
            id,
            model,
            basket_product,
            currency_id,
            promotions,
            lookups,
          });
          return {
            // ---
            currency_id: useBrand().validateCurrency(currency_id),
            promotions,
            // ---
            baseModel: !isEmpty(basket_product)
              ? parseBasketProduct({ id, ...basket_product })
              : parseModel({ id, ...model }),

            model: !isEmpty(basket_product)
              ? parseBasketProduct({ id, ...basket_product })
              : parseModel({ id, ...model }),
            // ---
            lookups: {
              product: basket_product?.product || lookups?.product,
              terms: lookups?.terms,
              options: lookups?.options,
              attributes: lookups?.attributes,
              provision_fields: lookups?.provision_fields,
            },
            // ---
            // config: {},
            // summary: {},
            // prices: {
            //   term: [],
            //   attributes: [],
            //   options: [],
            // },
            calculateCallback: spawn(calculateSubscription),
            // ---
            // error: {},
          };
        }
      ),
      setBasketHelper: assign(context => {
        return {
          basketHelper: spawn(syncSubscription),
          itemBuilder: item => parseModel(item),
          itemMapper: item => ({ id: item.id }),
          basketItemBuilder: item => buildBasketItem(item),
          basketItemMapper: item => ({
            id: item.id,
          }),
        };
      }),

      // ---
      setLookups: assign({
        raw: (_context, { data }) => data,

        lookups: ({ model }, { data }) => {
          return {
            product: parseProduct(data),
            terms: useTermsParser(data.prices, data?.promotion_display_type),
            attributes: parseSubproduct(
              data.products_attributes,
              data?.promotion_display_type
            ),
            options: parseSubproduct(
              data.products_options,
              data?.promotion_display_type,
              model?.term?.billing_cycle_months
            ),
            provision_fields: parseProvisioningSchema(
              data.products_provisioning
            ),
          };
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
        model: (_context, { data }) => parseModel(data?.product),
      }),

      resetModel: assign({
        model: ({ baseModel }, _event) => clone(baseModel),
      }),

      setBaseModel: assign({
        baseModel: ({ model }, _event) => clone(model),
      }),

      // ---

      setConfig: assign({
        config: ({ model }, _event) => buildBasketItem(model),
      }),

      // ---

      setSummary: assign({
        summary: ({ model, lookups }, { data }) => {
          return parseSummary({
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

          lookups.options = parseSubproduct(
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

      setError: assign({
        error: ({ error }, { data }) => {
          const err = data?.error || data;

          if (err?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            return {
              ...error,
              provision_fields: parseAddirtionalErrors(err),
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
      needsBasketHelper: ({ basket_id, basketHelper }: ProductConfigContext) =>
        Boolean(!!basket_id && !basketHelper),

      isNew: ({ basket_product }: ProductConfigContext) =>
        isEmpty(basket_product),

      isDirty: ({ model, baseModel, basket_product }: ProductConfigContext) => {
        const cleanModel = omitBy(model, isDeepEmpty);
        const cleanBaseModel = omitBy(baseModel, isDeepEmpty);
        return isEmpty(basket_product) || !isEqual(cleanModel, cleanBaseModel);
      },

      hasChanged: (
        { model, basket_id, currency_id, promotions }: ProductConfigContext,
        { data }: ProductConfigEvent
      ) => {
        const newModel = merge({}, model, parseModel(data));
        const value =
          !isEqual(newModel, model) ||
          basket_id !== data?.id ||
          currency_id !== data?.currency_id ||
          !isEqual(promotions, data?.promotions);
        return value;
      },
      needsCalculating: (
        { prices }: ProductConfigContext,
        { data }: ProductConfigEvent
      ) => {
        // work out which property we need to compare
        let prop;
        prop ??= has(data, "term") ? "term" : null;
        prop ??= has(data, "options") ? "options" : null;
        prop ??= has(data, "attributes") ? "attributes" : null;

        return !!prop && data?.price && !isEqual(data?.price, prices[prop]);
      },
      hasSummaryData: (
        _context: ProductConfigContext,
        { data }: ProductConfigEvent
      ) => !isEmpty(data),
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
  }
);
