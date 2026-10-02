/** @internal */
import { assign, createMachine, pure, spawn, stop } from "xstate";
import {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  TrialEndActionTypes
} from "@upmind-automation/types";
import { productMachine } from "../product";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  mapContractProduct,
  mapMigrationPreview,
  mapMigrationResult
} from "./contract-product.mappers";
import {
  useCancellationSchema,
  useCancellationUischema,
  useSetConsolidationSchema,
  useSetConsolidationUischema
} from "./contract-product.schemas";
import { contractProductMachineServices as services } from "./contract-product.services";
import { ContractProductState } from "./contract-product.types";
import {
  buildMigrationSeed,
  canConsolidate,
  canMigrateProduct,
  cancellationOptions,
  hasHardCancellationRequest,
  migrationTargetConfig,
  minFutureCancellationDate
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
import { isEmpty, isEqual, some, uniqueId } from "lodash-es";
import type {
  ContractProductContext,
  ContractProductLoaded,
  ContractProductWriteModel,
  MigrationChange,
  MigrationTarget
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

/** Spawns the stock product machine for a chosen plan, with the change-of-plan overrides. */
function spawnMigrationChild(
  context: ContractProductContext,
  target: MigrationTarget
) {
  return spawn(
    productMachine
      .withContext(buildMigrationSeed(context, target))
      .withConfig(migrationTargetConfig),
    { name: uniqueId("migrationTarget-") }
  );
}

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
        entry: ["clearCancellation", "clearConsolidation", "clearMigration"],
        invoke: {
          src: "load",
          // The settled read places the status node; the guards read the
          // record THIS read returned (the event), never the previous one.
          onDone: [
            {
              target: ContractProductState.STAGED,
              cond: "isStaged",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.CANCELLED,
              cond: "isCancelled",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.LAPSED,
              cond: "isLapsed",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.FRAUD,
              cond: "isFraud",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.CANCELLING,
              cond: "isCancelling",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.EXPIRING,
              cond: "isExpiring",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.PENDING,
              cond: "isPending",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.INACTIVE,
              cond: "isInactive",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.ACTIVE,
              cond: "isActive",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: ContractProductState.SUSPENDED,
              cond: "isSuspended",
              actions: ["setContractProduct", "setLookups"]
            },
            {
              target: "#error",
              // No status this machine knows (AC12).
              actions: ["setContractProduct", "setLookups", "setStatusError"]
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

      clearMigrationResult: assign({ migrationResult: null }),

      spawnMigrationTarget: assign(
        (context: ContractProductContext, { data }: AnyEventObject) => {
          const target = data as MigrationTarget;
          return {
            migration: { target, ref: spawnMigrationChild(context, target) }
          };
        }
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
          model: (data as MigrationChange).model,
          rawProduct: (data as MigrationChange).rawProduct
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
      canMigrate: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct && canMigrateProduct(contractProduct),

      isAllowedMigrationTarget: (
        { contractProduct }: ContractProductContext,
        { data }: AnyEventObject
      ) =>
        some(contractProduct?.allowedMigrations, [
          "migration_product_id",
          (data as MigrationTarget)?.id
        ]),

      isNewMigrationModel: (
        { migration }: ContractProductContext,
        { data }: AnyEventObject
      ) => !isEqual((data as MigrationChange)?.model, migration?.model),

      isMigrationTargetReady: ({ migration }: ContractProductContext) =>
        stateMatches(migration?.ref, ["available"]),

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

      isStaged: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.record.staged_import,
      isCancelled: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) => data.record.status?.code === ContractStatusCodes.CANCELLED,
      isLapsed: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.CLOSED,
      isFraud: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.FRAUD,
      isCancelling: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) =>
        data.record.contract_request?.status?.code ===
        CancellationRequestStatusCodes.REQUEST_CANCELLATION_REQUEST,
      isExpiring: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) =>
        data.record.billing_cycle_months > 0 &&
        !data.record.renew &&
        !!data.record.calculated_cancel_date,
      isPending: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.PENDING,
      isInactive: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) => data.record.status?.code === ContractStatusCodes.AWAITING_ACTIVATION,
      isActive: (_context: ContractProductContext, { data }: AnyEventObject) =>
        data.record.status?.code === ContractStatusCodes.ACTIVE,
      isSuspended: (
        _context: ContractProductContext,
        { data }: AnyEventObject
      ) => data.record.status?.code === ContractStatusCodes.SUSPENDED,

      isSetupIncomplete: ({ contractProduct }: ContractProductContext) =>
        contractProduct?.provisionSetupFieldsConfirmed === false,
      isSetupComplete: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct &&
        contractProduct.provisionSetupFieldsConfirmed !== false,

      isTrialRunning: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct?.inTrial &&
        contractProduct.trialEndAction !== TrialEndActionTypes.CANCEL,
      isTrialEnding: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct?.inTrial &&
        contractProduct.trialEndAction === TrialEndActionTypes.CANCEL,
      isTrialNone: ({ contractProduct }: ContractProductContext) =>
        !!contractProduct && !contractProduct.inTrial
    },

    services
  }
);

export default contractProductMachine;
