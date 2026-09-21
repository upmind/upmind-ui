/** @internal */
import { assign, createMachine, spawn } from "xstate";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import { mapContractProduct } from "./contract-product.mappers";
import { contractProductMachineServices as services } from "./contract-product.services";
import { ContractProductState } from "./contract-product.types";
import {
  selectSetupNode,
  selectStatusNode,
  selectTrialNode
} from "./contract-product.utils";
import {
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes
} from "../../utils";
import type { ContractProductContext } from "./contract-product.types";
import type { IContractProduct } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.machine
 * @description The LOCKED contract-product manager machine (R4), on the house
 * write spine of `data-manager.machine.ts` (R20, R20a). `available` is
 * `type: "parallel"` over `status`, `setup` and `trial`; `unavailable` holds
 * staged · cancelled · lapsed · fraud and nothing leaves it. Every write runs
 * through the one `processing` state, which invokes one named service and
 * re-reads on completion. A failure is the `error` context property, never a
 * state.
 *
 * @decision
 * what: `loading` clears the record pair on entry and hosts the ordered
 *   `always` entry list, which reads `context.contractProduct`.
 * why: an `always` list on `loading` is evaluated on entry as well as after
 *   the read lands, so a stale view model from the previous cycle would place
 *   the node before the request fired and cancel it. The chart is locked
 *   (R4), so no transient child state may host the list instead.
 * rejected: a `loading.placing` child state; guards that read the raw record
 *   off the `done.invoke` event with `setContractProduct` repeated per arm.
 */

