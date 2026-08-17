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
 * Cross-package specs reach this file as `internalKits["client-email"]` on the
 * package's ONE `@upmind-automation/headless/testing` entry — never from the
 * main barrel, so the test-only surface stays out of the production export
 * graph, and never by a per-module subpath, which the package does not publish.
 */

export { useQuerySchema, useQueryUischema } from "../client-email.schemas";

/**
 * Read by the playground coverage gate, which parses its `@scenario` tags. Joined
 * off `import.meta.dirname` by template literal rather than `node:path`, because
 * the entry publishing this kit is also reached from a browser graph, where a node
 * builtin throws on first use. Not `import.meta.url` — through a Vite graph that
 * is a SERVED url, whose `.pathname` is an unreadable `/@fs/...` prefix.
 */
export const CLIENT_EMAILS_ACTIONS_SOURCE = `${import.meta.dirname}/../useClientEmails.actions.ts`;
