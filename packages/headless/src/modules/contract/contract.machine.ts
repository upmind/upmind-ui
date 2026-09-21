/** @internal */
import { assign, createMachine, spawn } from "xstate";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import { mapContract } from "./contract.mappers";
import { contractMachineServices as services } from "./contract.services";
import { ContractState } from "./contract.types";
import { selectContractStatusNode } from "./contract.utils";
import {
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes
} from "../../utils";
import { isNil } from "lodash-es";
import type { ContractContext } from "./contract.types";
import type { IContract } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.machine
 * @description The contract manager machine — flow.md section 3 on the house
 * spine of `orders/order.machine.ts` (R4, R20, R20a). Eight nodes:
 * `available.{pending,inactive,active,suspended,cancelling}` and
 * `unavailable.{cancelled,lapsed,fraud}`. Every write runs through the one
 * `processing` state; a failure stays on the `error` context property and the
 * next `loading` re-places the node from the server record.
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

      loading: {
        id: "loading",
        initial: "fetching",
        states: {
          fetching: {
            invoke: {
              src: "load",
              onDone: { target: "checking", actions: ["setContract"] },
              onError: { target: "checking", actions: ["setError"] }
            }
          },
          // Entry order of flow.md section 3: `unavailable` first, then
          // `cancelling`, then the four `available` status nodes.
          checking: {
            always: [
              { target: "#unavailable.cancelled", cond: "isCancelled" },
              { target: "#unavailable.lapsed", cond: "isLapsed" },
              { target: "#unavailable.fraud", cond: "isFraud" },
              { target: "#available.cancelling", cond: "isCancelling" },
              { target: "#available.pending", cond: "isPending" },
              { target: "#available.inactive", cond: "isInactive" },
              { target: "#available.suspended", cond: "isSuspended" },
              { target: "#available.active", cond: "isActive" },
              { cond: "isUnrecognised", actions: ["setStatusError"] }
            ]
          }
        }
      },

      available: {
        id: "available",
        states: {
          pending: {
            on: {
              REQUEST_CANCEL: { target: "#processing.requestingCancellation" },
              SET_PAYMENT_METHOD: { target: "#processing.settingPaymentMethod" }
            }
          },
          inactive: {
            on: {
              REQUEST_CANCEL: { target: "#processing.requestingCancellation" },
              SET_PAYMENT_METHOD: { target: "#processing.settingPaymentMethod" }
            }
          },
          active: {
            on: {
              REQUEST_CANCEL: { target: "#processing.requestingCancellation" },
              SET_PAYMENT_METHOD: { target: "#processing.settingPaymentMethod" }
            }
          },
          suspended: {
            on: {
              REQUEST_CANCEL: { target: "#processing.requestingCancellation" },
              SET_PAYMENT_METHOD: { target: "#processing.settingPaymentMethod" }
            }
          },
          cancelling: {
            on: {
              WITHDRAW: { target: "#processing.withdrawingCancellation" },
              SET_PAYMENT_METHOD: { target: "#processing.settingPaymentMethod" }
            }
          }
        }
      },

      unavailable: {
        id: "unavailable",
        states: {
          cancelled: {
            on: {
              SET_PAYMENT_METHOD: { target: "#processing.settingPaymentMethod" }
            }
          },
          lapsed: {
            on: {
              SET_PAYMENT_METHOD: { target: "#processing.settingPaymentMethod" }
            }
          },
          fraud: {}
        }
      },

      processing: {
        id: "processing",
        entry: ["clearError"],
        states: {
          requestingCancellation: {
            invoke: {
              src: "requestCancellation",
              onDone: { target: "#loading" },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          withdrawingCancellation: {
            invoke: {
              src: "withdrawCancellation",
              onDone: { target: "#loading" },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          settingPaymentMethod: {
            invoke: {
              src: "setPaymentMethod",
              onDone: { target: "#loading" },
              onError: { target: "#loading", actions: ["setError"] }
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
          rawContract: data as IContract,
          contract: mapContract(data as IContract)
        })
      ),

      setError: assign({
        error: (_context: ContractContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
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
      // `!error` is what stops the targetless arm re-firing once it has run.
      isUnrecognised: ({ contract, error }: ContractContext) =>
        !error && !!contract && isNil(selectContractStatusNode(contract))
    },

    services
  }
);
