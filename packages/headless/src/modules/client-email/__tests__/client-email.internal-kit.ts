// -----------------------------------------------------------------------------
/**
 * @module client-email/__tests__/client-email.internal-kit
 * @description The module's `@internal` surface, re-exported for the test lanes
 * of OTHER packages. `client-email.schemas.ts` is `@internal` and the actions
 * source is not a published artefact at all, so a cross-package spec reaching
 * either by a relative path walks through the package boundary the Module
 * Visibility Law draws — a breach the "zero deep subpath imports" grep cannot
 * see, because it matches specifiers rather than resolved paths.
 *
 * Cross-package specs reach this file by the package's own
 * `@upmind-automation/headless/testing/client-email/internal-kit` subpath
 * export — a real entry in `package.json`, never re-exported from the main
 * barrel, so the test-only surface stays out of the production export graph.
 */

import { join } from "node:path";

export { useQuerySchema, useQueryUischema } from "../client-email.schemas";

/** Read by the playground coverage gate, which parses its `@scenario` tags. */
export const CLIENT_EMAILS_ACTIONS_SOURCE = join(
  import.meta.dirname,
  "../useClientEmails.actions.ts"
);
