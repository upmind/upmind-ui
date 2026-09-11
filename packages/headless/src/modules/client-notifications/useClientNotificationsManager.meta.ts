// -----------------------------------------------------------------------------
/**
 * @module client-notifications/useClientNotificationsManager.meta
 * @description Manager meta factory — computed state flags, one computed per
 * flag, reading the machine through the canonical state utilities only
 * (`code-xstate.md`).
 * @doctrine §D10 — armless (no `.meta.{actor}.ts` sibling).
 */

import { computed } from "vue";
import { contextValue, stateMatches } from "../../utils";
import { isEqual } from "lodash-es";
import type { NotificationsModel } from "./client-notifications.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------

export function createClientNotificationsManagerMeta(
  _actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  /** True once the form is available for input. */
  const isAvailable = computed(() => stateMatches(state, "available"));

  /**
   * True while waiting for a client id or a link token to become
   * addressable, or resolving `lookups`. `subscribing` is included
   * deliberately: a manager whose `hasSubscription` guard has not passed yet
   * is loading, not broken (AC-8's guard scenario).
   */
  const isLoading = computed(() =>
    stateMatches(state, ["subscribing", "loading"])
  );

  /**
   * True if the machine captured a save failure (defect F3, AC-7), the draft
   * fails validation, or the module is unreachable — `available.error`,
   * `available.invalid` AND `unavailable` all read as an error (drift D22,
   * AC-17): a manager blind to `invalid`/`unavailable` reports no-error while
   * genuinely broken.
   */
  const hasError = computed(() =>
    stateMatches(state, ["available.error", "available.invalid", "unavailable"])
  );

  /** True if the current draft passes schema validation. */
  const isValid = computed(() => stateMatches(state, "available.valid"));

  /**
   * True if the draft differs from its persisted baseline — the SAME
   * comparison `useClientNotificationsManager.actions.ts`'s `update()` uses to
   * refuse a pointless save (AC-5), so the flag and the gate cannot drift.
   */
  const isDirty = computed(
    () =>
      !isEqual(
        contextValue<NotificationsModel>(state, "model"),
        contextValue<NotificationsModel>(state, "baseModel")
      )
  );

  /** True while a save is being processed (AC-3). */
  const isProcessing = computed(() => stateMatches(state, "processing"));

  /** True once the current save has settled. */
  const isComplete = computed(() =>
    stateMatches(state, ["processed", "complete"])
  );

  // --- actor-specific meta: none earned (§D10 — meta: none).

  return {
    /** True if the machine captured a save failure. */
    hasError,

    /** True once the form is available for input. */
    isAvailable,

    /** True once the current save has settled. */
    isComplete,

    /** True if the draft differs from its persisted baseline. */
    isDirty,

    /** True while subscribing, loading, or resolving lookups. */
    isLoading,

    /** True while a save is being processed. */
    isProcessing,

    /** True if the current draft passes schema validation. */
    isValid

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseClientNotificationsManagerMeta = ReturnType<
  typeof createClientNotificationsManagerMeta
>;
