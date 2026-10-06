import { computed } from "vue";
import { minFutureCancellationDate as resolveMinFutureCancellationDate } from "./contract-product.utils";
import { contextValue, useContext } from "../../utils";
import type {
  ContractProduct,
  ContractProductContext,
  MigrationPreview,
  MigrationHolders,
  MigrationResult,
  MigrationTarget,
  ScheduledAction,
  ContractProductForm
} from "./contract-product.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type {
  IContractProduct,
  IProductMigration
} from "@upmind-automation/types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct.context
 * @description Manager context — the reactive read side of the machine
 * context. Every member goes through the `useContext` state-read utility.
 * `scheduledActions` and `minFutureCancellationDate` are DERIVED off the view
 * model, never stored as their own context fields. Each open write form is read
 * off its own `cancellation` / `consolidation` slot, which the machine sets on
 * that form's open transition; nothing is fetched or composed here. Errors are
 * state, not events.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createContractProductContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  holders: MigrationHolders
) {
  const { state } = actor;

  const contractProduct = useContext<ContractProduct>(state, "contractProduct");

  const scheduledActions = computed<ScheduledAction[]>(
    () => contractProduct.value?.scheduledActions ?? []
  );

  const minFutureCancellationDate = computed(() =>
    contractProduct.value
      ? resolveMinFutureCancellationDate(contractProduct.value)
      : null
  );

  /** Display title of the product — derived off the view model, as `scheduledActions` is. */
  const title = computed(() => contractProduct.value?.name);

  /** Description of the product — derived off the raw wire record, as `scheduledActions` is. */
  const description = computed(() => contractProduct.value?.raw?.description);

  const allowedMigrations = computed<IProductMigration[]>(
    () => contractProduct.value?.allowedMigrations ?? []
  );

  return {
    /** The products the current product allows a change to. */
    allowedMigrations,

    /** The open cancellation form: `schema`, `uischema` and the parsed `model`. */
    cancellation: useContext<ContractProductForm | undefined>(
      state,
      "cancellation"
    ),

    /** The open consolidation form: `schema`, `uischema` and the parsed `model`. */
    consolidation: useContext<ContractProductForm | undefined>(
      state,
      "consolidation"
    ),

    /** The full machine context object. */
    context: useContext<ContractProductContext>(state),

    /** The contract the product belongs to. */
    contractId: useContext<string | undefined>(state, "contractId"),

    /** The mapped contract product. */
    contractProduct,

    /** Display description of the product. */
    description,

    /** Machine-captured error, if any — read, never raised. */
    error: useContext<ResponseError | undefined>(state, "error"),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The product this manager acts on (undefined for a new item). */
    id: useContext<string | undefined>(state, "contractProductId"),

    /** Reference data the machine's `load` service resolved (the CANCEL_REQUEST custom fields). */
    lookups: useContext<ContractProductContext["lookups"]>(state, "lookups"),

    /** The earliest selectable future-cancellation date, as a wire date string. */
    minFutureCancellationDate,

    /** The configurator of the chosen product, `null` when no product is chosen. It gives no provision field and no trial choice. */
    migrationConfig: computed(() => holders.config.value?.config ?? null),

    /** The cost the last dry run gave, `undefined` while none is shown. */
    migrationPreview: useContext<MigrationPreview | undefined>(
      state,
      "migration.preview"
    ),

    /** The invoice the last committed change of product raised; `null` before the first commit and after `openMigration`. */
    migrationResult: computed<MigrationResult | null>(
      () => contextValue<MigrationResult>(state, "migrationResult") ?? null
    ),

    /** The chosen product, `undefined` when none is chosen. */
    migrationTarget: useContext<MigrationTarget | undefined>(
      state,
      "migration.target"
    ),

    /** The products of the current page set, one row each. */
    migrationTargets: computed(() => holders.list.value?.data.value ?? []),

    /** How many products the platform counted; 0 until the count lands. */
    migrationsCount: computed(
      () => holders.count.value?.pagination.value.total ?? 0
    ),

    /** The raw wire record beside the view model. */
    rawContractProduct: useContext<IContractProduct | undefined>(
      state,
      "rawContractProduct"
    ),

    /** The product's scheduled actions, when the read carried them (AC15). */
    scheduledActions,

    /** Display title of the product. */
    title,

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")
  };
}

export type UseContractProductContext = ReturnType<
  typeof createContractProductContext
>;
