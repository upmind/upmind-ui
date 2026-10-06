/**
 * @fileoverview `tests/e2e-no-external-goto` — an e2e test stays inside the app
 * under test (P6, `e2e-stay-in-app`). It spoofs a third-party return with the
 * callback parameters the app reads, and never drives a third-party page.
 *
 * Flags `page.goto(<absolute URL>)` when the URL's origin is not an allowed
 * origin. The option `allowedOrigins` names the allowed origins. The default
 * is the `baseURL` origin of `playwright.config.ts`
 * (`http://qa-automation.local:4000`). A relative path is always valid.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-no-external-goto
 */

import { propertyName, staticString } from "../util.mjs";

const DEFAULT_ORIGINS = ["http://qa-automation.local:4000"];

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "page.goto with an absolute URL must stay on the configured baseURL origin.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedOrigins: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ],
    messages: {
      externalGoto:
        "`goto` leaves the app for `{{origin}}`. Stay inside the app: spoof the third-party return with the callback parameters the app reads."
    }
  },

  create(context) {
    const allowed = new Set(
      (context.options[0]?.allowedOrigins ?? DEFAULT_ORIGINS).map(
        origin => originOf(origin) ?? origin
      )
    );

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          propertyName(callee.property) !== "goto"
        ) {
          return;
        }
        const url = staticString(node.arguments[0]);
        if (url === null || !/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url)) return;
        const origin = originOf(url.startsWith("//") ? `http:${url}` : url);
        if (origin !== null && !allowed.has(origin)) {
          context.report({
            node,
            messageId: "externalGoto",
            data: { origin }
          });
        }
      }
    };
  }
};
