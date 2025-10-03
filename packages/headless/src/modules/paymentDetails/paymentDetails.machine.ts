// --- external
import { createMachine, assign, spawn, sendParent } from "xstate";

// --- internal
import services from "./services";
import { authSubscription } from "../session/helper";

// --- utils
import { spawnGateway } from "./utils";
import { mapToHeadlessError, stopService, useModelParser } from "../../utils";
import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema } from "./schemas";
import { set, unset, forEach, isEqual, some, isEmpty } from "lodash-es";

// --- types
import type { ActorRef, AnyEventObject } from "xstate";
import type { PaymentDetailsContext } from "./types";
import { responseCodes } from "../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    id: "paymentDetailsManager",
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
          REFRESH: { actions: "refresh" }
        }
      },

      checking: {
        invoke: {
          src: "isAuthenticated",
          onDone: [
            {
              target: "available.checking",
              cond: "hasLookups"
            },
            { target: "available" }
          ],
          onError: { target: "unavailable" }
        }
      },

      unavailable: {
        on: {
          AUTHENTICATED: { target: "checking" }
        }
      },

      available: {
        initial: "loading",
        states: {
          loading: {
            id: "loading",
            entry: ["clearError"],
            invoke: {
              src: "loadLookups",
              onDone: {
                target: "checking",
                actions: ["setLookups", "setSchemas"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          // ---

          checking: {
            entry: ["clearError"],
            initial: "parsing",
            states: {
              parsing: {
                invoke: {
                  src: "parse",
                  onDone: {
                    target: "validating",
                    actions: ["setParsed", "setGateway", "setSchemas"]
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
                      cond: "isFree"
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
            always: [{ target: "processing", cond: "shouldUpdate" }],
            on: {
              PAYMENT_DETAILS: [
                {
                  target: "checking",
                  actions: ["setPaymentDetails"],
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
                  cond: "isFree"
                },
                {
                  target: "#complete",
                  cond: "hasPaymentDetails"
                },

                { target: "processing", cond: "hasBasket" }
              ],

              // NB we need to re check our payment details if the gateway changes
              "xstate.update": {
                target: "checking"
              }
            }
          },

          invalid: {
            id: "invalid",
            on: {
              // NB we need to re check our payment details if the gateway changes
              "xstate.update": {
                target: "checking"
              }
            }
          },

          processing: {
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
          }
        },
        on: {
          CLEAR: {
            target: "available.checking",
            actions: ["clearModel"]
          },
          SET: {
            target: "available.checking",
            actions: ["setAutoUpdate"]
          },
          REFRESH: [
            // NB if we change currecy, tear down the gateway and re create it
            {
              target: "available.loading",
              actions: ["clearGateway", "refresh"],
              cond: "hasCurrencyChanged"
            },
            {
              target: "available.loading",
              actions: "refresh",
              cond: "hasChanged"
            },
            {
              target: "available.checking",
              actions: "refresh"
            }
          ]
        }
      },

      // ---
      error: { id: "error" },
      complete: {
        entry: ["providePaymentDetails"],
        id: "complete",
        type: "final",
        data: ({ paymentDetails }, _event) => paymentDetails,
        on: {
          REFRESH: {
            target: "available",
            actions: "refresh"
          }
        }
      }
    },
    on: {
      UNAUTHENTICATED: {
        target: "subscribing",
        actions: ["clearError", "clearModel", "clearSchemas"]
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
        model: (_context, { data }: AnyEventObject) => data.model,
        gateway: (_context, { data }: AnyEventObject) => data.gateway,
        paymentDetails: (_context, { data }: AnyEventObject) =>
          data.paymentDetails
      }),

      setLookups: assign({
        storedPaymentMethods: (_context, { data }: AnyEventObject) =>
          data.storedPaymentMethods,
        gateways: (_context, { data }) => data.gateways,
        paymentTypes: (_context, { data }) => data.paymentTypes,
        address: (_context, { data }) => data.address
      }),

      setSchemas: assign({
        schema: (context: PaymentDetailsContext) => useSchema(context),
        uischema: _context => useUischema(),
        model: ({ schema, model }: PaymentDetailsContext) => {
          if (!schema) return model;
          return useModelParser(schema, model);
        }
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      clearModel: assign({
        model: undefined,
        gateway: undefined
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }: AnyEventObject) => !!update
      }),

      clearAutoUpdate: assign({
        autoupdate: false
      }),

      setGateway: assign({
        // NB: SPAWN HAS TO BE DONE IN AN ASSIGN!
        actors: (
          {
            address,
            orderId,
            currency,
            amount,
            gateway,
            actors,
            storedPaymentMethods
          },
          _event
        ) => {
          actors ??= {}; //sanity check

          // stop any existing gateways if they are different and not done/complete
          if (actors.gateway && actors?.gateway?.id != gateway?.id) {
            stopService(actors.gateway);
            unset(actors, "gateway");
          }

          // if we are provided a gateway AND dont have one spawned yet,
          if (!actors?.gateway && gateway) {
            const actor = spawnGateway({
              amount,
              orderId,
              currency,
              gateway: amount ? gateway : undefined, // use the free gateway if amount is 0
              storedPaymentMethods,
              address
            });
            set(actors, "gateway", actor);
          }

          return actors;
        }
      }),

      clearGateway: assign({
        actors: ({ actors }: PaymentDetailsContext) => {
          if (actors?.gateway) {
            stopService(actors.gateway);
            unset(actors, "gateway");
          }
          return actors;
        }
      }),

      refresh: assign({
        orderId: (_context, { data }: AnyEventObject) => data?.id,
        clientId: (_context, { data }: AnyEventObject) => data?.client_id,
        currency: (_context, { data }: AnyEventObject) => data?.currency,
        address: (_context, { data }: AnyEventObject) => data?.address,
        amount: (_context, { data }: AnyEventObject) =>
          data?.unpaid_amount_converted || 0.0, // NB: we always force use the outstanding amount
        actors: (
          { actors }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => {
          forEach(actors, actor => {
            if (actor?.send && !actor?.getSnapshot()?.done) {
              actor.send({
                type: "REFRESH",
                data: {
                  orderId: data?.id,
                  currency: data?.currency,
                  amount: data?.unpaid_amount_converted || 0.0,
                  address: data?.address
                }
              });
            }
          });
          return actors;
        }
      }),

      // ---

      setPaymentDetails: assign({
        paymentDetails: (
          { amount, model, orderId, currency, address }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => {
          debugger;
          // todo: parse the data to ensure we have what we need and dont send unnecessary stuff
          return {
            ...model,
            ...data,
            // ensure OUR values are used
            orderId,
            currency,
            amount,
            address
          };
        }
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails
      })),

      cancelPaymentDetails: sendParent(() => ({
        type: "CANCEL"
      })),

      // ---

      forwardCheckout: ({ actors }: PaymentDetailsContext) => {
        forEach(actors, (actor: ActorRef<any> | undefined) => {
          if (actor?.send) {
            actor.send({ type: "CHECKOUT" });
          }
        });
      },

      // ---

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
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
      isDirty: ({ model, baseModel }: PaymentDetailsContext, _event) =>
        !isEqual(model, baseModel),
      hasBasket: ({ orderId }, _event) => !!orderId,
      hasLookups: ({ storedPaymentMethods, gateways, paymentTypes }, _event) =>
        !!storedPaymentMethods && !!gateways && !!paymentTypes,
      isFree: ({ amount }, _event) => !amount,
      hasPaymentDetails: ({ storedPaymentMethods, paymentDetails }, _event) => {
        debugger;
        return !isEmpty(paymentDetails?.id);
      },
      isPaymentDetail: (_context, { data }: AnyEventObject) => {
        debugger;
        return !isEmpty(data?.id);
      },

      shouldUpdate: ({ autoupdate, orderId, amount }, _event) =>
        !!autoupdate && !!orderId && amount !== 0,
      hasCurrencyChanged: (
        { currency }: PaymentDetailsContext,
        { data }: AnyEventObject
      ) => currency?.id != data?.currency_id,

      hasChanged: (
        { orderId, currency, clientId, amount, address }: PaymentDetailsContext,
        { data }: AnyEventObject
      ) => {
        const orderChanged = orderId != data?.id;
        const clientChanged = clientId != data?.client_id;
        const amountChanged = amount == (data?.unpaid_amount_converted || 0.0);
        const addressChanged = address?.id != data?.address?.id;

        return orderChanged || clientChanged || amountChanged || addressChanged;
      },

      isAuthenticated: ({ authHelper }: PaymentDetailsContext, _event) =>
        authHelper?.getSnapshot()?.matches("authenticated")
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
