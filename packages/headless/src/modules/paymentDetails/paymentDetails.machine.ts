// --- external
import {
  createMachine,
  assign,
  actions,
  spawn,
  sendParent,
  InterpreterStatus,
} from "xstate";

// --- internal
import services from "./services";
import { authSubscription } from "../session/helper";
import { useFeedback } from "../feedback";
const { addError } = useFeedback();

// --- utils
import { spawnGateway, parsePaymentDetails } from "./utils";
import { stopActor, useModelParser } from "../../utils";
import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema } from "./utils";
import { set, unset, forEach } from "lodash-es";

// --- types
import type { ActorRef, AnyEventObject } from "xstate";
import type { PaymentDetailsContext } from "./types";
import { responseCodes } from "../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./paymentDetails.machine.typegen").Typegen0,
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
          REFRESH: { actions: "refresh" },
        },
      },

      checking: {
        invoke: {
          src: "isAuthenticated",
          onDone: [
            {
              target: "available.checking",
              cond: "hasLookups",
            },
            { target: "available" },
          ],
          onError: { target: "unavailable" },
        },
      },

      unavailable: {
        on: {
          AUTHENTICATED: { target: "checking" },
        },
      },

      available: {
        initial: "loading",
        states: {
          loading: {
            id: "loading",
            entry: ["clearError"],
            invoke: {
              src: "load",
              onDone: {
                target: "checking",
                actions: ["setLookups"],
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"],
              },
            },
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
                    actions: ["setParsed", "setGateway", "setSchemas"],
                  },
                },
              },
              validating: {
                invoke: {
                  src: "validate",
                  onDone: { target: "#valid" },
                  onError: [
                    {
                      target: "#valid",
                      cond: "isFree",
                    },
                    {
                      target: "#invalid",
                      actions: ["setError"],
                    },
                  ],
                },
              },
            },
          },

          valid: {
            id: "valid",
            always: { target: "processing", cond: "shouldUpdate" },
            on: {
              CHECKOUT: [
                {
                  target: "#complete",
                  actions: ["setPaymentDetails"],
                  cond: "isFree",
                },
                { target: "processing", cond: "hasBasket" },
              ],
              "xstate.update": {
                target: "checking",
              },
            },
          },

          invalid: {
            id: "invalid",
            on: {
              "xstate.update": {
                target: "checking",
              },
            },
          },

          processing: {
            entry: ["forwardCheckout"],
            on: {
              CANCEL: {
                target: "#invalid", // no need to set the error, it will be set by the gateway
                actions: ["cancelPaymentDetails", "clearAutoUpdate"],
              },
              // ths is the response from the gateway
              PAYMENT_DETAILS: {
                target: "#complete",
                actions: ["setPaymentDetails", "clearAutoUpdate"],
              },
            },
          },
        },
        on: {
          CLEAR: {
            target: "available.checking",
            actions: ["clearModel", "setDirty"],
          },
          SET: {
            target: "available.checking",
            actions: ["setDirty", "setAutoUpdate"],
          },
          REFRESH: [
            {
              target: "available.loading",
              actions: "refresh",
              cond: "hasChanged",
            },
            {
              target: "available.checking",
              actions: "refresh",
            },
          ],
        },
      },

      // ---
      error: { id: "error" },
      complete: {
        entry: ["providePaymentDetails"],
        id: "complete",
        data: ({ paymentDetails }, _event) => paymentDetails,
        on: {
          REFRESH: {
            target: "available",
            actions: "refresh",
          },
        },
      },
    },
    on: {
      UNAUTHENTICATED: {
        target: "subscribing",
        actions: ["clearError", "clearModel", "clearSchemas"],
      },
    },
  },
  {
    actions: {
      setAuthHelper: assign({
        authHelper: (
          { authHelper }: PaymentDetailsContext,
          _event: AnyEventObject
        ) => authHelper ?? spawn(authSubscription),
      }),

      setParsed: assign({
        model: (_context, { data }: AnyEventObject) => data.model,
        gateway: (_context, { data }: AnyEventObject) => data.gateway,
      }),

      setLookups: assign({
        stored_payment_methods: (_context, { data }: AnyEventObject) =>
          data.stored_payment_methods,
        gateways: (_context, { data }) => data.gateways,
        payment_types: (_context, { data }) => data.payment_types,
        address: (_context, { data }) => data.address,
      }),

      setSchemas: assign({
        schema: (context: PaymentDetailsContext) => useSchema(context),
        uischema: _context => useUischema(),
        model: ({ schema, model }: PaymentDetailsContext) => {
          if (!schema) return model;
          return useModelParser(schema, model);
        },
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined,
      }),

      clearModel: assign({
        model: undefined,
      }),

      setDirty: assign({
        dirty: true,
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }: AnyEventObject) => !!update,
      }),

      clearAutoUpdate: assign({
        autoupdate: false,
      }),

      setGateway: assign({
        // NB: SPAWN HAS TO BE DONE IN AN ASSIGN!
        actors: (
          {
            address,
            orderId,
            currency,
            model,
            gateway,
            actors,
            stored_payment_methods,
          },
          _event
        ) => {
          actors ??= {}; //sanity check

          // stop any existing gateways if they are different and not done/complete
          if (actors?.gateway?.id != gateway?.id) {
            stopActor(actors?.gateway);
            unset(actors, "gateway");
          }

          // if we are provided a gateway AND dont have one spawned yet,
          if (!actors?.gateway && gateway) {
            const actor = spawnGateway({
              orderId,
              currency,
              amount: model?.amount,
              gateway: model?.amount ? gateway : null, // use the free gateway if amount is 0
              stored_payment_methods,
              address,
            });
            set(actors, "gateway", actor);
          }

          return actors;
        },
      }),

      refresh: assign({
        orderId: (_context, { data }: AnyEventObject) => data?.id,
        clientId: (_context, { data }: AnyEventObject) => data?.client_id,
        currency: (_context, { data }: AnyEventObject) => data?.currency,
        address: (_context, { data }: AnyEventObject) => data?.address,
        model: ({ model }, { data }: AnyEventObject) => {
          return {
            ...model,
            amount: data?.unpaid_amount_converted || 0.0, // NB: we always force use the outstanding amount
          };
        },
        actors: ({ actors }, { data }: any) => {
          forEach(actors, actor => {
            if (actor?.send && !actor?.getSnapshot()?.done) {
              actor.send({
                type: "REFRESH",
                data: {
                  orderId: data?.id,
                  currency: data?.currency,
                  amount: data?.unpaid_amount_converted || 0.0,
                  address: data?.address,
                },
              });
            }
          });
          return actors;
        },
      }),

      // ---

      setPaymentDetails: assign({
        paymentDetails: (
          { model, orderId, currency, address }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => {
          const amount = model?.amount || 0;
          return parsePaymentDetails({
            ...model,
            ...data,
            // ensure OUR values are used
            orderId,
            currency,
            amount,
            address,
          });
        },
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails,
      })),

      cancelPaymentDetails: sendParent(() => ({
        type: "CANCEL",
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

      setFeedbackError: ({ error }: PaymentDetailsContext, _event) => {
        // dont show any unauthorized errors
        if (
          !error ||
          error?.status == responseCodes.Unprocessable_Entity ||
          error?.status == responseCodes.Unauthorized
        )
          return;

        addError({
          title:
            "We experienced an error while processing your order. Please try again.",
          copy: error?.message,
          data: error?.data,
        });
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          let error = data?.error;
          if (data?.status == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error || data;
        },
      }),

      clearError: assign({ error: undefined }),
    },

    guards: {
      isDirty: ({ dirty }: any, _event: any) => !!dirty,
      hasBasket: ({ orderId }, _event) => !!orderId,
      hasLookups: (
        { stored_payment_methods, gateways, payment_types },
        _event
      ) => !!stored_payment_methods && !!gateways && !!payment_types,
      isFree: ({ model }, _event) => !model?.amount,
      shouldUpdate: ({ autoupdate, orderId, model }, _event) =>
        !!autoupdate && !!orderId && model?.amount !== 0,

      hasChanged: (
        { orderId, currency, clientId, model, address }: PaymentDetailsContext,
        { data }: AnyEventObject
      ) => {
        const orderChanged = orderId != data?.id;
        const currencyChanged = currency?.id != data?.currency_id;
        const clientChanged = clientId != data?.client_id;
        const amountChanged =
          model?.amount == (data?.unpaid_amount_converted || 0.0);
        const addressChanged = address?.id != data?.address?.id;

        return (
          orderChanged ||
          currencyChanged ||
          clientChanged ||
          amountChanged ||
          addressChanged
        );
      },
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
