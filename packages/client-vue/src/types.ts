// -----------------------------------------------------------------------------
/**
 * @module client-vue/types
 * @description Shared types for the client-vue package.
 */

/**
 * `StorefrontRoute` sank to `@upmind-automation/foundation` in the ADR 023 cut
 * (≥2 domain packages read it, it knows none of them). Re-exported so every
 * existing consumer keeps its import.
 */
export type { StorefrontRoute } from "@upmind-automation/foundation";
