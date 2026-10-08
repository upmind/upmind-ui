/** @internal */
import { assign, createMachine, pure, spawn, stop } from "xstate";
import { TrialEndActionTypes } from "@upmind-automation/types";
import { mapInvoice } from "../invoices";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapMigrationPreview,
  mapMigrationResult
} from "./contract-product.mappers";
import {
  useBillingEntitySchema,
  useBillingEntityUischema,
  useCancellationSchema,
  useCancellationUischema,
  useSetConsolidationSchema,
  useSetConsolidationUischema
} from "./contract-product.schemas";
import { ContractProductState } from "./contract-product.types";
import {
  canConsolidate,
  canDisableAutoRenew,
  canEnableAutoRenew,
  canEndTrial,
  canIssueNextInvoice,
  canMigrateProduct,
  canRequestCancellation,
  canRequestEndOfTerm,
  canScheduleFutureCancellation,
  cancellationOptions,
  hasAutoExpireEnabled,
  hasHardCancellationRequest,
  hasRegionWrite,
  minFutureCancellationDate,
  spawnMigrationChild
} from "./contract-product.utils";
import {
  DetailedError,
  ErrorOrigin,
  mapToHeadlessError,
  responseCodes,
  stateMatches,
  useModelParser,
  useValidationParser
} from "../../utils";
import { isEqual, isNil, some } from "lodash-es";
import type {
  BillingEntityModel,
  CancellationModel,
  ContractProductContext,
  SetConsolidationModel
} from "./contract-product.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.machine
 * @description The contract-product manager machine. `available` is parallel
 * over `status`, `setup`, `trial` and the write regions `cancelling`,
 * `migrating`, `consolidating` and `billingEntity`; a form region never leaves
 * the status node. `unavailable` is parallel over `status` (staged ·
 * cancelled · lapsed · fraud) and its own `billingEntity` form, and takes the
 * formless lifecycle writes as `available` does.
 */

