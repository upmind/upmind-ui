// --- external
import { createMachine, assign, sendParent, pure } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError } = useFeedback();

import { spawnGateway } from "./utils";

// --- utils
import { useModelParser } from "../../utils";
import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema } from "./utils";
import { set, unset, forEach } from "lodash-es";

// --- types
import { responseCodes } from "../api";
import type {
  PaymentDetailsContext,
  PaymentDetailsEvent,
  RefreshEvent,
} from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./paymentDetails.machine.typegen").Typegen0,
    id: "paymentDetailsManager",
    predictableActionArguments: true,
    initial: "loading",
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
      loading: {
        entry: ["clearError"],
        invoke: {
          src: "load",
          onDone: {
            target: "checking",
            actions: ["setContext", "setSchemas"],
          },
          onError: {
            target: "error",
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
              onError: {
                target: "#invalid",
                actions: ["setError"],
              },
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
        // ths is the return from the gateway
        on: {
          PAYMENT_DETAILS: {
            target: "complete",
            actions: ["setPaymentDetails", "providePaymentDetails"],
          },
        },
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ paymentDetails }, _event) => paymentDetails,
      },

      // ---

      error: {
        id: "error",
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

      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"],
      },

      REFRESH: {
        target: "loading",
        actions: ["refreshContext", "setSchemas"],
        cond: "hasChanged",
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
          // if we are provided a gateway,
          // lets spawn it if it doesnt exist or if it is different
          // otherwise stop the old one if it exists
          // THIS HAS TO BE DONE IN AN ASSIGN!

          if (!data?.gateway) {
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
        error: (_context, { data }) => {
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
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
