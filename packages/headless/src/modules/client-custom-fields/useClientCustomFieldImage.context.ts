import { computed } from "vue";
import type { ClientCustomFieldImageServices } from "./client-custom-fields.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFieldImage.context
 * @description Per-field IMAGE context — the current value, its resolved
 * hash, download URL and preview source (AC-20), and the scope's captured
 * error, rewritten onto this field's own code (AC-19).
 *
 * ERRORS ARE STATE, NOT EVENTS — `errors` is read, never raised.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createClientCustomFieldImageContext(
  _actorScope: ScopeActorTypes,
  service: ClientCustomFieldImageServices
) {
  // --- actor-specific context: none earned yet (clause 2).

  return {
    /** The download URL for this field's stored image, once resolved. */
    downloadUrl: service.uploader.src,

    /** The resolved hash for this field's stored image. */
    hash: service.uploader.file,

    /** The preview source for this field's stored image. */
    preview: service.uploader.src,

    /** The raw current value — an alias of {@link hash} for API parity. */
    value: service.uploader.file,

    /**
     * The scope's captured error's DATA, code-keyed (AC-19) — read, never
     * raised. `service.error` itself stays the full `ResponseError` (status,
     * message, origin included) for a caller that needs those; this is the
     * display-ready, field-scoped projection of it.
     */
    errors: computed(() => service.error.value?.data)

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseClientCustomFieldImageContext = ReturnType<
  typeof createClientCustomFieldImageContext
>;
