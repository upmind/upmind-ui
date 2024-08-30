// --- external
import { createMachine, assign, actions } from "xstate";
const { sendParent, pure } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError, trackEvent } = useFeedback();

// --- utils
import { spawnGateway, parsePaymentDetails } from "./utils";
import { useModelParser } from "../../utils";
import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema } from "./utils";
import { set, unset, forEach } from "lodash-es";

// --- types
import type { PaymentDetailsContext, RefreshEvent } from "./types.d";
import { responseCodes } from "../api";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./paymentDetails.machine.typegen").Typegen0,
    id: "paymentDetailsManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      basket_id: undefined,
      client_id: undefined,
      currency: undefined,
      // ---
      fields: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      stored_payment_methods: undefined,
      gateways: undefined,
      payment_types: undefined,
      // ---
      actors: {
        gateway: undefined,
      },
      // ---
      dirty: false,
      error: null,
      autoupdate: false,
    } as PaymentDetailsContext,
    states: {
      // Subscribe to changes in auth and listen for a valid Authenticated client,
      // we will also wait for a session before we can continue
      subscribing: {
        invoke: {
          id: "authCallback",
          src: "authSubscription",
        },
        on: {
          AUTHENTICATED: { target: "checking" },
          REFRESH: { actions: "refreshBasket" },
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
              CHECKOUT: { target: "processing", cond: "hasBasket" },
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

            invoke: {
              src: "update",
              onDone: {
                target: "#complete",
                actions: [
                  "setPaymentDetails",
                  "providePaymentDetails",
                  "clearAutoUpdate",
                  "trackPaymentDetails",
                ],
              },
              onError: {
                actions: "clearError", // this is handled by the gateway
              },
            },
            on: {
              // ths is the response from the gateway
              PAYMENT_DETAILS: {
                target: "#complete",
                actions: ["setPaymentDetails", "providePaymentDetails"],
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
              actions: "refreshBasket",
              cond: "hasChanged",
            },
            {
              target: "available.checking",
              actions: "refreshBasket",
            },
          ],
        },
      },

      // ---
      error: { id: "error" },
      complete: {
        id: "complete",
        type: "final",
        data: ({ paymentDetails }, _event) => paymentDetails,
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
      setParsed: assign({
        model: (_context, { data }) => data.model,
        gateway: (_context, { data }) => data.gateway,
      }),

      setLookups: assign({
        stored_payment_methods: (_context, { data }) =>
          data.stored_payment_methods,
        gateways: (_context, { data }) => data.gateways,
        payment_types: (_context, { data }) => data.payment_types,
      }),

      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: ({ schema, model }) => useModelParser(schema, model),
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined,
      }),

      setModel: assign({
        model: ({ schema, model }, { data }) =>
          useModelParser(schema, data || model),
      }),

      clearModel: assign({
        model: undefined,
      }),

      setDirty: assign({
        dirty: true,
      }),

      clearDirty: assign({
        dirty: false,
      }),

      setAutoUpdate: assign({
        autoupdate: (_context, { update }) => !!update,
      }),
      clearAutoUpdate: assign({
        autoupdate: false,
      }),

      setGateway: assign({
        // NB: SPAWN HAS TO BE DONE IN AN ASSIGN!
        actors: (
          {
            basket_id,
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
            if (actors?.gateway && !actors.gateway?.state?.done)
              actors.gateway?.stop();
            unset(actors, "gateway");
          }

          // if we are provided a gateway AND dont have one spawned yet,
          if (!actors?.gateway && gateway) {
            const actor = spawnGateway({
              basket_id,
              currency,
              amount: model?.amount,
              gateway: model?.amount ? gateway : null, // use the free gateway if amount is 0
              stored_payment_methods,
            });
            set(actors, "gateway", actor);
          }

          return actors;
        },
      }),

      refreshBasket: assign({
        basket_id: (_context, { data: basket }: RefreshEvent) => basket?.id,
        client_id: (_context, { data: basket }: RefreshEvent) =>
          basket?.client_id,
        currency: (_context, { data: basket }: RefreshEvent) =>
          basket?.currency,
        model: ({ model }, { data: basket }: RefreshEvent) => {
          return {
            ...model,
            amount: basket?.unpaid_amount_converted || 0.0,
          };
        },
        actors: ({ actors }, { data: basket }) => {
          forEach(actors, actor => {
            if (actor?.send && !actor?.state?.done) {
              actor.send({
                type: "REFRESH",
                data: {
                  basket_id: basket?.id,
                  currency: basket?.currency,
                  amount: basket?.unpaid_amount_converted || 0.0,
                },
              });
            }
          });
          return actors;
        },
      }),

      // ---

      setPaymentDetails: assign({
        paymentDetails: ({ model }, { data }) =>
          parsePaymentDetails({ ...model, ...data }),
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails,
      })),

      // ---

      trackPaymentDetails: (_context, _event) => {
        trackEvent({ ecommerce: null });
        trackEvent({ event: "add_payment_info" });
      },
      // ---

      forwardCheckout: pure(({ actors }: PaymentDetailsContext) => {
        forEach(actors, actor => {
          if (actor?.send) {
            actor.send({ type: "CHECKOUT" });
          }
        });
      }),

      // ---

      setFeedbackError: ({ error }, _event) => {
        // dont show any unauthorized errors
        if (
          !error ||
          error?.code == responseCodes.Unprocessable_Entity ||
          error?.code == responseCodes.Unauthorized
        )
          return;

        addError({
          title:
            error?.title ||
            "We experienced an error while processing your order. Please try again.",
          copy: error?.message,
          data: error?.data,
        });
      },

      setError: assign({
        error: (_context, { data }) => {
          let error = data?.error;
          if (error?.code == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error || data;
        },
      }),

      clearError: assign({ error: null }),
    },

    guards: {
      isDirty: ({ dirty }, _event) => !!dirty,
      hasBasket: ({ basket_id }, _event) => !!basket_id,
      hasLookups: (
        { stored_payment_methods, gateways, payment_types },
        _event
      ) => !!stored_payment_methods && !!gateways && !!payment_types,
      isFree: ({ model }, _event) => !model?.amount,
      shouldUpdate: ({ autoupdate, basket_id }, _event) =>
        !!autoupdate && !!basket_id,

      hasChanged: ({ basket_id, currency, client_id, model }, { data }) => {
        const basketChanged = basket_id != data?.id;
        const currencyChanged = currency?.id != data?.currency_id;
        const clientChanged = client_id != data?.client_id;
        const amountChanged =
          model.amount == (data?.unpaid_amount_converted || 0.0);

        return (
          basketChanged || currencyChanged || clientChanged || amountChanged
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
