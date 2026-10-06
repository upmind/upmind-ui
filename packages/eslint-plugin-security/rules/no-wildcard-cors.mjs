/**
 * @fileoverview `security/no-wildcard-cors` — never allow every origin.
 *
 * In server files, flag `origin: "*"` in an object (the `cors()` option shape)
 * and an `Access-Control-Allow-Origin` header set to `"*"`, whether set by a
 * header-setter call (`res.setHeader`, `res.header`, `headers.set`,
 * `setHeader(event, ...)`) or as an object key. Scope the rule to server files
 * in the config `files`.
 *
 * Valid:   `cors({ origin: "https://app.upmind.com" })`
 * Invalid: `cors({ origin: "*" })`, `res.setHeader("Access-Control-Allow-Origin", "*")`
 *
 * @module packages/eslint-plugin-security/rules/no-wildcard-cors
 */

const HEADER = "access-control-allow-origin";
const SETTERS = new Set([
  "setHeader",
  "header",
  "set",
  "append",
  "setResponseHeader"
]);

/** True for the string literal `"*"`. */
function isWildcard(node) {
  return node?.type === "Literal" && node.value === "*";
}

/** True for a string literal naming the allow-origin header. */
function isOriginHeader(node) {
  return (
    node?.type === "Literal" &&
    typeof node.value === "string" &&
    node.value.toLowerCase() === HEADER
  );
}

/** The name a callee ends in, or null. */
function calleeName(callee) {
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        'Disallow `origin: "*"` and an `Access-Control-Allow-Origin` header set to "*" in server files.'
    },
    schema: [],
    messages: {
      wildcardCors:
        'Do not allow every origin (`"*"`). List the allowed origins explicitly.'
    }
  },

  create(context) {
    return {
      Property(node) {
        if (node.computed) return;
        const key =
          node.key.type === "Identifier"
            ? node.key.name
            : node.key.type === "Literal"
              ? String(node.key.value)
              : null;
        if (key === null || !isWildcard(node.value)) return;
        if (key === "origin" || key.toLowerCase() === HEADER) {
          context.report({ node: node.value, messageId: "wildcardCors" });
        }
      },
      CallExpression(node) {
        const name = calleeName(node.callee);
        if (!name || !SETTERS.has(name)) return;
        // `res.setHeader(name, value)` and `setHeader(event, name, value)`.
        const args = node.arguments;
        for (let i = 0; i < args.length - 1; i += 1) {
          if (isOriginHeader(args[i]) && isWildcard(args[i + 1])) {
            context.report({ node: args[i + 1], messageId: "wildcardCors" });
          }
        }
      }
    };
  }
};
