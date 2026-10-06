/**
 * @fileoverview `tests/e2e-no-journey-mock` — an e2e test mocks settings, never
 * journey data (P4, §Mock policy, `e2e-mock-settings-only`). A mocked basket,
 * order or payment answer goes stale and hides real bugs.
 *
 * Flags `route.fulfill({ body | json })` inside the handler of a `.route(url,
 * handler)` call whose URL matches a configured journey list. The option
 * `journeyRoutes` names the list. The default is `orders`, `basket` and
 * `payments`. A `route.fulfill` without a body, and a route on settings, brand
 * or feature flags, stay valid.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-no-journey-mock
 */

import { objectProperty, propertyName, walk } from "../util.mjs";

const DEFAULT_JOURNEY_ROUTES = ["orders", "basket", "payments"];

function routeText(node, sourceCode) {
  if (!node) return null;
  if (node.type === "Literal" && node.regex) return node.regex.pattern;
  return sourceCode.getText(node);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not fulfil a journey route (orders, basket, payments) with a mocked body.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          journeyRoutes: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ],
    messages: {
      journeyMock:
        "This route mocks journey data (`{{route}}`). Mock settings only: brand or tenant config, UI schema, feature flags, third-party errors."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const journeyRoutes =
      context.options[0]?.journeyRoutes ?? DEFAULT_JOURNEY_ROUTES;
    const pattern = new RegExp(
      `(?<![A-Za-z])(?:${journeyRoutes.map(r => r.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![A-Za-z])`
    );

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          propertyName(callee.property) !== "route"
        ) {
          return;
        }
        const [url, handler] = node.arguments;
        const text = routeText(url, sourceCode);
        if (text === null || !pattern.test(text)) return;
        if (
          !handler ||
          (handler.type !== "ArrowFunctionExpression" &&
            handler.type !== "FunctionExpression")
        ) {
          return;
        }

        walk(handler.body, inner => {
          if (
            inner.type === "CallExpression" &&
            inner.callee.type === "MemberExpression" &&
            propertyName(inner.callee.property) === "fulfill"
          ) {
            const options = inner.arguments[0];
            if (
              objectProperty(options, "body") ||
              objectProperty(options, "json")
            ) {
              context.report({
                node: inner,
                messageId: "journeyMock",
                data: { route: text }
              });
            }
          }
        });
      }
    };
  }
};
