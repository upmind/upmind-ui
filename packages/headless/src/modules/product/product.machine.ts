// --- external
import { createMachine, assign, spawn, sendTo, pure, raise } from "xstate";

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";

// --utils
import { mapToHeadlessError, responseCodes, useTime } from "../../utils";
import {
  parseSubproductDetails,
  parseProvisioningSchema,
  parseProductDetails,
  parseTermDetails,
  parseModel,
  parseBasketProductModel,
  parseProduct,
  parseBundledProducts
} from "./utils";

import {
  cloneDeep,
  concat,
  forEach,
  isEmpty,
  isEqual,
  isNil,
  isObject,
  map,
  merge,
  omitBy,
  pick,
  remove,
  uniq,
  xorBy
} from "lodash-es";

import { calculateSubscription } from "./services";

// ---types
import type { AnyEventObject } from "xstate";
import type { BasketProduct } from "../basketProduct";
import type {
  ExternalError,
  PriceDisplay,
  ProductConfigContext,
  ProductModel
} from "./types";
import { transformProductDynamicValues } from "../basketProduct/utils";

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
          actions: "setBasketHelper"
        }
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
              actions: ["setLookups"]
            }
          ],
          onError: [
            {
              target: "subscribing",
              cond: "isUnauthorized"
            },
            {
              target: "error",
              actions: "setError"
            }
          ]
        }
      },

      refreshing: {
        id: "refreshing",
        invoke: {
          id: "refresh",
          src: "refresh",
          onDone: [
            {
              target: "available",
              actions: ["setLookups"]
            }
          ],
          onError: {
            target: "error",
            actions: "setError"
          }
        }
      },

      available: {
        initial: "checking",
        states: {
          checking: {
            entry: ["clearError"],
            initial: "parsing",
            states: {
              parsing: {
                invoke: {
                  src: "parse",
                  onDone: {
                    target: "validating",
                    actions: [
                      "setModel",
                      "calculate",
                      "setProduct"
                      // "setSchemas",
                    ]
                  }
                }
              },
              validating: {
                invoke: {
                  src: "validate",
                  onDone: {
                    target: "#valid"
                  },
                  onError: {
                    target: "#invalid",
                    actions: ["setError"]
                  }
                }
              }
            }
          },

          valid: {
            id: "valid"
          },

          invalid: {
            id: "invalid"
          },

          error: {}
        },
        on: {
          REFRESH: [
            {
              target: "refreshing",
              actions: ["refreshContext", "setExternalError"],
              cond: "hasBasketChanged"
            },
            {
              target: "available.error",
              actions: ["refreshContext", "setExternalError"],
              cond: "hasError"
            },
            {
              actions: ["refreshContext", "setExternalError"]
            }
          ],

          UPDATE: {
            target: "processing"
          },

          CALCULATING: {
            actions: ["setCalculating"]
          },

          CALCULATED: {
            actions: ["clearCalculating", "setProduct"]
          },
          // ---
          SET: {
            target: "available.invalid"
          },
          "SET.QUANTITY": {
            target: "available.checking"
          },
          "SET.TERM": {
            target: "available.checking"
          },
          "SET.ATTRIBUTES": {
            target: "available.checking"
          },
          "SET.OPTIONS": {
            target: "available.checking"
          },
          "SET.PROVISIONING": {
            target: "available.checking"
          }
        }
      },

      error: {},

      // this is a state where we hav ebeen deleted or are no longer available from a parent machine
      processing: {
        id: "processing",
        initial: "validating",
        states: {
          validating: {
            invoke: {
              src: "validate",
              onDone: {
                target: "updating",
                actions: ["update"]
              },
              onError: {
                target: "#invalid",
                actions: ["setError", "incrementAttempts"]
              }
            }
          },
          updating: {
            entry: ["clearError"],
            on: {
              PROCESSING: {
                // do nothing as we are already processing
              },
              UPDATED: [
                {
                  target: "bundling",
                  actions: ["addBundle"],
                  cond: "hasBundles"
                },
                { target: "#complete" }
              ]
            }
          },
          bundling: {
            on: {
              PROCESSING: {
                // do nothing as we are already'processing'
              },
              UPDATED: { target: "#complete" },
              ERROR: { target: "#complete" }, // fail silently > move on
              CANCEL: { target: "#complete" } // cancel the bundle > move on
            }
          }
        },

        on: {
          CANCEL: { target: "available" }
        }
      },

      // Handle completion, stop the machine and prevent further products
      complete: {
        id: "complete",
        type: "final"
      }
    },
    on: {
      STOP: "complete",
      RESET: {
        target: "refreshing",
        actions: ["resetModel"]
      },
      // if our halper tells us we are processing then we can go directly to the
      //  processing state
      PROCESSING: {
        target: "processing.updating"
      },
      ERROR: {
        target: "available.error",
        actions: ["setExternalError", "clearCalculating", "incrementAttempts"]
      },
      CALCULATE_CANCELLED: {
        actions: ["clearCalculating"]
      }
    }
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
            silent,
            bundle
          }: ProductConfigContext,
          _event: AnyEventObject
        ) => {
          return {
            errorExternal,
            error: merge({}, error),

            // ---
            basketId,
            clientId,
            currencyId,
            promotions: promotions ?? [],
            coupons: coupons ?? [],
            subproducts: subproducts ?? [],
            silent: silent ?? false,
            bundle: bundle ?? undefined,
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
            calculateCallback: spawn(calculateSubscription)
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
            rawBasketProduct
          }: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          const {
            basket_product,
            client_id,
            currency_id,
            promotions,
            error: errorExternal
          } = data;

          lookups ??= {};

          if (rawProduct) {
            lookups.product = parseProductDetails(rawProduct, rawBasketProduct);
          }

          if (rawBasketProduct && rawBasketProduct != basket_product) {
            console.warn(
              "Product Machine",
              "refresh",
              "basketProduct mismatch",
              {
                rawBasketProduct,
                basket_product
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
            error: merge({}, error),
            lookups
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
              id: item.id
            })
          };
        }
      ),
      // ---

      setLookups: assign({
        currencyId: (_context, { data }: AnyEventObject) =>
          data?.currency?.id || data?.currency_id,

        rawProduct: (_context, { data }: AnyEventObject) => data.product,
        lookups: (
          { model, rawBasketProduct, bundle }: ProductConfigContext,
          { data }: AnyEventObject
        ) => ({
          product: parseProductDetails(data.product, rawBasketProduct),
          terms: parseTermDetails(data.product.prices),
          options: parseSubproductDetails(
            data.product.products_options,
            model?.term
          ),
          attributes: parseSubproductDetails(data.product.products_attributes),
          provisionFields: parseProvisioningSchema(
            data.provisioning,
            data.product
          ),
          bundled: parseBundledProducts(data.product, bundle)
        })
      }),

      persistModel: assign({
        baseModel: ({ model }: ProductConfigContext, _event) => cloneDeep(model)
      }),

      setModel: assign({
        model: (_context, { data }: AnyEventObject) =>
          parseModel(data?.model ?? data),

        lookups: ({ lookups, rawProduct }, { data }: AnyEventObject) => {
          // reset the lookup options options based on the term selected,
          //  as this may impact what price and options are available
          lookups ??= {};
          lookups.options = parseSubproductDetails(
            rawProduct?.products_options,
            data.model?.term
          );

          lookups.prices = data.prices;

          return lookups;
        },

        errorExternal: (
          { errorExternal, model }: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          // Change in Logic...if we have interacted with the product,
          // we can clear the external errors and let our normal validation handle it
          return !isEqual(model?.provisionFields, data.model?.provisionFields)
            ? undefined
            : errorExternal;

          // DEPRECATED
          // lets parse/override our error message and data, specifically external errors.
          // For any dirty/hydrated field, remove any external error to allow for normal validation
          // Once the external error is removed, we dont ever want to show it again, unless we refresh the product
          // forEach(data.model.provisionFields, (field, key) => {
          //   if (
          //     !isEmpty(field) ||
          //     (!isNil(field) &&
          //       isObject(errorExternal) &&
          //       !isEmpty(errorExternal?.provisionFields))
          //   ) {
          //     remove(errorExternal!.provisionFields!, ["propertyName", key]);
          //   }
          // });
          // return omitBy(errorExternal, isEmpty) as ExternalError;
        }
      }),

      // restroring the model + errors to its prev state
      resetModel: assign({
        model: ({ baseModel }: ProductConfigContext, _event) =>
          cloneDeep(baseModel),
        error: ({ error, errorExternal }, _event) =>
          merge({}, error, errorExternal)
      }),

      // ---

      setProduct: assign({
        product: (
          {
            model,
            lookups,
            error,
            product,
            rawBasketProduct
          }: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          // if we don't have any value in the data, then fallback to the existing product.price if available
          // otherwise parse the data
          const fallback = product?.price;
          const price: PriceDisplay = {
            regularAmount: data?.total ?? fallback?.regularAmount,
            regularPrice: data?.totalFormatted ?? fallback?.regularPrice,
            currentAmount: data?.total ?? fallback?.currentAmount,
            currentPrice: data?.totalFormatted ?? fallback?.currentPrice,
            savingAmount: data?.total ? 0 : (fallback?.savingAmount ?? 0), // Cant calculate this
            savingPrice: data?.total ? "" : (fallback?.savingPrice ?? ""), // Cant calculate this
            savingPercent: data?.total ? "" : (fallback?.savingPercent ?? "") // Cant calculate this
          };

          return parseProduct(price, {
            model,
            lookups,
            error,
            rawBasketProduct
          });
        }
      }),

      setCalculating: assign({
        lookups: ({ lookups }: ProductConfigContext, _event) => {
          lookups ??= {};
          lookups.prices ??= {};
          lookups.prices.calculating = true;
          return lookups;
        }
      }),

      clearCalculating: assign({
        lookups: ({ lookups }: ProductConfigContext, _event) => {
          lookups ??= {};
          lookups.prices ??= {};
          lookups.prices.calculating = false;
          return lookups;
        }
      }),

      calculate: pure(
        (
          {
            calculateCallback,
            silent,
            currencyId,
            model,
            lookups
          }: ProductConfigContext,
          _event
        ) => {
          if (!calculateCallback || silent) return;
          return sendTo(calculateCallback, {
            type: "CALCULATE",
            data: { currencyId, model, lookups }
          });
        }
      ),

      update: pure((context: ProductConfigContext, _event) => {
        if (!context.basketHelper) return;
        const { model, rawBasketProduct } = context;

        // NB:ensure we ad dout basket product id to the model, so we update instead of add
        if (rawBasketProduct && model) model.id = rawBasketProduct.id;

        return sendTo(context.basketHelper, {
          type: "UPDATE",
          target: model,
          context
        });
      }),

      addBundle: pure(
        (context: ProductConfigContext, { data }: AnyEventObject) => {
          const basketProducts = data?.products || [];
          const { lookups } = context;

          if (
            !context.basketHelper ||
            !lookups?.bundled ||
            isEmpty(lookups?.bundled)
          ) {
            return raise({ type: "CANCEL" }); // Raise an error here or emit a cancel event
          }

          // NB: wew need to map our bundled products to ensure they have the correct dynamic values
          //  we use the basket returned after the UPDATE to resolve any dynamic values
          return sendTo(context.basketHelper, {
            type: "ADD_UPDATE_MANY",
            target: map(lookups.bundled, bundle => {
              return transformProductDynamicValues(bundle, basketProducts);
            }),
            context
          });
        }
      ),

      incrementAttempts: assign({
        attempts: ({ attempts }: ProductConfigContext) => {
          attempts = attempts || 0;
          attempts++;
          return attempts;
        }
      }),
      // ---

      setExternalError: assign({
        errorExternal: (
          _context: ProductConfigContext,
          { data }: AnyEventObject
        ) => data,
        error: (_context: ProductConfigContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),

      // TODO: @DC implement the new response errors from the API
      setError: assign({
        error: (_context: ProductConfigContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),

      clearError: assign({
        error: {}
      })
    },
    services,
    guards: {
      hasError: ({ error }: ProductConfigContext) => !isEmpty(error),

      hasBasketChanged: (
        {
          basketId,
          clientId,
          currencyId,
          promotions,
          rawBasketProduct
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

      hasBundles: ({
        lookups,
        rawProduct,
        silent,
        rawBasketProduct
      }: ProductConfigContext) => {
        // if we are silent or editing, then we are not bundled
        if (silent || !isEmpty(rawBasketProduct)) return false;
        return !isEmpty(lookups?.bundled);
      },

      isUnauthorized: (
        _context: ProductConfigContext,
        { data }: AnyEventObject
      ) => {
        // if we are not authorised,( ie our token is regenerated) then we should reset the machine
        // this is used to handle the case where the token has expired and cant be refreshed
        const error = mapToHeadlessError(data);
        return error?.code === responseCodes.Unauthorized;
      }
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    }
  }
);
