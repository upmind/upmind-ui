// --- external
import { createMachine, assign, spawn, sendTo, pure } from "xstate";

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";
import { authSubscription } from "../session/helper";

// --- utils
import { responseCodes, useTime } from "../../utils";
import { parseDomain, parseValue, parseSld } from "./utils";
import {
  cloneDeep,
  compact,
  concat,
  defaultsDeep,
  every,
  filter,
  find,
  first,
  get,
  has,
  includes,
  isArray,
  isEmpty,
  isFunction,
  map,
  omit,
  reduce,
  reject,
  set,
  some,
  uniqBy,
  values,
} from "lodash-es";

// --- types
import type { AnyEventObject, EventObject } from "xstate";
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import { DomainTypes } from "./types";
import type { DomainModel, DomainContext, DomainProduct } from "./types";
import type { ProductModel, ProductProps } from "../product";
import { parseBasketProduct } from "../basketProduct/utils";
import { ResponseError } from "../query";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./domain.machine.typegen").Typegen0,
    id: "domainManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as DomainContext,
    states: {
      subscribing: {
        entry: ["setContext", "clearLookups"],
        always: {
          target: "loading",
          actions: ["setBasketHelper", "setAuthHelper"],
        },
      },

      loading: {
        type: "parallel",
        states: {
          existing: {
            initial: "processing",
            states: {
              processing: {
                invoke: {
                  src: "getClientDomains",
                  onDone: {
                    target: "complete",
                    actions: ["setOwned"],
                  },
                  onError: { target: "complete" },
                },
              },
              complete: { type: "final" },
            },
          },
          basket: {
            initial: "processing",
            states: {
              processing: {
                entry: ["loadBasket"],
                on: {
                  REFRESH: {
                    target: "complete",
                    actions: [
                      "setBasketProducts",
                      "setCurrency",
                      "setPromotions",
                    ],
                  },
                  ERROR: {
                    target: "complete",
                  },
                },
              },
              complete: { type: "final" },
            },
          },
        },
        onDone: "idle",
        exit: ["checkModel", "ensureSelected", "persistModel"],
      },

      // our initial state depends on if the machine has been forced to a type,
      // if we do then go to that types state, otherwise stay idle
      idle: {
        entry: ["checkChoices"],
        id: "idle",
        always: [
          {
            target: "dac",
            cond: ({ type }) =>
              includes([DomainTypes.register, DomainTypes.transfer], type),
          },
          {
            target: "existing",
            cond: ({ type }) => type === DomainTypes.existing,
          },
          {
            target: "basket",
            cond: ({ type }) => type === DomainTypes.basket,
          },
        ],
      },

      dac: {
        id: "dac",
        initial: "loading",
        entry: ["clearModel", "clearSearch"],
        states: {
          loading: {
            entry: ["cancelController", "clearError"],
            always: [
              { target: "processing", cond: "hasSearchQuery" },
              { target: "invalid" },
            ],
          },
          // cancel any existing search via the controller then wait before starting a new search & controller
          processing: {
            id: "processing",
            entry: ["clearError", "cancelController", "newController"],
            invoke: {
              src: "search",
              onDone: {
                target: "invalid",
                actions: ["setSearchResults"],
              },
              onError: [
                {
                  target: "error",
                  actions: ["setError"],
                  cond: "isNotCancelled",
                },
                {
                  actions: ["setError"],
                },
              ],
            },
          },
          valid: {
            type: "final",
            always: [
              {
                target: "invalid",
                cond: "isInvalid",
              },
            ],
            on: {
              ADD_UPDATE_MANY: {
                target: "processingBasket",
                actions: ["addToBasket"],
              },
            },
          },
          invalid: {
            always: [{ target: "valid", cond: "isValid" }],
          },
          processingBasket: {
            on: {
              REFRESH: {
                // Do nothing > wait for the updated event
                actions: ["setBasketProducts", "setCurrency", "setPromotions"],
              },
              UPDATED: {
                target: "#basket",
                actions: [
                  "setBasketProducts",
                  "setModelFromBasket",
                  "ensureSelected",
                  "checkChoices",
                  "persistModel",
                ],
              },

              ERROR: { actions: ["setError"] },
            },
          },
          error: {},
          complete: {},
        },
        on: {
          ADD: [
            {
              target: ".valid",
              actions: ["add", "ensureSelected"],
              cond: "isValidDomain",
            },
          ],
          REMOVE: {
            target: ".valid",
            actions: ["remove", "ensureSelected"],
            cond: "isValid",
          },
          UPDATE: {
            target: ".valid",
            actions: ["setModel", "ensureSelected"],
          },
          SEARCH: [
            {
              target: ".loading",
              actions: ["setSearchQuery"],
              cond: "validSearchQuery",
            },
            {
              actions: ["setSearchQuery"],
            },
          ],
          "SEARCH.OFFSET": {
            target: ".loading",
            actions: ["setSearchOffset"],
            cond: "validSearchOffset",
          },
          RESET: {
            target: ".invalid",
            actions: ["resetModel", "resetLookups", "clearSearch"],
          },

          ERROR: { actions: ["setError"] },
        },
        // exit: ["clearModel"],
      },

      existing: {
        id: "existing",
        initial: "invalid",
        entry: ["resetModel"],
        states: {
          valid: {},
          invalid: {},
          error: {},
        },
        on: {
          UPDATE: [
            {
              target: ".valid",
              actions: ["clearError", "setExisting", "persistModel"],
              cond: "isValid",
            },
            {
              target: ".invalid",
              actions: ["setErrorInvalidDomain", "setExisting", "persistModel"],
            },
          ],
        },
        exit: ["clearModel", "persistModel"],
      },

      basket: {
        id: "basket",
        entry: ["resetModel"],
        initial: "loading",
        states: {
          loading: {
            after: {
              wait: "invalid",
            },
          },
          processing: {
            after: {
              wait: "invalid",
            },
          },
          valid: {
            always: {
              target: "invalid",
              cond: "isInvalid",
            },
          },
          invalid: {
            always: {
              target: "valid",
              cond: "isValid",
            },
          },

          error: {},
          complete: {},
        },
        on: {
          SELECT: [
            {
              target: ".processing",
              actions: ["select", "persistModel"],
              cond: "isSelectable",
            },
          ],
        },
        exit: ["clearModel", "persistModel"],
      },

      complete: {
        type: "final",
      },
    },
    on: {
      REFRESH: {
        actions: [
          "setBasketProducts",
          "setCurrency",
          "setPromotions",
          "checkChoices",
        ],
      },

      CHOOSE: [
        {
          // do nothing
          cond: "isInvalidType",
        },
        {
          target: "dac",
          actions: ["setType"],
          cond: "isDomainRegister",
        },
        {
          target: "dac",
          actions: ["setType"],
          cond: "isDomainTransfer",
        },
        {
          target: "existing",
          actions: ["setType"],
          cond: "isExistingDomain",
        },
        {
          target: "basket",
          actions: ["setType"],
          cond: "isBasket",
        },
      ],

      STOP: {
        target: "complete",
      },

      AUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
      UNAUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
    },
  },
  {
    actions: {
      setContext: assign((context: DomainContext, _event: AnyEventObject) =>
        defaultsDeep(context, {
          choices: DomainTypes,
          type: undefined,
          model: [],
          lookups: {
            searched: [],
            history: [],
            owned: [],
            basket: [],
          },
          // ---
          currency: undefined,
          promotions: [],
          // ---
          search: {
            query: undefined,
            limit: 10,
            offset: 0,
            total: 0,
          },

          controller: undefined,
          // ---
          error: undefined,
          // ---
          authHelper: undefined,
          basketHelper: undefined,
          parseBasketProduct: undefined,
          parseProductModel: undefined,
        })
      ),

      persistModel: assign({
        baseModel: ({ model }: DomainContext) => cloneDeep(model), // we use spread to ensure its a new array
      }),

      checkModel: assign({
        model: ({ model, lookups }: DomainContext) => {
          const values = map(model, item => parseDomain(item)) as DomainModel[];
          if (isEmpty(values) && !isEmpty(lookups.basket)) {
            return map(lookups.basket, item => {
              return {
                domain: item.domain,
                tld: item.tld,
                sld: item.sld,
                typee: DomainTypes.basket,
                selected: item.meta.selected,
              } as DomainModel;
            }) as DomainModel[];
          }
          return values;
        },
      }),

      ensureSelected: assign({
        model: ({ model }: DomainContext) => {
          if (!isEmpty(model) && !some(model, "selected")) {
            const primaryDomain = first(model);
            if (primaryDomain) set(primaryDomain, "selected", true);
          }
          return model;
        },
      }),

      checkChoices: assign({
        choices: ({ lookups }: DomainContext) => {
          if (isEmpty(lookups.basket))
            return values(omit(DomainTypes, DomainTypes.basket));
          return values(DomainTypes);
        },
        type: ({ lookups, model }: DomainContext) => {
          const selected = find(model, "selected") || first(model);
          const domain = get(selected, "domain");
          if (domain) {
            const added = some(lookups.basket, ["domain", domain]);
            if (added) return DomainTypes.basket;
            return DomainTypes.existing;
          }
          return undefined;
        },
      }),

      setType: assign({
        type: (_context, { data }: AnyEventObject) => data,
        error: undefined,
      }),

      setCurrency: assign({
        currency: (_context, { data }: AnyEventObject) => {
          return get(data, "currency.code");
        },
      }),

      setPromotions: assign({
        promotions: (_context, { data }: AnyEventObject) =>
          data?.promotions ?? [],
      }),

      setAuthHelper: assign(({ authHelper }: DomainContext) => ({
        authHelper: authHelper || spawn(authSubscription),
      })),

      loadBasket: pure(({ basketHelper }: DomainContext, _event) => {
        if (!basketHelper) return;
        return sendTo(basketHelper, {
          type: "INIT",
        });
      }),

      setBasketHelper: assign(({ basketHelper }: DomainContext) => {
        // only do this once, set up the basket helper
        return {
          basketHelper: basketHelper ?? spawn(basketSubscription),

          parseBasketProduct: (
            raw: IBasketProduct,
            primaryDomain?: string
          ): DomainProduct | undefined => {
            const isDomainProduct = has(raw, "provision_fields.sld");
            if (!isDomainProduct) return undefined;

            const value = raw?.service_identifier;
            const parsed = value ? parseDomain(value) : undefined;

            if (!parsed) return undefined;

            const basketProduct = parseBasketProduct(raw) as DomainProduct;
            basketProduct.tld = parsed.tld;
            basketProduct.sld = parsed.sld;
            basketProduct.domain = parsed.domain;
            basketProduct.meta.selected = parsed.domain === primaryDomain;
            basketProduct.productDetails.title = parsed.domain;
            return basketProduct;
          },

          parseProductModel: (
            item: DomainProduct
          ): ProductModel | undefined => {
            if (!item?.configuration?.productId) return undefined;

            return {
              productId: item.configuration.productId,
              quantity: 1,
              term: item.configuration.term,
              options: item.configuration.options,
              attributes: item.configuration.attributes,
              provisionFields: {
                sld: item.sld,
              },
            } as ProductModel;
          },
        };
      }),

      setBasketProducts: assign({
        lookups: (
          { lookups, parseBasketProduct, model }: DomainContext,
          { data }: AnyEventObject
        ) => {
          const primary =
            find(model, "selected") || first(model) || first(lookups.basket);

          const available = reduce(
            data.products,
            (result: DomainProduct[], raw: IBasketProduct) => {
              const parsed = parseBasketProduct(raw, primary?.domain);
              if (parsed) result.push(parsed);
              return result;
            },
            []
          );
          set(lookups, "basket", available);
          return lookups;
        },
      }),

      addToBasket: pure((context: DomainContext, _event) => {
        if (!context.basketHelper) return;

        const products = reduce(
          context.model ?? [],
          (result: ProductModel[], item: DomainModel) => {
            const product = find(context.lookups.searched, [
              "domain",
              item.domain,
            ]);

            if (product?.configuration?.productId) {
              const model = isFunction(context?.parseProductModel)
                ? context.parseProductModel(product)
                : undefined;
              if (model) {
                model.skipValidation = true; // NB: we dont want to be blocked by the machine but rather let he backend handle this
                result.push(model);
              }
            }
            return result;
          },
          []
        );

        return sendTo(context.basketHelper, {
          type: "ADD_UPDATE_MANY",
          target: products,
          context,
        });
      }),

      // ---

      add: assign({
        model: (
          { model, lookups, type }: DomainContext,
          { data }: AnyEventObject
        ) => {
          let available: DomainProduct[] = [];
          switch (type) {
            case DomainTypes.register:
              available = lookups.searched || [];
              break;
            case DomainTypes.transfer:
              available = lookups.searched || [];
              break;
            // case DomainTypes.existing:
            //   available = lookups.owned;
            //   break;
            case DomainTypes.basket:
              available = lookups.basket || [];
              break;
          }
          const domain = parseValue(data, model, available);
          model ??= [];
          if (domain) model.push(domain);
          return model;
        },
      }),

      setExisting: assign({
        model: (_context: DomainContext, { data }: AnyEventObject) => {
          const value = isArray(data) ? first(data) : data;
          const parsed = parseDomain(value, true);
          const domain: DomainModel = {
            type: DomainTypes.existing,
            domain: value,
            tld: parsed?.tld ?? "",
            sld: parsed?.sld ?? "",
            selected: true,
          };
          return [domain];
        },
      }),

      remove: assign({
        model: ({ model }: DomainContext, { data }: AnyEventObject) =>
          reject(model, ["domain", data]),
      }),

      setModel: assign({
        model: (
          { model, lookups, type }: DomainContext,
          { data }: AnyEventObject
        ) => {
          return reduce(
            data,
            (result: DomainModel[], item) => {
              let available: DomainProduct[] = [];
              switch (type) {
                case DomainTypes.register:
                  available = lookups?.searched;
                  break;
                case DomainTypes.transfer:
                  available = lookups?.searched;
                  break;
                case DomainTypes.existing:
                  available = lookups?.owned;
                  break;
                case DomainTypes.basket:
                  available = lookups?.basket;
                  break;
              }

              const domain: DomainModel = parseValue(item, data, available);
              if (domain) result.push(domain);

              return result;
            },
            []
          );
        },
      }),

      setModelFromBasket: assign({
        type: (_context, _event: AnyEventObject) => DomainTypes.basket,
        model: ({ lookups }: DomainContext, _event: AnyEventObject) =>
          map(lookups.basket, (item: DomainProduct) => {
            return {
              domain: item.domain,
              tld: item.tld,
              sld: item.sld,
              typee: DomainTypes.basket,
              selected: item.meta.selected,
            } as DomainModel;
          }) as DomainModel[],
      }),

      clearModel: assign({
        model: () => [],
      }),

      resetModel: assign({
        model: ({ baseModel }, _event: AnyEventObject) => {
          return cloneDeep(baseModel);
        },
      }),

      cancelController: assign({
        controller: ({ controller }: DomainContext) => {
          if (controller?.signal && !controller.signal?.aborted) {
            controller?.abort();
          }
          return undefined;
        },
      }),

      newController: assign({
        controller: () => {
          return new AbortController();
        },
      }),

      setSearchQuery: assign({
        search: ({ search }: DomainContext, { data }: AnyEventObject) => {
          return {
            query: data ?? undefined,
            offset: 0,
            limit: search?.limit ?? 10,
            total: 0,
          };
        },
      }),

      setSearchOffset: assign({
        search: ({ search }: DomainContext, _event: AnyEventObject) => {
          search ??= {
            offset: 0,
            limit: 10,
            total: 0,
          };
          search.offset += search?.limit ?? 10;
          return search;
        },
      }),

      clearSearch: assign({
        search: ({ search }: DomainContext, _event: AnyEventObject) => ({
          query: undefined,
          offset: 0,
          limit: search?.limit ?? 10,
          total: 0,
        }),
        lookups: ({ lookups }) => {
          // lookups.history = [];
          lookups.searched = [];
          return lookups;
        },
      }),

      setSearchResults: assign({
        lookups: (
          { lookups, model, search }: DomainContext,
          { data }: AnyEventObject
        ) => {
          const previous = (search?.offset ?? 0 > 0) ? lookups.searched : [];

          const available: DomainProduct[] = map(
            data?.available,
            (item: DomainProduct) => {
              item.meta.owned = some(lookups.owned, ["domain", item.domain]);
              item.meta.added = some(lookups.basket, ["domain", item.domain]);
              item.meta.disabled = item.meta.owned || item.meta.added;
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
        search: ({ search }: DomainContext, { data }: AnyEventObject) => {
          return {
            query: search?.query ?? undefined,
            offset: search?.offset ?? 0,
            limit: search?.limit ?? 10,
            total: data?.total || 0,
          };
        },
        controller: undefined,
      }),

      setOwned: assign({
        lookups: ({ lookups }: DomainContext, { data }: AnyEventObject) => {
          const available = map(data, (item: DomainModel) => {
            return {
              domain: item.domain,
              tld: item.tld,
              sld: item.sld,
              productDetails: {
                title: item.domain,
              },
              meta: {
                owned: true,
                persisted: true,
              },
            } as DomainProduct;
          });
          set(lookups, "owned", available);
          return lookups;
        },
      }),

      clearLookups: assign({
        lookups: (_context: DomainContext, _event: AnyEventObject) => {
          return {
            searched: [],
            history: [],
            owned: [],
            basket: [],
          };
        },
      }),

      resetLookups: assign({
        lookups: ({ lookups }: DomainContext, _event: AnyEventObject) => {
          return {
            searched: [],
            history: [],
            owned: lookups.owned,
            basket: lookups.basket,
          };
        },
      }),

      select: assign({
        model: ({ lookups }: DomainContext, { data }: AnyEventObject) => {
          const selected =
            find(lookups.basket, ["domain", data]) || first(lookups.basket);
          return map(lookups.basket, value => {
            value.meta.selected = value === selected;
            return {
              domain: value.domain,
              tld: value.tld,
              sld: value.sld,
              typee: DomainTypes.basket,
              selected: value.domain === selected?.domain,
            } as DomainModel;
          });
        },
      }),

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          // addError({
          //   title: data?.title || "We experienced an error getting domains",
          //   copy: data?.message,
          //   data: data?.data,
          // });

          return data;
        },
      }),

      setErrorInvalidDomain: assign({
        error: (_context: DomainContext, { data }: AnyEventObject) => {
          return {
            id: null,
            code: "invalid_domain",
            type: responseCodes.Unprocessable_Entity,
            message: "Invalid domain",
            data: null,
          } as ResponseError;
        },
      }),

      clearError: assign({ error: undefined }),
    },

    guards: {
      // hasData: (_context, { data }:AnyEventObject) => isObject(data) && !isEmpty(data),

      isInvalidType: ({ choices }: DomainContext, { data }: AnyEventObject) => {
        return isEmpty(choices) || !has(DomainTypes, data);
      },

      isValidDomain: (_context, { data }: AnyEventObject) =>
        !isEmpty(parseDomain(data)),

      hasSearchQuery: ({ search }: DomainContext, _event: AnyEventObject) => {
        const sld = parseSld(search?.query ?? "");
        return sld?.length > 2;
      },
      validSearchQuery: (_context, { data }: AnyEventObject) => {
        return !isEmpty(data);
      },
      validSearchOffset: (
        { search }: DomainContext,
        _event: AnyEventObject
      ) => {
        const offset = (search?.offset ?? 0) + (search?.limit ?? 0);
        return offset < (search?.total || 0);
      },

      isValid: ({ model }: DomainContext) => {
        const valid = !isEmpty(model) && every(model, parseDomain);
        return valid;
      },

      isSelectable: (
        { model, lookups }: DomainContext,
        { data }: AnyEventObject
      ) => {
        const valid = some(lookups.basket, ["domain", data]);
        return valid;
      },

      isInvalid: ({ model }: DomainContext) =>
        isEmpty(model) || !every(model, parseDomain),

      isNotCancelled: (_context, { data }: AnyEventObject) =>
        data?.name !== "AbortError",

      isDomainTransfer: (
        { choices }: DomainContext,
        { data }: AnyEventObject
      ) => !isEmpty(choices) && data === DomainTypes.transfer,

      isExistingDomain: (
        { choices }: DomainContext,
        { data }: AnyEventObject
      ) => !isEmpty(choices) && data === DomainTypes.existing,

      isDomainRegister: (
        { choices }: DomainContext,
        { data }: AnyEventObject
      ) => !isEmpty(choices) && data === DomainTypes.register,

      isBasket: ({ choices }: DomainContext, { data }: AnyEventObject) =>
        !isEmpty(choices) && data === DomainTypes.basket,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
