import { computed } from "vue";
import { minFutureCancellationDate as resolveMinFutureCancellationDate } from "./contract-product.utils";
import { useContext } from "../../utils";
import type {
  ContractProduct,
  ContractProductContext,
  ScheduledAction,
  ContractProductForm
} from "./contract-product.types";
import type { ResponseError, UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { IContractProduct } from "@upmind-automation/types";
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
  actor: UseActor
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

  return {
    /** The full machine context object. */
    context: useContext<ContractProductContext>(state),

    /** The contract the product belongs to. */
    contractId: useContext<string | undefined>(state, "contractId"),

    /** The mapped contract product. */
    contractProduct,

    /** The product this manager acts on. */
    contractProductId: useContext<string | undefined>(
      state,
      "contractProductId"
    ),

    /** Machine-captured error, if any — read, never raised. */
    error: useContext<ResponseError | undefined>(state, "error"),

    /** The earliest selectable future-cancellation date, as a wire date string. */
    minFutureCancellationDate,

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

    /** The raw wire record beside the view model. */
    rawContractProduct: useContext<IContractProduct | undefined>(
      state,
      "rawContractProduct"
    ),

    /** The product's scheduled actions, when the read carried them (AC15). */
    scheduledActions
  };
}

export type UseContractProductContext = ReturnType<
  typeof createContractProductContext
>;
