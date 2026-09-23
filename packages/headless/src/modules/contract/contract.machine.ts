/** @internal */
import { assign, createMachine, spawn } from "xstate";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import { mapContract } from "./contract.mappers";
import {
  useSetPaymentMethodSchema,
  useSetPaymentMethodUischema
} from "./contract.schemas";
import { contractMachineServices as services } from "./contract.services";
import { ContractState } from "./contract.types";
import { selectContractStatusNode } from "./contract.utils";
import {
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes,
  useModelParser,
  useValidationParser
} from "../../utils";
import { isNil } from "lodash-es";
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
 * `unavailable.lapsed` (`canChangePaymentMethod` refuses `fraud` alone).
 */

function isNode(node: ContractState) {
  return ({ contract }: ContractContext) =>
    !!contract && selectContractStatusNode(contract) === node;
}

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

      // ONE `load` settles the record and its reused stored-card lookup, then
      // the `always` places the status node in flow.md section 3 order:
      // `unavailable` first, then `cancelling`, then the four `available` nodes.
      loading: {
        id: "loading",
        invoke: {
          src: "load",
          onDone: { actions: ["setContract", "setLookups"] },
          onError: { actions: ["setError"] }
        },
        always: [
          { target: ContractState.CANCELLED, cond: "isCancelled" },
          { target: ContractState.LAPSED, cond: "isLapsed" },
          { target: ContractState.FRAUD, cond: "isFraud" },
          { target: ContractState.CANCELLING, cond: "isCancelling" },
          { target: ContractState.PENDING, cond: "isPending" },
          { target: ContractState.INACTIVE, cond: "isInactive" },
          { target: ContractState.SUSPENDED, cond: "isSuspended" },
          { target: ContractState.ACTIVE, cond: "isActive" },
          { cond: "isUnrecognised", actions: ["setStatusError"] }
        ]
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
                    actions: "setPaymentMethodSchemas"
                  }
                }
              },
              available: {
                initial: "checking",
                on: {
                  "SET.PAYMENT_METHOD": {
                    target: ".checking",
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
                  "SET.PAYMENT_METHOD": {
                    target: ".checking",
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
      isPending: isNode(ContractState.PENDING),
      isInactive: isNode(ContractState.INACTIVE),
      isActive: isNode(ContractState.ACTIVE),
      isSuspended: isNode(ContractState.SUSPENDED),
      isCancelling: isNode(ContractState.CANCELLING),
      isCancelled: isNode(ContractState.CANCELLED),
      isLapsed: isNode(ContractState.LAPSED),
      isFraud: isNode(ContractState.FRAUD),
      // R13: not `fraud` — the one `unavailable` node the form is refused on.
      canChangePaymentMethod: ({ contract }: ContractContext) =>
        !!contract &&
        selectContractStatusNode(contract) !== ContractState.FRAUD,
      // `!error` is what stops the targetless arm re-firing once it has run.
      isUnrecognised: ({ contract, error }: ContractContext) =>
        !error && !!contract && isNil(selectContractStatusNode(contract))
    },

    services
  }
);
