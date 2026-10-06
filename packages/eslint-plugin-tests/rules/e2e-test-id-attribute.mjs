/**
 * @fileoverview `tests/e2e-test-id-attribute` — one test-id attribute per
 * project, and the project names it (ruling G7, contradiction 6).
 *
 * The attribute is the `testIdAttribute` the `playwright.config.ts` sets, found
 * by walking up from the linted file. When the config leaves it unset,
 * Playwright's default `data-testid` applies. The rule flags any other
 * test-id attribute (`data-testid`, `data-test-id`, `data-test-key`,
 * `data-test`, `data-qa`, `data-cy`, `data-e2e`) in a string literal, a
 * template string, or a `.vue` template attribute name. `data-test-value`, the
 * value companion of the key, is not a test-id attribute.
 *
 * Option `testIdAttribute` overrides the config lookup (used by the specs).
 *
 * @module packages/eslint-plugin-tests/rules/e2e-test-id-attribute
 */

import { dirname } from "node:path";
import { readTestIdAttribute } from "../util.mjs";

const TEST_ID_ATTRIBUTE =
  /(?<![\w-])data-(?:testid|test-id|testkey|test-key|test|qa|cy|e2e|automation-id)(?![\w-])/g;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "The only test-id attribute is the testIdAttribute from playwright.config.ts (default data-testid).",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: { testIdAttribute: { type: "string" } },
        additionalProperties: false
      }
    ],
    messages: {
      wrongAttribute:
        "`{{found}}` is not the project's test-id attribute. Use `{{configured}}`, the `testIdAttribute` in playwright.config.ts."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const configured =
      context.options[0]?.testIdAttribute ??
      readTestIdAttribute(dirname(filename));

    function scan(node, text) {
      if (typeof text !== "string") return;
      for (const match of text.matchAll(TEST_ID_ATTRIBUTE)) {
        if (match[0] !== configured) {
          context.report({
            node,
            messageId: "wrongAttribute",
            data: { found: match[0], configured }
          });
        }
      }
    }

    const scriptVisitor = {
      Literal(node) {
        if (typeof node.value === "string") scan(node, node.value);
      },
      TemplateElement(node) {
        scan(node, node.value.cooked ?? node.value.raw);
      }
    };

    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const services = sourceCode.parserServices;
    if (!services?.defineTemplateBodyVisitor) return scriptVisitor;

    return services.defineTemplateBodyVisitor(
      {
        ...scriptVisitor,
        VAttribute(node) {
          const name = node.directive
            ? node.key.argument?.type === "VIdentifier"
              ? node.key.argument.name
              : null
            : node.key.name;
          scan(node, name);
        }
      },
      scriptVisitor
    );
  }
};
