/**
 * @fileoverview `xstate/guard-prefix` — a guard name reads as a yes/no question.
 *
 * A key of the `guards` object in machine options (`createMachine(config,
 * { guards })`) or in `setup({ guards })` must start with a prefix from the
 * lint config, followed by an upper-case letter. Default prefixes: `is`,
 * `has`, `can`. A new prefix is a reviewed one-line config change.
 *
 * Valid:   `createMachine({}, { guards: { isReady: () => true } })`
 * Invalid: `createMachine({}, { guards: { continueEditing: () => true } })`
 *
 * @module packages/eslint-plugin-xstate/rules/guard-prefix
 */

import {
  calleeName,
  findProperty,
  importsXstate,
  propertyName
} from "../util.mjs";

const DEFAULT_PREFIXES = ["is", "has", "can"];

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a guard name to start with a configured yes/no prefix (is, has, can)."
    },
    schema: [
      {
        type: "object",
        properties: {
          prefixes: { type: "array", items: { type: "string" }, minItems: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      guardPrefix:
        "Guard `{{name}}` must start with one of {{prefixes}} followed by an upper-case letter, so it reads as a yes/no question (for example `isReady`)."
    }
  },

  create(context) {
    const prefixes = context.options[0]?.prefixes ?? DEFAULT_PREFIXES;
    const matcher = new RegExp(`^(${prefixes.join("|")})[A-Z0-9_]`);
    const sourceCode = context.sourceCode;
    if (!importsXstate(sourceCode.ast)) return {};

    function checkGuards(optionsObject) {
      const guards = findProperty(optionsObject, "guards");
      if (!guards || guards.value.type !== "ObjectExpression") return;
      for (const property of guards.value.properties) {
        const name = propertyName(property);
        if (name !== null && !matcher.test(name)) {
          context.report({
            node: property.key,
            messageId: "guardPrefix",
            data: { name, prefixes: prefixes.map(p => `\`${p}\``).join(", ") }
          });
        }
      }
    }

    return {
      CallExpression(node) {
        const name = calleeName(node);
        if (name === "createMachine") checkGuards(node.arguments[1]);
        if (name === "setup") checkGuards(node.arguments[0]);
      }
    };
  }
};
