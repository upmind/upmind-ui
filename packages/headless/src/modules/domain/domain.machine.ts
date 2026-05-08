// --- external
import { createMachine, assign, spawn, sendTo, pure } from "xstate";

// --- internal
import DACmachine from "./dac.machine";

import services from "./services";
import { basketSubscription } from "../basketProduct/helper";
import { authSubscription } from "../session/helper";

// --- utils
import {
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes,
  type ResponseError,
  useTime,
  DOMAIN_LIKE_VALIDATION
} from "../../utils";
import {
  getDomainRawBasketProducts,
  isDomainProduct,
  parseDomain
} from "./utils";
import {
  cloneDeep,
  compact,
  defaultsDeep,
  find,
  first,
  get,
  has,
  includes,
  isArray,
  isEmpty,
  isString,
  map,
  reduce,
  remove,
  set,
  some,
  trim,
  values
} from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import { type IBasketProduct } from "@upmind-automation/types";
import { DomainTypes } from "./types";
import type { DomainModel, DomainContext, DomainProduct } from "./types";
import { parseBasketProduct } from "../basketProduct/utils";
import { type ProductProps } from "../product";
import { useI18n } from "../system";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    id: "domainManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as DomainContext,
    states: {
      subscribing: {
        entry: ["setContext", "clearLookups"],
        always: {
          target: "loading",
          actions: ["setBasketHelper", "setAuthHelper"]
        }
      },

      loading: {
        id: "loading",
        type: "parallel",
        entry: [],
        states: {
          existing: {
            initial: "processing",
            states: {
              processing: {
                invoke: {
                  src: "getClientDomains",
                  onDone: {
                    target: "complete",
                    actions: ["setOwned"]
                  },
                  onError: { target: "complete" }
                }
              },
              complete: { type: "final" }
            }
          },
          basket: {
            initial: "processing",
            states: {
              processing: {
                entry: ["loadBasket"],
                on: {
                  REFRESH: {
                    target: "complete",
                    actions: ["refreshContext", "setBasketProducts"]
                  },
                  ERROR: {
                    target: "complete"
                  }
                }
              },
              complete: { type: "final" }
            }
          }
        },
        onDone: "idle",
        exit: ["checkModel", "ensureSelected", "persistModel"]
      },

      // our initial state depends on if the machine has been forced to a type,
      // if we do then go to that types state, otherwise stay idle
      idle: {
        entry: ["checkChoices", "checkType"],
        id: "idle",
        always: [
          {
            target: "dac",
            cond: ({ type }) => {
              return includes(
                [DomainTypes.register, DomainTypes.transfer],
                type
              );
            }
          },
          {
            target: "existing",
            cond: ({ type }) => type === DomainTypes.existing
          },
          {
            target: "basket",
            cond: ({ type }) => type === DomainTypes.basket
          }
        ]
      },

      dac: {
        invoke: {
          id: "dac",
          src: DACmachine,
          data: ({
            type,
            search,
            currency,
            basketId,
            brandId,
            coupons,
            preferredCycle,
            tlds,
            useSuggestions
          }: DomainContext) => ({
            mode: type,
            search,
            currency,
            basketId,
            brandId,
            coupons,
            preferredCycle,
            tlds,
            useSuggestions
          }),
          autoForward: true,
          onError: {
            target: "idle",
            actions: ["setError"]
          },
          onDone: [
            {
              target: "#idle", // NB go back to start and let it work out where to go
              actions: ["setModelFromDac", "ensureSelected", "checkType"]
            }
          ]
        },
        on: {
          STOP: { actions: sendTo("dac", { type: "STOP" }) }
        },
        exit: ["clearSearch"]
      },

      existing: {
        id: "existing",
        initial: "invalid",
        states: {
          valid: {},
          invalid: {},
          error: {}
        },
        on: {
          UPDATE: [
            {
              target: ".valid",
              actions: ["clearError", "setExisting", "persistModel"],
              cond: "isDomainLike"
            },
            {
              target: ".invalid",
              actions: ["setErrorInvalidDomain", "setExisting", "persistModel"]
            }
          ]
        },
        exit: ["clearModel"]
      },

      basket: {
        id: "basket",
        entry: ["resetModel", "checkModel", "ensureSelected"],
        initial: "loading",
        states: {
          loading: {
            after: {
              wait: "invalid"
            }
          },
          processing: {
            after: {
              wait: "invalid"
            }
          },
          valid: {
            always: {
              target: "invalid",
              cond: "isInvalid"
            }
          },
          invalid: {
            always: {
              target: "valid",
              cond: "isValid"
            }
          },

          error: {},
          complete: {}
        },
        on: {
          SELECT: [
            {
              target: ".processing",
              actions: ["select", "persistModel"],
              cond: "isSelectable"
            }
          ]
        },
        exit: ["clearModel"]
      },

      complete: {
        type: "final"
      }
    },
    on: {
      REFRESH: {
        actions: [
          "setBasketProducts",
          "refreshContext",
          "checkChoices",
          "checkType"
        ]
      },

      CHOOSE: [
        {
          // do nothing
          cond: "isInvalidType"
        },
        {
          target: "dac",
          actions: ["setType"],
          cond: "isDomainRegister"
        },
        {
          target: "dac",
          actions: ["setType"],
          cond: "isDomainTransfer"
        },
        {
          target: "existing",
          actions: ["setType"],
          cond: "isExistingDomain"
        },
        {
          target: "basket",
          actions: ["setType"],
          cond: "isBasket"
        }
      ],

      STOP: {
        target: "complete"
      },

      AUTHENTICATED: { target: "loading", actions: ["clearLookups"] },
      UNAUTHENTICATED: { target: "loading", actions: ["clearLookups"] }
    }
  },
  {
    actions: {
      setContext: assign((context: DomainContext, _event: AnyEventObject) => {
        return defaultsDeep(context, {
          choices: values(DomainTypes),
          type: undefined,
          model: undefined,
          lookups: {
            owned: [],
            basket: []
          },
          // ---
          currency: undefined,
          basketId: undefined,
          brandId: undefined,
          coupons: [],
          // ---
          error: undefined,
          // ---
          authHelper: undefined,
          basketHelper: undefined,
          parseBasketProduct: undefined,
          parseProductModel: undefined
        }) as DomainContext;
      }),

      persistModel: assign({
        baseModel: ({ model }: DomainContext) => cloneDeep(model) // we use spread to ensure its a new array
      }),

      checkModel: assign({
        model: ({ model, lookups }: DomainContext) => {
          let value = parseDomain(model);
          if (isEmpty(value) && !isEmpty(lookups.basket)) {
            const parsed = map(lookups.basket, item => {
              return {
                domain: item.domain,
                tld: item.tld,
                sld: item.sld,
                type: DomainTypes.basket,
                selected: item.meta.selected
              } as DomainModel;
            });

            value = find(parsed, "selected") || first(parsed);
          }

          // ensure the selected flag is set on the selected domain
          if (value) set(value, "selected", true);

          return value;
        }
      }),

      ensureSelected: assign({
        model: ({ model }: DomainContext) => {
          if (!isEmpty(model) && !model.selected) {
            set(model, "selected", true);
          }
          return model;
        }
      }),

      checkChoices: assign({
        choices: ({ lookups, choices }: DomainContext) => {
          choices ??= [];
          if (isString(choices)) choices = [choices as DomainTypes];
          // ensure we DONT have the basket type in the choices if we dont have any basket products
          if (isEmpty(lookups.basket)) {
            remove(choices, value => value === DomainTypes.basket);
          }
          // nb only add the basket choice if we are not restricting choices
          else if (choices.length > 1 && !includes(choices, DomainTypes.basket))
            choices.push(DomainTypes.basket);

          return choices;
        }
      }),

      checkType: assign({
        type: ({ type, choices, model, lookups, search }: DomainContext) => {
          // FORCE: if we dont have a type set but we have an initial search query
          if (
            !type &&
            includes(choices, DomainTypes.register) &&
            !isEmpty(search?.query)
          ) {
            return DomainTypes.register;
          }

          const domain = get(model, "domain");

          // FORCE: if we have a domain AND we are not limiting the choices
          if (
            domain &&
            (includes(choices, DomainTypes.basket) ||
              includes(choices, DomainTypes.existing))
          ) {
            const added = some(lookups.basket, ["domain", domain]);
            if (added) {
              return DomainTypes.basket;
            }
            return DomainTypes.existing;
          }

          if (!type && !isEmpty(choices)) {
            return first(choices);
          }

          return type;
        }
      }),

      setType: assign({
        type: (_context, { data }: AnyEventObject) => data,
        error: undefined
      }),

      refreshContext: assign(
        (_context: DomainContext, { data }: AnyEventObject) => {
          if (isEmpty(data)) return {};
          const { id: basketId, brand_id: brandId, currency } = data;

          const newContext = {
            basketId,
            brandId,
            currency: currency?.code
          };

          return newContext;
        }
      ),

      setAuthHelper: assign(({ authHelper }: DomainContext) => ({
        authHelper: authHelper || spawn(authSubscription)
      })),

      loadBasket: pure(({ basketHelper }: DomainContext, _event) => {
        if (!basketHelper) return;
        return sendTo(basketHelper, {
          type: "INIT"
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
            if (
              !isDomainProduct({
                serviceIdentifier: raw.service_identifier,
                blueprintCode:
                  raw?.product?.provision_blueprint?.category?.code,
                provisionFields: raw?.provision_fields
              })
            )
              return undefined;

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
          ): ProductProps | undefined => {
            if (!item?.configuration?.productId) return undefined;
            return item.configuration;
          }
        };
      }),

      setBasketProducts: assign({
        lookups: (
          { lookups, parseBasketProduct, model }: DomainContext,
          { data }: AnyEventObject
        ) => {
          const primary = model || first(lookups.basket);
          // 1st filter out only the domain products from the basket products
          const domains = getDomainRawBasketProducts(
            data?.products as IBasketProduct[]
          );
          // then parse them into our DomainProduct type
          const available = reduce(
            domains,
            (result: DomainProduct[], raw: IBasketProduct) => {
              const parsed = parseBasketProduct(raw, primary?.domain);

              // NB ensure we have a valid domain and we dont already have it in the list
              if (parsed && !some(result, ["domain", parsed.domain]))
                result.push(parsed);

              return result;
            },
            []
          );

          set(lookups, "basket", available);
          return lookups;
        }
      }),

      // ---

      setExisting: assign({
        model: (_context: DomainContext, { data }: AnyEventObject) => {
          const value = trim(isArray(data) ? first(data) : data);
          const parsed = parseDomain(value, true);
          const domain: DomainModel = {
            type: DomainTypes.existing,
            domain: value,
            tld: parsed?.tld ?? "",
            sld: parsed?.sld ?? "",
            selected: true
          };
          return domain;
        }
      }),

      setModelFromDac: assign({
        model: (
          { model, lookups }: DomainContext,
          { data }: AnyEventObject
        ) => {
          // if no data, return existing model
          if (isEmpty(data?.domains)) return model;
          const mapped = map(data.domains, (item: DomainProduct) =>
            parseDomain(item.domain)
          );
          return find(mapped, "selected") || first(mapped);
        },
        lookups: ({ lookups }: DomainContext, { data }: AnyEventObject) => {
          if (isEmpty(data?.basket)) return lookups;
          lookups.basket = data.basket;
          return lookups;
        }
      }),

      clearModel: assign({
        model: () => undefined
      }),

      resetModel: assign({
        model: ({ baseModel }, _event: AnyEventObject) => cloneDeep(baseModel)
      }),

      setOwned: assign({
        lookups: ({ lookups }: DomainContext, { data }: AnyEventObject) => {
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
        lookups: (_context: DomainContext, _event: AnyEventObject) => {
          return {
            owned: [],
            basket: []
          };
        }
      }),

      select: assign({
        model: ({ lookups }: DomainContext, { data }: AnyEventObject) => {
          const selected =
            find(lookups.basket, ["domain", data]) || first(lookups.basket);

          if (selected) {
            return {
              domain: selected.domain,
              tld: selected.tld,
              sld: selected.sld,
              type: DomainTypes.basket,
              selected: true
            } as DomainModel;
          }
          return undefined;
        }
      }),

      clearSearch: assign({
        search: () => {
          return undefined;
        }
      }),

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          return mapToHeadlessError(data);
        }
      }),

      setErrorInvalidDomain: assign({
        error: (_context: DomainContext, { data }: AnyEventObject) => {
          const { t } = useI18n();
          return {
            data: null,
            status: responseCodes.Unprocessable_Entity,
            message: t("error.domain_not_valid"),
            origin: ErrorOrigin.Headless
          } as ResponseError;
        }
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      // hasData: (_context, { data }: AnyEventObject) =>
      //   isObjectLike(data) && !isEmpty(data),

      isInvalidType: (
        { choices, type }: DomainContext,
        { data }: AnyEventObject
      ) => {
        return isEmpty(choices) || !has(DomainTypes, data) || type == data;
      },

      isValid: ({ model }: DomainContext) => isEmpty(parseDomain(model)),

      isSelectable: (
        { model, lookups }: DomainContext,
        { data }: AnyEventObject
      ) => {
        const valid = some(lookups.basket, ["domain", data]);
        return valid;
      },

      isInvalid: ({ model }: DomainContext) => isEmpty(parseDomain(model)),

      isDomainLike: (_context: DomainContext, { data }: AnyEventObject) => {
        return DOMAIN_LIKE_VALIDATION.test(data.toString());
      },

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
        !isEmpty(choices) && data === DomainTypes.basket
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services: services as any
  }
);
