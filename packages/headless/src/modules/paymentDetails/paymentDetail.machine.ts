// --- external
import { createMachine, assign, spawn, sendParent } from "xstate";

// --- internal
import services from "./services";
import { authSubscription } from "../session/helper";

// --- utils
import {
  filterGateways,
  filterPaymentDetails,
  filterPaymentTypes,
  spawnGateway
} from "./utils";
import {
  mapToHeadlessError,
  stateMatches,
  stopService,
  useModelParser
} from "../../utils";
import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema } from "./schemas";
import { isEqual, isEmpty, find, map, isNil, set, includes } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { PaymentDetailsContext } from "./types";
import { responseCodes } from "../../utils";
import {
  PaymentType,
  GatewayContext as GatewayCtx,
  type IBasket,
  InvoiceStatus
} from "@upmind-automation/types";
import { mapPaymentData } from "./mappers";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    id: "paymentDetailManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as PaymentDetailsContext,
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continue
      subscribing: {
        entry: ["setAuthHelper"],
        on: {
          AUTHENTICATED: { target: "checking" },
          REFRESH: {
            actions: ["refresh"]
          }
        }
      },

      checking: {
        invoke: {
          src: "isAuthenticated",
          onDone: [
            { target: "loading", cond: "isPayable" },
            { target: "unavailable" }
          ],

          onError: { target: "unavailable" }
        }
      },

      loading: {
        id: "loading",
        entry: ["clearError"],
        invoke: {
          src: "loadLookups",
          onDone: {
            target: "available",
            actions: ["setRaw", "setLookups", "setSchemas"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

      unavailable: {
        on: {
          AUTHENTICATED: { target: "checking" }
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
                      "setParsed",
                      "setLookups",
                      "setGateway",
                      "setSchemas"
                    ]
                  }
                }
              },
              validating: {
                invoke: {
                  src: "validate",
                  onDone: { target: "#valid" },
                  onError: [
                    {
                      target: "#valid",
                      cond: "needsNoPayment"
                    },
                    {
                      target: "#invalid",
                      actions: ["setError"]
                    }
                  ]
                }
              }
            }
          },

          valid: {
            id: "valid",
            always: [{ target: "#processing", cond: "shouldUpdate" }],
            on: {
              PAYMENT_DETAILS: [
                {
                  target: "checking",
                  cond: "isPaymentDetail"
                }
              ],

              // NB: if we are Free then we can complete CHECKOUT without going to processing
              //     if we already have payment details, then we can complete immediately on CHECKOUT,
              //     otherwise we need to go via processing where the spawned gateway will handle the checkout
              //     and return PAYMENT_DETAILS when done
              CHECKOUT: [
                {
                  target: "#complete",
                  actions: ["setPaymentDetails"],
                  cond: "needsNoPayment"
                },
                {
                  target: "#complete",
                  cond: "hasPaymentDetails"
                },

                { target: "#processing", cond: "hasBasket" }
              ]
            }
          },

          invalid: {
            id: "invalid"
          }
        },
        on: {
          CLEAR: {
            target: "available.checking",
            actions: ["reset"]
          },
          SET: {
            target: "available.checking",
            actions: ["setAutoUpdate"]
          },
          SET_PARTIAL_PAYMENT: {
            target: "available.checking",
            actions: ["setPartialPayment"]
          },
          SET_WALLET_AMOUNT: {
            target: "available.checking",
            actions: ["setWalletAmount"]
          },
          REFRESH: [
            // NB if we change core values, tear down the gateway and re create it
            {
              target: "#loading",
              actions: ["reset", "refresh", "refreshActors"],
              cond: "hasChanged"
            },
            // otherwise just update context and actors
            {
              target: "available.checking",
              actions: ["refresh", "refreshActors"],
              cond: "hasAmountChanged"
            }
          ]
        }
      },

      processing: {
        id: "processing",
        entry: ["forwardCheckout"],
        on: {
          CANCEL: {
            target: "#invalid", // no need to set the error, it will be set by the gateway
            actions: ["cancelPaymentDetails", "clearAutoUpdate"]
          },
          // ths is the response from the gateway
          PAYMENT_DETAILS: {
            target: "#complete",
            actions: ["setPaymentDetails", "clearAutoUpdate"]
          }
        }
      },

      // ---
      error: { id: "error" },

      complete: {
        entry: ["providePaymentDetails"],
        id: "complete",
        type: "final",
        data: (
          { paymentDetail, model }: PaymentDetailsContext,
          _event: AnyEventObject
        ) => paymentDetail
      }
    },
    on: {
      UNAUTHENTICATED: {
        target: "subscribing",
        actions: ["clearError", "reset", "clearSchemas"]
      }
    }
  },
  {
    actions: {
      setAuthHelper: assign({
        authHelper: (
          { authHelper }: PaymentDetailsContext,
          _event: AnyEventObject
        ) => authHelper ?? spawn(authSubscription)
      }),

      setParsed: assign({
        model: (_context: PaymentDetailsContext, { data }: AnyEventObject) =>
          data.model,
        paymentDetail: (
          _context: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => data.paymentDetail
      }),

      setRaw: assign({
        raw: (_context: PaymentDetailsContext, { data }: AnyEventObject) => data
      }),

      setLookups: assign({
        lookups: (
          { model, raw, orderStatus }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => {
          // NB: Filter out  gateways and payment details that are not valid base don our model
          const safePaymentTypes = filterPaymentTypes(raw.config, model);
          const safeGateways = filterGateways(
            raw.gateways ?? [],
            model,
            orderStatus
          );
          const safePaymentDetails = filterPaymentDetails(
            raw.storedPaymentMethods ?? [],
            safeGateways
          );
          return {
            storedPaymentMethods: safePaymentDetails,
            gateways: safeGateways,
            paymentTypes: safePaymentTypes,
            accountCredit: raw?.accountCredit,
            amountsFormatted: data?.amountsFormatted ?? {
              amount: "",
              outstanding: "",
              wallet: ""
            }
          };
        }
      }),

      setSchemas: assign({
        schema: (context: PaymentDetailsContext) => useSchema(context),
        uischema: (context: PaymentDetailsContext) => useUischema(context),
        model: ({ schema, model }: PaymentDetailsContext) => {
          if (!schema) return model;
          return useModelParser(schema, model);
        }
      }),

      setPartialPayment: assign({
        amountPartial: (
          _context: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => data.amount ?? 0
      }),

      setWalletAmount: assign({
        amountWallet: (
          _context: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => data.wallet_amount ?? 0
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setAutoUpdate: assign({
        autoupdate: (
          _context: PaymentDetailsContext,
          { update }: AnyEventObject
        ) => !!update
      }),

      clearAutoUpdate: assign({
        autoupdate: false
      }),

      setGateway: assign({
        // NB: SPAWN HAS TO BE DONE IN AN ASSIGN!
        gatewayHelper: (
          {
            address,
            orderId,
            currency,
            lookups,
            gatewayHelper,
            client,
            model
          }: PaymentDetailsContext,
          _event: AnyEventObject
        ) => {
          if (gatewayHelper?.id != model?.gateway_id) {
            // stop any existing gateways if they are different
            if (gatewayHelper) stopService(gatewayHelper);

            // then find the gateway in the list
            const brandGateway = find(lookups.gateways, [
              "gateway_id",
              model?.gateway_id
            ]);

            if (!brandGateway?.gateway) return undefined;

            // and spawn it if it exists
            gatewayHelper = spawnGateway({
              orderId,
              gateway: brandGateway.gateway,
              amount: model?.amount ?? 0,
              currency,
              address,
              client,
              ctx: GatewayCtx.PAY
            });
          }

          return gatewayHelper; // otherwise just return the existing one
        }
      }),

      reset: assign({
        gatewayHelper: ({ gatewayHelper }: PaymentDetailsContext) => {
          if (gatewayHelper) stopService(gatewayHelper);
          return undefined;
        },
        // NB reset the model AND amounts so we force a reparse and recalculation
        model: undefined,
        amountPartial: undefined,
        amountWallet: undefined
      }),

      refresh: assign({
        orderId: (_context: PaymentDetailsContext, { data }: AnyEventObject) =>
          data?.id,
        client: ({ client }: PaymentDetailsContext, { data }: AnyEventObject) =>
          data?.client ?? client,
        currency: (
          { currency }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => data?.currency ?? currency,
        address: (
          { address }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => data?.address ?? address,
        paymentDetail: (
          _context: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => undefined, // we clear the payment details so we force a reparse
        amount: (_context: PaymentDetailsContext, { data }: AnyEventObject) =>
          data?.unpaid_amount_converted || 0.0 // NB: we always force use the outstanding amount
      }),

      refreshActors: assign({
        gatewayHelper: (
          {
            gatewayHelper,
            orderId,
            currency,
            model,
            address,
            client
          }: PaymentDetailsContext,
          _event: AnyEventObject
        ) => {
          if (
            gatewayHelper?.send &&
            !stateMatches(gatewayHelper, ["complete", "done"])
          ) {
            gatewayHelper.send({
              type: "REFRESH",
              data: {
                orderId,
                currency,
                amount: model?.amount ?? 0,
                address,
                client
              }
            });
          }

          return gatewayHelper;
        }
      }),

      // ---

      setPaymentDetails: assign({
        paymentDetail: (
          { model, lookups, client }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) =>
          mapPaymentData({
            clientId: client?.id,
            data,
            lookups,
            model
          })
      }),

      providePaymentDetails: sendParent(
        ({ paymentDetail }: PaymentDetailsContext) => ({
          type: "PAYMENT_DETAILS",
          data: paymentDetail
        })
      ),

      cancelPaymentDetails: sendParent(() => ({
        type: "CANCEL"
      })),

      // ---

      forwardCheckout: ({ gatewayHelper }: PaymentDetailsContext) => {
        if (gatewayHelper?.send) gatewayHelper.send({ type: "CHECKOUT" });
      },

      // ---

      setError: assign({
        error: (_context: PaymentDetailsContext, { data }: AnyEventObject) => {
          let error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      isPayable: (
        { orderStatus }: PaymentDetailsContext,
        _event: AnyEventObject
      ) =>
        includes(
          [
            InvoiceStatus.DRAFT,
            InvoiceStatus.ADJUSTED,
            InvoiceStatus.UNPAID,
            InvoiceStatus.OVERDUE
          ],
          orderStatus
        ),

      hasBasket: ({ orderId }: PaymentDetailsContext, _event: AnyEventObject) =>
        !!orderId,

      needsNoPayment: (
        { model }: PaymentDetailsContext,
        _event: AnyEventObject
      ) =>
        !model?.amount ||
        isEqual(model.amount, model.wallet_amount) ||
        model?.type == PaymentType.PAY_LATER,

      hasPaymentDetails: (
        { paymentDetail, model }: PaymentDetailsContext,
        _event: AnyEventObject
      ) => !isNil(paymentDetail),
      isPaymentDetail: (
        _context: PaymentDetailsContext,
        { data }: AnyEventObject
      ) => !isEmpty(data?.payment_details_id),
      shouldUpdate: (
        { autoupdate, orderId, model }: PaymentDetailsContext,
        _event: AnyEventObject
      ) => !!autoupdate && !!orderId && model?.amount !== 0,

      hasAmountChanged: (
        { model }: PaymentDetailsContext,
        { data }: AnyEventObject
      ) => model?.amount != (data?.unpaid_amount_converted || 0),

      hasChanged: (
        { orderId, client, address, currency }: PaymentDetailsContext,
        { data }: AnyEventObject
      ) => {
        const orderChanged = orderId != data?.id;
        const clientChanged = client?.id != data?.client_id;
        const currencyChanged = currency?.id != data?.currency_id;
        // NB : We only need to worry if the address country changes  as that is all that affects payment methods
        const countryChanged =
          data?.address && address?.country_id != data?.address?.country_id;
        return (
          orderChanged || clientChanged || countryChanged || currencyChanged
        );
      },

      hasData: (context: PaymentDetailsContext, { data }: AnyEventObject) =>
        !isEmpty(data)
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
