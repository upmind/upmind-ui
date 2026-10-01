/**
 * @fileoverview `endpoint-ownership` — an ESLint plugin pinning brand-owned and
 * system-owned endpoints to the modules that own them. Brand endpoints
 * (`brand/settings`, `config/brand/values`, `org/modules`,
 * `config/organisation/values`) and system endpoints (`currencies`,
 * `billing_cycles`, `countries`, `languages`, `statuses`, `tickets/departments`)
 * are loaded once at start-up by `brand` / `system`; every other module reads
 * them through `useBrand()` / `useSystem()`, never by re-requesting the URL.
 *
 *   owned-endpoint-boundary — a request literal to an owned endpoint outside the
 *                             owning module is an error.
 *   no-direct-tanstack-query — a value import of a TanStack Query entry point
 *                             outside the query module is an error; reach it
 *                             through the internal useQuery wrapper.
 *
 * @module packages/eslint-plugin-endpoint-ownership
 */

import noDirectTanstackQuery from "./rules/no-direct-tanstack-query.mjs";
import ownedEndpointBoundary from "./rules/owned-endpoint-boundary.mjs";

const plugin = {
  meta: { name: "endpoint-ownership", version: "1.0.0" },
  rules: {
    "no-direct-tanstack-query": noDirectTanstackQuery,
    "owned-endpoint-boundary": ownedEndpointBoundary
  }
};

export default plugin;
