/**
 * @fileoverview `xstate/typed-context` — a machine declares its context type.
 *
 * A `createMachine` config that has a `context` property must type it:
 * `context: {} as T`, `schema: { context: ... }`, `tsTypes`, or v5 `types`.
 * An untyped literal or identifier context fails.
 *
 * Valid:   `createMachine({ context: {} as ProductContext })`
 * Invalid: `createMachine({ context: { count: 0 } })`
 *
 * @module packages/eslint-plugin-xstate/rules/typed-context
 */

import { findProperty, importsXstate, isCreateMachineCall } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a machine config to declare its context type (as T, schema.context, tsTypes or types)."
    },
    schema: [],
    messages: {
      untypedContext:
        "Type the machine context explicitly: `context: {} as MyContext`, or declare `schema.context`, `tsTypes` or `types`."
    }
  },

  create(context) {
    if (!importsXstate(context.sourceCode.ast)) return {};
    return {
      CallExpression(node) {
        if (!isCreateMachineCall(node)) return;
        const config = node.arguments[0];
        if (!config || config.type !== "ObjectExpression") return;
        const contextProperty = findProperty(config, "context");
        if (!contextProperty) return;
        if (findProperty(config, "tsTypes") || findProperty(config, "types")) {
          return;
        }
        const schema = findProperty(config, "schema");
        if (schema && findProperty(schema.value, "context")) return;
        const value = contextProperty.value;
        if (value.type === "TSAsExpression") return;
        context.report({ node: contextProperty, messageId: "untypedContext" });
      }
    };
  }
};
