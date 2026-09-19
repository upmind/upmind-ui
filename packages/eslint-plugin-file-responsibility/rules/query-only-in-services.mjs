/**
 * @fileoverview `file-responsibility/query-only-in-services` — FE-3249 #1.
 *
 * A call to `useQuery(...)` or `useMutation(...)` is the module's HTTP seam. It
 * belongs in a services file (`*.services.ts`, or an actor arm
 * `*.services.<actor>.ts`) — never in a `.machine.ts`, `.utils.ts`,
 * `.types.ts`, or any other concern. The one carve-out is the `query` module
 * that DEFINES these helpers: any file under a `/query/` directory
 * (`modules/query/index.ts`, `modules/query/useQuery.ts`, `query/query.ts`).
 *
 * Grounding: the `packages/headless` module services files reach HTTP through
 * `useQuery` / `useMutation` imported from `../query`; the definitions live in
 * `packages/headless/src/modules/query/`.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/query-only-in-services
 */

import { isServicesFile } from "../util.mjs";

/** The two query-module entry points this rule pins to services files. */
const QUERY_ENTRIES = new Set(["useQuery", "useMutation"]);

/** True for a file inside the `modules/query/` module that defines these helpers. */
function isQueryModuleFile(filename) {
  return /\/modules\/query\//.test(filename);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Call `useQuery` / `useMutation` only in a services file; the query module defines them, a services file is the only other place that may call them (FE-3249 #1).",
      recommended: true
    },
    schema: [],
    messages: {
      queryOutsideServices:
        "Call `{{name}}` only in a services file (`*.services.ts`). This file is not a services file, so it must not open the HTTP seam. Move this call into the module's `.services.ts`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();

    // A services file is allowed; the query module that defines the helpers is
    // allowed. Nowhere else may call them.
    if (isServicesFile(filename) || isQueryModuleFile(filename)) return {};

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === "Identifier" && QUERY_ENTRIES.has(callee.name)) {
          context.report({
            node,
            messageId: "queryOutsideServices",
            data: { name: callee.name }
          });
        }
      }
    };
  }
};
