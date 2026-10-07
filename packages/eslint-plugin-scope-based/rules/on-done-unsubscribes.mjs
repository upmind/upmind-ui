/**
 * @fileoverview `scope-based/on-done-unsubscribes` — `onDone` cleans up after
 * itself.
 *
 * An `onDone` member registers its unsubscribe with `onScopeDispose` or
 * `onUnmounted`. In a `use*.ts` file, an `onDone` function (a declaration, a
 * `const`, or an inline property value) must call one of those. An `onDone`
 * that is only a reference to a function this file does not define is not
 * checked.
 *
 * @module packages/eslint-plugin-scope-based/rules/on-done-unsubscribes
 */

import {
  composableFile,
  isFunctionNode,
  isTestFile,
  propertyKeyName
} from "../util.mjs";

const DISPOSERS = new Set([
  "onScopeDispose",
  "onUnmounted",
  "tryOnScopeDispose"
]);

/** True when the function body calls a disposer (nested functions included). */
function registersDisposer(fn) {
  let found = false;
  (function walk(node) {
    if (found || node === null || typeof node !== "object") return;
    if (
      node.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      DISPOSERS.has(node.callee.name)
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

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require an `onDone` function to register its unsubscribe with onScopeDispose or onUnmounted."
    },
    schema: [],
    messages: {
      noUnsubscribe:
        "`onDone` must register its unsubscribe with `onScopeDispose` or `onUnmounted`, so a listener never outlives its owner."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename) || !composableFile(filename)) return {};

    function check(fn) {
      if (!isFunctionNode(fn)) return;
      if (!registersDisposer(fn)) {
        context.report({ node: fn, messageId: "noUnsubscribe" });
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id?.name === "onDone") check(node);
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && node.id.name === "onDone") {
          check(node.init);
        }
      },
      Property(node) {
        if (propertyKeyName(node) === "onDone" && !node.shorthand) {
          check(node.value);
        }
      }
    };
  }
};
