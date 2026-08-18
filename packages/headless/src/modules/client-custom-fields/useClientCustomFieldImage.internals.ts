import type { ClientCustomFieldImageServices } from "./client-custom-fields.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFieldImage.internals
 * @description Per-field IMAGE internals (debugging) — the raw
 * `system-upload` handle backing this field.
 * @doctrine clause 1 (uniform four-layer default).
 */
export function createClientCustomFieldImageInternals(
  actorScope: ScopeActorTypes,
  service: ClientCustomFieldImageServices
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** The raw `system-upload` handle backing this field. */
    uploader: service.uploader
  };
}

// Type export for consumers
export type UseClientCustomFieldImageInternals = ReturnType<
  typeof createClientCustomFieldImageInternals
>;
