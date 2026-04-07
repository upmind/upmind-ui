// --- external
import { createMachine, assign, spawn, sendTo, pure } from "xstate";

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";
import { authSubscription } from "../session/helper";
import { useFeedback } from "../feedback";

// --- utils
import { mapToHeadlessError, useTime } from "../../utils";
import { parseDomain, parseValue, parseSld, isDomainProduct } from "./utils";
import { parseProductProps } from "../product/utils";
import {
  compact,
  concat,
  defaultsDeep,
  every,
  filter,
  find,
  first,
  has,
  isEmpty,
  isFunction,
  isObject,
  map,
  reduce,
  reject,
  set,
  some,
  uniqBy
} from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import { type IBasketProduct } from "@upmind-automation/types";
import {
  type DomainModel,
  type DacContext,
  type DomainProduct,
  DomainMode
} from "./types";
import type { ProductProps } from "../product";
import { parseBasketProduct } from "../basketProduct/utils";
import { PAGINATION } from "../query";
import { useI18n } from "../system";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./domain.machine.typegen").Typegen0,
    id: "DAC",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as DacContext,
    states: {
      subscribing: {
        entry: [
          "setContext",
          "clearLookups",
          "setBasketHelper",
          "setAuthHelper",
          "loadBasket"
        ],
        on: {
          REFRESH: [
            {
              target: "loading",
              actions: ["setBasketProducts", "setBasket"]
            }
          ],
          ERROR: {
            actions: ["setError"]
            // target: "unavailable",
          }
        }
      },

      loading: {
        invoke: {
          src: "getClientDomains",
          onDone: [
            { target: "searching", cond: "hasSearchQuery" },
            { target: "invalid" }
          ],
          onError: { target: "error", actions: ["setError"] }
        },
        exit: ["setOwned"]
      },

      searching: {
        id: "searching",
        entry: ["clearError"],
        invoke: {
          src: "search"
        },
        on: {
          // Each resolved call sends SEARCH_RESULTS — stays in searching
          // to keep the callback service alive for the other call
          SEARCH_RESULTS: {
            actions: ["setSearchResults"]
          },
          // All pending calls done — transition out
          SEARCH_COMPLETE: {
            target: "invalid"
          },
          SEARCH_ERROR: [
            {
              target: "error",
              actions: ["setError"],
              cond: "isNotCancelled"
            },
            {
              actions: ["setError"]
            }
          ],
          // Allow adding domains while second call is still loading
          ADD: [
            {
              target: "checking",
              actions: ["add", "setProcessing", "setCheckingDomain"],
              cond: "isValidDomain"
            }
          ]
        }
      },

      valid: {
        always: [
          {
            target: "invalid",
            cond: "isInvalid"
          }
        ],
        on: {
          ADD: [
            {
              // Already availability-checked & transferable — skip re-check
              target: "valid",
              actions: ["add", "setProcessing", "addToBasket"],
              cond: "isAlreadyChecked"
            },
            {
              target: "checking",
              actions: ["add", "setProcessing", "setCheckingDomain"],
              cond: "isValidDomain"
            }
          ]
        }
      },

      invalid: {
        always: [{ target: "valid", cond: "isValid" }],
        on: {
          ADD: [
            {
              // Already availability-checked & transferable — skip re-check
              target: "valid",
              actions: ["add", "setProcessing", "addToBasket"],
              cond: "isAlreadyChecked"
            },
            {
              target: "checking",
              actions: ["add", "setProcessing", "setCheckingDomain"],
              cond: "isValidDomain"
            }
          ]
        }
      },

      error: {},

      checking: {
        entry: ["clearError"],
        invoke: {
          src: "addDomainToBasket",
          onDone: [
            {
              // addDomainToBasket already added the product to the basket
              // via the API — the basket subscription will sync the state
              target: "valid",
              actions: ["clearCheckingProcessing"],
              cond: "isDomainAvailable"
            },
            {
              // 409 conflict — flip domain type (register↔transfer)
              // Keep checkedAvailability=false so next click retries addDomainToBasket
              target: "invalid",
              actions: ["clearCheckingProcessing", "flipDomainType"],
              cond: "isConflict"
            },
            {
              // web_hosting::domain_register_only — tried to transfer but domain
              // can only be registered → convert row to register so user can click and register
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setRegisterable"
              ],
              cond: "isDomainRegisterOnly"
            },
            {
              // web_hosting::domain_transfer_only — tried to register but domain
              // can only be transferred → convert row to transfer so user can click and transfer
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setTransferable"
              ],
              cond: "isDomainTransferOnly"
            },
            {
              // web_hosting::domain_not_for_sale — domain is not available at all
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setFullyUnavailable"
              ],
              cond: "isDomainNotForSale"
            },
            {
              // can_register=false BUT can_transfer=true → convert row to transfer
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setTransferable"
              ],
              cond: "isDomainTransferable"
            },
            {
              // can_register=false AND can_transfer=false → fully unavailable
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setFullyUnavailable"
              ]
            }
          ],
          onError: [
            {
              target: "invalid",
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setError",
                "setFeedbackError"
              ],
              cond: "isNotCancelled"
            },
            {
              actions: [
                "clearCheckingProcessing",
                "removeCheckingDomain",
                "setError"
              ]
            }
          ]
        }
      },

      complete: {
        type: "final",
        data: ({ model, lookups }: DacContext) => {
          const domains = lookups.basket;
          const primary = first(model);

          return {
            basket: lookups.basket,
            domains: reduce(
              model,
              (result: DomainModel[], item) => {
                // ensure we mark the primary domain
                if (item.domain === primary?.domain) {
                  item.selected = true;
                }
                result.push(item);
                return result;
              },
              []
            )
          };
        }
      }
    },

    on: {
      UPDATED: {
        actions: ["setBasketProducts"]
      },

      CANCEL: {
        actions: ["clearProcessing", "remove"]
      },

      ERROR: {
        actions: ["setError", "setFeedbackError"]
      },

      REMOVE: {
        actions: ["setProcessing", "removeFromBasket", "remove"]
      },

      UPDATE: {
        target: "valid"
        // actions: ["setModel"]
      },

      SEARCH: [
        {
          target: "loading",
          actions: ["setSearchQuery"],
          cond: "validSearchQuery"
        },
        { actions: ["setSearchQuery"] }
      ],

      "SEARCH.OFFSET": {
        target: "loading",
        actions: ["setSearchOffset"],
        cond: "validSearchOffset"
      },

      RESET: {
        target: "invalid",
        actions: ["resetLookups", "clearSearch"]
      },

      REFRESH: {
        actions: ["setBasketProducts", "setBasket"]
      },

      STOP: { target: "complete" },

      AUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
      UNAUTHENTICATED: { target: "loading", actions: ["clearLookups"] }
    }
  },
  {
    actions: {
      setContext: assign(
        (context: DacContext, _event: AnyEventObject) =>
          defaultsDeep(context, {
            model: [],

            lookups: {
              searched: [],
              history: [],
              owned: [],
              basket: []
            },
            // ---
            currency: undefined,
            basketId: undefined,
            brandId: undefined,
            coupons: [],
            // ---
            search: {
              query: undefined,
              limit: PAGINATION.limit,
              offset: PAGINATION.offset,
              total: 0
            },
            // ---
            error: undefined,
            // ---
            authHelper: undefined,
            basketHelper: undefined,
            parseBasketProduct: undefined,
            parseProductModel: undefined
          }) as DacContext
      ),

      setBasket: assign((_context: DacContext, { data }: AnyEventObject) => {
        const { id: basketId, brand_id: brandId, currency } = data ?? {};

        const newContext = {
          basketId,
          brandId,
          currency: currency?.code
        };

        return newContext;
      }),

      setAuthHelper: assign(({ authHelper }: DacContext) => ({
        authHelper: authHelper || spawn(authSubscription)
      })),

      loadBasket: pure(({ basketHelper }: DacContext, _event) => {
        if (!basketHelper) return;
        return sendTo(basketHelper, {
          type: "INIT"
        });
      }),

      setBasketHelper: assign(({ basketHelper }: DacContext) => {
        // only do this once, set up the basket helper
        return {
          basketHelper: basketHelper ?? spawn(basketSubscription),

          parseBasketProduct: (
            raw: IBasketProduct,
            primaryDomain?: string
          ): DomainProduct | undefined => {
            // First check if we have the blueprint code available that identifies domain products
            // This is not always present as it requites a 'with' when fetching the basket
            // and the basket returned after an update may not have it
            // The fallback is to check if we have and SLD provision field
            // OR we can parse the service identifier as a domain

            const parsed = parseDomain(raw?.service_identifier);

            if (
              !isDomainProduct({
                blueprintCode:
                  raw?.product?.provision_blueprint?.category?.code,
                provisionFields: raw?.provision_fields,
                serviceIdentifier: raw?.service_identifier ?? undefined
              })
            )
              return undefined;

            const basketProduct = parseBasketProduct(raw) as DomainProduct;
            basketProduct.tld = parsed!.tld;
            basketProduct.sld = parsed!.sld;
            basketProduct.domain = parsed!.domain;
            basketProduct.meta.added = true;
            basketProduct.productDetails.title = parsed!.domain;
            return basketProduct;
          },

          parseProductModel: (
            item: DomainProduct
          ): ProductProps | undefined => {
            if (!item?.configuration?.productId) return undefined;
            return item.configuration;
          }
        };
      }),

      setBasketProducts: assign({
        lookups: (
          { lookups, parseBasketProduct, model }: DacContext,
          { data }: AnyEventObject
        ) => {
          // Bail out if we have not been given a basket with products
          if (!isObject(data) || !has(data, "products")) return lookups;

          const primary = first(model) || first(lookups.basket);

          // 1st filter out only the domain products from the basket products
          const newBasketProducts: DomainProduct[] = reduce(
            data?.products,
            (acc: DomainProduct[], basketProduct: IBasketProduct) => {
              const parsed = parseBasketProduct(basketProduct, primary?.domain);
              if (parsed) acc.push(parsed);
              return acc;
            },
            []
          );

          lookups.searched = map(lookups.searched, (item: DomainProduct) => {
            const inBasket = some(newBasketProducts, ["domain", item.domain]);
            const wasInBasket = some(lookups.basket, ["domain", item.domain]);
            // determine if we are processing based on if its being added or removed
            // if its in the new basket and wasnt before, its being added
            // if its not in the new basket and was before, its being removed
            const isProcessing =
              !!item?.meta?.processing && (wasInBasket ? inBasket : !inBasket);

            item.meta.added = inBasket;
            item.meta.disabled = item.meta.owned || false;
            item.meta.processing = isProcessing;

            return item;
          });

          set(lookups, "basket", newBasketProducts);

          return lookups;
        }
      }),

      addToBasket: pure((context: DacContext, { data }: AnyEventObject) => {
        if (!context.basketHelper) return;

        const product = find(context.lookups.searched, [
          "domain",
          data
        ]) as DomainProduct;

        const model = isFunction(context?.parseProductModel)
          ? context.parseProductModel(product)
          : product?.configuration;

        if (model) {
          model.coupons ??= context.coupons ?? []; // NB ensure we pass any coupons from the context to the product being added
          model.silent = true; // NB ensure we add silently so we don't trigger provision field validation at this stage

          return sendTo(context.basketHelper, {
            type: "ADD_UPDATE",
            target: model,
            context
          });
        }
      }),

      removeFromBasket: pure(
        (context: DacContext, { data }: AnyEventObject) => {
          if (!context.basketHelper) return;

          const product = find(context.lookups.basket, ["domain", data]);

          if (product) {
            return sendTo(context.basketHelper, {
              type: "REMOVE",
              target: product,
              context
            });
          }
        }
      ),

      add: assign({
        model: ({ model, lookups }: DacContext, { data }: AnyEventObject) => {
          model ??= [];
          const domain = parseValue(data, model, lookups.searched);

          if (domain) model.push(domain);

          return model;
        }
      }),

      setProcessing: assign({
        lookups: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          const product = find(lookups.searched, [
            "domain",
            data
          ]) as DomainProduct;

          if (product) {
            product.meta.processing = true;
          }

          return lookups;
        }
      }),

      clearProcessing: assign({
        lookups: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          const product = find(lookups.searched, [
            "productDetails.id",
            (data as ProductProps)?.productId
          ]) as DomainProduct;

          if (product) product.meta.processing = false;

          return lookups;
        }
      }),

      remove: assign({
        model: ({ model, lookups }: DacContext, { data }: AnyEventObject) => {
          const domainProduct = find(
            lookups.searched,
            (product: DomainProduct) => {
              return isObject(data)
                ? product.productDetails.id == (data as ProductProps)?.productId
                : product.domain == data;
            }
          ) as DomainProduct;
          return reject(model, ["domain", domainProduct.domain]);
        }
      }),

      setModel: assign({
        model: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          return reduce(
            data,
            (result: DomainModel[], item) => {
              const domain = parseValue(item, data, lookups?.searched);
              if (domain) result.push(domain);
              return result;
            },
            []
          );
        }
      }),

      clearModel: assign({
        model: () => []
      }),

      setSearchQuery: assign({
        search: ({ search }: DacContext, { data }: AnyEventObject) => {
          return {
            query: data?.slice(0, 63), // max domain length is 63 characters as per BE
            offset: PAGINATION.offset,
            limit: search?.limit ?? PAGINATION.limit,
            total: 0
          };
        }
      }),

      setSearchOffset: assign({
        search: ({ search }: DacContext, _event: AnyEventObject) => {
          const current = search ?? {
            offset: PAGINATION.offset,
            limit: PAGINATION.limit,
            total: 0
          };

          return {
            query: current.query,
            limit: current.limit,
            offset: current.offset + (current.limit ?? PAGINATION.limit),
            total: current.total
          };
        }
      }),

      clearSearch: assign({
        search: ({ search }: DacContext, _event: AnyEventObject) => ({
          query: undefined,
          offset: PAGINATION.offset,
          limit: search?.limit ?? PAGINATION.limit,
          total: 0
        }),
        lookups: ({ lookups }) => {
          // lookups.history = [];
          lookups.searched = [];
          return lookups;
        }
      }),

      setSearchResults: assign({
        lookups: (
          { lookups, model, search }: DacContext,
          { data: response }: AnyEventObject
        ) => {
          const previous = (search?.offset ?? 0 > 0) ? lookups.searched : [];

          const available: DomainProduct[] = map(
            response?.data,
            (item: DomainProduct) => {
              item.meta.owned = some(lookups.owned, ["domain", item.domain]);
              item.meta.added = some(lookups.basket, ["domain", item.domain]);
              item.meta.disabled = item.meta.owned;

              if (search?.query && search.query === item.domain) {
                item.meta.exactMatch = true;
              }

              // If this is the exact match domain and we have availability data,
              // merge the availability flags into the product
              if (
                response?.exactDomain &&
                item.domain === response.exactDomain &&
                response.availability
              ) {
                const avail = response.availability;
                item.meta.exactMatch = true;
                item.meta.checkedAvailability = true;
                item.meta.available = avail.can_register;
                item.meta.canTransfer =
                  !avail.can_register && avail.can_transfer;
                item.meta.unavailable =
                  !avail.can_register && !avail.can_transfer;
                item.meta.disabled =
                  item.meta.owned || item.meta.unavailable || false;
              }

              return item as DomainProduct;
            }
          );

          const persisted = filter(lookups.history, ({ domain }) =>
            some(model, ["domain", domain])
          );

          set(
            lookups,
            "searched",
            uniqBy(compact(concat(persisted, previous, available)), "domain")
          );

          // store all previous searches
          set(
            lookups,
            "history",
            uniqBy(compact(concat(lookups.history, available)), "domain")
          );

          return lookups;
        },
        search: (
          { search }: DacContext,
          { data: response }: AnyEventObject
        ) => {
          return {
            query: search?.query ?? undefined,
            offset: search?.offset ?? 0,
            limit: search?.limit ?? PAGINATION.limit,
            total: response?.total || 0
          };
        }
      }),

      setOwned: assign({
        lookups: ({ lookups }: DacContext, { data }: AnyEventObject) => {
          const available = map(compact(data), (item: DomainModel) => {
            return {
              domain: item.domain,
              tld: item.tld,
              sld: item.sld,
              productDetails: {
                title: item.domain
              },
              meta: {
                owned: true,
                persisted: true
              }
            } as DomainProduct;
          });
          set(lookups, "owned", available);
          return lookups;
        }
      }),

      clearLookups: assign({
        lookups: (_context: DacContext, _event: AnyEventObject) => {
          return {
            searched: [],
            history: [],
            owned: [],
            basket: []
          };
        }
      }),

      resetLookups: assign({
        lookups: ({ lookups }: DacContext, _event: AnyEventObject) => {
          return {
            searched: [],
            history: [],
            owned: lookups.owned,
            basket: lookups.basket
          };
        }
      }),

      setFeedbackError: (
        { error, lookups }: DacContext,
        { data, sourceContext }
      ) => {
        const { t } = useI18n();

        const domainProduct = find(lookups.searched, [
          "productDetails.id",
          (sourceContext as ProductProps)?.productId
        ]) as DomainProduct;

        if (!data || !domainProduct) return;

        useFeedback().addError({
          title: t("error.domain_add_failed"),
          copy: domainProduct?.domain ?? ""
        });
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => mapToHeadlessError(data)
        // model: ({ model }, { data, sourceContext }: AnyEventObject) => {
        //
        //   // if we are passed a sourceContext, vie the event, then we can use that to understand what triggered the error
        //   // this is useful for marking the triggering product as erroring
        //   if (sourceContext) {
        //     const domainProduct = find(model, [
        //       "productDetails.id",
        //       (data as ProductProps)?.productId
        //     ]) as DomainProduct;

        //

        //     const domain = find(model, ["domain", domainProduct?.domain]);

        //     if (domain) {
        //       domain.processing = false;
        //       domain.error = true;
        //     }
        //     // return remove(model ?? [], item => {
        //     //
        //     //   return item.sld !== context.provisionFields.sld;
        //     // });
        //   }
        //   return model;
        // }
      }),

      clearError: assign({ error: undefined }),

      setCheckingDomain: assign({
        checkingDomain: (_context: DacContext, { data }: AnyEventObject) => {
          const parsed = parseDomain(data);
          return parsed?.domain ?? data;
        }
      }),

      // Used from checking state where event.data is the availability response,
      // not the domain string — reads context.checkingDomain instead.
      addToBasketFromChecking: pure(
        (context: DacContext, _event: AnyEventObject) => {
          if (!context.basketHelper) return;

          const product = find(context.lookups.searched, [
            "domain",
            context.checkingDomain
          ]) as DomainProduct;

          const model = isFunction(context?.parseProductModel)
            ? context.parseProductModel(product)
            : product?.configuration;

          if (model) {
            model.coupons ??= context.coupons ?? [];
            model.silent = true;

            return sendTo(context.basketHelper, {
              type: "ADD_UPDATE",
              target: model,
              context
            });
          }
        }
      ),

      clearCheckingProcessing: assign({
        lookups: ({ lookups, checkingDomain }: DacContext) => {
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;
          if (product) product.meta.processing = false;
          return lookups;
        }
      }),

      removeCheckingDomain: assign({
        model: ({ model, checkingDomain }: DacContext) =>
          reject(model, ["domain", checkingDomain])
      }),

      setUnavailableError: assign({
        error: (_context: DacContext) =>
          mapToHeadlessError(new Error("domain_unavailable"))
      }),

      // --- Availability fallback actions ---

      setRegisterable: assign({
        lookups: ({ lookups, checkingDomain }: DacContext) => {
          const { t } = useI18n();
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;

          if (product) {
            product.meta.available = true;
            product.meta.canTransfer = false;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;

            // Rebuild configuration with register sub_pids from setup_function_sub_ids
            if (product.rawProduct) {
              const setupSubIds = product.rawProduct.setup_function_sub_ids;
              const subproducts: string[] = compact(
                setupSubIds?.register ?? [product.rawProduct.sub_product_id]
              );
              product.configuration = parseProductProps(
                {
                  productId: product.rawProduct.id,
                  quantity: product.rawProduct.unit_quantity,
                  subproducts,
                  provisionFields: product.configuration?.provisionFields ?? {}
                },
                product.rawProduct
              );
            }
          }

          useFeedback().addError({
            title: t("error.domain_transfer_unavailable"),
            copy: checkingDomain ?? ""
          });

          return lookups;
        }
      }),

      setTransferable: assign({
        lookups: ({ lookups, checkingDomain }: DacContext) => {
          const { t } = useI18n();
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;

          if (product) {
            product.meta.available = false;
            product.meta.canTransfer = true;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;

            // Rebuild configuration with transfer sub_pids from setup_function_sub_ids
            if (product.rawProduct) {
              const setupSubIds = product.rawProduct.setup_function_sub_ids;
              const subproducts: string[] = compact(
                setupSubIds?.transfer ?? [product.rawProduct.sub_product_id]
              );
              product.configuration = parseProductProps(
                {
                  productId: product.rawProduct.id,
                  quantity: product.rawProduct.unit_quantity,
                  subproducts,
                  provisionFields: product.configuration?.provisionFields ?? {}
                },
                product.rawProduct
              );
            }
          }

          useFeedback().addError({
            title: t("error.domain_register_unavailable"),
            copy: checkingDomain ?? ""
          });

          return lookups;
        }
      }),

      setFullyUnavailable: assign({
        lookups: ({ lookups, checkingDomain }: DacContext) => {
          const { t } = useI18n();
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;

          if (product) {
            product.meta.available = false;
            product.meta.unavailable = true;
            product.meta.disabled = true;
            product.meta.checkedAvailability = true;
            product.meta.processing = false;
          }

          useFeedback().addError({
            title: t("error.domain_unavailable"),
            copy: checkingDomain ?? ""
          });

          return lookups;
        }
      }),

      // 409 conflict: flip the domain type (register↔transfer)
      // Does NOT set checkedAvailability so the next click goes through
      // addDomainToBasket again instead of skipping to addToBasket
      flipDomainType: assign({
        lookups: (
          { lookups, checkingDomain }: DacContext,
          { data }: AnyEventObject
        ) => {
          const product = find(lookups.searched, [
            "domain",
            checkingDomain
          ]) as DomainProduct;

          if (product) {
            product.meta.available = data?.can_register ?? false;
            product.meta.canTransfer = data?.can_transfer ?? false;
            product.meta.unavailable = false;
            product.meta.disabled = false;
            product.meta.checkedAvailability = false;
            product.meta.processing = false;
          }

          return lookups;
        }
      })
    },

    guards: {
      // hasData: (_context, { data }:AnyEventObject) => isObject(data) && !isEmpty(data),

      isValidDomain: (_context, { data }: AnyEventObject) =>
        !isEmpty(parseDomain(data)),

      hasSearchQuery: (
        { search, mode }: DacContext,
        _event: AnyEventObject
      ) => {
        if (mode === DomainMode.transfer) {
          return !isEmpty(parseDomain(search?.query ?? ""));
        }
        const sld = parseSld(search?.query ?? "");
        return sld?.length > 2;
      },
      validSearchQuery: ({ mode }: DacContext, { data }: AnyEventObject) => {
        if (mode === DomainMode.transfer) {
          return !isEmpty(parseDomain(data ?? ""));
        }
        const sld = parseSld(data ?? "");
        return sld?.length > 2 && sld.length <= 63;
      },
      validSearchOffset: ({ search }: DacContext, _event: AnyEventObject) => {
        const offset = (search?.offset ?? 0) + (search?.limit ?? 0);
        return offset < (search?.total || 0);
      },

      isValid: ({ model }: DacContext) => {
        const valid = !isEmpty(model) && every(model, parseDomain);
        return valid;
      },

      isInvalid: ({ model }: DacContext) =>
        isEmpty(model) || !every(model, parseDomain),

      isNotCancelled: (_context, { data }: AnyEventObject) =>
        data?.name !== "AbortError",

      isDomainAvailable: (_context, { data }: AnyEventObject) =>
        data?.can_register === true,

      isDomainTransferable: (_context, { data }: AnyEventObject) =>
        data?.can_register === false && data?.can_transfer === true,

      isAlreadyChecked: ({ lookups }: DacContext, { data }: AnyEventObject) => {
        const domain = parseDomain(data);
        if (!domain) return false;
        const product = find(lookups.searched, [
          "domain",
          domain.domain
        ]) as DomainProduct;
        return !!product?.meta?.checkedAvailability;
      },

      isConflict: (_context: DacContext, { data }: AnyEventObject) =>
        data?.conflict === true,

      isDomainRegisterOnly: (_context: DacContext, { data }: AnyEventObject) =>
        data?.error_code === "web_hosting::domain_register_only",

      isDomainTransferOnly: (_context: DacContext, { data }: AnyEventObject) =>
        data?.error_code === "web_hosting::domain_transfer_only",

      isDomainNotForSale: (_context: DacContext, { data }: AnyEventObject) =>
        data?.error_code === "web_hosting::domain_not_for_sale"
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services: {
      search: services.search,
      addDomainToBasket: services.addDomainToBasket,
      getClientDomains: services.getClientDomains
    }
  }
);
