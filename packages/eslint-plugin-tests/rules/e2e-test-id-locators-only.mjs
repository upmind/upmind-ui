/**
 * @fileoverview `tests/e2e-test-id-locators-only` — an e2e test locates an
 * element by an explicit test id, never by translatable copy (code-tests
 * §Locators, code-tests-e2e §Locator priority, P9).
 *
 * Flags `getByText`, `getByLabel`, `getByPlaceholder`, `getByAltText`,
 * `getByTitle`, `getByRole` with a `name` option, `.filter({ hasText })`, and
 * the `:has-text(...)` and `text=` selector forms. A vendor attribute selector
 * such as `frameLocator("iframe").locator('[name="cardnumber"]')` stays valid.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-test-id-locators-only
 */

import { objectProperty, propertyName, staticString } from "../util.mjs";

const TEXT_LOCATORS = new Set([
  "getByText",
  "getByLabel",
  "getByPlaceholder",
  "getByAltText",
  "getByTitle"
]);
const SELECTOR_CALLS = new Set([
  "locator",
  "$",
  "$$",
  "waitForSelector",
  "click",
  "fill",
  "hover",
  "check",
  "uncheck",
  "press",
  "isVisible",
  "textContent",
  "innerText"
]);
const TEXT_SELECTOR =
  /(?:^|[\s>+~])(?:text|text-is|text-matches)\s*=|:has-text\(|:text(?:-is|-matches)?\(/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "e2e locators use test ids only: no getByText, getByRole with name, getByLabel, getByPlaceholder, :has-text or text=.",
      recommended: true
    },
    schema: [],
    messages: {
      textLocator:
        "`{{what}}` locates by translatable copy. Locate by an explicit test id (`getByTestId`).",
      roleName:
        "`getByRole` with `name` locates by translatable copy. Locate by an explicit test id (`getByTestId`).",
      hasText:
        "`.filter({ hasText })` filters by translatable copy. Locate by an explicit test id (`getByTestId`).",
      textSelector:
        "A `text=` or `:has-text` selector locates by translatable copy. Locate by an explicit test id (`getByTestId`)."
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed) return;
        const name = propertyName(callee.property);

        if (TEXT_LOCATORS.has(name)) {
          context.report({
            node,
            messageId: "textLocator",
            data: { what: name }
          });
          return;
        }
        if (name === "getByRole" && objectProperty(node.arguments[1], "name")) {
          context.report({ node, messageId: "roleName" });
          return;
        }
        if (
          name === "filter" &&
          (objectProperty(node.arguments[0], "hasText") ||
            objectProperty(node.arguments[0], "hasNotText"))
        ) {
          context.report({ node, messageId: "hasText" });
          return;
        }
        if (SELECTOR_CALLS.has(name)) {
          const selector = staticString(node.arguments[0]);
          if (selector !== null && TEXT_SELECTOR.test(selector)) {
            context.report({ node, messageId: "textSelector" });
          }
        }
      }
    };
  }
};
