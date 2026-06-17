// --- external
import { createMachine, assign, spawn, sendTo, pure, raise } from "xstate";

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";

// --utils
import {
  compactDeep,
  mapToHeadlessError,
  responseCodes,
  useModelParser,
  useTime
} from "../../utils";
import {
  parseSubproductDetails,
  parseProductDetails,
  parseTermDetails,
  parseModel,
  parseBasketProductModel,
  parseProduct,
  parseBundledProducts,
  mergeBasketSubproducts,
  hasNonOrderableSubproducts
} from "./utils";

import { useProductConfigSchema, useProductConfigUischema } from "./schemas";

import {
  cloneDeep,
  compact,
  filter,
  find,
  get,
  isArray,
  isEmpty,
  isEqual,
  map,
  merge,
  split,
  trimStart,
  xorBy
} from "lodash-es";

import { calculateActor } from "../../utils";
import {
  buildPriceEntries,
  checkPriceOverride,
  getOutstandingBasketErrors
} from "./utils";

// ---types
import type { AnyEventObject } from "xstate";
import type { BasketProduct } from "../basketProduct";
import type { PriceDisplay, ProductConfigContext, ProductModel } from "./types";
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
        id: "subscribing",
        entry: ["setContext"],
        // Parse our Basket/Config data into context
        always: {
          target: "loading",
          actions: "setBasketHelper"
        }
      },

      // first load our product, we do this even if we are given a valid set of values
      //  as we need the additional 'with' properties
      // WE also parse the model to ensure its prepoulated correctly with and provided configuration
      loading: {
        id: "loading",
        initial: "lookups",
        states: {
          lookups: {
            invoke: {
              src: "load",
              onDone: [
                {
                  target: "model",
                  actions: [
                    "initModel",
                    "setLookups",
                    "setSchemas",
                    "setProduct",
                    "persistModel"
                  ]
                }
              ],
              onError: [
                {
                  target: "#subscribing",
                  cond: "isUnauthorized"
                },
                {
                  target: "#unavailable",
                  actions: "setError"
                }
              ]
            }
          },
          model: {
            invoke: {
              src: "parse",
              onDone: [
                {
                  target: "#available",
                  actions: [
                    "setProduct",
                    "setModel",
                    "setSchemas",
                    "persistModel"
                  ]
                }
              ],
              onError: [
                {
                  target: "#subscribing",
                  cond: "isUnauthorized"
                },
                {
                  target: "#unavailable",
                  actions: "setError"
                }
              ]
            }
          }
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
              actions: ["setLookups", "setSchemas"]
            }
          ],
          onError: {
            target: "unavailable",
            actions: "setError"
          }
        }
      },

      available: {
        id: "available",
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
                      "setSchemas",
                      "calculate",
                      "setProduct"
                    ]
                  }
                }
              },
              validating: {
                invoke: {
                  src: "validate",
                  onDone: [
                    {
                      // finish validation in `invalid`, not `valid`: the setup
                      // flow disables its Continue button while invalid
                      target: "#invalid",
                      // true while the offending field (e.g. the domain) still
                      // holds the value the BE rejected — i.e. not yet fixed
                      cond: "hasOutstandingErrors"
                    },
                    { target: "#valid" }
                  ],
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
              target: "loading",
              actions: ["clearError", "refreshContext"],
              cond: "hasCurrencyChanged"
            },
            {
              target: "refreshing",
              actions: ["clearError", "refreshContext"],
              cond: "hasBasketChanged"
            },
            {
              target: "available.error",
              actions: ["refreshContext"],
              cond: "hasError"
            },
            {
              // Default: refresh context and re-validate (model may have changed)
              target: "available.checking",
              actions: ["refreshContext"]
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
            target: "available.checking"
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
          },
          "SET.TRIAL": {
            target: "available.checking"
          }
        }
      },

      // this is a state where we hav ebeen deleted or are no longer available from a parent machine
      processing: {
        id: "processing",
        initial: "validating",
        states: {
          validating: {
            invoke: {
              src: "validate",
              onDone: [
                {
                  // on confirm, route to `invalid` so the update never runs —
                  // the confirm button stays enabled, it just can't proceed
                  target: "#invalid",
                  // true while the offending field (e.g. the domain) still
                  // holds the value the BE rejected — i.e. not yet fixed
                  cond: "hasOutstandingErrors"
                },
                {
                  target: "updating",
                  actions: ["update"],
                  cond: "isDirty"
                },
                { target: "#processed" }
              ],
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
                { target: "#processed", actions: ["persistModel"] }
              ]
            }
          },
          bundling: {
            on: {
              PROCESSING: {
                // do nothing as we are already'processing'
              },
              UPDATED: { target: "#processed" },
              ERROR: { target: "#processed" }, // fail silently > move on
              CANCEL: { target: "#processed" } // cancel the bundle > move on
            }
          }
        },

        on: {
          CANCEL: { target: "available" }
        }
      },

      unavailable: {
        id: "unavailable",
        on: {
          REFRESH: {
            target: "loading",
            actions: ["refreshContext"]
          }
        }
      },

      // Decide whether to continue editing or stop
      processed: {
        id: "processed",
        always: [
          { target: "#available", cond: "continueEditing" },
          { target: "#complete" }
        ]
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
        actions: [
          "setExternalError",
          "clearCalculating",
          "clearSilent",
          "incrementAttempts"
        ]
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
            basketErrors,
            error,
            silent,
            bundle
          }: ProductConfigContext,
          _event: AnyEventObject
        ) => {
          return {
            basketErrors: get(basketErrors, rawBasketProduct?.id ?? ""),
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
            readonly: hasNonOrderableSubproducts(rawBasketProduct),
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
            calculateCallback: spawn(calculateActor())
          };
        }
      ),
      refreshContext: assign(
        (context: ProductConfigContext, { data }: AnyEventObject) => {
          let { model, lookups, rawProduct, coupons, rawBasketProduct } =
            context;

          let {
            client_id,
            currency_id,
            promotions,
            products,
            error: basketErrors
          } = data ?? {};

          // Basket refresh sends full basket, not individual products - find ours by ID
          // this ensure any changes to our basketProduct are not stale
          const basketProduct = rawBasketProduct?.id
            ? find(products, { id: rawBasketProduct.id })
            : undefined;

          lookups ??= {};

          if (rawProduct) {
            lookups.product = parseProductDetails(rawProduct, basketProduct);
          }

          // Update baseModel from new basket data, merge into model preserving user edits.
          // compactDeep strips nulls from model so basket values fill in, but actual user edits win.
          const newBaseModel = basketProduct
            ? parseBasketProductModel(basketProduct)
            : cloneDeep(model);

          const newModel = useModelParser<ProductModel>(
            context.schema,
            compactDeep(model),
            newBaseModel
          );

          const newContext = {
            clientId: client_id,
            currencyId: currency_id,
            currencyCode: undefined, // we reset any given currency code after refresh to prevent going out of sync
            promotions: promotions ?? [],
            coupons: coupons ?? [],
            rawBasketProduct: basketProduct, // ensure we honoure any given basket product
            readonly: hasNonOrderableSubproducts(basketProduct),
            baseModel: newBaseModel,
            model: newModel,
            // Fresh basket errors for this product - keyed by product ID in the full basket errors object
            basketErrors: get(basketErrors, basketProduct?.id ?? ""),
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
        rawProvisionFields: (_context, { data }: AnyEventObject) =>
          data.rawProvisionFields,
        lookups: (
          { model, rawBasketProduct, bundle }: ProductConfigContext,
          { data }: AnyEventObject
        ) => ({
          product: parseProductDetails(data.product, rawBasketProduct),
          terms: parseTermDetails(
            data.product,
            rawBasketProduct?.price_option_override
          ),
          options: parseSubproductDetails(
            mergeBasketSubproducts(
              data.product.products_options,
              rawBasketProduct?.options
            ),
            model?.term,
            data?.currency?.id
          ),
          attributes: parseSubproductDetails(
            mergeBasketSubproducts(
              data.product.products_attributes,
              rawBasketProduct?.attributes
            )
          ),
          provisionFields: data.rawProvisionFields,
          bundled: parseBundledProducts(data.product, bundle)
        })
      }),

      setSchemas: assign({
        schema: (context: ProductConfigContext) =>
          useProductConfigSchema(context),
        uischema: (context: ProductConfigContext) =>
          useProductConfigUischema(context)
      }),

      persistModel: assign({
        baseModel: ({ model }: ProductConfigContext, _event) => cloneDeep(model)
      }),

      initModel: assign({
        model: (_context, { data }: AnyEventObject) => parseModel(data.model)
      }),

      setModel: assign({
        model: (_context, { data }: AnyEventObject) =>
          parseModel(data?.model ?? data),
        lookups: ({ lookups }, { data }: AnyEventObject) =>
          data?.lookups ?? lookups ?? {},
        rawProvisionFields: (
          { rawProvisionFields },
          { data }: AnyEventObject
        ) => data?.rawProvisionFields ?? rawProvisionFields ?? {}
      }),

      // restroring the model + errors to its prev state
      resetModel: assign({
        model: ({ baseModel }: ProductConfigContext, _event) =>
          cloneDeep(baseModel),
        error: ({ error, basketErrors }, _event) =>
          merge({}, error, basketErrors)
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
          if (!calculateCallback || silent || !currencyId) return;
          const overrides =
            !!model?.options &&
            !!lookups?.options &&
            checkPriceOverride(model.options, lookups.options);
          const input = buildPriceEntries(lookups?.prices ?? {}, overrides);
          return sendTo(calculateCallback, {
            type: "CALCULATE",
            data: { currencyId, input }
          });
        }
      ),

      update: pure((context: ProductConfigContext, _event) => {
        if (!context.basketHelper) return;
        const { model, rawBasketProduct, coupons, silent } = context;

        // NB:ensure we ad dout basket product id to the model, so we update instead of add
        if (rawBasketProduct && model) model.id = rawBasketProduct.id;

        return sendTo(context.basketHelper, {
          type: "UPDATE",
          target: { ...model, silent, coupons },
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
          attempts = attempts ?? 0;
          attempts++;
          return attempts;
        }
      }),

      clearSilent: assign({
        // silent: false
      }),
      // ---

      setExternalError: assign({
        // field-level array → additionalErrors; anything else is a
        // request-level error for the generic externalErrors slot
        basketErrors: (
          _context: ProductConfigContext,
          { data }: AnyEventObject
        ) => {
          // normalise the thrown value / API error into a ResponseError
          const mapped = mapToHeadlessError(data);
          // a 422's per-field errors arrive in `data` as an array; anything
          // else (e.g. a thrown error's string) is a request-level error
          const mappedData = mapped?.data;
          if (isArray(mappedData)) return mappedData;
          return mapped;
        },
        // snapshot the values the BE just rejected, so getOutstandingBasketErrors
        // can tell when the user later edits the offending field (e.g. the domain)
        rejectedModel: ({ model }: ProductConfigContext) => cloneDeep(model)
      }),

      setError: assign({
        error: (_context: ProductConfigContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),

      clearError: assign({
        error: []
      })
    },
    services,
    guards: {
      hasError: ({ error }: ProductConfigContext) => !isEmpty(error),

      hasBasketChanged: (
        {
          basketId,
          clientId,
          promotions,
          rawBasketProduct
        }: ProductConfigContext,
        { data }: AnyEventObject
      ) => {
        //  NB: data is raw basket data so use snake_case for comparison

        const clientChanged = clientId !== data?.client_id!;
        const basketChanged = basketId !== data?.id;
        const promotionsChanged = !isEmpty(
          xorBy(promotions, data?.promotions, "promotion_id")
        );

        // NB check if our underlying basketProduct has changed as well ( if we have one )
        const basketProductChanged =
          !!rawBasketProduct &&
          !isEqual(
            find(data?.products, ["id", rawBasketProduct?.id]),
            rawBasketProduct
          );

        const value =
          basketChanged ||
          clientChanged ||
          promotionsChanged ||
          basketProductChanged;

        return value;
      },

      hasCurrencyChanged: (
        { currencyId }: ProductConfigContext,
        { data }: AnyEventObject
      ) => currencyId !== data?.currency_id,

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

      isDirty: ({
        model,
        baseModel,
        rawBasketProduct
      }: ProductConfigContext) => {
        return !rawBasketProduct || !isEqual(model, baseModel);
      },

      // an outstanding field error (e.g. a domain in use) keeps the product
      // invalid so confirm can't proceed — without disabling the button
      hasOutstandingErrors: ({
        model,
        baseModel,
        basketErrors,
        rejectedModel
      }: ProductConfigContext) =>
        !isEmpty(
          // compare the live model against the rejected snapshot (or the base
          // model for seeded errors) to drop errors the user has since fixed
          getOutstandingBasketErrors(
            basketErrors,
            rejectedModel ?? baseModel,
            model
          )
        ),

      continueEditing: ({ allowMultipleEdits }: ProductConfigContext) =>
        !!allowMultipleEdits,

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
