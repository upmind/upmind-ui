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
  useValidationParser
} from "../../utils";
import { isNil } from "lodash-es";
import type { ContractContext, ContractLoaded } from "./contract.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.machine
 * @description The contract manager machine — flow.md section 3 on the house
 * spine of `orders/order.machine.ts` (R4, R20, R20a). Eight status nodes:
 * `available.{pending,inactive,active,suspended,cancelling}` and
 * `unavailable.{cancelled,lapsed,fraud}`. The contract keeps only contract
 * facts (R34): every cancellation write moved to `contract-product` with R33,
 * so the ONE write it owns is the payment-method form.
 *
 * @decision the payment-method write is a FORM (auth shape), not a bare
 *   `processing` transition (R33 form shape, operator ruling 2026-09-23).
 * what: `PAYMENT_METHOD` opens the form (the open transition sets its
 *   `schema`/`uischema`/`model` from the stored-card lookup), `SET` runs
 *   `parse` → `validate` (→ `valid`/`invalid`), `SET_PAYMENT_METHOD` submits
 *   through `processing.settingPaymentMethod` (`validating` → `updating`), and
 *   `CANCEL` closes the form back onto the status node.
 * why: house law (auth, account) renders and validates a write through a form
 *   node; the labs editor needs the single `schema`/`uischema` slot on context.
 * rejected: the `schemas` map on context (dropped with R28's amendment
 *   withdrawn); a bare status-node transition straight to `processing`.
 */

function isNode(node: ContractState) {
  return ({ contract }: ContractContext) =>
    !!contract && selectContractStatusNode(contract) === node;
}

/** The open + submit + cancel handlers every status node carries for the form. */
const paymentMethodOn = {
  PAYMENT_METHOD: {
    target: "#paymentMethod",
    actions: "setPaymentMethodSchemas"
  }
};

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
      },

      available: {
        id: "available",
        states: {
          pending: { on: paymentMethodOn },
          inactive: { on: paymentMethodOn },
          active: { on: paymentMethodOn },
          suspended: { on: paymentMethodOn },
          cancelling: { on: paymentMethodOn }
        }
      },

      unavailable: {
        id: "unavailable",
        states: {
          cancelled: { on: paymentMethodOn },
          lapsed: { on: paymentMethodOn },
          fraud: {}
        }
      },

      // The ONE write form (R34), copied from `auth.machine.ts`'s flow shape:
      // `available` (SET → parse → validate → valid|invalid) beside its own
      // `processing`.
      /**
       * @decision `CANCEL` closes the form to `#loading`, not to an idle node.
       * what: the form's `CANCEL` targets `#loading`, which re-reads the record
       *   and re-places the status node through its `always`.
       * why: auth's `CANCEL` targets `#idle` because auth HAS a placement-free
       *   idle node; this machine has none — every settled node lives under a
       *   status placement, so the only re-entry point is `#loading`.
       * rejected: a bare idle node with no placement (the machine has none).
       */
      paymentMethod: {
        id: "paymentMethod",
        initial: "available",
        on: {
          CANCEL: { target: "#loading", actions: ["clearForm"] }
        },
        states: {
          available: {
            initial: "checking",
            on: {
              SET: { target: ".checking", actions: "setModel" },
              SET_PAYMENT_METHOD: {
                target: "#paymentMethod.processing",
                actions: "setModel"
              }
            },
            states: {
              checking: {
                entry: ["clearError"],
                initial: "parsing",
                states: {
                  parsing: {
                    invoke: {
                      src: "parse",
                      onDone: { target: "validating", actions: ["setModel"] }
                    }
                  },
                  validating: {
                    invoke: {
                      src: "validate",
                      onDone: { target: "#paymentMethod.available.valid" },
                      onError: {
                        target: "#paymentMethod.available.invalid",
                        actions: ["setError"]
                      }
                    }
                  }
                }
              },
              valid: {},
              invalid: {},
              error: {
                on: {
                  SET: {
                    target: "#paymentMethod.available",
                    actions: "setModel"
                  },
                  SET_PAYMENT_METHOD: {
                    target: "#paymentMethod.processing",
                    actions: "setModel"
                  }
                }
              }
            }
          },
          processing: {
            initial: "settingPaymentMethod",
            states: {
              settingPaymentMethod: {
                entry: ["clearError"],
                initial: "validating",
                states: {
                  validating: {
                    invoke: {
                      src: "validate",
                      onDone: { target: "updating" },
                      onError: {
                        target: "#paymentMethod.available.error",
                        actions: ["setError"]
                      }
                    }
                  },
                  updating: {
                    invoke: {
                      src: "setPaymentMethod",
                      onDone: { target: "#loading", actions: ["clearForm"] },
                      onError: { target: "#loading", actions: ["setError"] }
                    }
                  }
                }
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
      setPaymentMethodSchemas: assign(
        ({ contract, lookups }: ContractContext) => ({
          schema: useSetPaymentMethodSchema({
            storedPaymentMethods: lookups?.storedPaymentMethods,
            paymentDetailsId: contract?.paymentDetailsId
          }),
          uischema: useSetPaymentMethodUischema(),
          model: {}
        })
      ),

      setModel: assign({
        model: ({ model }: ContractContext, { data }: AnyEventObject) =>
          data ?? model
      }),

      clearForm: assign({
        schema: undefined,
        uischema: undefined,
        model: undefined
      }),

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
      // `!error` is what stops the targetless arm re-firing once it has run.
      isUnrecognised: ({ contract, error }: ContractContext) =>
        !error && !!contract && isNil(selectContractStatusNode(contract))
    },

    services
  }
);
