/** @internal */
import { createMachine, assign, spawn, sendParent, sendTo, pure } from "xstate";
import {
  PaymentType,
  BrandConfigKeys,
  GatewayContext as GatewayCtx,
  QUERY_PARAMS,
  InvoiceStatus
} from "@upmind-automation/types";
import { STRIPE_QUERY_PARAMS } from "../payment-gateways/stripe/types";
import { useQueryParams } from "../routing";
import { authSubscription } from "../session-store";
import { mapPaymentData } from "./payment-details.mappers";
import { useSchema, useUischema } from "./payment-details.schemas";
import services from "./payment-details.services";
import {
  filterGateways,
  filterPaymentDetails,
  filterPaymentTypes,
  isAddFlow,
  spawnGateway
} from "./payment-details.utils";
import { calculateActor } from "../../utils";
import {
  mapToHeadlessError,
  stateMatches,
  stopService,
  useModelParser,
  useSessionStorage
} from "../../utils";
import { useTime, useValidationParser } from "../../utils";
import { responseCodes } from "../../utils";
import {
  every,
  find,
  get,
  includes,
  isEmpty,
  isEqual,
  isNil,
  set
} from "lodash-es";
import type { PaymentDetailsContext } from "./payment-details.types";
import type { AnyEventObject } from "xstate";

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
            { target: "restoring", cond: "hasPendingOperation" },
            { target: "loading", cond: "isPayable" },
            { target: "unavailable" }
          ],

          onError: { target: "unavailable" }
        }
      },

      restoring: {
        id: "restoring",
        invoke: {
          src: "restoreOperation",
          onDone: {
            target: "finalising",
            actions: ["setOperation", "resetOperation"]
          },
          onError: {
            target: "error",
            actions: ["setError", "resetOperation"]
          }
        }
      },

      loading: {
        id: "loading",
        invoke: {
          src: "loadLookups",
          onDone: {
            target: "available",
            actions: ["setRaw", "setLookups", "resolveCtx", "setSchemas"]
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
                      "setSchemas",
                      "calculate",
                      // NB: sync the gateway helper with the freshly parsed
                      // model.amount. Without this, SET_PARTIAL_PAYMENT and
                      // SET_WALLET_AMOUNT updates never reach the gateway,
                      // leaving Stripe configured with a stale amount (and
                      // stuck in `unavailable` if the previous amount was
                      // below its minimum).
                      "refreshActors"
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
                    // incomplete gateway form: block PAY (invalid) without alert
                    {
                      target: "#invalid",
                      actions: ["clearError"],
                      cond: "isGatewayIncomplete"
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

              // NB: if we are Free then we can complete PAY without going to processing
              //     if we already have payment details, then we can complete immediately on PAY,
              //     otherwise we need to go via processing where the spawned gateway will handle the payment
              //     and return PAYMENT_DETAILS when done
              PAY: [
                // Free + requirePaymentForFreeOrders: PAY acts as ADD
                {
                  target: "#processing",
                  cond: "isAddContext"
                },
                {
                  target: "#complete",
                  actions: ["setPaymentDetail"],
                  cond: "needsNoPayment"
                },
                {
                  target: "#complete",
                  cond: "hasPaymentDetails"
                },

                { target: "#processing", cond: "hasBasket" }
              ],
              ADD: [
                {
                  target: "#processing",
                  cond: "isAddContext"
                }
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
            actions: ["clearError", "setAutoUpdate"]
          },
          SET_PARTIAL_PAYMENT: {
            target: "available.checking",
            actions: ["clearError", "setPartialPayment"]
          },
          SET_WALLET_AMOUNT: {
            target: "available.checking",
            actions: ["clearError", "setWalletAmount"]
          },
          CALCULATED: {
            actions: ["setAmountsFormatted"]
          },
          REFRESH: [
            // NB if we change core values, tear down the gateway and re create it
            {
              target: "#loading",
              actions: ["reset", "refresh", "resolveCtx", "refreshActors"],
              cond: "hasChanged"
            },
            // otherwise just update context and actors
            {
              target: "available.checking",
              actions: ["refresh", "resolveCtx", "refreshActors"],
              cond: "hasAmountChanged"
            }
          ]
        }
      },

      processing: {
        id: "processing",
        entry: ["forwardSubmit"],
        // NB: If no gateway helper is available, forwardSubmit is a no-op.
        // Transition to error after a timeout to prevent stuck state.
        after: {
          60000: {
            target: "#error",
            cond: ({ gatewayHelper }: PaymentDetailsContext) =>
              !gatewayHelper?.send
          }
        },
        on: {
          CANCEL: {
            target: "available.checking",
            actions: ["cancelPaymentDetails", "clearAutoUpdate"]
          },
          // --- PAY context: gateway returns finalized payment details → complete
          PAYMENT_DETAILS: [
            {
              target: "#finalising",
              actions: ["setOperation", "clearAutoUpdate"],
              cond: "isAddContext"
            },
            {
              target: "#complete",
              actions: ["setPaymentDetail", "clearAutoUpdate"]
            }
          ]
        }
      },

      finalising: {
        id: "finalising",
        invoke: {
          src: "endSetup",
          onDone: {
            target: "#complete",
            actions: ["setAddedPaymentDetailId", "setPaymentDetail"]
          },
          onError: {
            target: "#loading",
            actions: ["setError"]
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
          { paymentDetail }: PaymentDetailsContext,
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
        raw: (_context: PaymentDetailsContext, { data }: AnyEventObject) =>
          data,
        calculateCallback: ({ calculateCallback }: PaymentDetailsContext) =>
          calculateCallback ?? spawn(calculateActor())
      }),

      setLookups: assign({
        lookups: (
          {
            amount,
            requirePaymentForFreeOrders,
            model,
            raw,
            orderStatus
          }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => {
          // NB determine if we are in ADD context
          const safePaymentDetails = filterPaymentDetails(
            raw.storedPaymentMethods ?? [],
            raw.gateways ?? []
          );
          const isAdd =
            (amount ?? 0) === 0 &&
            requirePaymentForFreeOrders &&
            isEmpty(safePaymentDetails);

          // NB in ADD context, only show store-capable gateways and disable pay later
          const config = isAdd
            ? set({ ...raw.config }, BrandConfigKeys.PAY_LATER_ENABLED, false)
            : raw.config;
          const safePaymentTypes = filterPaymentTypes(config, model);
          const safeGateways = filterGateways(
            raw.gateways ?? [],
            model,
            orderStatus,
            { storeOnly: isAdd }
          );

          return {
            storedPaymentMethods: filterPaymentDetails(
              raw.storedPaymentMethods ?? [],
              safeGateways
            ),
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
            model,
            ctx
          }: PaymentDetailsContext,
          _event: AnyEventObject
        ) => {
          if (gatewayHelper?.id != model?.gateway_id) {
            // stop any existing gateways if they are different
            if (gatewayHelper) {
              gatewayHelper.send({ type: "CLEANUP" });
              stopService(gatewayHelper);
            }

            // then find the gateway in the list
            const brandGateway = find(lookups.gateways, [
              "gateway_id",
              model?.gateway_id
            ]);

            if (!brandGateway?.gateway) return undefined;

            // and spawn it if it exists — use context's ctx (ADD or PAY)
            gatewayHelper = spawnGateway({
              orderId,
              gateway: brandGateway.gateway,
              amount: model?.amount ?? 0,
              currency,
              address,
              client,
              ctx: ctx ?? GatewayCtx.PAY
            });
          }

          return gatewayHelper; // otherwise just return the existing one
        }
      }),

      reset: assign({
        gatewayHelper: ({ gatewayHelper }: PaymentDetailsContext) => {
          if (gatewayHelper) {
            gatewayHelper.send({ type: "CLEANUP" });
            stopService(gatewayHelper);
          }
          return undefined;
        },
        calculateCallback: ({ calculateCallback }: PaymentDetailsContext) => {
          if (calculateCallback) {
            calculateCallback.send({ type: "CANCEL" });
            stopService(calculateCallback);
          }
          return undefined;
        },
        // NB reset the model AND amounts so we force a reparse and recalculation
        model: undefined,
        amountPartial: undefined,
        amountWallet: undefined
      }),

      refresh: assign({
        orderId: (_context: PaymentDetailsContext, { data }: AnyEventObject) =>
          data?.id ?? data?.orderId,
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
          { _data }: AnyEventObject
        ) => undefined, // we clear the payment details so we force a reparse
        amount: ({ amount }: PaymentDetailsContext, { data }: AnyEventObject) =>
          data?.unpaid_amount_converted ?? data?.amount ?? amount ?? 0
      }),

      resolveCtx: assign({
        ctx: ({
          ctx,
          amount,
          requirePaymentForFreeOrders,
          lookups
        }: PaymentDetailsContext) => {
          if ((amount ?? 0) > 0) return GatewayCtx.PAY;

          if (
            requirePaymentForFreeOrders &&
            (amount ?? 0) === 0 &&
            isEmpty(lookups?.storedPaymentMethods)
          )
            return GatewayCtx.ADD;

          return ctx ?? GatewayCtx.PAY; // Nb ensure we force pay if we are not already set
        }
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

      setOperation: assign({
        operation: (
          _context: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => data
      }),

      setAddedPaymentDetailId: assign({
        model: (
          { model }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => ({
          ...model,
          payment_details_id: get(data, "client_payment_details.id")
        })
      }),

      setPaymentDetail: assign({
        paymentDetail: (
          {
            model,
            lookups,
            client,
            requirePaymentForFreeOrders
          }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) =>
          mapPaymentData({
            clientId: client?.id,
            data,
            lookups,
            model,
            requirePaymentForFreeOrders
          })
      }),

      providePaymentDetails: pure(
        ({ isInvoked, paymentDetail }: PaymentDetailsContext) => {
          if (!isInvoked) return [];
          return [
            sendParent(() => ({
              type: "PAYMENT_DETAILS",
              data: paymentDetail
            }))
          ];
        }
      ),

      cancelPaymentDetails: pure(({ isInvoked }: PaymentDetailsContext) => {
        if (!isInvoked) return [];
        return [
          sendParent(() => ({
            type: "CANCEL"
          }))
        ];
      }),

      // ---

      forwardSubmit: ({
        gatewayHelper,
        ctx,
        amount,
        requirePaymentForFreeOrders
      }: PaymentDetailsContext) => {
        if (gatewayHelper?.send) {
          gatewayHelper.send({
            type: isAddFlow({ ctx, amount, requirePaymentForFreeOrders })
              ? "ADD"
              : "PAY"
          });
        }
      },

      // ---

      setError: assign({
        error: (_context: PaymentDetailsContext, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
      }),

      clearError: assign({ error: undefined }),

      calculate: pure(
        (
          { calculateCallback, currency, model, amount }: PaymentDetailsContext,
          _event
        ) => {
          if (!calculateCallback) return;
          return sendTo(calculateCallback, {
            type: "CALCULATE",
            data: {
              currencyId: currency?.id,
              input: {
                amount: model?.amount ?? 0,
                outstanding: amount ?? 0,
                wallet: model?.wallet_amount ?? 0
              }
            }
          });
        }
      ),

      setAmountsFormatted: assign({
        lookups: (
          { lookups }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => ({
          ...lookups,
          amountsFormatted: data ?? {
            amount: "",
            outstanding: "",
            wallet: ""
          }
        })
      }),

      resetOperation: () => {
        const { getParam, unsetParam } = useQueryParams();
        const operationId = getParam(QUERY_PARAMS.OPERATION_ID);
        if (operationId) {
          useSessionStorage().remove("operation");
          unsetParam(QUERY_PARAMS.OPERATION_ID);
          unsetParam(STRIPE_QUERY_PARAMS.STRIPE_SETUP_INTENT);
          unsetParam(STRIPE_QUERY_PARAMS.STRIPE_SETUP_INTENT_CLIENT_SECRET);
          unsetParam(STRIPE_QUERY_PARAMS.STRIPE_REDIRECT_STATUS);
        }
      }
    },

    guards: {
      isPayable: (
        { orderStatus, ctx }: PaymentDetailsContext,
        _event: AnyEventObject
      ) =>
        ctx === GatewayCtx.ADD ||
        includes(
          [
            InvoiceStatus.DRAFT,
            InvoiceStatus.ADJUSTED,
            InvoiceStatus.UNPAID,
            InvoiceStatus.OVERDUE
          ],
          orderStatus
        ),

      isAddContext: (
        { ctx, amount, requirePaymentForFreeOrders }: PaymentDetailsContext,
        _event: AnyEventObject
      ) => isAddFlow({ ctx, amount, requirePaymentForFreeOrders }),

      hasPendingOperation: (
        { ctx, amount, requirePaymentForFreeOrders }: PaymentDetailsContext,
        _event: AnyEventObject
      ) => {
        if (!isAddFlow({ ctx, amount, requirePaymentForFreeOrders }))
          return false;
        const { getParam } = useQueryParams();
        const operationId = getParam(QUERY_PARAMS.OPERATION_ID);
        if (!operationId) return false;
        const operation = useSessionStorage().get("operation");
        return !!operation;
      },

      hasBasket: ({ orderId }: PaymentDetailsContext, _event: AnyEventObject) =>
        !!orderId,

      needsNoPayment: (
        { model, ctx }: PaymentDetailsContext,
        _event: AnyEventObject
      ) =>
        ctx !== GatewayCtx.ADD &&
        (!model?.amount ||
          isEqual(model.amount, model.wallet_amount) ||
          model?.type == PaymentType.PAY_LATER),

      hasPaymentDetails: (
        { paymentDetail, model: _model }: PaymentDetailsContext,
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
        {
          requirePaymentForFreeOrders,
          lookups,
          ctx,
          orderId,
          client,
          address,
          currency
        }: PaymentDetailsContext,
        { data }: AnyEventObject
      ) => {
        const orderChanged = orderId != data?.id;
        const clientChanged = client?.id != data?.client_id;
        const currencyChanged = currency?.id != data?.currency_id;
        // NB : We only need to worry if the address country changes  as that is all that affects payment methods
        const countryChanged =
          data?.address && address?.country_id != data?.address?.country_id;

        // CHECk if we  need to change context mid basket
        const targetCtx: GatewayCtx =
          requirePaymentForFreeOrders &&
          !data?.unpaid_amount_converted &&
          isEmpty(lookups?.storedPaymentMethods)
            ? GatewayCtx.ADD
            : GatewayCtx.PAY;

        const ctxChanged = targetCtx !== ctx;

        return (
          orderChanged ||
          clientChanged ||
          countryChanged ||
          currencyChanged ||
          ctxChanged
        );
      },

      // incomplete gateway form only — gateway `invalid` with no model-level
      // errors (the thrown errors are read off the event, not context.error)
      isGatewayIncomplete: (
        { gatewayHelper }: PaymentDetailsContext,
        { data }: AnyEventObject
      ) =>
        stateMatches(gatewayHelper, ["available.invalid"]) &&
        !isEmpty(data?.data) &&
        every(data?.data, ["keyword", "actorState"])
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
