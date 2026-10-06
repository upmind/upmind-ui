/**
 * @fileoverview `code-quality/no-literal-error-message` — every user-facing
 * string comes from a translation key.
 *
 * The message of a thrown error can reach the user. Flag `new Error("...")`
 * (any `*Error` class) and `throw "..."` when the literal holds a space, which
 * marks it as prose. A translation key has no space (`errors.not_found`).
 *
 * @module packages/eslint-plugin-code-quality/rules/no-literal-error-message
 */

/** The prose text of a string literal or a template literal, or null. */
function proseOf(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis.map(q => q.value.cooked ?? "").join(" ");
  }
  return null;
}

/** True when text reads as a sentence, not a key. */
function isProse(text) {
  return typeof text === "string" && /\S\s+\S/.test(text);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a literal prose message in `new Error(...)` and in `throw`; use a translation key."
    },
    schema: [],
    messages: {
      literalMessage:
        "Use a translation key, not literal text, for the message of a thrown error."
    }
  },

  create(context) {
    return {
      NewExpression(node) {
        if (node.callee.type !== "Identifier") return;
        if (!/Error$/.test(node.callee.name)) return;
        const first = node.arguments[0];
        if (!isProse(proseOf(first))) return;
        context.report({ node: first, messageId: "literalMessage" });
      },
      ThrowStatement(node) {
        const arg = node.argument;
        if (arg?.type !== "Literal" && arg?.type !== "TemplateLiteral") return;
        if (!isProse(proseOf(arg))) return;
        context.report({ node: arg, messageId: "literalMessage" });
      }
    };
  }
};
