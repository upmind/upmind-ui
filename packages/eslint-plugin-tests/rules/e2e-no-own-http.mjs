/**
 * @fileoverview `tests/e2e-no-own-http` — a test file makes no HTTP call of its
 * own (decision 7, code-tests-e2e P5 and §Setup pattern). Setup comes from
 * generated fixtures, and the app's real modules (`headless`, `client-vue`)
 * make the calls. A hand-rolled request replicates their logic and is a
 * shadow implementation.
 *
 * Flags `fetch(...)`, `$fetch(...)`, `axios(...)` and `axios.<method>(...)`,
 * `new XMLHttpRequest()`, `request.newContext(...)`, and `.get/.post/.put/
 * .patch/.delete/.head/.fetch` on `request` or `page.request`.
 *
 * @module packages/eslint-plugin-tests/rules/e2e-no-own-http
 */

import { propertyName } from "../util.mjs";

const HTTP_FUNCTIONS = new Set(["fetch", "$fetch", "ofetch", "axios"]);
const HTTP_METHODS = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "fetch"
]);

/** True when `node` is `request` or `<anything>.request`. */
function isRequestObject(node) {
  if (node.type === "Identifier") return node.name === "request";
  return (
    node.type === "MemberExpression" &&
    !node.computed &&
    propertyName(node.property) === "request"
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A test file makes no HTTP call of its own: no fetch, axios, XMLHttpRequest or Playwright request.",
      recommended: true
    },
    schema: [],
    messages: {
      ownHttp:
        "`{{what}}` is a test's own HTTP call. Take setup from generated fixtures and let the app's real modules make the call."
    }
  },

  create(context) {
    function report(node, what) {
      context.report({ node, messageId: "ownHttp", data: { what } });
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === "Identifier" && HTTP_FUNCTIONS.has(callee.name)) {
          report(node, `${callee.name}(...)`);
          return;
        }
        if (callee.type !== "MemberExpression" || callee.computed) return;
        const method = propertyName(callee.property);
        if (
          callee.object.type === "Identifier" &&
          callee.object.name === "axios" &&
          method
        ) {
          report(node, `axios.${method}(...)`);
          return;
        }
        if (method === "newContext" && isRequestObject(callee.object)) {
          report(node, "request.newContext(...)");
          return;
        }
        if (HTTP_METHODS.has(method) && isRequestObject(callee.object)) {
          report(node, `request.${method}(...)`);
        }
      },
      NewExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "XMLHttpRequest"
        ) {
          report(node, "new XMLHttpRequest()");
        }
      }
    };
  }
};
