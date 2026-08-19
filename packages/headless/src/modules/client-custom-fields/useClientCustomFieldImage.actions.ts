import { remove as removeFromRegistry } from "../scope";
import type { ClientCustomFieldImageServices } from "./client-custom-fields.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFieldImage.actions
 * @description Per-field IMAGE actions — upload, remove, the aggregate-save
 * counterpart `flush`, readiness and lifecycle.
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `.actions.{actor}.ts` file exists.
 */
export function createClientCustomFieldImageActions(
  _actorScope: ScopeActorTypes,
  service: ClientCustomFieldImageServices,
  scopeKey: string
) {
  /**
   * Resolves once the field identity has settled — bounded, and settles on
   * an unaddressable scope rather than hanging (mirrors the collection's own
   * AC-6 shape for this half).
   */
  async function isReady(): Promise<boolean> {
    if (!service.isAvailable.value) return false;
    return true;
  }

  /**
   * Destroys this scoped instance — removes it from the registry AND stops
   * the underlying `system-upload` interpreter.
   */
  function destroy(): void {
    service.uploader.stop();
    removeFromRegistry(scopeKey);
  }

  // --- actor-specific actions: none earned yet (clause 2).

  return {
    /** Destroys this scoped instance and stops its upload interpreter. */
    destroy,

    /**
     * Settles `value` for this field: uploads it if pending, loads it for
     * preview/download if already a stored hash (seam consumer of A-11).
     */
    flush: service.flush,

    /** Resolves true when this field's identity can be addressed. */
    isReady,

    /** Clears this field's stored value. */
    remove: service.remove,

    /** Uploads a new file for this field, returning the resulting hash. */
    upload: service.upload

    // The arm merges in HERE, last.
    // ...actorActions
  };
}

// Type export for consumers
export type UseClientCustomFieldImageActions = ReturnType<
  typeof createClientCustomFieldImageActions
>;