export const contractProductMachine = createMachine<ContractProductContext>(
  {
    id: "contractProductManager",
    predictableActionArguments: true,
    initial: "subscribing",
    states: {
      subscribing: {
        entry: ["setAuthHelper"],
        on: { AUTHENTICATED: { target: "loading" } }
      },

      loading: {
        id: "loading",
        // A form's slot outliving the read that re-placed the product would
        // leave a page drawing a dead form beside its re-shown open control.
        entry: [
          "clearCancellation",
          "clearConsolidation",
          "clearBillingEntity",
          "clearMigration"
        ],
        invoke: {
          src: "load",
          // The guards read the product THIS read returned (the event).
          onDone: [
            {
              target: ContractProductState.STAGED,
              cond: "isStaged",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.CANCELLED,
              cond: "isCancelled",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.LAPSED,
              cond: "isLapsed",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.FRAUD,
              cond: "isFraud",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.CANCELLING,
              cond: "isCancelling",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.EXPIRING,
              cond: "isExpiring",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.PENDING,
              cond: "isPending",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.INACTIVE,
              cond: "isInactive",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.ACTIVE,
              cond: "isActive",
              actions: ["setContractProduct"]
            },
            {
              target: ContractProductState.SUSPENDED,
              cond: "isSuspended",
              actions: ["setContractProduct"]
            },
            {
              target: "#error",
              actions: ["setContractProduct", "setStatusError"]
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
        on: {
          "AUTO_RENEW.SET": {
            target: "#processing.settingAutoRenew",
            cond: "canSetAutoRenew"
          },
          "NEXT_INVOICE.ISSUE": {
            target: "#processing.issuingNextInvoice",
            cond: "canIssueNextInvoice"
          },
          "TRIAL.END": {
            target: "#processing.endingTrial",
            cond: "canEndTrial"
          },
          "LABEL.SET": {
            target: "#processing.settingClientLabel",
            cond: "canUpdateContractProduct"
          }
        },
        states: {
          status: {
            on: {
              SCHEDULE_CANCEL_REVOKE: {
                target: "#processing.revokingScheduledCancellation",
                cond: "hasNoRegionWrite"
              }
            },
            states: {
              pending: {},
              inactive: {},
              active: {},
              suspended: {},
              expiring: {
                on: {
                  RESUME: {
                    target: "#processing.resumingRenewal",
                    cond: "hasNoRegionWrite"
                  }
                }
              },
              cancelling: {
                on: {
                  WITHDRAW: {
                    target: "#processing.withdrawingCancellation",
                    cond: "hasNoRegionWrite"
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
                    target: "loading",
                    cond: "canRequestCancellation"
                  }
                }
              },
              // The form draws the CANCEL_REQUEST fields, so it opens once they
              // are read.
              loading: {
                invoke: {
                  src: "loadCancellationFields",
                  onDone: {
                    target: "available",
                    actions: "setCancellationSchemas"
                  },
                  onError: { target: "idle", actions: ["setError"] }
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
                    cond: "canRequestEndOfTerm"
                  },
                  SCHEDULE_CANCEL: {
                    target: "#cancelling.processing.schedulingCancellation",
                    cond: "canScheduleFutureCancellation"
                  },
                  REQUEST_CANCEL: {
                    target: "#cancelling.processing.requestingCancellation",
                    cond: "canRequestCancellation"
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
              // A failed submit returns to this form's `error` node with the
              // model kept, and the product never leaves its status node.
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

          migrating: {
            id: "migrating",
            initial: "idle",
            states: {
              idle: {
                on: {
                  MIGRATION: {
                    target: "choosing",
                    actions: "clearMigrationResult",
                    cond: "canMigrate"
                  }
                }
              },
              choosing: {
                on: {
                  "MIGRATION.SELECT": {
                    target: "configuring",
                    actions: "spawnMigrationTarget",
                    cond: "isAllowedMigrationTarget"
                  },
                  "CANCEL.MIGRATION": {
                    target: "idle",
                    actions: "clearMigration"
                  }
                }
              },
              configuring: {
                id: "migrationConfiguring",
                initial: "loading",
                invoke: { src: "watchMigrationTarget" },
                on: {
                  "MIGRATION.UNAVAILABLE": {
                    target: ".unavailable",
                    actions: ["setError", "clearMigrationPreview"]
                  },
                  "CANCEL.MIGRATION": {
                    target: "idle",
                    actions: "clearMigration"
                  }
                },
                states: {
                  loading: {
                    on: {
                      "MIGRATION.CHANGED": {
                        target: "previewing",
                        actions: "setMigrationModel"
                      }
                    }
                  },
                  unavailable: {
                    on: {
                      "MIGRATION.RELOAD": {
                        target: "#migrationConfiguring",
                        actions: ["clearError", "respawnMigrationTarget"]
                      }
                    }
                  },
                  previewing: {
                    entry: "clearMigrationPreview",
                    invoke: {
                      src: "previewMigration",
                      onDone: {
                        target: "previewed",
                        actions: "setMigrationPreview"
                      },
                      onError: { target: "unpreviewed" }
                    },
                    on: {
                      "MIGRATION.CHANGED": {
                        target: "previewing",
                        actions: "setMigrationModel",
                        cond: "isNewMigrationModel"
                      }
                    }
                  },
                  previewed: {
                    on: {
                      "MIGRATION.CHANGED": {
                        target: "previewing",
                        actions: "setMigrationModel",
                        cond: "isNewMigrationModel"
                      },
                      MIGRATE: {
                        target: "processing",
                        cond: "isMigrationTargetReady"
                      }
                    }
                  },
                  unpreviewed: {
                    entry: "clearMigrationPreview",
                    on: {
                      "MIGRATION.CHANGED": {
                        target: "previewing",
                        actions: "setMigrationModel",
                        cond: "isNewMigrationModel"
                      },
                      MIGRATE: {
                        target: "processing",
                        cond: "isMigrationTargetReady"
                      }
                    }
                  },
                  error: {
                    id: "migrationError",
                    on: {
                      "MIGRATION.CHANGED": {
                        target: "previewing",
                        actions: ["setMigrationModel", "clearError"],
                        cond: "isNewMigrationModel"
                      },
                      MIGRATE: {
                        target: "processing",
                        cond: "isMigrationTargetReady"
                      }
                    }
                  },
                  processing: {
                    entry: "clearError",
                    initial: "requesting",
                    // Forbidden: the PUT is out, so its invoice must land.
                    on: {
                      "CANCEL.MIGRATION": undefined,
                      "MIGRATION.UNAVAILABLE": undefined,
                      REFRESH: undefined
                    },
                    states: {
                      requesting: {
                        entry: "requestMigrationCommit",
                        on: {
                          "MIGRATION.COMMIT": {
                            target: "sending",
                            actions: "setMigrationModel"
                          }
                        }
                      },
                      sending: {
                        invoke: {
                          src: "migrate",
                          onDone: {
                            target: "#loading",
                            actions: [
                              "answerMigrationTargetDone",
                              "setMigrationResult"
                            ]
                          },
                          onError: {
                            target: "#migrationError",
                            actions: ["setError", "answerMigrationTargetError"]
                          }
                        }
                      }
                    }
                  }
                }
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
          },

          billingEntity: {
            id: "billingEntity",
            initial: "idle",
            states: {
              idle: {
                on: {
                  BILLING_ENTITY: {
                    target: "loading",
                    cond: "canSetBillingEntity"
                  }
                }
              },
              // The picker lists the client's addresses and companies, so the
              // form opens once both owner lists are read.
              loading: {
                invoke: {
                  src: "loadBillingEntities",
                  onDone: {
                    target: "available",
                    actions: "setBillingEntitySchemas"
                  },
                  onError: { target: "idle", actions: ["setError"] }
                }
              },
              available: {
                initial: "checking",
                on: {
                  // Re-enter the node: `.checking` would not restart an in-flight
                  // validation, so a stale result would land.
                  "SET.BILLING_ENTITY": {
                    target: "available",
                    actions: "setBillingEntityModel"
                  },
                  SET_BILLING_ENTITY: {
                    target: "#billingEntity.processing.settingBillingEntity",
                    cond: "canSetBillingEntity"
                  }
                },
                states: {
                  checking: {
                    entry: ["clearError"],
                    invoke: {
                      src: "validateBillingEntity",
                      onDone: { target: "valid" },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {},
                  error: {}
                }
              },
              processing: {
                entry: ["clearError"],
                states: {
                  settingBillingEntity: {
                    initial: "validating",
                    states: {
                      validating: {
                        invoke: {
                          src: "validateBillingEntity",
                          onDone: { target: "updating" },
                          onError: {
                            target: "#billingEntity.available.error",
                            actions: ["setError"]
                          }
                        }
                      },
                      updating: {
                        invoke: {
                          src: "setBillingEntity",
                          onDone: { target: "#loading" },
                          onError: {
                            target: "#billingEntity.available.error",
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
              "CANCEL.BILLING_ENTITY": {
                target: ".idle",
                actions: "clearBillingEntity"
              }
            }
          }
        }
      },

      unavailable: {
        id: "unavailable",
        on: {
          "AUTO_RENEW.SET": {
            target: "#processing.settingAutoRenew",
            cond: "canSetAutoRenew"
          },
          "NEXT_INVOICE.ISSUE": {
            target: "#processing.issuingNextInvoice",
            cond: "canIssueNextInvoice"
          },
          "TRIAL.END": {
            target: "#processing.endingTrial",
            cond: "canEndTrial"
          },
          "LABEL.SET": {
            target: "#processing.settingClientLabel",
            cond: "canUpdateContractProduct"
          }
        },
        type: "parallel",
        states: {
          status: {
            states: {
              staged: {},
              cancelled: {},
              lapsed: {},
              fraud: {}
            }
          },

          billingEntity: {
            id: "billingEntityUnavailable",
            initial: "idle",
            states: {
              idle: {
                on: {
                  BILLING_ENTITY: {
                    target: "loading",
                    cond: "canSetBillingEntity"
                  }
                }
              },
              // The picker lists the client's addresses and companies, so the
              // form opens once both owner lists are read.
              loading: {
                invoke: {
                  src: "loadBillingEntities",
                  onDone: {
                    target: "available",
                    actions: "setBillingEntitySchemas"
                  },
                  onError: { target: "idle", actions: ["setError"] }
                }
              },
              available: {
                initial: "checking",
                on: {
                  // Re-enter the node: `.checking` would not restart an in-flight
                  // validation, so a stale result would land.
                  "SET.BILLING_ENTITY": {
                    target: "available",
                    actions: "setBillingEntityModel"
                  },
                  SET_BILLING_ENTITY: {
                    target:
                      "#billingEntityUnavailable.processing.settingBillingEntity",
                    cond: "canSetBillingEntity"
                  }
                },
                states: {
                  checking: {
                    entry: ["clearError"],
                    invoke: {
                      src: "validateBillingEntity",
                      onDone: { target: "valid" },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {},
                  error: {}
                }
              },
              processing: {
                entry: ["clearError"],
                states: {
                  settingBillingEntity: {
                    initial: "validating",
                    states: {
                      validating: {
                        invoke: {
                          src: "validateBillingEntity",
                          onDone: { target: "updating" },
                          onError: {
                            target: "#billingEntityUnavailable.available.error",
                            actions: ["setError"]
                          }
                        }
                      },
                      updating: {
                        invoke: {
                          src: "setBillingEntity",
                          onDone: { target: "#loading" },
                          onError: {
                            target: "#billingEntityUnavailable.available.error",
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
              "CANCEL.BILLING_ENTITY": {
                target: ".idle",
                actions: "clearBillingEntity"
              }
            }
          }
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
          },
          settingAutoRenew: {
            invoke: {
              src: "setAutoRenew",
              onDone: { target: "#loading" },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          // Forbidden while the POST is out: a re-read would drop the invoice
          // it raises.
          issuingNextInvoice: {
            entry: ["clearIssuedInvoice"],
            on: { REFRESH: undefined, UNAUTHENTICATED: undefined },
            invoke: {
              src: "issueNextInvoice",
              onDone: { target: "#loading", actions: ["setIssuedInvoice"] },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          endingTrial: {
            entry: ["clearIssuedInvoice"],
            on: { REFRESH: undefined, UNAUTHENTICATED: undefined },
            invoke: {
              src: "endTrial",
              onDone: { target: "#loading", actions: ["setIssuedInvoice"] },
              onError: { target: "#loading", actions: ["setError"] }
            }
          },
          settingClientLabel: {
            initial: "validating",
            states: {
              validating: {
                invoke: {
                  src: "validateClientLabel",
                  onDone: { target: "updating" },
                  onError: { target: "#loading", actions: ["setError"] }
                }
              },
              updating: {
                invoke: {
                  src: "setClientLabel",
                  onDone: { target: "#loading" },
                  onError: { target: "#loading", actions: ["setError"] }
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
        authHelper: ({ authHelper }: ContractProductContext) =>
          authHelper ?? spawn(authSubscription)
      }),

      setContractProduct: assign(
        (context: ContractProductContext, { data }: AnyEventObject) => ({
          contractProduct: data,
          contractId: context.contractId || data.contractId
        })
      ),

      setCancellationSchemas: assign({
        cancellation: (
          { contractProduct }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({
          schema: useCancellationSchema({
            options: contractProduct
              ? cancellationOptions(contractProduct)
              : [],
            minDate: contractProduct
              ? minFutureCancellationDate(contractProduct)
              : null,
            customFields: data
          }),
          uischema: useCancellationUischema(data),
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

      setBillingEntitySchemas: assign({
        billingEntity: (
          { contractProduct }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({
          schema: useBillingEntitySchema(data, contractProduct),
          uischema: useBillingEntityUischema(),
          model: {}
        })
      }),

      setCancellationModel: assign({
        cancellation: (
          { cancellation }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({
          ...cancellation,
          model: useModelParser<CancellationModel>(
            cancellation?.schema,
            data ?? {}
          )
        })
      }),

      setConsolidationModel: assign({
        consolidation: (
          { consolidation }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({
          ...consolidation,
          model: useModelParser<SetConsolidationModel>(
            consolidation?.schema,
            data ?? {}
          )
        })
      }),

      setBillingEntityModel: assign({
        billingEntity: (
          { billingEntity }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({
          ...billingEntity,
          model: useModelParser<BillingEntityModel>(
            billingEntity?.schema,
            data ?? {}
          )
        })
      }),

      clearCancellation: assign({ cancellation: undefined }),

      clearConsolidation: assign({ consolidation: undefined }),

      clearBillingEntity: assign({ billingEntity: undefined }),

      clearMigrationResult: assign({ migrationResult: null }),

      spawnMigrationTarget: assign(
        (context: ContractProductContext, { data }: AnyEventObject) => ({
          migration: {
            target: data,
            ref: spawnMigrationChild(context, data)
          }
        })
      ),

      respawnMigrationTarget: pure<ContractProductContext, AnyEventObject>(
        context => {
          const { migration } = context;
          if (!migration?.target) return undefined;

          return [
            ...(migration.ref
              ? [stop<ContractProductContext, AnyEventObject>(migration.ref.id)]
              : []),
            assign<ContractProductContext, AnyEventObject>({
              migration: {
                target: migration.target,
                ref: spawnMigrationChild(context, migration.target)
              }
            })
          ];
        }
      ),

      clearMigration: pure<ContractProductContext, AnyEventObject>(
        ({ migration }) => [
          ...(migration?.ref
            ? [stop<ContractProductContext, AnyEventObject>(migration.ref.id)]
            : []),
          assign<ContractProductContext, AnyEventObject>({
            migration: undefined
          })
        ]
      ),

      setMigrationModel: assign({
        migration: (
          { migration }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({
          ...migration,
          model: data.model,
          rawProduct: data.rawProduct
        })
      }),

      setMigrationPreview: assign({
        migration: (
          { migration }: ContractProductContext,
          { data }: AnyEventObject
        ) => ({ ...migration, preview: mapMigrationPreview(data) })
      }),

      clearMigrationPreview: assign({
        migration: ({ migration }: ContractProductContext) =>
          migration && { ...migration, preview: undefined }
      }),

      setMigrationResult: assign({
        migrationResult: (
          _context: ContractProductContext,
          { data }: AnyEventObject
        ) => mapMigrationResult(data)
      }),

      // The child is asked to commit by a forced `UPDATE`; its `update`
      // override answers with `MIGRATION.COMMIT`.
      requestMigrationCommit: ({ migration }: ContractProductContext) => {
        migration?.ref?.send({ type: "UPDATE", data: { forced: true } });
      },

      // Sent straight to the child, not through `sendTo`: a `sendTo` is
      // delivered after the `loading` entry has stopped the child, so the
      // answer would reach a dead actor.
      answerMigrationTargetDone: ({ migration }: ContractProductContext) => {
        migration?.ref?.send({ type: "UPDATED" });
      },

      answerMigrationTargetError: (
        { migration }: ContractProductContext,
        { data }: AnyEventObject
      ) => {
        migration?.ref?.send({ type: "ERROR", data });
      },

      // Outside the form slots, so the re-read keeps the result for the action.
      setIssuedInvoice: assign({
        issuedInvoice: (
          _context: ContractProductContext,
          { data }: AnyEventObject
        ) => (isNil(data) ? null : mapInvoice(data))
      }),

      clearIssuedInvoice: assign({ issuedInvoice: undefined }),

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
              { code: contractProduct?.raw.status?.code }
            )
          )
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      canMigrate: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct && canMigrateProduct(contractProduct),

      isAllowedMigrationTarget: (
        { contractProduct }: ContractProductContext,
        { data }: AnyEventObject
      ) =>
        some(contractProduct?.allowedMigrations, [
          "migration_product_id",
          data?.id
        ]),

      isNewMigrationModel: (
        { migration }: ContractProductContext,
        { data }: AnyEventObject
      ) => !isEqual(data?.model, migration?.model),

      isMigrationTargetReady: (
        { migration }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) =>
        !hasRegionWrite(state) && stateMatches(migration?.ref, ["available"]),

      canRequestEndOfTerm: (
        { contractProduct }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) =>
        !hasRegionWrite(state) &&
        !!contractProduct &&
        canRequestEndOfTerm(contractProduct),

      canRequestCancellation: (
        { contractProduct }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) =>
        !hasRegionWrite(state) &&
        !!contractProduct &&
        canRequestCancellation(contractProduct),

      canScheduleFutureCancellation: (
        { contractProduct }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) =>
        !hasRegionWrite(state) &&
        !!contractProduct &&
        canScheduleFutureCancellation(contractProduct),

      canConsolidate: (
        { contractProduct }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) =>
        !hasRegionWrite(state) &&
        !!contractProduct &&
        canConsolidate(contractProduct),

      hasNoRegionWrite: (
        _context: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) => !hasRegionWrite(state),

      canSetAutoRenew: (
        { contractProduct }: ContractProductContext,
        { data }: AnyEventObject,
        { state }
      ) =>
        !hasRegionWrite(state) &&
        !!contractProduct &&
        (data.on
          ? canEnableAutoRenew(contractProduct)
          : canDisableAutoRenew(contractProduct)),

      canIssueNextInvoice: (
        { contractProduct }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) =>
        !hasRegionWrite(state) &&
        !!contractProduct &&
        canIssueNextInvoice(contractProduct),

      canEndTrial: (
        { contractProduct }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) =>
        !hasRegionWrite(state) &&
        !!contractProduct &&
        canEndTrial(contractProduct),

      canUpdateContractProduct: (
        { contractProduct }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) => !hasRegionWrite(state) && !!contractProduct,

      canSetBillingEntity: (
        { contractProduct }: ContractProductContext,
        _event: AnyEventObject,
        { state }
      ) => !hasRegionWrite(state) && !!contractProduct?.isSubscription,

      isStaged: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.stagedImport,
      isCancelled: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) => data.meta.isCancelled,
      isLapsed: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.meta.isClosed,
      isFraud: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.meta.isFraud,
      isCancelling: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) => hasHardCancellationRequest(data),
      isExpiring: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) => hasAutoExpireEnabled(data),
      isPending: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.meta.isPending,
      isInactive: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) => data.meta.isAwaitingActivation,
      isActive: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.meta.isActive,
      isSuspended: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) => data.meta.isSuspended,

      isSetupIncomplete: ({ contractProduct }: ContractProductContext) =>
        !isNil(contractProduct?.provisionSetupFieldsConfirmed) &&
        !contractProduct.provisionSetupFieldsConfirmed,
      isSetupComplete: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        (isNil(contractProduct.provisionSetupFieldsConfirmed) ||
          contractProduct.provisionSetupFieldsConfirmed),

      isTrialRunning: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct?.inTrial &&
        contractProduct.trialEndAction !== TrialEndActionTypes.CANCEL,
      isTrialEnding: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct?.inTrial &&
        contractProduct.trialEndAction === TrialEndActionTypes.CANCEL,
      isTrialNone: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct && !contractProduct.inTrial
    }
  }
);

export default contractProductMachine;
