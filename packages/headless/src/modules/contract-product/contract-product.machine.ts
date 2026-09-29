/** @internal */
import { assign, createMachine, spawn } from "xstate";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import { mapContractProduct } from "./contract-product.mappers";
import {
  useCancellationSchema,
  useCancellationUischema,
  useSetConsolidationSchema,
  useSetConsolidationUischema
} from "./contract-product.schemas";
import { contractProductMachineServices as services } from "./contract-product.services";
import { ContractProductState } from "./contract-product.types";
import {
  canConsolidate,
  cancellationOptions,
  hasHardCancellationRequest,
  minFutureCancellationDate,
  selectSetupNode,
  selectStatusNode,
  selectTrialNode
} from "./contract-product.utils";
import {
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes,
  useModelParser,
  useValidationParser
} from "../../utils";
import { isEmpty } from "lodash-es";
import type {
  ContractProductContext,
  ContractProductLoaded,
  ContractProductWriteModel
} from "./contract-product.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.machine
 * @description The contract-product manager machine (R4) on the house write
 * spine of `data-manager.machine.ts` (R20, R20a). `available` is parallel over
 * `status`, `setup`, `trial`, `cancelling` and `consolidating`; the last two are
 * the auth-shaped write forms, so an open form never leaves the status node.
 * `unavailable` holds staged · cancelled · lapsed · fraud.
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
        // A form's context slot is the form's own — outliving the read that
        // re-placed the product would leave a page drawing a dead form beside
        // its re-shown "open" control.
        entry: [
          "clearContractProduct",
          "clearCancellation",
          "clearConsolidation"
        ],
        invoke: {
          src: "load",
          onDone: { actions: ["setContractProduct", "setLookups"] },
          onError: { target: "#error", actions: ["setError"] }
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
          {
            target: "#error",
            cond: "isUnrecognised",
            actions: ["setStatusError"]
          }
        ]
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
              pending: {
                on: {
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              inactive: {
                on: {
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              active: {
                on: {
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              suspended: {
                on: {
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              expiring: {
                on: {
                  RESUME: { target: "#processing.resumingRenewal" },
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  }
                }
              },
              cancelling: {
                on: {
                  SCHEDULE_CANCEL_REVOKE: {
                    target: "#processing.revokingScheduledCancellation"
                  },
                  WITHDRAW: {
                    target: "#processing.withdrawingCancellation"
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
          },

          cancelling: {
            id: "cancelling",
            initial: "idle",
            states: {
              idle: {
                on: {
                  CANCELLATION: {
                    target: "available",
                    actions: "setCancellationSchemas",
                    cond: "hasCancellationOptions"
                  }
                }
              },
              available: {
                initial: "checking",
                on: {
                  // Re-enter the node: `.checking` would not restart an in-flight
                  // validation, so a stale result would land.
                  "SET.CANCELLATION": {
                    target: "available",
                    actions: "setCancellationModel"
                  },
                  STOP_RENEWING: {
                    target: "#cancelling.processing.stoppingRenewal",
                    cond: "isSubscription"
                  },
                  SCHEDULE_CANCEL: {
                    target: "#cancelling.processing.schedulingCancellation"
                  },
                  REQUEST_CANCEL: {
                    target: "#cancelling.processing.requestingCancellation",
                    cond: "canRequestHardCancellation"
                  }
                },
                states: {
                  checking: {
                    entry: ["clearError"],
                    invoke: {
                      src: "validateCancellation",
                      onDone: { target: "valid" },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {},
                  error: {}
                }
              },
              // Its own `processing`, unlike the formless writes: a failed
              // submit returns to this form's `error` node with the model kept,
              // and the product never leaves its status node.
              processing: {
                entry: ["clearError"],
                states: {
                  stoppingRenewal: {
                    initial: "validating",
                    states: {
                      validating: {
                        invoke: {
                          src: "validateCancellation",
                          onDone: { target: "updating" },
                          onError: {
                            target: "#cancelling.available.error",
                            actions: ["setError"]
                          }
                        }
                      },
                      updating: {
                        invoke: {
                          src: "requestSoftCancel",
                          onDone: { target: "#loading" },
                          onError: {
                            target: "#cancelling.available.error",
                            actions: ["setError"]
                          }
                        }
                      }
                    }
                  },
                  schedulingCancellation: {
                    initial: "validating",
                    states: {
                      validating: {
                        invoke: {
                          src: "validateCancellation",
                          onDone: { target: "updating" },
                          onError: {
                            target: "#cancelling.available.error",
                            actions: ["setError"]
                          }
                        }
                      },
                      updating: {
                        invoke: {
                          src: "scheduleCancellation",
                          onDone: { target: "#loading" },
                          onError: {
                            target: "#cancelling.available.error",
                            actions: ["setError"]
                          }
                        }
                      }
                    }
                  },
                  requestingCancellation: {
                    initial: "validating",
                    states: {
                      validating: {
                        invoke: {
                          src: "validateCancellation",
                          onDone: { target: "updating" },
                          onError: {
                            target: "#cancelling.available.error",
                            actions: ["setError"]
                          }
                        }
                      },
                      updating: {
                        invoke: {
                          src: "requestCancellation",
                          onDone: { target: "#loading" },
                          onError: {
                            target: "#cancelling.available.error",
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
              "CANCEL.CANCELLATION": {
                target: ".idle",
                actions: "clearCancellation"
              }
            }
          },

          consolidating: {
            id: "consolidating",
            initial: "idle",
            states: {
              idle: {
                on: {
                  CONSOLIDATION: {
                    target: "available",
                    actions: "setConsolidationSchemas",
                    cond: "canConsolidate"
                  }
                }
              },
              available: {
                initial: "checking",
                on: {
                  // Re-enter the node: `.checking` would not restart an in-flight
                  // validation, so a stale result would land.
                  "SET.CONSOLIDATION": {
                    target: "available",
                    actions: "setConsolidationModel"
                  },
                  SET_CONSOLIDATION: {
                    target: "#consolidating.processing.settingConsolidation",
                    cond: "canConsolidate"
                  }
                },
                states: {
                  checking: {
                    entry: ["clearError"],
                    invoke: {
                      src: "validateConsolidation",
                      onDone: { target: "valid" },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {},
                  error: {}
                }
              },
              // Its own `processing`, unlike the formless writes: a failed
              // submit returns to this form's `error` node with the model kept,
              // and the product never leaves its status node.
              processing: {
                entry: ["clearError"],
                states: {
                  settingConsolidation: {
                    initial: "validating",
                    states: {
                      validating: {
                        invoke: {
                          src: "validateConsolidation",
                          onDone: { target: "updating" },
                          onError: {
                            target: "#consolidating.available.error",
                            actions: ["setError"]
                          }
                        }
                      },
                      updating: {
                        invoke: {
                          src: "setConsolidation",
                          onDone: { target: "#loading" },
                          onError: {
                            target: "#consolidating.available.error",
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
              "CANCEL.CONSOLIDATION": {
                target: ".idle",
                actions: "clearConsolidation"
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
          resumingRenewal: {
            invoke: {
              src: "abortSoftCancel",
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
          const raw = (data as ContractProductLoaded).record;
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

      setLookups: assign({
        lookups: (_context: ContractProductContext, { data }: AnyEventObject) =>
          (data as ContractProductLoaded).lookups
      }),

      // The open transition builds the combined cancellation form on context
      // from the product's eligible options, its earliest anniversary and the
      // CANCEL_REQUEST catalogue, then seeds an empty model.
      setCancellationSchemas: assign({
        cancellation: ({
          contractProduct,
          lookups
        }: ContractProductContext) => ({
          schema: useCancellationSchema({
            options: contractProduct
              ? cancellationOptions(contractProduct)
              : [],
            minDate: contractProduct
              ? minFutureCancellationDate(contractProduct)
              : null,
            customFields: lookups?.customFields
          }),
          uischema: useCancellationUischema(lookups?.customFields),
          model: {}
        })
      }),

      setConsolidationSchemas: assign({
        consolidation: () => ({
          schema: useSetConsolidationSchema(),
          uischema: useSetConsolidationUischema(),
          model: {}
        })
      }),

      setCancellationModel: assign({
        cancellation: (
          { cancellation }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({
          ...cancellation,
          model: useModelParser(
            cancellation?.schema,
            (data ?? {}) as Record<string, unknown>
          ) as ContractProductWriteModel
        })
      }),

      setConsolidationModel: assign({
        consolidation: (
          { consolidation }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({
          ...consolidation,
          model: useModelParser(
            consolidation?.schema,
            (data ?? {}) as Record<string, unknown>
          ) as ContractProductWriteModel
        })
      }),

      clearCancellation: assign({ cancellation: undefined }),

      clearConsolidation: assign({ consolidation: undefined }),

      setError: assign({
        error: (_context: ContractProductContext, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
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
      hasCancellationOptions: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct && !isEmpty(cancellationOptions(contractProduct)),

      isSubscription: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct?.isSubscription,

      canConsolidate: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct && canConsolidate(contractProduct),

      // HARD request eligibility (ADR-25 subscription, ADR-27 no scheduled
      // future cancellation), derived from the record — no brand setting read.
      canRequestHardCancellation: ({
        contractProduct
      }: ContractProductContext) =>
        !!contractProduct?.isSubscription &&
        !!contractProduct?.canCancel &&
        !hasHardCancellationRequest(contractProduct) &&
        !contractProduct?.hasScheduledFutureCancellation,

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
