// -----------------------------------------------------------------------------
/**
 * @module client-email-history/__tests__/client-email-history.internal-kit
 * @description The module's `@internal` surface, re-exported for the test lanes
 * of OTHER packages. `client-email-history.schemas.ts` is `@internal`, so a
 * cross-package spec reaching it by a relative path walks through the package
 * boundary the Module Visibility Law draws — a breach the "zero deep subpath
 * imports" grep cannot see, because it matches specifiers rather than resolved
 * paths.
 *
 * Cross-package specs reach this file as `internalKits["client-email-history"]`
 * on the package's ONE `@upmind-automation/headless/testing` entry — never from
 * the main barrel, so the test-only surface stays out of the production export
 * graph, and never by a per-module subpath, which the package does not publish.
 */

export {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "../client-email-history.schemas";
