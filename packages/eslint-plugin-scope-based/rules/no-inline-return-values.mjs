/**
 * @fileoverview `scope-based/no-inline-return-values` — define a value above
 * the return, never inside it.
 *
 * In a `use*.ts` file, flag a member of a factory's returned object whose value
 * is a `computed(...)` call or a function written inline (an arrow, a function
 * expression, or a method). The four lazy layer members of a scope factory
 * (`useActions`, `useContext`, `useInternals`, `useMeta`) are exempt.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-inline-return-values
 */

import {
  composableFile,
  isFunctionNode,
  isTestFile,
  onReturnedObjects,
  propertyKeyName
} from "../util.mjs";

const SCOPE_LAYER_MEMBERS = new Set([
  "useActions",
  "useContext",
  "useInternals",
  "useMeta"
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow an inline computed or function in a composable's return object."
    },
    schema: [],
    messages: {
      inlineValue:
        "Define `{{name}}` above the return and return it by name. A return object lists members; it holds no logic."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename) || !composableFile(filename)) return {};

    return onReturnedObjects(objectNode => {
      for (const prop of objectNode.properties) {
        if (prop.type !== "Property") continue;
        const name = propertyKeyName(prop) ?? "this member";
        if (SCOPE_LAYER_MEMBERS.has(name)) continue;
        const value = prop.value;
        const isInlineComputed =
          value.type === "CallExpression" &&
          value.callee.type === "Identifier" &&
          value.callee.name === "computed";
        if (prop.method || isFunctionNode(value) || isInlineComputed) {
          context.report({
            node: prop,
            messageId: "inlineValue",
            data: { name }
          });
        }
      }
    });
  }
};
