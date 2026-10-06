/**
 * @fileoverview `ui/v-html-sanitised` — `v-html` only through a sanitiser call.
 *
 * The value of a `v-html` directive must be a call to a sanitiser named in the
 * lint config (option `sanitisers`, default `["DOMPurify.sanitize"]`). It
 * replaces `vue/no-v-html: "off"` (decision 13).
 *
 * Valid:   `<div v-html="DOMPurify.sanitize(html)" />`
 * Invalid: `<div v-html="html" />`, `<div v-html="clean" />`
 *
 * A genuine exception is silenced in place with
 * `<!-- eslint-disable-next-line ui/v-html-sanitised -- <reason> -->`.
 *
 * @module packages/eslint-plugin-ui/rules/v-html-sanitised
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Allow v-html only when its value is a call to a configured sanitiser.",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          sanitisers: { type: "array", items: { type: "string" }, minItems: 1 }
        },
        additionalProperties: false
      }
    ],
    messages: {
      unsanitised:
        "`v-html` must render the result of a sanitiser call: {{sanitisers}}. Never bind raw HTML."
    }
  },

  create(context) {
    const sanitisers = context.options[0]?.sanitisers ?? ["DOMPurify.sanitize"];
    const sourceCode = context.sourceCode;
    const services = sourceCode.parserServices;
    if (!services || !services.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      "VAttribute[directive=true]"(node) {
        if (node.key?.name?.name !== "html") return;
        const expression = node.value?.expression;
        const isSanitised =
          expression?.type === "CallExpression" &&
          sanitisers.includes(sourceCode.getText(expression.callee));
        if (!isSanitised) {
          context.report({
            node,
            messageId: "unsanitised",
            data: { sanitisers: sanitisers.map(s => `\`${s}\``).join(", ") }
          });
        }
      }
    });
  }
};
