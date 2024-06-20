// --- external
import { createMachine, assign, actions } from "xstate";
const { sendParent, pure } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError } = useFeedback();

// --- utils
import { spawnGateway } from "./utils";
import { useModelParser } from "../../utils";
import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema } from "./utils";
import { set, unset, forEach } from "lodash-es";

// --- types
import type {
  PaymentDetailsContext,
  PaymentDetailsEvent,
  RefreshEvent,
} from "./types.d";
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
      currency: undefined,
      // ---
      fields: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      actors: {
        gateway: undefined,
      },
      // ---
      error: null,
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
          SESSION: { target: "checking" },
        },
      },

      checking: {
        invoke: {
          src: "isAuthenticated",
          onDone: { target: "available" },
          onError: { target: "unavailable" },
        },
      },

      unavailable: {
        on: {
          AUTHENTICATED: { target: "available" },
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
                actions: ["setContext", "setSchemas"],
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
            id: "checking",
            initial: "parsing",
            states: {
              parsing: {
                invoke: {
                  src: "parse",
                  onDone: {
                    target: "validating",
                    actions: ["setContext", "setSchemas"],
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

          invalid: {
            id: "invalid",
            on: {
              "xstate.update": {
                target: "checking",
              },
            },
          },

          valid: {
            id: "valid",
            on: {
              CHECKOUT: { target: "processing", cond: "hasBasket" },
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
                actions: ["setPaymentDetails", "providePaymentDetails"],
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
            target: "#checking",
            actions: ["clearModel"],
          },
          SET: {
            target: "#checking",
            actions: ["setModel"],
          },

          REFRESH: {
            target: "#loading",
            actions: ["refreshContext", "setSchemas"],
            cond: "hasChanged",
          },
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
        target: "unavailable",
        actions: ["clearError", "clearModel", "clearSchemas"],
      },
    },
  },
  {
    actions: {
      refreshContext: assign(
        (_context: PaymentDetailsContext, { data: basket }: RefreshEvent) => ({
          basket_id: basket?.id,
          currency: basket?.currency,
          model: {
            amount: basket?.unpaid_amount_converted || 0.0,
          },
        })
      ),

      setContext: assign(
        (
          { currency }: PaymentDetailsContext,
          { data }: PaymentDetailsEvent
        ) => {
          // if we are provided a gateway AND we have an amount,
          // lets spawn it if it doesnt exist or if it is different
          // otherwise stop the old one if it exists
          // THIS HAS TO BE DONE IN AN ASSIGN!

          if (!data.model?.amount || !data?.gateway) {
            if (data?.actors?.gateway)
              !data.actors.gateway?.state?.done && data.actors.gateway?.stop();
            unset(data, "actors.gateway");
          } else if (data.actors?.gateway?.id != data?.gateway?.id) {
            if (data?.actors?.gateway)
              !data.actors.gateway?.state?.done && data.actors.gateway?.stop();
            const actor = spawnGateway({
              basket_id: data.basket_id,
              gateway: data.gateway,
              amount: data.model?.amount,
              currency,
            });
            set(data, "actors.gateway", actor);
          }

          return data;
        }
      ),

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

      // ---

      setPaymentDetails: assign({
        paymentDetails: ({ model }, { data }) => {
          return { ...model, ...data };
        },
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails,
      })),

      // ---

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
        error: (_context, { data }, node) => {
          let error = data?.error;
          if (error?.code == 422) {
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
      hasBasket: ({ basket_id }, _event) => !!basket_id,
      hasChanged: ({ currency }, { data }) =>
        currency?.id !== data?.currency_id,
      isFree: ({ model }, _event) => !model?.amount,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
