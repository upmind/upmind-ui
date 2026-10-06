/**
 * @fileoverview `security/no-dynamic-regexp` — no `new RegExp()` with a
 * non-literal argument (ReDoS).
 *
 * A pattern built from a variable can come from user input and run in
 * super-linear time. `new RegExp("literal")`, `RegExp("literal")` and a
 * template literal with no expressions pass. Escape or allow-list the input,
 * or write the pattern as a literal.
 *
 * Valid:   `new RegExp("^[a-z]+$")`, `new RegExp(`^abc`)`
 * Invalid: `new RegExp(input)`, `RegExp("^" + name)`, `new RegExp(`^${name}`)`
 *
 * @module packages/eslint-plugin-security/rules/no-dynamic-regexp
 */

/** True when the node is a string literal or a template literal with no expressions. */
function isStaticString(node) {
  if (node.type === "Literal") return typeof node.value === "string";
  return node.type === "TemplateLiteral" && node.expressions.length === 0;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow new RegExp() with a non-literal pattern argument."
    },
    schema: [],
    messages: {
      dynamicRegexp:
        "Do not build a regular expression from a non-literal value (ReDoS). Write the pattern as a literal, or escape and allow-list the input."
    }
  },

  create(context) {
    function check(node) {
      if (node.callee.type !== "Identifier" || node.callee.name !== "RegExp") {
        return;
      }
      const pattern = node.arguments[0];
      if (pattern && !isStaticString(pattern)) {
        context.report({ node, messageId: "dynamicRegexp" });
      }
    }
    return { NewExpression: check, CallExpression: check };
  }
};
