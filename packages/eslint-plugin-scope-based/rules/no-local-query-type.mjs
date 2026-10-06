/**
 * @fileoverview `scope-based/no-local-query-type` — use the query module's
 * types, never a local copy.
 *
 * Flags a type alias `type X = ReturnType<typeof fn>` where `fn` is a query or
 * mutation function (`useQuery`, `useMutation`, a name holding `Query` or
 * `Mutation`, or a `loadList`). Use `ListQuery` or `MutationResult` from the
 * query module. The query module itself is exempt.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-local-query-type
 */

import { isTestFile } from "../util.mjs";

const QUERY_FN = /(Query|Mutation)|^loadList$/;

/** The last name of `typeof a.b.c` / `typeof a`, or null. */
function queriedName(typeQuery) {
  const expr = typeQuery.exprName;
  if (expr.type === "Identifier") return expr.name;
  if (expr.type === "TSQualifiedName") return expr.right.name;
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a local ReturnType alias of a query function; use ListQuery or MutationResult."
    },
    schema: [],
    messages: {
      localQueryType:
        "Do not alias `ReturnType<typeof {{fn}}>`. Use `ListQuery` or `MutationResult` from the query module."
    }
  },

  create(context) {
    const filename = (context.filename ?? context.getFilename()).replace(
      /\\/g,
      "/"
    );
    if (isTestFile(filename) || /\/modules\/query\//.test(filename)) return {};

    return {
      TSTypeAliasDeclaration(node) {
        const ann = node.typeAnnotation;
        if (
          ann.type !== "TSTypeReference" ||
          ann.typeName.type !== "Identifier" ||
          ann.typeName.name !== "ReturnType"
        ) {
          return;
        }
        const arg = (ann.typeArguments ?? ann.typeParameters)?.params?.[0];
        if (arg?.type !== "TSTypeQuery") return;
        const fn = queriedName(arg);
        if (!fn || !QUERY_FN.test(fn)) return;
        context.report({
          node: node.id,
          messageId: "localQueryType",
          data: { fn }
        });
      }
    };
  }
};
