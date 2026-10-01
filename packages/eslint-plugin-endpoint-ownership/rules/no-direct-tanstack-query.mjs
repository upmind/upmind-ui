/**
 * @fileoverview `endpoint-ownership/no-direct-tanstack-query`.
 *
 * Code must reach TanStack Query only through the internal `useQuery` wrapper in
 * `packages/headless/src/modules/query`. A value import of a TanStack Query
 * entry point — `useQuery`, `useQueries`, `useInfiniteQuery`, `useMutation`,
 * `useQueryClient`, `QueryClient`, `queryOptions` — from `@tanstack/vue-query`
 * or `@tanstack/query-core` forks that boundary. This rule reports such an
 * import (under any local alias) from any file outside the query module.
 *
 * Type-only imports stay allowed: a whole-declaration `import type { … }` and a
 * per-specifier `import { type X }` carry no runtime binding, so they cannot
 * bypass the wrapper.
 *
 * @module packages/eslint-plugin-endpoint-ownership/rules/no-direct-tanstack-query
 */

const FORBIDDEN_SOURCES = new Set(["@tanstack/vue-query", "@tanstack/query-core"]);

const FORBIDDEN_SPECIFIERS = new Set([
  "useQuery",
  "useQueries",
  "useInfiniteQuery",
  "useMutation",
  "useQueryClient",
  "QueryClient",
  "queryOptions"
]);

const QUERY_MODULE_DIR = /\/packages\/headless\/src\/modules\/query\//;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid a value import of a TanStack Query entry point outside packages/headless/src/modules/query; use the internal useQuery wrapper instead.",
      recommended: true
    },
    schema: [],
    messages: {
      directImport:
        "`{{name}}` from `{{source}}` bypasses the internal useQuery wrapper. Import it from `packages/headless/src/modules/query` instead."
    }
  },

  create(context) {
    if (QUERY_MODULE_DIR.test(context.filename)) return {};

    return {
      ImportDeclaration(node) {
        if (!FORBIDDEN_SOURCES.has(node.source.value)) return;
        if (node.importKind === "type") return;

        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          if (specifier.importKind === "type") continue;
          if (specifier.imported.type !== "Identifier") continue;
          if (!FORBIDDEN_SPECIFIERS.has(specifier.imported.name)) continue;
          context.report({
            node: specifier,
            messageId: "directImport",
            data: { name: specifier.imported.name, source: node.source.value }
          });
        }
      }
    };
  }
};
