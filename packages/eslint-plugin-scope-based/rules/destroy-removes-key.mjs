/**
 * @fileoverview `scope-based/destroy-removes-key` — a non-singleton module's
 * `destroy` removes its registry entry.
 *
 * In a shared actions file (`use<Module>.actions.ts`), a `destroy` function
 * marks the module as a non-singleton. Then:
 *  - the actions factory takes a `scopeKey` parameter;
 *  - `destroy` calls the registry remove with `scopeKey`
 *    (`remove(scopeKey)` or any call that passes `scopeKey`).
 *
 * The judgment half (does the module need `destroy` at all) is a review
 * catch.
 *
 * @module packages/eslint-plugin-scope-based/rules/destroy-removes-key
 */

import {
  composableFile,
  enclosingFunction,
  isFunctionNode,
  isTestFile,
  propertyKeyName
} from "../util.mjs";

/** True when the function body has a call that passes the identifier `scopeKey`. */
function passesScopeKey(fn) {
  let found = false;
  (function walk(node) {
    if (found || node === null || typeof node !== "object") return;
    if (
      node.type === "CallExpression" &&
      node.arguments.some(a => a.type === "Identifier" && a.name === "scopeKey")
    ) {
      found = true;
      return;
    }
    for (const key of Object.keys(node)) {
      if (key === "parent") continue;
      const value = node[key];
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value.type === "string") walk(value);
    }
  })(fn.body);
  return found;
}

/** True when the factory declares a `scopeKey` parameter. */
function hasScopeKeyParam(factory) {
  return factory.params.some(p => {
    const inner = p.type === "AssignmentPattern" ? p.left : p;
    return inner.type === "Identifier" && inner.name === "scopeKey";
  });
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a destroy function to remove the registry entry with scopeKey, and the actions factory to take scopeKey."
    },
    schema: [],
    messages: {
      noRemove:
        "`destroy` must remove the registry entry: call the registry `remove(scopeKey)`.",
      noScopeKey:
        "The actions factory that defines `destroy` must take `scopeKey` so `destroy` can clean up the registry."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const info = composableFile(filename);
    if (isTestFile(filename) || !info) return {};
    if (info.layer !== "actions" || info.actor !== null) return {};

    function check(fn) {
      if (!isFunctionNode(fn)) return;
      if (!passesScopeKey(fn)) {
        context.report({ node: fn, messageId: "noRemove" });
      }
      const factory = enclosingFunction(fn);
      if (factory && !hasScopeKeyParam(factory)) {
        context.report({ node: factory, messageId: "noScopeKey" });
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id?.name === "destroy") check(node);
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && node.id.name === "destroy") {
          check(node.init);
        }
      },
      Property(node) {
        if (propertyKeyName(node) === "destroy" && !node.shorthand) {
          check(node.value);
        }
      }
    };
  }
};
