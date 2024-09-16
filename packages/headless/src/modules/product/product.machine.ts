// --- external
import { createMachine, assign, actions, spawn } from "xstate";
const { sendTo, raise } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basket/helper";

// --utils
import { responseCodes } from "../api";
import { useTime, compactDeep, useValidationParser } from "../../utils";
import {
  buildBasketItem,
  parseSubproduct,
  parseProvisioningSchema,
  parseProduct,
  parseTerms,
  parseModel,
  parseBasketProduct,
  parseSummary,
} from "./utils";

import {
  cloneDeep,
  compact,
  differenceBy,
  forEach,
  get,
  has,
  isEmpty,
  isEqual,
  isNil,
  merge,
  pick,
  remove,
  set,
  toNumber,
  unset,
} from "lodash-es";

import { calculateSubscription } from "./services";

// ---types
import type { ProductConfigContext, ProductConfigEvent } from "./types";
// --------------------------------------------------------
// as this is a sub machine, we need to be initialised with a product
export default createMachine(
  {
    tsTypes: {} as import("./product.machine.typegen").Typegen0,
    id: "productConfigurator",
    predictableActionArguments: true,
    initial: "subscribing",
    // @ts-ignore
    context: {},
    states: {
      // this is our initial state where we are conditionally waiting for the basket helper to be created
      // this is so we can add/update our product to the basket
      subscribing: {
        entry: "setContext",
        // Parse our Basket/Config data into context
        always: {
          target: "loading",
          actions: "setBasketHelper",
        },
      },

      // first load our product, we do this even if we are given a configured set of values
      //  as we need the additional 'with' properties
      loading: {
        id: "loading",
        invoke: {
          id: "load",
          src: "load",
          onDone: [
            {
              target: "available",
              actions: ["setLookups"],
            },
          ],
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
                    // entry: ({ error }) => unset(error, "provision_fields"),
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
              { target: "error", cond: "hasError" },
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
          REFRESH: [
            {
              target: "loading",
              actions: ["refreshContext"],
              cond: "hasBasketChanged",
            },
            {
              target: "available.configuring",
              actions: ["refreshContext"],
              cond: "hasChanged",
            },
          ],
          REMOVE: {
            actions: sendTo(
              // @ts-ignore
              ({ basketHelper }, _event) => basketHelper,
              (context, _event) => ({
                type: "REMOVE",
                target: context.model,
                context,
              })
            ),
            target: "processing",
          },
          UPDATE: {
            actions: sendTo(
              // @ts-ignore
              ({ basketHelper }, _event) => basketHelper,
              (context, _event) => ({
                type: "UPDATE",
                target: context.model,
                context,
              })
            ),
            target: "processing",
          },
          CALCULATED: [
            {
              actions: ["clearSummaryCalculating", "setSummary"],
              cond: "hasSummaryData",
            },
            {
              actions: ["clearSummaryCalculating"],
            },
          ],
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
      processing: {
        entry: "clearError",
        on: {
          CANCEL: [
            { target: "available.error", cond: "hasError" },
            { target: "available.configuring" },
          ],
          REMOVED: { target: "complete" },
          UPDATED: [
            { target: "complete", cond: "isNew" },
            {
              target: "available.complete",
              actions: ["setBaseModel", "calculate"],
            },
          ],
        },
      },

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
      PROCESSING: {
        target: "processing",
      },
      ERROR: {
        actions: ["setError"],
      },
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
            basket_id,
            client_id,
            promotions,
          }: ProductConfigContext,
          _event: ProductConfigEvent
        ) => {
          return {
            // ---
            basket_id,
            client_id,
            currency_id,
            promotions,
            // ---
            baseModel: !isEmpty(basket_product)
              ? parseBasketProduct({ id, ...basket_product })
              : parseModel({ id, ...model }),

            model: !isEmpty(basket_product)
              ? parseBasketProduct({ id, ...basket_product })
              : parseModel({ id, ...model }),

            // ---
            calculateCallback: spawn(calculateSubscription),
          };
        }
      ),
      refreshContext: assign(
        (
          { model, lookups, raw }: ProductConfigContext,
          { data }: ProductConfigEvent
        ) => {
          const { basket_product, client_id, currency_id, promotions, error } =
            data;

          lookups.product = parseProduct(raw, basket_product);

          const newContext = {
            client_id,
            currency_id,
            promotions,
            basket_product,
            baseModel: basket_product
              ? parseBasketProduct(basket_product)
              : cloneDeep(model),
            model: basket_product
              ? parseBasketProduct(basket_product)
              : cloneDeep(model),
            errorExternal: error,
            prices: undefined, // they need to be recalculated
            lookups,
          };

          return newContext;
        }
      ),

      setBasketHelper: assign(({ basketHelper }: any) => {
        return {
          basketHelper: basketHelper || spawn(basketSubscription),
          itemBuilder: (item: any) => parseModel(item),
          itemMapper: (item: any) => ({ id: item.id }),
          basketItemBuilder: (item: any) => buildBasketItem(item),
          basketItemMapper: (item: any) => ({
            id: item.id,
          }),
        };
      }),
      // ---

      setLookups: assign({
        raw: (_context, { data }: any) => data.product,

        lookups: ({ model, basket_product }: any, { data }) => {
          return {
            product: parseProduct(data.product, basket_product),
            terms: parseTerms(data.product.prices, data.promotion_display_type),
            attributes: parseSubproduct(
              data.product.products_attributes,
              data?.promotion_display_type
            ),
            options: parseSubproduct(
              data.product.products_options,
              data?.promotion_display_type,
              model?.term?.billing_cycle_months
            ),
            provision_fields: parseProvisioningSchema(
              data.product.products_provisioning
            ),
          };
        },
      }),

      setBaseModel: assign({
        baseModel: ({ model }: any, _event) => cloneDeep(model),
      }),
      setModel: assign({
        model: (_context, { data }: any) => parseModel(data?.product),
      }),

      // restroring the model + errors to its prev state
      resetModel: assign({
        model: ({ baseModel }: any, _event) => cloneDeep(baseModel),
        error: ({ error, errorExternal }, _event) =>
          merge({}, error, errorExternal),
      }),

      // ---

      setSummary: assign({
        summary: ({ model, lookups, error }: any, { data }) =>
          parseSummary({
            summary: data,
            model,
            lookups,
            error,
          }),
      }),

      setSummaryCalculating: assign({
        summary: ({ summary }: any, _event) => {
          set(summary, "isCalculating", true);
          return summary;
        },
      }),
      clearSummaryCalculating: assign({
        summary: ({ summary }: any, _event) => {
          set(summary, "isCalculating", false);
          return summary;
        },
      }),

      calculate: sendTo(
        ({ calculateCallback }, _event) => calculateCallback,
        ({ currency_id, prices, model, lookups }: any, _event) => ({
          type: "CALCULATE",
          data: { currency_id, prices, model, lookups },
        })
      ),

      //  ---
      setQuantity: assign({
        model: ({ model }: any, { data }) => {
          const quantity: number = toNumber(get(data, "quantity", data)); // workaround to allow the same action to be used for different event sources
          set(model, "quantity", Math.max(1, quantity)); //TODO: min check? step check
          return model;
        },
      }),

      setTerm: assign({
        model: ({ model }: any, { data }) => {
          const term = get(data, "term");
          set(model, "term", term);
          return model;
        },
        lookups: ({ lookups, raw }, { data }) => {
          // reset the lookup options options based on the term selected,
          //  as this may impact what price and options are available
          const billing_cycle_months = get(data, "term.billing_cycle_months");

          lookups.options = parseSubproduct(
            raw?.products_options,
            raw?.promotion_display_type,
            billing_cycle_months
          );
          return lookups;
        },
        prices: ({ prices }, { data }: any) => {
          if (!data?.price) return prices;
          return { ...prices, term: data.price };
        },
      }),

      setAttributes: assign({
        model: ({ model }: any, { data }) => {
          const attributes = get(data, "attributes");
          set(model, "attributes", attributes);
          return model;
        },
        prices: ({ prices }: any, { data }: any) => {
          if (!data?.price) return prices;
          return { ...prices, attributes: data.price };
        },
      }),

      setOptions: assign({
        model: ({ model }: any, { data }) => {
          const options = get(data, "options");
          set(model, "options", options);
          return model;
        },
        prices: ({ prices }, { data }: any) => {
          if (!data?.price) return prices;
          return { ...prices, options: data.price };
        },
      }),

      setProvisioning: assign({
        model: ({ model }: any, { data }) => {
          const provision_fields = get(data, "provision_fields");
          set(model, "provision_fields", provision_fields);
          return model;
        },
        error: ({ error }: any, { data }) => {
          // lets parse/override our error message and data, specifically external errors.
          // For any dirty/hydrated field, remove any external error to allow for normal validation
          // Once the external error is removed, we dont ever want to show it again, unless we refresh the product
          const provision_fields = get(data, "provision_fields");

          if (!error?.provision_fields?.data?.length) return error;

          forEach(provision_fields, (field, key) => {
            if (!isEmpty(field) || !isNil(field)) {
              remove(error.provision_fields.data, ["schemaPath", key]);
            }
          });

          // housekeeping, if we have no errors, remove the provision_fields key
          if (isEmpty(error?.provision_fields?.data))
            unset(error, "provision_fields");

          return error;
        },
      }),

      // ---

      setError: assign({
        errorExternal: (_context, { data }: any) => data?.error,
        error: ({ error }: any, { data }) => {
          let err = data?.error;

          if (!err) return error;

          if (err?.code == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            err = {
              provision_fields: useValidationParser(err),
            };
          }

          return merge({}, error, err);
        },
      }),

      // setProvisioningErrors: assign({
      //   error: ({ error, errorExternal }, { data }) => {
      //     const cleanedError = merge({}, error, errorExternal);

      //     // lets parse/override our error message and data, specifically external errors.
      //     // For any dirty/hydrated field, remove any external error to allow for normal validation
      //     // Once the external error is removed, we dont ever want to show it again, unless we refresh the product
      //     const provision_fields = get(data, "provision_fields");

      //     if (!cleanedError?.provision_fields?.data?.length)
      //       return cleanedError;

      //     forEach(provision_fields, (field, key) => {
      //       if (!isNil(field)) {
      //         remove(cleanedError.provision_fields.data, ["schemaPath", key]);
      //       }
      //     });

      //     // housekeeping, if we have no cleanedErrors, remove the provision_fields key
      //     if (isEmpty(cleanedError?.provision_fields?.data))
      //       unset(cleanedError, "provision_fields");

      //     return cleanedError;
      //   },
      // }),

      clearError: assign({
        error: {},
      }),
    },
    services,
    guards: {
      isNew: ({ basket_product }: ProductConfigContext) =>
        isEmpty(basket_product),

      isDirty: ({ model, baseModel, basket_product }: ProductConfigContext) => {
        const cleanModel = compactDeep(model);
        const cleanBaseModel = compactDeep(baseModel);
        const value =
          isEmpty(basket_product) || !isEqual(cleanModel, cleanBaseModel);

        return value;
      },
      hasError: ({ error }: ProductConfigContext) => !isEmpty(error),

      hasChanged: (
        { model }: ProductConfigContext,
        { data }: ProductConfigEvent
      ) => {
        const cleanModel = compactDeep(model);
        const cleanProduct = data?.basket_product
          ? compactDeep(parseBasketProduct(data.basket_product))
          : {};
        const isDirty =
          !isEmpty(cleanProduct) && !isEqual(cleanModel, cleanProduct);

        return isDirty;
      },
      hasBasketChanged: (
        {
          basket_id,
          client_id,
          currency_id,
          promotions,
          basket_product,
        }: ProductConfigContext,
        { data }: ProductConfigEvent
      ) => {
        const clientChanged = data?.client_id !== client_id;
        const basketChanged = basket_id !== data?.id;
        const currencyChanged = currency_id !== data?.currency_id;
        const promotionsChanged = !isEmpty(
          differenceBy(promotions, data?.promotions, "promotion_id")
        );

        // lets see if any important value have changed within the basket_product
        // dont compare the entire object, just the keys that are important to this machine
        const keys = ["id", "product_id", "service_identifier"];
        const basketPoductChanged = !isEqual(
          pick(data?.basket_product, keys),
          pick(basket_product, keys)
        );

        const value =
          basketChanged ||
          clientChanged ||
          currencyChanged ||
          promotionsChanged ||
          basketPoductChanged;

        return value;
      },

      needsCalculating: (
        { prices, summary }: ProductConfigContext,
        { data }: ProductConfigEvent
      ) => {
        // work out which property we need to compare
        let prop;
        prop ??= has(data, "term") ? "term" : null;
        prop ??= has(data, "options") ? "options" : null;
        prop ??= has(data, "attributes") ? "attributes" : null;

        if (!prop) return false;

        const newPrice = compact(get(data, "price", []));
        const oldPrice = compact(get(prices, prop, []));

        const value = !summary || !prop || !isEqual(oldPrice, newPrice);

        // console.debug("productConfig", "needsCalculating", value, {
        //   prop,
        //   newPrice,
        //   oldPrice,
        // });

        return value;
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
