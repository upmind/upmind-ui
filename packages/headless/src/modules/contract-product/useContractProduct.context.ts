import { computed } from "vue";
import { minFutureCancellationDate as resolveMinFutureCancellationDate } from "./contract-product.utils";
import { contextValue, useContext } from "../../utils";
import type {
  ContractProduct,
  ContractProductContext,
  ContractProductContextMembers,
  ContractProductForm,
  MigrationHolders,
  MigrationPreview,
  MigrationResult,
  MigrationTarget
} from "./contract-product.types";
import type { ResponseError, UseActor } from "../../utils";
import type { Invoice } from "../invoices";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ErrorObject } from "ajv";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProduct.context
 * @description Manager context: the reactive read side of the machine
 * context. `scheduledActions` and `minFutureCancellationDate` are derived off
 * the view model. Each open write form is read off its own slot, which the
 * machine sets on that form's open transition. Errors are state, not events.
 */
export function createContractProductContext(
  _actorScope: ScopeActorTypes,
  actor: UseActor,
  holders: MigrationHolders
): ContractProductContextMembers {
  const { state } = actor;

  const contractProduct = useContext<ContractProduct>(state, "contractProduct");
  const allowedMigrations = computed(
    () => contractProduct.value?.allowedMigrations ?? []
  );
  const scheduledActions = computed(
    () => contractProduct.value?.scheduledActions ?? []
  );
  const minFutureCancellationDate = computed(() =>
    contractProduct.value
      ? resolveMinFutureCancellationDate(contractProduct.value)
      : null
  );
  const description = computed(() => contractProduct.value?.description);
  const title = computed(() => contractProduct.value?.title);
  const migrationConfig = computed(() => holders.config.value?.config ?? null);
  const migrationResult = computed(
    () => contextValue<MigrationResult>(state, "migrationResult") ?? null
  );
  const migrationTargets = computed(() => holders.list.value?.data.value ?? []);
  const migrationsCount = computed(
    () => holders.count.value?.pagination.value.total ?? 0
  );

  return {
    /** The products the current product allows a migration to. */
    allowedMigrations,

    /** The open billing-entity form: `schema`, `uischema` and the parsed `model`. Its one property lists the client's addresses and companies, and opens on the entity the contract bills to now. */
    billingEntity: useContext<ContractProductForm | undefined>(
      state,
      "billingEntity"
    ),

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

    /** Description of the product. */
    description,

    /** Machine-captured error, if any — read, never raised. */
    error: useContext<ResponseError | undefined>(state, "error"),

    /** Machine-captured error message, if any — read, never raised. */
    errors: useContext<ResponseError["message"]>(state, "error.message"),

    /** The product this manager acts on. */
    id: useContext<string | undefined>(state, "contractProductId"),

    /**
     * The result of the last next-invoice or end-of-trial write: `undefined`
     * when none settled, `null` when the write raised no invoice. It survives
     * `REFRESH` and later writes of other kinds, so it is not the current state
     * of the product.
     */
    issuedInvoice: useContext<Invoice | null | undefined>(
      state,
      "issuedInvoice"
    ),

    /** The configurator of the chosen product, `null` when no product is chosen. It gives no provision field and no trial choice. */
    migrationConfig,

    /** The cost the last dry run gave, `undefined` while none is shown. */
    migrationPreview: useContext<MigrationPreview | undefined>(
      state,
      "migration.preview"
    ),

    /** The invoice the last committed migration raised; `null` before the first commit and after `openMigration`. */
    migrationResult,

    /** How many products the platform counted; 0 until the count lands. */
    migrationsCount,

    /** The chosen product, `undefined` when none is chosen. */
    migrationTarget: useContext<MigrationTarget | undefined>(
      state,
      "migration.target"
    ),

    /** The products of the current page set, one row each. */
    migrationTargets,

    /** The earliest selectable future-cancellation date, as a wire date string. */
    minFutureCancellationDate,

    /** The product's scheduled actions, when the read carried them. */
    scheduledActions,

    /** Display title of the product: "Starter Hosting (testdomain.com)". */
    title,

    /** Field-level validation errors (AJV `ErrorObject[]`) — read, never raised. */
    validationErrors: useContext<ErrorObject[]>(state, "error.data")
  };
}

export type UseContractProductContext = ReturnType<
  typeof createContractProductContext
>;