export const contractProductMachine = createMachine(
  {
    id: "contractProductManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as ContractProductContext,
    states: {
      subscribing: {
        entry: ["setAuthHelper"],
        on: { AUTHENTICATED: { target: "loading" } }
      },

      loading: {
        id: "loading",
        entry: ["clearContractProduct"],
        invoke: {
          src: "load",
          onDone: { actions: ["setContractProduct"] },
          onError: { actions: ["setError"] }
        },
        always: [
          { target: ContractProductState.STAGED, cond: "isStaged" },
          { target: ContractProductState.CANCELLED, cond: "isCancelled" },
          { target: ContractProductState.LAPSED, cond: "isLapsed" },
          { target: ContractProductState.FRAUD, cond: "isFraud" },
          { target: ContractProductState.CANCELLING, cond: "isCancelling" },
          { target: ContractProductState.EXPIRING, cond: "isExpiring" },
          { target: ContractProductState.PENDING, cond: "isPending" },
          { target: ContractProductState.INACTIVE, cond: "isInactive" },
          { target: ContractProductState.ACTIVE, cond: "isActive" },
          { target: ContractProductState.SUSPENDED, cond: "isSuspended" },
          { cond: "isUnrecognised", actions: ["setStatusError"] }
        ]
      },

      available: {
        id: "available",
        type: "parallel",
        states: {
          status: {
            states: {
              pending: {
                on: {
                  SET_CONSOLIDATION: {
                    target: "#processing.settingConsolidation",
                    cond: "isSubscription"
                  },
                  SCHEDULE_CANCEL: {
                    target: "#processing.schedulingCancellation"
                  },
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              inactive: {
                on: {
                  STOP_RENEWING: {
                    target: "#processing.stoppingRenewal",
                    cond: "isSubscription"
                  },
                  SET_CONSOLIDATION: {
                    target: "#processing.settingConsolidation",
                    cond: "isSubscription"
                  },
                  SCHEDULE_CANCEL: {
                    target: "#processing.schedulingCancellation"
                  },
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              active: {
                on: {
                  STOP_RENEWING: {
                    target: "#processing.stoppingRenewal",
                    cond: "isSubscription"
                  },
                  SET_CONSOLIDATION: {
                    target: "#processing.settingConsolidation",
                    cond: "isSubscription"
                  },
                  SCHEDULE_CANCEL: {
                    target: "#processing.schedulingCancellation"
                  },
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              suspended: {
                on: {
                  STOP_RENEWING: {
                    target: "#processing.stoppingRenewal",
                    cond: "isSubscription"
                  },
                  SET_CONSOLIDATION: {
                    target: "#processing.settingConsolidation",
                    cond: "isSubscription"
                  },
                  SCHEDULE_CANCEL: {
                    target: "#processing.schedulingCancellation"
                  },
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              expiring: {
                on: {
                  RESUME: { target: "#processing.resumingRenewal" },
                  SET_CONSOLIDATION: {
                    target: "#processing.settingConsolidation",
                    cond: "isSubscription"
                  },
                  SCHEDULE_CANCEL: {
                    target: "#processing.schedulingCancellation"
                  },
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              cancelling: {
                on: {
                  SET_CONSOLIDATION: {
                    target: "#processing.settingConsolidation",
                    cond: "isSubscription"
                  },
                  SCHEDULE_CANCEL: {
                    target: "#processing.schedulingCancellation"
                  },
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              }
            }
          },

          setup: {
            initial: "complete",
            states: {
              incomplete: {
                always: { target: "complete", cond: "isSetupComplete" }
              },
              complete: {
                always: { target: "incomplete", cond: "isSetupIncomplete" }
              }
            }
          },

          trial: {
            initial: "none",
            states: {
              none: {
                always: [
                  { target: "ending", cond: "isTrialEnding" },
                  { target: "running", cond: "isTrialRunning" }
                ]
              },
              running: {
                always: [
                  { target: "ending", cond: "isTrialEnding" },
                  { target: "none", cond: "isTrialNone" }
                ]
              },
              ending: {
                always: [
                  { target: "running", cond: "isTrialRunning" },
                  { target: "none", cond: "isTrialNone" }
                ]
              }
            }
          }
        }
      },

      unavailable: {
        id: "unavailable",
        states: {
          staged: {},
          cancelled: {},
          lapsed: {},
          fraud: {}
        }
      },

      processing: {
        id: "processing",
        entry: ["clearError"],
        states: {
          stoppingRenewal: {
            invoke: {
              src: "requestSoftCancel",
              onDone: { target: "#loading" },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          resumingRenewal: {
            invoke: {
              src: "abortSoftCancel",
              onDone: { target: "#loading" },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          settingConsolidation: {
            invoke: {
              src: "setConsolidation",
              onDone: { target: "#loading" },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          schedulingCancellation: {
            invoke: {
              src: "scheduleCancellation",
              onDone: { target: "#loading" },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          revokingScheduledCancellation: {
            invoke: {
              src: "revokeScheduledCancellation",
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
        authHelper: ({ authHelper }: ContractProductContext) =>
          authHelper ?? spawn(authSubscription)
      }),

      setContractProduct: assign(
        (context: ContractProductContext, { data }: AnyEventObject) => {
          const raw = data as IContractProduct;
          return {
            rawContractProduct: raw,
            contractProduct: mapContractProduct(raw),
            contractId: context.contractId || raw.contract_id
          };
        }
      ),

      clearContractProduct: assign({
        rawContractProduct: undefined,
        contractProduct: undefined
      }),

      setError: assign({
        error: (_context: ContractProductContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),

      setStatusError: assign({
        error: ({ contractProduct }: ContractProductContext) =>
          mapToHeadlessError(
            new DetailedError(
              useI18n().t("error.contract_product_status_unrecognised"),
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless,
              { code: contractProduct?.status?.code }
            )
          )
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      isSubscription: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct?.isSubscription,

      isStaged: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.STAGED,
      isCancelled: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.CANCELLED,
      isLapsed: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.LAPSED,
      isFraud: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.FRAUD,
      isCancelling: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.CANCELLING,
      isExpiring: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.EXPIRING,
      isPending: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.PENDING,
      isInactive: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.INACTIVE,
      isActive: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.ACTIVE,
      isSuspended: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectStatusNode(contractProduct) === ContractProductState.SUSPENDED,
      isUnrecognised: ({ contractProduct, error }: ContractProductContext) =>
        !!contractProduct &&
        !error &&
        selectStatusNode(contractProduct) === undefined,

      isSetupIncomplete: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectSetupNode(contractProduct) ===
          ContractProductState.SETUP_INCOMPLETE,
      isSetupComplete: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectSetupNode(contractProduct) ===
          ContractProductState.SETUP_COMPLETE,

      isTrialRunning: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectTrialNode(contractProduct) === ContractProductState.TRIAL_RUNNING,
      isTrialEnding: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectTrialNode(contractProduct) === ContractProductState.TRIAL_ENDING,
      isTrialNone: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        selectTrialNode(contractProduct) === ContractProductState.TRIAL_NONE
    },

    services
  }
);

export default contractProductMachine;
