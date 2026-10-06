/**
 * @fileoverview `tests/e2e-no-text-assert` — an e2e test asserts presence, not
 * translatable copy (code-tests §Locators (verify), P9).
 *
 * Flags `toHaveText` and `toContainText`. Assert presence with `toBeVisible`;
 * read dynamic data from the value attribute after `toBeVisible`.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-no-text-assert
 */

import { parseExpectChain } from "../util.mjs";

const TEXT_MATCHERS = new Set(["toHaveText", "toContainText"]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "e2e specs never assert toHaveText or toContainText.",
      recommended: true
    },
    schema: [],
    messages: {
      textAssert:
        "`{{matcher}}` asserts translatable copy. Assert presence with `toBeVisible`; read dynamic data from the value attribute after `toBeVisible`."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        const chain = parseExpectChain(node);
        if (chain && TEXT_MATCHERS.has(chain.matcher)) {
          context.report({
            node,
            messageId: "textAssert",
            data: { matcher: chain.matcher }
          });
        }
      }
    };
  }
};
