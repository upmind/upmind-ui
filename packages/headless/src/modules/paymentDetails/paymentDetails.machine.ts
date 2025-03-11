// --- external
import { createMachine, assign, actions } from "xstate";
const { pure, sendParent } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError, trackEvent } = useFeedback();

// --- utils
import { spawnGateway, parsePaymentDetails } from "./utils";
import { useModelParser } from "../../utils";
import { useTime, useValidationParser } from "../../utils";
import { useSchema, useUischema } from "./utils";
import { get, set, unset, forEach } from "lodash-es";

// --- types

import type { ActorRef, AnyEventObject } from "xstate";
import type { PaymentDetailsContext } from "./types";
import { responseCodes } from "../../utils";

// --------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./paymentDetails.machine.typegen").Typegen0,
    id: "paymentDetailsManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      id: undefined,
      clientId: undefined,
      currency: undefined,
      address: undefined,
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
                  actions: ["setPaymentDetails", "trackPaymentDetails"],
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
                actions: [
                  "setPaymentDetails",
                  "trackPaymentDetails",
                  "clearAutoUpdate",
                ],
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
        model: ({ schema, model }: PaymentDetailsContext) =>
          useModelParser(schema, model),
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
            id,
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
            if (!actors.gateway?.getSnapshot()?.done && actors.gateway?.stop)
              actors.gateway?.stop();

            unset(actors, "gateway");
          }

          // if we are provided a gateway AND dont have one spawned yet,
          if (!actors?.gateway && gateway) {
            const actor = spawnGateway({
              id,
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
        id: (_context, { data }: AnyEventObject) => data?.id,
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
                  id: data?.id,
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
          { model, id, currency, address }: PaymentDetailsContext,
          { data }: AnyEventObject
        ) => {
          const amount = model?.amount || 0;
          return parsePaymentDetails({
            ...model,
            ...data,
            // ensure OUR values are used
            id,
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

      trackPaymentDetails: (_context, _event) => {
        trackEvent({ ecommerce: null });
        trackEvent({ event: "add_payment_info" });
      },
      // ---

      forwardCheckout: ({ actors }: PaymentDetailsContext) => {
        forEach(actors, (actor: ActorRef<any> | undefined) => {
          if (actor?.send) {
            actor.send({ type: "CHECKOUT" });
          }
        });
      },

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
        error: (_context, { data }: AnyEventObject) => {
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
      isDirty: ({ dirty }: any, _event: any) => !!dirty,
      hasBasket: ({ id }, _event) => !!id,
      hasLookups: (
        { stored_payment_methods, gateways, payment_types },
        _event
      ) => !!stored_payment_methods && !!gateways && !!payment_types,
      isFree: ({ model }, _event) => !model?.amount,
      shouldUpdate: ({ autoupdate, id, model }, _event) =>
        !!autoupdate && !!id && model?.amount !== 0,

      hasChanged: (
        { id, currency, clientId, model, address }: PaymentDetailsContext,
        { data }: AnyEventObject
      ) => {
        const idChanged = id != data?.id;
        const currencyChanged = currency?.id != data?.currency_id;
        const clientChanged = clientId != data?.client_id;
        const amountChanged =
          model?.amount == (data?.unpaid_amount_converted || 0.0);
        const addressChanged = address?.id != data?.address?.id;

        return (
          idChanged ||
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
