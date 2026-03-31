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
import { useFeedback } from "../feedback";

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
            target: "skip",
            cond: "isSkip"
          },
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
            cond: ({ type }) => type === DomainTypes.existing,
            actions: ["setTransferFromBasket"]
          },
          {
            target: "basket",
            cond: ({ type }) => type === DomainTypes.basket
          }
        ]
      },

      skip: {
        entry: ["setSkipModel"]
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
            tlds
          }: DomainContext) => ({
            mode: type,
            search,
            currency,
            basketId,
            brandId,
            coupons,
            preferredCycle,
            tlds
          }),
          autoForward: true,
          onError: {
            target: "idle",
            actions: ["setError"]
          },
          onDone: [
            {
              target: "#basket",
              cond: "hasDacDomains",
              actions: [
                "setModelFromDac",
                "ensureSelected",
                "checkChoices",
                "setTypeBasket",
                "persistModel"
              ]
            },
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
          invalid: {
            always: {
              target: "transferred",
              cond: "hasTransferProductId"
            }
          },

          validating: {
            entry: ["setCheckingDomain"],
            always: {
              target: "valid",
              cond: "isOwnedDomain",
              actions: ["persistModel"]
            },
            invoke: {
              src: "checkAvailability",
              onDone: [
                {
                  target: "checked",
                  cond: "isDomainTransferable",
                  actions: ["setAvailabilityResult"]
                },
                {
                  target: "registerable",
                  cond: "isDomainRegisterable",
                  actions: ["setAvailabilityResult"]
                },
                {
                  target: "unavailable",
                  cond: "isDomainUnavailable"
                },
                {
                  target: "valid",
                  actions: ["persistModel"]
                }
              ],
              onError: {
                target: "error",
                actions: ["setError"]
              }
            }
          },

          checked: {
            on: {
              ADD_TRANSFER: { target: "transferring" }
            }
          },

          registerable: {
            on: {
              ADD_REGISTRATION: { target: "registering" }
            }
          },

          registering: {
            invoke: {
              src: "addExistingRegistration",
              onDone: {
                target: "#basket",
                actions: [
                  "setModelFromRegistration",
                  "ensureSelected",
                  "checkChoices",
                  "setTypeBasket",
                  "persistModel"
                ]
              },
              onError: {
                target: "registerable",
                actions: ["setError", "setFeedbackRegistrationAddError"]
              }
            }
          },

          transferring: {
            invoke: {
              src: "addExistingTransfer",
              onDone: {
                target: "transferred",
                actions: ["setTransferProductId"]
              },
              onError: {
                target: "checked",
                actions: ["setError", "setFeedbackTransferAddError"]
              }
            }
          },

          transferred: {
            on: {
              REMOVE_TRANSFER: { target: "removing" }
            }
          },

          removing: {
            entry: ["setRemovalInFlight"],
            on: {
              UPDATE: { actions: ["storePendingUpdate"] },
              CHOOSE: { actions: ["storePendingChoose"] }
            },
            invoke: {
              src: "removeExistingTransfer",
              onDone: [
                {
                  target: "#idle",
                  cond: "hasPendingChoose",
                  actions: [
                    "applyPendingChoose",
                    "clearPendingChoose",
                    "clearPendingUpdate",
                    "clearRemovalInFlight",
                    "clearModel",
                    "clearCheckingDomain",
                    "clearAvailabilityResult",
                    "clearTransferProductId"
                  ]
                },
                {
                  target: "validating",
                  cond: "hasPendingUpdateDomainLike",
                  actions: [
                    "setExistingFromPending",
                    "persistModel",
                    "clearPendingUpdate",
                    "clearAvailabilityResult",
                    "clearRemovalInFlight",
                    "clearTransferProductId"
                  ]
                },
                {
                  target: "invalid",
                  cond: "hasPendingUpdate",
                  actions: [
                    "setExistingFromPending",
                    "persistModel",
                    "clearPendingUpdate",
                    "clearAvailabilityResult",
                    "clearRemovalInFlight",
                    "clearTransferProductId"
                  ]
                },
                {
                  target: "checked",
                  actions: ["clearRemovalInFlight", "clearTransferProductId"]
                }
              ],
              onError: [
                {
                  target: "transferred",
                  cond: "hasPendingChoose",
                  actions: [
                    "setError",
                    "setFeedbackTransferRemoveError",
                    "clearPendingChoose",
                    "clearPendingUpdate",
                    "clearRemovalInFlight"
                  ]
                },
                {
                  target: "transferred",
                  actions: [
                    "setError",
                    "setFeedbackTransferRemoveError",
                    "clearPendingUpdate",
                    "clearRemovalInFlight"
                  ]
                }
              ]
            }
          },

          valid: {},
          unavailable: {
            on: {
              UPDATE: [
                {
                  target: "validating",
                  cond: "isDomainLike",
                  actions: ["clearError", "setExisting", "persistModel"]
                },
                {
                  target: "invalid",
                  actions: [
                    "setErrorInvalidDomain",
                    "setExisting",
                    "persistModel"
                  ]
                }
              ]
            }
          },
          error: {}
        },
        on: {
          REFRESH: {
            actions: ["setBasketProducts", "refreshContext", "checkChoices"]
          },
          UPDATE: [
            {
              target: ".removing",
              cond: "isTransferred",
              actions: ["storePendingUpdate"]
            },
            {
              target: ".validating",
              cond: "isDomainLike",
              actions: ["clearError", "setExisting", "persistModel"]
            },
            {
              target: ".invalid",
              actions: ["setErrorInvalidDomain", "setExisting", "persistModel"]
            }
          ]
        },
        exit: [
          "clearModel",
          "clearCheckingDomain",
          "clearAvailabilityResult",
          "clearRemovalInFlight",
          "clearTransferProductId"
        ]
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
          REFRESH: {
            target: "#idle",
            cond: "isBasketEmptyFromEvent",
            actions: ["setBasketProducts", "clearModel", "clearType"]
          },
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
          // Already removing — absorb the new target type, don't restart removal
          cond: "isInRemovingState",
          actions: ["storePendingChoose"]
        },
        {
          // In transferred — must remove transfer before switching types (blocking)
          target: "#existing.removing",
          cond: "isInTransferredState",
          actions: ["storePendingChoose"]
        },
        {
          // do nothing
          cond: "isInvalidType"
        },
        {
          target: "skip",
          actions: ["setType"],
          cond: "isSkipType"
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

      AUTHENTICATED: {
        target: "loading",
        actions: ["clearLookups"]
      },
      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearLookups"]
      }
    }
  },
  {
    actions: {
      setContext: assign((context: DomainContext, _event: AnyEventObject) => {
        return defaultsDeep(context, {
          choices: values(DomainTypes),
          type: undefined,
          required: undefined,
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
          // --- existing flow
          checkingDomain: undefined,
          availabilityResult: undefined,
          transferProductId: undefined,
          pendingUpdate: undefined,
          pendingChoose: undefined,
          removalInFlight: false,
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
        choices: ({ lookups, choices, required }: DomainContext) => {
          choices ??= [];
          if (isString(choices)) choices = [choices as DomainTypes];

          // exclude skip when not explicitly optional
          if (required !== false) {
            remove(choices, value => value === DomainTypes.skip);
          }
          // add skip when explicitly optional and not already present
          else if (!includes(choices, DomainTypes.skip)) {
            choices.unshift(DomainTypes.skip);
          }

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
        type: ({
          type,
          choices,
          model,
          lookups,
          search,
          required
        }: DomainContext) => {
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
            const matched = find(lookups.basket, ["domain", domain]);
            if (matched) {
              // Transfer products should route to existing, not basket
              if (matched.meta?.isTransfer) {
                return DomainTypes.existing;
              }
              return DomainTypes.basket;
            }
            return DomainTypes.existing;
          }

          if (!type && !isEmpty(choices)) {
            // required === false → default to skip (explicitly optional)
            if (required === false) {
              return DomainTypes.skip;
            }
            // required === true → auto-select register when no basket items
            if (required === true) {
              if (
                isEmpty(lookups.basket) &&
                includes(choices, DomainTypes.register)
              ) {
                return DomainTypes.register;
              }
              return undefined;
            }
            // required === undefined (legacy) → auto-select first choice
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

            // Detect transfer: check if basket product options match transfer sub-product IDs
            const transferSubIds =
              (raw.product as any)?.setup_function_sub_ids?.transfer ?? [];
            if (
              transferSubIds.length > 0 &&
              some(raw.options, (opt: any) =>
                includes(transferSubIds, opt.product_id)
              )
            ) {
              basketProduct.meta.isTransfer = true;
            }

            // Fallback: setup_function_sub_ids is unavailable in the basket
            // API response. Match basket option product_ids against catalog
            // products_options and check for transfer indicators.
            if (!basketProduct.meta.isTransfer && raw.options?.length) {
              const hasTransferIndicator = (product: any): boolean => {
                if (!product) return false;
                const name = (product.name ?? "").toLowerCase();
                const code = (product.code ?? "").toLowerCase();
                const opCode = (
                  product.domain_operation_code ?? ""
                ).toLowerCase();
                return (
                  name.includes("transfer") ||
                  code.includes("transfer") ||
                  opCode === "transfer"
                );
              };

              const basketOptionProductIds = new Set(
                map(raw.options, (opt: any) => opt.product_id)
              );
              const catalogOptions = raw.product?.products_options ?? [];

              const isTransfer =
                some(
                  catalogOptions,
                  (catOpt: any) =>
                    basketOptionProductIds.has(catOpt.id) &&
                    hasTransferIndicator(catOpt)
                ) ||
                some(raw.options, (opt: any) =>
                  hasTransferIndicator(opt.product)
                );

              if (isTransfer) {
                basketProduct.meta.isTransfer = true;
              }
            }

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

      setExistingFromPending: assign({
        model: (context: DomainContext) => {
          const value = trim(context.pendingUpdate ?? "");
          const parsed = parseDomain(value, true);
          return {
            type: DomainTypes.existing,
            domain: value,
            tld: parsed?.tld ?? "",
            sld: parsed?.sld ?? "",
            selected: true
          } as DomainModel;
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

      clearError: assign({ error: undefined }),

      setSkipModel: assign({
        model: () => null
      }),

      clearType: assign({
        type: () => undefined
      }),

      setTypeBasket: assign({
        type: () => DomainTypes.basket
      }),

      storePendingUpdate: assign({
        pendingUpdate: (_context: DomainContext, { data }: AnyEventObject) => {
          const d = data;
          return trim(isArray(d) ? first(d) : d);
        }
      }),

      clearPendingUpdate: assign({
        pendingUpdate: () => undefined
      }),

      storePendingChoose: assign({
        pendingChoose: (_context: DomainContext, { data }: AnyEventObject) =>
          data
      }),

      clearPendingChoose: assign({
        pendingChoose: () => undefined
      }),

      applyPendingChoose: assign({
        type: (context: DomainContext) => {
          const target = context.pendingChoose;
          if (target && includes(context.choices, target)) return target;
          console.warn(
            "[domain] pendingChoose target no longer in choices, falling back",
            { target, choices: context.choices }
          );
          return undefined;
        },
        error: undefined
      }),

      setRemovalInFlight: assign({
        removalInFlight: () => true
      }),

      clearRemovalInFlight: assign({
        removalInFlight: () => false
      }),

      setCheckingDomain: assign({
        checkingDomain: (ctx: DomainContext) => ctx.model?.domain
      }),

      clearCheckingDomain: assign({
        checkingDomain: () => undefined
      }),

      setAvailabilityResult: assign({
        availabilityResult: (
          _context: DomainContext,
          { data }: AnyEventObject
        ) => data
      }),

      clearAvailabilityResult: assign({
        availabilityResult: () => undefined
      }),

      setTransferProductId: assign({
        transferProductId: (
          _context: DomainContext,
          { data }: AnyEventObject
        ) => data?.bpid
      }),

      setTransferFromBasket: assign({
        transferProductId: ({ lookups, model }: DomainContext) => {
          const domain = get(model, "domain");
          if (!domain) return undefined;
          // If checkType routed to existing AND domain is in basket,
          // it must be a transfer product (non-transfers go to basket type)
          const matched = find(lookups.basket, ["domain", domain]);
          return matched?.id;
        }
      }),

      clearTransferProductId: assign({
        transferProductId: () => undefined
      }),

      setFeedbackTransferAddError: (context: DomainContext) => {
        const { t } = useI18n();
        useFeedback().addError({
          title: t("domain.error.transfer_add_failed"),
          copy: context.checkingDomain
        });
      },

      setFeedbackTransferRemoveError: (context: DomainContext) => {
        const { t } = useI18n();
        useFeedback().addError({
          title: t("domain.error.transfer_remove_failed"),
          copy: context.checkingDomain
        });
      },

      setModelFromRegistration: assign({
        model: (_ctx: DomainContext, { data }: AnyEventObject) => {
          if (!data?.domain) return undefined;
          return parseDomain(data.domain) as DomainModel;
        }
      }),

      setFeedbackRegistrationAddError: (context: DomainContext) => {
        const { t } = useI18n();
        useFeedback().addError({
          title: t("domain.error.registration_add_failed"),
          copy: context.checkingDomain
        });
      }
    },

    guards: {
      isSkip: ({ type }: DomainContext) => type === DomainTypes.skip,

      isSkipType: ({ choices }: DomainContext, { data }: AnyEventObject) =>
        !isEmpty(choices) && data === DomainTypes.skip,

      isBasketEmptyFromEvent: (
        _context: DomainContext,
        { data }: AnyEventObject
      ) => {
        const products = data?.products;
        return isArray(products) && products.length === 0;
      },

      hasDacDomains: (_context: DomainContext, { data }: AnyEventObject) =>
        !isEmpty(data?.domains),

      isInTransferredState: (
        _ctx: DomainContext,
        _event: AnyEventObject,
        { state }: any
      ) => state.matches("existing.transferred"),

      isInRemovingState: (
        _ctx: DomainContext,
        _event: AnyEventObject,
        { state }: any
      ) => state.matches("existing.removing"),

      isOwnedDomain: ({ model, lookups }: DomainContext) =>
        some(lookups.owned, ["domain", model?.domain]),

      isDomainTransferable: (
        _context: DomainContext,
        { data }: AnyEventObject
      ) => !data?.can_register && data?.can_transfer === true,

      isDomainRegisterable: (
        _context: DomainContext,
        { data }: AnyEventObject
      ) => data?.can_register === true,

      isDomainUnavailable: (
        _context: DomainContext,
        { data }: AnyEventObject
      ) => data?.can_register === false && data?.can_transfer === false,

      isTransferred: (
        _ctx: DomainContext,
        _event: AnyEventObject,
        { state }: any
      ) => state.matches("existing.transferred"),

      hasPendingChoose: ({ pendingChoose }: DomainContext) =>
        pendingChoose !== undefined,

      hasTransferProductId: ({ transferProductId }: DomainContext) =>
        !!transferProductId,

      hasPendingUpdateDomainLike: ({ pendingUpdate }: DomainContext) =>
        !!pendingUpdate && DOMAIN_LIKE_VALIDATION.test(pendingUpdate),

      hasPendingUpdate: ({ pendingUpdate }: DomainContext) =>
        pendingUpdate !== undefined,

      isInvalidType: (
        { choices, type }: DomainContext,
        { data }: AnyEventObject
      ) => {
        return isEmpty(choices) || !has(DomainTypes, data) || type == data;
      },

      isValid: ({ model }: DomainContext) => !isEmpty(parseDomain(model)),

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
