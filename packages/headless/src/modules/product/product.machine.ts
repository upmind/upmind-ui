// --- external
import { createMachine, assign, actions, spawn } from "xstate";
const { sendTo, raise } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";

// --utils
import { responseCodes } from "../../utils";
import { useTime, compactDeep, useValidationParser } from "../../utils";
import {
  parseSubproductDetails,
  parseProvisioningSchema,
  parseProductDetails,
  parseTermDetails,
  parseModel,
  parseBasketProductModel,
  parseProduct,
  useUischemaTitle,
  useProductName,
} from "./utils";

import {
  cloneDeep,
  compact,
  concat,
  xorBy,
  forEach,
  get,
  has,
  isEmpty,
  isEqual,
  isNil,
  isObject,
  merge,
  pick,
  remove,
  set,
  toNumber,
  unset,
  first,
  uniq,
} from "lodash-es";

import { calculateSubscription } from "./services";

// ---types
import type { AnyEventObject } from "xstate";
import type { BasketProduct } from "../basketProduct";
import type {
  PriceDisplay,
  ProductConfigContext,
  ProductModel,
  ProductSummaryDetailWithPrice,
} from "./types";
import { parseBasketProduct } from "../basketProduct/utils";

// -----------------------------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./product.machine.typegen").Typegen0,
    id: "productConfigurator",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as ProductConfigContext,
    states: {
      // this is our initial state where we are conditionally waiting for the basket helper to be created
      // this is so we can add/update our product to the basket
      subscribing: {
        entry: ["setContext"],
        // Parse our Basket/Config data into context
        always: {
          target: "loading",
          actions: "setBasketHelper",
        },
      },

      // first load our product, we do this even if we are given a valid set of values
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

      refreshing: {
        id: "refreshing",
        invoke: {
          id: "refresh",
          src: "refresh",
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
        initial: "invalid",
        states: {
          // The product requires configuration
          invalid: {
            id: "invalid",
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
                            "setProductCalculating",
                            "calculate",
                            raise("CHECK.OPTIONS"),
                          ],
                          cond: "needsCalculating",
                        },

                        {
                          target: "valid",
                          actions: [
                            "setTerm",
                            "setProduct",
                            raise("CHECK.OPTIONS"),
                          ],
                        },
                      ],
                      onError: [
                        {
                          target: "invalid",
                          actions: [
                            "setTerm",
                            "setError",
                            "setProductCalculating",
                            "calculate",
                          ],
                          cond: "needsCalculating",
                        },
                        {
                          target: "invalid",
                          actions: ["setTerm", "setProduct", "setError"],
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
                        actions: ["setAttributes", "setProduct"],
                      },
                      onError: {
                        target: "invalid",
                        actions: ["setAttributes", "setProduct", "setError"],
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
                            "setProductCalculating",
                            "calculate",
                          ],
                          cond: "needsCalculating",
                        },
                        {
                          target: "valid",
                          actions: ["setOptions", "setProduct"],
                        },
                      ],
                      onError: [
                        {
                          target: "invalid",
                          actions: [
                            "setOptions",
                            "setError",
                            "setProductCalculating",
                            "calculate",
                          ],
                          cond: "needsCalculating",
                        },
                        {
                          target: "invalid",
                          actions: ["setOptions", "setProduct", "setError"],
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
                    invoke: {
                      src: "checkProvisioning",
                      onDone: {
                        target: "valid",
                        actions: ["setProvisioning", "setProduct"],
                      },
                      onError: {
                        target: "invalid",
                        actions: ["setProvisioning", "setProduct", "setError"],
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
              { target: "valid" },
            ],
          },
          // this is our state where we are all good and can add/update this configuration to the basket
          valid: {},

          error: {},
        },
        on: {
          REFRESH: [
            {
              target: "refreshing",
              actions: ["refreshContext", "setError"],
              cond: "hasBasketChanged",
            },
            {
              target: "available.error",
              actions: ["refreshContext", "setError"],
              cond: "hasError",
            },
            {
              target: "available.invalid",
              actions: ["refreshContext", "setError"],
              cond: "hasChanged",
            },
          ],
          REMOVE: {
            actions: sendTo(
              ({ basketHelper }: ProductConfigContext, _event) => {
                if (!basketHelper)
                  throw new Error("basketHelper is not defined");

                return basketHelper;
              },
              (context: ProductConfigContext, _event) => {
                const { model, rawBasketProduct } = context;
                // NB:ensure we ad dout basket product id to the model, so we update instead of add
                if (rawBasketProduct && model) model.id = rawBasketProduct.id;

                return {
                  type: "REMOVE",
                  target: model,
                  context,
                };
              }
            ),
            target: "processing",
          },
          UPDATE: {
            actions: sendTo(
              ({ basketHelper }: ProductConfigContext, _event) => {
                if (!basketHelper)
                  throw new Error("basketHelper is not defined");

                return basketHelper;
              },
              (context: ProductConfigContext, _event) => {
                const { model, rawBasketProduct } = context;

                // NB:ensure we ad dout basket product id to the model, so we update instead of add
                if (rawBasketProduct && model) model.id = rawBasketProduct.id;

                return {
                  type: "UPDATE",
                  target: model,
                  context,
                };
              }
            ),
            target: "processing",
          },
          CALCULATE_CANCELLED: {
            actions: ["clearSummaryCalculating"],
          },
          CALCULATED: [
            {
              actions: ["clearSummaryCalculating", "setProduct"],
              cond: "hasSummaryData",
            },
            {
              actions: ["clearSummaryCalculating"],
            },
          ],
          // ---
          SET: {
            target: "available.invalid",
            actions: ["setModel"],
          },
          "SET.QUANTITY": {
            target: "available.invalid.quantity.checking",
            actions: ["setQuantity"],
          },
          "SET.TERM": {
            target: "available.invalid.term.checking",
            actions: ["setTerm"],
          },
          "SET.ATTRIBUTES": {
            target: "available.invalid.attributes.checking",
            actions: ["setAttributes"],
          },
          "SET.OPTIONS": {
            target: "available.invalid.options.checking",
            actions: ["setOptions"],
          },
          "SET.PROVISIONING": {
            target: "available.invalid.provisioning.checking",
            actions: ["setProvisioning"],
          },
        },
      },

      error: {
        on: {
          REMOVE: {
            actions: sendTo(
              ({ basketHelper }: ProductConfigContext, _event) => {
                if (!basketHelper)
                  throw new Error("basketHelper is not defined");

                return basketHelper;
              },
              (context: ProductConfigContext, _event) => ({
                type: "REMOVE",
                target: context.model,
                context,
              })
            ),
            target: "processing",
          },
        },
      },

      // this is a state where we hav ebeen deleted or are no longer available from a parent machine
      processing: {
        entry: "clearError",
        on: {
          CANCEL: [
            { target: "available.error", cond: "hasError" },
            { target: "available.invalid" },
          ],
          REMOVED: { target: "complete" },
          UPDATED: [
            { target: "complete", cond: "isNew" },
            {
              target: "complete",
              actions: ["persistModel", "calculate"],
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
      STOP: "complete",
      RESET: {
        target: "refreshing",
        actions: ["resetModel"],
      },
      PROCESSING: {
        target: "processing",
      },
      ERROR: {
        target: "available.error",
        actions: ["setError"],
      },
    },
  },
  {
    actions: {
      setContext: assign(
        (
          {
            // id,
            model,
            rawBasketProduct,
            currencyId,
            basketId,
            clientId,
            promotions,
            coupons,
            subproducts,
            errorExternal,
            error,
          }: ProductConfigContext,
          _event: AnyEventObject
        ) => {
          return {
            errorExternal,
            error: merge({}, errorExternal, error),
            // ---
            basketId,
            clientId,
            currencyId,
            promotions: promotions ?? [],
            coupons: coupons ?? [],
            subproducts: subproducts ?? [],
            // ---
            baseModel: !isEmpty(rawBasketProduct)
              ? parseBasketProductModel(rawBasketProduct)
              : model
                ? parseModel(model)
                : undefined,

            model: !isEmpty(rawBasketProduct)
              ? parseBasketProductModel(rawBasketProduct)
              : model
                ? parseModel(model)
                : undefined,

            // ---
            calculateCallback: spawn(calculateSubscription),
          };
        }
      ),
      refreshContext: assign(
        (
          {
            model,
            lookups,
            rawProduct,
            error,
            coupons,
            rawBasketProduct,
          }: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          const {
            basket_product,
            client_id,
            currency_id,
            promotions,
            error: errorExternal,
          } = data;

          lookups ??= {};

          if (rawProduct) {
            lookups.product = parseProductDetails(rawProduct);
          }

          if (rawBasketProduct && rawBasketProduct != basket_product) {
            console.warn(
              "Product Machine",
              "refresh",
              "basketProduct mismatch",
              {
                rawBasketProduct,
                basket_product,
              }
            );
          }

          const newContext = {
            clientId: client_id,
            currencyId: currency_id,
            promotions: uniq(concat(promotions ?? [], coupons ?? [])),
            coupons: coupons ?? [],
            rawBasketProduct: rawBasketProduct ?? basket_product, // ensure we honoure any given basket product
            baseModel: basket_product
              ? parseBasketProductModel(basket_product)
              : cloneDeep(model),
            model: basket_product
              ? parseBasketProductModel(basket_product)
              : cloneDeep(model),
            errorExternal,
            error: merge({}, errorExternal, error),
            lookups,
          };

          return newContext;
        }
      ),

      setBasketHelper: assign(
        ({ basketHelper, promotions }: ProductConfigContext) => {
          return {
            basketHelper: basketHelper || spawn(basketSubscription),
            parseBasketProduct: (item: ProductModel) => parseModel(item),
            parseBasketProductComparison: (item: BasketProduct) => ({
              id: item.id,
            }),
          };
        }
      ),
      // ---

      setLookups: assign({
        currencyId: (_context, { data }: AnyEventObject) =>
          data?.currency?.id || data?.currency_id,

        rawProduct: (_context, { data }: AnyEventObject) => data.product,
        lookups: (
          { model }: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          return {
            product: parseProductDetails(data.product),
            terms: parseTermDetails(
              data.product.prices,
              data.promotionDisplayType
            ),
            options: parseSubproductDetails(
              data.product.products_options,
              data?.promotionDisplayType,
              model?.term
            ),
            attributes: parseSubproductDetails(
              data.product.products_attributes,
              data?.promotionDisplayType
            ),
            provisionFields: parseProvisioningSchema(
              data.provisioning,
              data.product
            ),
          };
        },
      }),

      persistModel: assign({
        baseModel: ({ model }: ProductConfigContext, _event) =>
          cloneDeep(model),
      }),

      setModel: assign({
        model: (_context, { data }: AnyEventObject) =>
          parseModel(data?.product),
      }),

      // restroring the model + errors to its prev state
      resetModel: assign({
        model: ({ baseModel }: ProductConfigContext, _event) =>
          cloneDeep(baseModel),
        error: ({ error, errorExternal }, _event) =>
          merge({}, error, errorExternal),
      }),

      // ---

      setProduct: assign({
        product: (
          {
            model,
            lookups,
            error,
            product,
            rawBasketProduct,
          }: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          const fallback = product?.price;

          // parse new pricing data ( if provided ) with fallbacks
          const price: PriceDisplay = {
            regularAmount: data?.total ? data.total : fallback?.regularAmount,
            regularPrice: data?.total
              ? data?.totalFormatted
              : fallback?.regularPrice,
            currentAmount: data?.total ? data.total : fallback?.currentAmount,
            currentPrice: data?.total
              ? data.totalFormatted
              : fallback?.currentPrice,
            savingAmount: data?.total ? 0 : (fallback?.savingAmount ?? 0),
            savingPrice: data?.total ? "" : (fallback?.savingPrice ?? ""),
            savingPercent: data?.total ? "" : (fallback?.savingPercent ?? ""),
          };

          return parseProduct(price, {
            model,
            lookups,
            error,
          });
        },
      }),

      setProductCalculating: assign({
        lookups: ({ lookups }: ProductConfigContext, _event) => {
          lookups ??= {};
          lookups.prices ??= {};
          set(lookups.prices, "calculating", true);
          return lookups;
        },
      }),
      clearSummaryCalculating: assign({
        lookups: ({ lookups }: ProductConfigContext, _event) => {
          lookups ??= {};
          lookups.prices ??= {};
          set(lookups.prices, "calculating", false);
          return lookups;
        },
      }),

      calculate: sendTo(
        ({ calculateCallback }: ProductConfigContext, _event) => {
          if (!calculateCallback) {
            throw new Error("calculateCallback is not defined");
          }
          return calculateCallback;
        },
        ({ currencyId, model, lookups }: ProductConfigContext, _event) => ({
          type: "CALCULATE",
          data: { currencyId, model, lookups },
        })
      ),

      //  ---
      setQuantity: assign({
        model: ({ model }: ProductConfigContext, { data }: AnyEventObject) => {
          if (model) {
            const quantity: number = toNumber(get(data, "quantity", data)); // workaround to allow the same action to be used for different event sources
            set(model, "quantity", Math.max(1, quantity)); //TODO: min check? step check
          }
          return model;
        },
      }),

      setTerm: assign({
        model: ({ model }: ProductConfigContext, { data }: AnyEventObject) => {
          if (model) {
            let term = get(data, "term");
            term = isObject(term) ? (term as any)?.cycle : term;
            set(model, "term", term);
          }
          return model;
        },
        lookups: ({ lookups, rawProduct, model }, { data }: AnyEventObject) => {
          // reset the lookup options options based on the term selected,
          //  as this may impact what price and options are available
          lookups ??= {};
          lookups.options = parseSubproductDetails(
            rawProduct?.products_options,
            // @ts-ignore this is added by the setLookups action
            rawProduct?.promotionDisplayType,
            model?.term
          );

          lookups.prices ??= {};
          const prices = lookups?.prices;
          if (!data?.price) return lookups;
          lookups.prices = { ...prices, term: data.price };
          return lookups;
        },
      }),

      setAttributes: assign({
        model: ({ model }: ProductConfigContext, { data }: AnyEventObject) => {
          if (model) {
            const attributes = get(data, "attributes");
            set(model, "attributes", attributes);
          }
          return model;
        },
        lookups: (
          { lookups }: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          lookups ??= {};
          lookups.prices ??= {};
          const prices = lookups?.prices;
          if (!data?.price) return lookups;
          lookups.prices = { ...prices, attributes: data.price };
          return lookups;
        },
      }),

      setOptions: assign({
        model: ({ model }: ProductConfigContext, { data }: AnyEventObject) => {
          if (model) {
            const options = get(data, "options");
            set(model, "options", options);
          }
          return model;
        },
        lookups: (
          { lookups }: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          lookups ??= {};
          lookups.prices ??= {};
          const prices = lookups?.prices;
          if (!data?.price) return lookups;
          lookups.prices = { ...prices, options: data.price };
          return lookups;
        },
      }),

      setProvisioning: assign({
        model: ({ model }: ProductConfigContext, { data }: AnyEventObject) => {
          if (model) {
            const provisionFields = get(data, "provisionFields");
            set(model, "provisionFields", provisionFields);
          }
          return model;
        },
        error: ({ error }: ProductConfigContext, { data }: AnyEventObject) => {
          // lets parse/override our error message and data, specifically external errors.
          // For any dirty/hydrated field, remove any external error to allow for normal validation
          // Once the external error is removed, we dont ever want to show it again, unless we refresh the product
          const provisionFields = get(data, "provisionFields");

          if (!error?.provisionFields?.data?.length) return error;

          forEach(provisionFields, (field, key) => {
            if (!isEmpty(field) || !isNil(field)) {
              remove(error.provisionFields.data, ["schemaPath", key]);
            }
          });

          // housekeeping, if we have no errors, remove the provisionFields key
          if (isEmpty(error?.provisionFields?.data))
            unset(error, "provisionFields");

          return error;
        },
      }),

      // ---

      setError: assign({
        errorExternal: (
          _context: ProductConfigContext,
          { data }: AnyEventObject
        ) => data?.error,
        error: ({ error }: ProductConfigContext, { data }: AnyEventObject) => {
          let err = data?.error;

          if (!err) return error;

          if (err?.code == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            err = {
              provisionFields: useValidationParser(err),
            };
          }

          return merge({}, error, err);
        },
      }),

      clearError: assign({
        error: {},
      }),
    },
    services,
    guards: {
      isNew: ({ rawBasketProduct }: ProductConfigContext) =>
        isEmpty(rawBasketProduct),

      hasError: ({ error }: ProductConfigContext) => !isEmpty(error),

      hasChanged: (
        { model }: ProductConfigContext,
        { data }: AnyEventObject
      ) => {
        const cleanModel = compactDeep(model);
        debugger; // TODO: check if .basketProperty exusts on data
        const cleanProduct = data?.basketProduct
          ? compactDeep(parseBasketProductModel(data.basketProduct))
          : {};
        const isDirty =
          !isEmpty(cleanProduct) && !isEqual(cleanModel, cleanProduct);

        return isDirty;
      },

      hasBasketChanged: (
        {
          basketId,
          clientId,
          currencyId,
          promotions,
          rawBasketProduct,
        }: ProductConfigContext,
        { data }: AnyEventObject
      ) => {
        //  NB: data is raw basket data so use snake_case for comparison
        const clientChanged = clientId == data?.client_id!;
        const basketChanged = basketId !== data?.id;
        const currencyChanged = currencyId !== data?.currency_id;
        const promotionsChanged = !isEmpty(
          xorBy(promotions, data?.promotions, "promotion_id")
        );

        // lets see if any important value have changed within the basketProduct
        // dont compare the entire object, just the keys that are important to this machine
        const keys = ["id", "productId", "service_identifier"];
        // todo: check if bbasketProduct exists on data
        const basketPoductChanged = !isEqual(
          pick(data?.basketProduct, keys),
          pick(rawBasketProduct, keys)
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
        { lookups, product }: ProductConfigContext,
        { data }: AnyEventObject
      ) => {
        // work out which property we need to compare
        let prop;
        prop ??= has(data, "term") ? "term" : null;
        prop ??= has(data, "options") ? "options" : null;
        prop ??= has(data, "attributes") ? "attributes" : null;

        // safeguard: bail if we dont have a "summary" or a matching property to calculate
        if (!prop || !product) return false;

        const newPrice = compact(get(data, "price", []));
        const oldPrice = compact(get(lookups?.prices, prop, []));

        const value = !isEqual(oldPrice, newPrice);

        // console.debug("productConfig", "needsCalculating", value, {
        //   prop,
        //   newPrice,
        //   oldPrice,
        // });

        return value;
      },

      hasSummaryData: (
        _context: ProductConfigContext,
        { data }: AnyEventObject
      ) => !isEmpty(data),
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
  }
);
