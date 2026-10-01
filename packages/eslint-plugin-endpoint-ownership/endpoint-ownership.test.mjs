/**
 * @fileoverview RuleTester specs for the `endpoint-ownership` plugin.
 *
 * The rule pins brand-owned and system-owned endpoints to the brand/system
 * modules that load them; every other module must read them through
 * useBrand()/useSystem() rather than re-requesting the URL. session-transfer is
 * the one exception, and only for brand/settings.
 *
 * Both directions are covered per discriminator — the request sink (useUrl,
 * a url: property, fetch), the owner boundary (inside vs outside brand/system),
 * the endpoint class (brand, system, unrelated), the leading /api prefix, the
 * template-literal form, and the session-transfer carve-out (brand/settings
 * only, currencies still denied).
 *
 * Run: node --test packages/eslint-plugin-endpoint-ownership/endpoint-ownership.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import ownedEndpointBoundary from "./rules/owned-endpoint-boundary.mjs";
import noDirectTanstackQuery from "./rules/no-direct-tanstack-query.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const MOD = "/repo/packages/headless/src/modules";
const BRAND = `${MOD}/brand/brand.services.ts`;
const SYSTEM = `${MOD}/system/system.services.ts`;
const SESSION_TRANSFER = `${MOD}/session-transfer/session-transfer.services.ts`;
const OTHER = `${MOD}/orders/useOrders.ts`;
const QUERY = `${MOD}/query/useQuery.ts`;

test("owned-endpoint-boundary", () => {
  ruleTester.run("owned-endpoint-boundary", ownedEndpointBoundary, {
    valid: [
      { code: `useUrl("brand/settings");`, filename: BRAND },
      { code: `useUrl("config/brand/values");`, filename: BRAND },
      { code: `useUrl("currencies");`, filename: SYSTEM },
      { code: `fetch("countries/1/regions");`, filename: SYSTEM },
      { code: `useUrl("brand/settings");`, filename: SESSION_TRANSFER },
      { code: `useUrl("clients/1");`, filename: OTHER }
    ],
    invalid: [
      { code: `useUrl("config/brand/values");`, filename: OTHER, errors: 1 },
      { code: `const opts = { url: "/api/currencies" };`, filename: OTHER, errors: 1 },
      { code: "useUrl(`countries/${id}/regions`);", filename: OTHER, errors: 1 },
      { code: `fetch("statuses");`, filename: OTHER, errors: 1 },
      { code: `useUrl("currencies");`, filename: SESSION_TRANSFER, errors: 1 }
    ]
  });
});

test("no-direct-tanstack-query", () => {
  ruleTester.run("no-direct-tanstack-query", noDirectTanstackQuery, {
    valid: [
      { code: `import { useQuery } from "@tanstack/vue-query";`, filename: QUERY },
      { code: `import type { QueryKey } from "@tanstack/vue-query";`, filename: OTHER },
      { code: `import { type UseQueryReturnType } from "@tanstack/vue-query";`, filename: OTHER },
      { code: `import { useQuery } from "@tanstack/react-query";`, filename: OTHER },
      { code: `import { skipToken } from "@tanstack/vue-query";`, filename: OTHER },
      { code: `import { useQuery } from "../query";`, filename: OTHER }
    ],
    invalid: [
      { code: `import { useQuery } from "@tanstack/vue-query";`, filename: OTHER, errors: 1 },
      { code: `import { useQuery as vueUseQuery } from "@tanstack/vue-query";`, filename: OTHER, errors: 1 },
      { code: `import { queryOptions } from "@tanstack/query-core";`, filename: OTHER, errors: 1 },
      { code: `import { QueryClient } from "@tanstack/vue-query";`, filename: OTHER, errors: 1 },
      { code: `import { useMutation, useQueryClient } from "@tanstack/vue-query";`, filename: OTHER, errors: 2 },
      { code: `import { type QueryKey, useQuery } from "@tanstack/vue-query";`, filename: OTHER, errors: 1 },
      { code: `import { useQueries } from "@tanstack/vue-query";`, filename: OTHER, errors: 1 },
      { code: `import { useInfiniteQuery } from "@tanstack/vue-query";`, filename: OTHER, errors: 1 }
    ]
  });
});
