// -----------------------------------------------------------------------------
/**
 * @module client-notifications/__tests__/client-notifications.internal-kit
 * @description The module's `@internal` surface, re-exported for the test lanes
 * of OTHER packages. `client-notifications.schemas.ts` and
 * `client-notifications.mappers.ts` are `@internal` — never exported off the
 * package's main barrel (`client-notifications.surface.test.ts`'s curated-exports
 * assertion) — so a cross-package spec reaching either by a relative path walks
 * through the package boundary the Module Visibility Law draws.
 *
 * Cross-package specs reach this file as `internalKits["client-notifications"]`
 * on the package's ONE `@upmind-automation/headless/testing` entry — never from
 * the main barrel, and never by a per-module subpath, which the package does not
 * publish. `useSchema`/`useUischema`/`toPreferencesModel` are this module's own
 * addition beside the query-criteria pair every kit carries — the LIVE functions
 * a mount test drives the manager's real, derived form pair through
 * (`design.md` §D13, AC-14).
 */

export {
  useQuerySchema,
  useQueryUischema,
  useSortUischema,
  useSchema,
  useUischema
} from "../client-notifications.schemas";

export { toPreferencesModel } from "../client-notifications.mappers";
