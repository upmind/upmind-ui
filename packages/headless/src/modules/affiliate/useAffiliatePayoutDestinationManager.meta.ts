import { computed } from "vue";
import {
  defaultPayoutDestination,
  isPaypalDestination
} from "./affiliate.utils";
import { contextValue, stateMatches } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type {
  AffiliatePayoutDestinationFormModel,
  AffiliatePayoutDestinationManagerContext
} from "./affiliate.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module affiliate/useAffiliatePayoutDestinationManager.meta
 * @description Manager meta — FLAT computeds (design.md §8.6, audit DI-5).
 */
export function createAffiliatePayoutDestinationManagerMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  const isAvailable = computed(() => stateMatches(state, "available"));

  const isLoading = computed(() =>
    stateMatches(state, ["subscribing", "loading"])
  );

  /** design.md §8.2 Failure surface, §8.6 — `hasError`, matching this
   * module's one other naming convention. `hasErrors`/`showErrors` are kept
   * as aliases — pre-existing external names. */
  const hasError = computed(
    () =>
      stateMatches(state, "available.error") ||
      !isEmpty(
        contextValue<AffiliatePayoutDestinationManagerContext["error"]>(
          state,
          "error"
        )
      )
  );

  const hasErrors = hasError;
  const showErrors = hasError;

  const isValid = computed(() => stateMatches(state, "available.valid"));

  const isDirty = computed(
    () =>
      !isEqual(
        contextValue<AffiliatePayoutDestinationFormModel | undefined>(
          state,
          "model"
        ),
        contextValue<AffiliatePayoutDestinationFormModel | undefined>(
          state,
          "baseModel"
        )
      )
  );

  const isProcessing = computed(() => stateMatches(state, "processing"));

  const isComplete = computed(() =>
    stateMatches(state, ["processed", "complete"])
  );

  /** True for the current model's PayPal destination (audit DI-5). */
  const isPaypal = computed(() =>
    isPaypalDestination(
      contextValue<AffiliatePayoutDestinationFormModel | undefined>(
        state,
        "model"
      )?.payoutDestinationId,
      contextValue<AffiliatePayoutDestinationManagerContext["destinations"]>(
        state,
        "destinations"
      )
    )
  );

  const defaultDestination = computed(() =>
    defaultPayoutDestination(
      contextValue<AffiliatePayoutDestinationManagerContext["destinations"]>(
        state,
        "destinations"
      )
    )
  );

  return {
    defaultDestination,
    hasError,
    hasErrors,
    isAvailable,
    isComplete,
    isDirty,
    isLoading,
    isPaypal,
    isProcessing,
    isValid,
    showErrors
  };
}

export type UseAffiliatePayoutDestinationManagerMeta = ReturnType<
  typeof createAffiliatePayoutDestinationManagerMeta
>;
