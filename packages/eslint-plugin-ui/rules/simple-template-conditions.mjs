/**
 * @fileoverview `ui/simple-template-conditions` — composed-component law CC12a.
 *
 * A `v-if` / `v-else-if` / `v-show` expression may combine at most TWO boolean
 * clauses. Clauses are joined by `&&` / `||`, so two clauses means exactly one
 * logical operator; a second logical operator (`a && b && c`, `a || b || c`)
 * is a three-plus-clause condition that belongs in a named `meta` flag, not in
 * the template. `??` is a nullish default, not a boolean join, and is not
 * counted.
 *
 * Valid:   `v-if="meta.open"`, `v-if="a && b"`
 * Invalid: `v-if="a && b && c"`, `v-if="a || b || c"`
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/simple-template-conditions -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/simple-template-conditions
 */

/** Directive names this rule guards. */
const GUARDED = new Set(["if", "else-if", "show"]);

/** Count `&&` / `||` operators in a JS expression subtree. */
function countBooleanJoins(node) {
  let count = 0;
  const seen = new Set();
  const walk = n => {
    if (!n || typeof n.type !== "string" || seen.has(n)) return;
    seen.add(n);
    if (
      n.type === "LogicalExpression" &&
      (n.operator === "&&" || n.operator === "||")
    ) {
      count += 1;
    }
    for (const key of Object.keys(n)) {
      if (
        key === "parent" ||
        key === "loc" ||
        key === "range" ||
        key === "start" ||
        key === "end"
      )
        continue;
      const value = n[key];
      if (Array.isArray(value)) {
        for (const child of value)
          if (child && typeof child.type === "string") walk(child);
      } else if (value && typeof value.type === "string") {
        walk(value);
      }
    }
  };
  walk(node);
  return count;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a v-if/v-else-if/v-show with more than two boolean clauses; derive a named `meta` flag (CC12a).",
      recommended: true
    },
    schema: [],
    messages: {
      tooManyClauses:
        "A `v-{{directive}}` must not combine more than two boolean clauses (CC12a); derive a named `meta` flag instead of chaining `&&`/`||` in the template. If this is intentional, silence it with `// eslint-disable-next-line ui/simple-template-conditions -- <reason>`."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const services = sourceCode.parserServices;
    if (!services || !services.defineTemplateBodyVisitor) return {};

    return services.defineTemplateBodyVisitor({
      "VAttribute[directive=true]"(node) {
        const name = node.key?.name?.name;
        if (!GUARDED.has(name)) return;
        const expression = node.value?.expression;
        if (!expression) return;
        if (countBooleanJoins(expression) > 1) {
          context.report({
            node,
            messageId: "tooManyClauses",
            data: { directive: name }
          });
        }
      }
    });
  }
};
