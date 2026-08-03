// -----------------------------------------------------------------------------
/**
 * @module tests/journeys/scenario-harness/manifest
 * @description Upmind's own composable-key manifest — the interim home for
 * item 4's registry-generic scenario-harness (`packages/scenario-harness`
 * ships no manifest of its own). This is the ONLY key list for this
 * consumer: `./registry.ts` and every executor's own factory registry bind
 * against `ComposableKey` derived here, so renaming or removing a key fails
 * compilation at every binding site. FE-2977 re-homes this module when the
 * app itself starts consuming the harness (recorded in the FE-2968 handoff
 * README).
 */

export const COMPOSABLE_KEY = {
  AUTH: "auth"
} as const;

export type ComposableKey =
  (typeof COMPOSABLE_KEY)[keyof typeof COMPOSABLE_KEY];
