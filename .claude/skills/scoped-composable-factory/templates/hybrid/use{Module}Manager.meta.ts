// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part A "Meta Properties Pattern"
 * (one computed per flag, `is`/`has`/`can` prefixed) + Part B "Four-Layer
 * Return Shape" (Meta row). A disagreement between this skeleton, its worked
 * example, and the doctrine is a surfaced finding, never silently resolved
 * toward either.
 *
 * @surfaced-finding both manager precedents — the recovered
 * `client-email/useClientEmailManager.meta.ts` and the live `client-phone`
 * manager — return ONE `meta` computed holding an object of flags. That is the
 * legacy single-`meta`-object form `code-composables.companion.md` says to
 * leave where it works and NOT add to new code. This skeleton therefore emits
 * FLAT computeds, matching the collection half (`useModules.meta.ts`) and Part
 * A. A consumer porting off a legacy manager reads `manager.useMeta().isValid`
 * where it used to read `manager.meta.value.isValid` — call that out in the
 * module's own docs; do not reintroduce the object to spare the rename.
 */

import { computed } from "vue";
import { contextValue, stateMatches, stateValue } from "../../utils";
import { isEmpty, isEqual } from "lodash-es";
import type { ModuleContext } from "./module.types";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModuleManager.meta
 * @description Manager meta factory — computed state flags, one computed per
 * flag. Reads the machine through the canonical state utilities only
 * (`code-xstate.md`).
 * @doctrine clause 2 — shared-only (armless).
 */
export function createModuleManagerMeta(
  actorScope: ScopeActorTypes,
  actor: UseActor
) {
  const { state } = actor;

  /** True once the form is available for input. */
  const isAvailable = computed(() => stateMatches(state, "available"));

  /**
   * True while the machine is waiting for its client id or resolving lookups.
   * `subscribing` is included deliberately: a manager whose `hasSubscription`
   * guard has not passed yet is loading, not broken.
   */
  const isLoading = computed(() =>
    stateMatches(state, ["subscribing", "loading"])
  );

  /**
   * True if the machine captured an error. Named `hasError` (singular) to match
   * the collection half and the `has` prefix rule — the recovered manager's
   * `hasErrors` is the legacy spelling.
   */
  const hasError = computed(
    () =>
      stateMatches(state, "available.error") ||
      !isEmpty(contextValue<ModuleContext["error"]>(state, "error"))
  );

  /** True if the current model passes schema validation. */
  const isValid = computed(() => stateMatches(state, "available.valid"));

  /** True if the model differs from its persisted baseline. */
  const isDirty = computed(
    () =>
      !isEqual(
        contextValue<ModuleContext["model"]>(state, "model"),
        contextValue<ModuleContext["baseModel"]>(state, "baseModel")
      )
  );

  /**
   * True if the item is new (never saved). Reads the context `id` the machine's
   * own `isNew` guard reads (`({ id }) => !id`) — NOT a `stateMatches` call
   * against a context path, which is what the recovered manager did and which
   * can only ever return false.
   */
  const isNew = computed(() => !contextValue<ModuleContext["id"]>(state, "id"));

  /** True while a save is being processed. */
  const isProcessing = computed(() => stateMatches(state, "processing"));

  /** True once the item has been saved. */
  const isComplete = computed(
    () =>
      stateValue<boolean>(state, "done", false) === true ||
      stateMatches(state, ["processed", "complete"])
  );

  // --- actor-specific meta: none earned yet (clause 2). When a scope earns one,
  // add `useModuleManager.meta.{actor}.ts` following the collection half's arm
  // template and spread it LAST.

  return {
    /** True if the machine captured an error. */
    hasError,

    /** True once the form is available for input. */
    isAvailable,

    /** True once the item has been saved. */
    isComplete,

    /** True if the model differs from its persisted baseline. */
    isDirty,

    /** True while subscribing or loading. */
    isLoading,

    /** True if the item is new (never saved). */
    isNew,

    /** True while a save is being processed. */
    isProcessing,

    /** True if the current model passes schema validation. */
    isValid

    // The arm merges in HERE, last.
    // ...actorMeta
  };
}

// Type export for consumers
export type UseModuleManagerMeta = ReturnType<typeof createModuleManagerMeta>;
