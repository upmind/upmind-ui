/** @internal */
import { assign, createMachine, spawn } from "xstate";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes
} from "@upmind-automation/types";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import { mapContract } from "./contract.mappers";
import {
  useSetPaymentMethodSchema,
  useSetPaymentMethodUischema
} from "./contract.schemas";
import { contractMachineServices as services } from "./contract.services";
import { ContractState } from "./contract.types";
import {
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes,
  useModelParser,
  useValidationParser
} from "../../utils";
import { some } from "lodash-es";
import type {
  ContractContext,
  ContractLoaded,
  ContractWriteModel
} from "./contract.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.machine
 * @description The contract manager machine (R4) on the house write spine of
 * `orders/order.machine.ts` (R20, R20a). `available` and `unavailable` are each
 * parallel over `status` and the `changingPaymentMethod` write form (R35), so an
 * open form never leaves the status node. The contract keeps only contract facts
 * (R34): every cancellation write moved to `contract-product` with R33, so the
 * ONE write it owns is the payment-method form. That form is offered on every
 * `available` status node and, per R13, on `unavailable.cancelled` and
 * `unavailable.lapsed` — only for a subscription the client owns, never a
 * one-off or a delegated one, and never on `fraud` (`canChangePaymentMethod`).
 */

export default createMachine(
  {
    id: "contract",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as ContractContext,
    states: {
      subscribing: {
        entry: ["setAuthHelper"],
        on: {
          AUTHENTICATED: { target: "loading" }
        }
      },

      loading: {
        id: "loading",
        invoke: {
          src: "load",
          // The settled read places the status node, in flow.md section 3
          // order: `unavailable` first, then `cancelling`, then the four
          // `available` nodes. The guards read the record THIS read returned
          // (the event), never the previous one held in context.
          onDone: [
            {
              target: ContractState.CANCELLED,
              cond: "isCancelled",
              actions: ["setContract", "setLookups"]
            },
            {
              target: ContractState.LAPSED,
              cond: "isLapsed",
              actions: ["setContract", "setLookups"]
            },
            {
              target: ContractState.FRAUD,
              cond: "isFraud",
              actions: ["setContract", "setLookups"]
            },
            {
              target: ContractState.CANCELLING,
              cond: "isCancelling",
              actions: ["setContract", "setLookups"]
            },
            {
              target: ContractState.PENDING,
              cond: "isPending",
              actions: ["setContract", "setLookups"]
            },
            {
              target: ContractState.INACTIVE,
              cond: "isInactive",
              actions: ["setContract", "setLookups"]
            },
            {
              target: ContractState.SUSPENDED,
              cond: "isSuspended",
              actions: ["setContract", "setLookups"]
            },
            {
              target: ContractState.ACTIVE,
              cond: "isActive",
              actions: ["setContract", "setLookups"]
            },
            {
              target: "#error",
              // No status this machine knows (AC12).
              actions: ["setContract", "setLookups", "setStatusError"]
            }
          ],
          onError: { target: "#error", actions: ["setError"] }
        }
      },

      error: {
        id: "error"
      },

      available: {
        id: "available",
        type: "parallel",
        states: {
          status: {
            states: {
              pending: {},
              inactive: {},
              active: {},
              suspended: {},
              cancelling: {}
            }
          },

          changingPaymentMethod: {
            id: "changingPaymentMethod",
            initial: "idle",
            states: {
              idle: {
                on: {
                  PAYMENT_METHOD: {
                    target: "available",
                    actions: "setPaymentMethodSchemas",
                    cond: "canChangePaymentMethod"
                  }
                }
              },
              available: {
                initial: "checking",
                on: {
                  // Re-enter the node: `.checking` would not restart an in-flight
                  // validation, so a stale result would land.
                  "SET.PAYMENT_METHOD": {
                    target: "available",
                    actions: "setPaymentMethodModel"
                  },
                  SET_PAYMENT_METHOD: {
                    target:
                      "#changingPaymentMethod.processing.settingPaymentMethod"
                  }
                },
                states: {
                  checking: {
                    entry: ["clearError"],
                    invoke: {
                      src: "validatePaymentMethod",
                      onDone: { target: "valid" },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {},
                  error: {}
                }
              },
              // Its own `processing`, unlike a formless write: a failed submit
              // returns to this form's `error` node with the model kept, and the
              // contract never leaves its status node.
              processing: {
                entry: ["clearError"],
                states: {
                  settingPaymentMethod: {
                    initial: "validating",
                    states: {
                      validating: {
                        invoke: {
                          src: "validatePaymentMethod",
                          onDone: { target: "updating" },
                          onError: {
                            target: "#changingPaymentMethod.available.error",
                            actions: ["setError"]
                          }
                        }
                      },
                      updating: {
                        invoke: {
                          src: "setPaymentMethod",
                          onDone: { target: "#loading" },
                          onError: {
                            target: "#changingPaymentMethod.available.error",
                            actions: ["setError"]
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            on: {
              "CANCEL.PAYMENT_METHOD": {
                target: ".idle",
                actions: "clearPaymentMethod"
              }
            }
          }
        }
      },

      unavailable: {
        id: "unavailable",
        type: "parallel",
        states: {
          status: {
            states: {
              cancelled: {},
              lapsed: {},
              fraud: {}
            }
          },

          changingPaymentMethod: {
            id: "changingPaymentMethodUnavailable",
            initial: "idle",
            states: {
              idle: {
                on: {
                  // R13: a cancelled or lapsed contract may still change its
                  // payment method; `fraud` alone is refused.
                  PAYMENT_METHOD: {
                    target: "available",
                    actions: "setPaymentMethodSchemas",
                    cond: "canChangePaymentMethod"
                  }
                }
              },
              available: {
                initial: "checking",
                on: {
                  // Re-enter the node: `.checking` would not restart an in-flight
                  // validation, so a stale result would land.
                  "SET.PAYMENT_METHOD": {
                    target: "available",
                    actions: "setPaymentMethodModel"
                  },
                  SET_PAYMENT_METHOD: {
                    target:
                      "#changingPaymentMethodUnavailable.processing.settingPaymentMethod"
                  }
                },
                states: {
                  checking: {
                    entry: ["clearError"],
                    invoke: {
                      src: "validatePaymentMethod",
                      onDone: { target: "valid" },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {},
                  error: {}
                }
              },
              // Its own `processing`, unlike a formless write: a failed submit
              // returns to this form's `error` node with the model kept, and the
              // contract never leaves its status node.
              processing: {
                entry: ["clearError"],
                states: {
                  settingPaymentMethod: {
                    initial: "validating",
                    states: {
                      validating: {
                        invoke: {
                          src: "validatePaymentMethod",
                          onDone: { target: "updating" },
                          onError: {
                            target:
                              "#changingPaymentMethodUnavailable.available.error",
                            actions: ["setError"]
                          }
                        }
                      },
                      updating: {
                        invoke: {
                          src: "setPaymentMethod",
                          onDone: { target: "#loading" },
                          onError: {
                            target:
                              "#changingPaymentMethodUnavailable.available.error",
                            actions: ["setError"]
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            on: {
              "CANCEL.PAYMENT_METHOD": {
                target: ".idle",
                actions: "clearPaymentMethod"
              }
            }
          }
        }
      }
    },

    on: {
      REFRESH: { target: "#loading", actions: ["clearError"] },
      UNAUTHENTICATED: { target: "subscribing", actions: ["clearError"] }
    }
  },
  {
    actions: {
      setAuthHelper: assign({
        authHelper: ({ authHelper }: ContractContext, _event: AnyEventObject) =>
          authHelper ?? spawn(authSubscription)
      }),

      setContract: assign(
        (_context: ContractContext, { data }: AnyEventObject) => ({
          rawContract: (data as ContractLoaded).record,
          contract: mapContract((data as ContractLoaded).record)
        })
      ),

      setLookups: assign({
        lookups: (_context: ContractContext, { data }: AnyEventObject) =>
          (data as ContractLoaded).lookups
      }),

      // The open transition builds the payment-method form on context from the
      // loaded contract and stored-card lookup, then seeds an empty model.
      setPaymentMethodSchemas: assign({
        paymentMethod: ({ contract, lookups }: ContractContext) => ({
          schema: useSetPaymentMethodSchema({
            storedPaymentMethods: lookups?.storedPaymentMethods,
            paymentDetailsId: contract?.paymentDetailsId
          }),
          uischema: useSetPaymentMethodUischema(),
          model: {}
        })
      }),

      setPaymentMethodModel: assign({
        paymentMethod: (
          { paymentMethod }: ContractContext,
          { data }: AnyEventObject
        ) => ({
          ...paymentMethod,
          model: useModelParser(
            paymentMethod?.schema,
            (data ?? {}) as Record<string, unknown>
          ) as ContractWriteModel
        })
      }),

      clearPaymentMethod: assign({ paymentMethod: undefined }),

      setError: assign({
        error: (_context: ContractContext, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
      }),

      setStatusError: assign({
        error: ({ contract }: ContractContext) =>
          mapToHeadlessError(
            new DetailedError(
              useI18n().t("error.contract_status_unrecognised"),
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless,
              { code: contract?.status.code }
            )
          )
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      isPending: (_context: ContractContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.PENDING,
      isInactive: (_context: ContractContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.AWAITING_ACTIVATION,
      isActive: (_context: ContractContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.ACTIVE,
      isSuspended: (_context: ContractContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.SUSPENDED,
      isCancelling: (_context: ContractContext, { data }: AnyEventObject) =>
        data.record.cancellation_request?.status?.code ===
        CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST,
      isCancelled: (_context: ContractContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.CANCELLED,
      isLapsed: (_context: ContractContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.CLOSED,
      isFraud: (_context: ContractContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.FRAUD,
      // R13: not `fraud` — the one `unavailable` node the form is refused on.
      // Legacy `cProdProvider.vue` canModifySettings (:337-341): only a
      // subscription (billing cycle > 0) the client owns, never a delegated one.
      canChangePaymentMethod: ({ contract, rawContract }: ContractContext) =>
        !!contract &&
        rawContract?.status?.code !== ContractStatusCodes.FRAUD &&
        contract.billingCycleMonths > 0 &&
        !some(contract.products, "isDelegatedObject")
    },

    services
  }
);
