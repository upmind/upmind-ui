/**
 * @fileoverview `scope-based/meta-flag-name` — a meta member is named as a
 * flag (decision 4).
 *
 * In a `use<Module>.meta*.ts` file, each keyed member of a factory's returned
 * object starts with a prefix from the `prefixes` option (default `is`, `has`,
 * `can`, `show`) followed by an upper-case letter. A new prefix is a reviewed
 * one-line config change. This is the naming half of the rule; that the value
 * is a boolean needs types and is listed in the ledger.
 *
 * @module packages/eslint-plugin-scope-based/rules/meta-flag-name
 */

import {
  composableFile,
  isTestFile,
  onReturnedObjects,
  propertyKeyName
} from "../util.mjs";

const DEFAULT_PREFIXES = ["is", "has", "can", "show"];

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require each meta layer member to start with a flag prefix (is, has, can, show)."
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
      flagName:
        "Name the meta member `{{name}}` as a flag. Start it with one of: {{prefixes}}."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const info = composableFile(filename);
    if (isTestFile(filename) || !info || info.layer !== "meta") return {};
    const prefixes = context.options[0]?.prefixes ?? DEFAULT_PREFIXES;
    const pattern = new RegExp(`^(${prefixes.join("|")})[A-Z]`);

    return onReturnedObjects(objectNode => {
      for (const prop of objectNode.properties) {
        const name = propertyKeyName(prop);
        if (!name || pattern.test(name)) continue;
        context.report({
          node: prop,
          messageId: "flagName",
          data: { name, prefixes: prefixes.join(", ") }
        });
      }
    });
  }
};
