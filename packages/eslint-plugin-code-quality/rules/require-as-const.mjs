/**
 * @fileoverview `code-quality/require-as-const` — an immutable literal value
 * uses `as const`.
 *
 * A module-level `const` whose initializer is a plain object or array literal
 * of literal values, with no type annotation and no `as const`, is an
 * immutable value typed too wide. Add `as const`. A binding that the file
 * mutates (member assignment, `push`, `set` and the like) is a store, not a
 * literal value, and is left alone.
 *
 * @module packages/eslint-plugin-code-quality/rules/require-as-const
 */

const MUTATORS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "set",
  "add",
  "delete",
  "clear"
]);

/** True when a node is a pure literal value: scalars and nested literal objects or arrays. */
function isPureLiteral(node) {
  switch (node.type) {
    case "Literal":
      return true;
    case "TemplateLiteral":
      return node.expressions.length === 0;
    case "UnaryExpression":
      return (
        node.operator === "-" &&
        node.argument.type === "Literal" &&
        typeof node.argument.value === "number"
      );
    case "ArrayExpression":
      return node.elements.every(el => el !== null && isPureLiteral(el));
    case "ObjectExpression":
      return node.properties.every(
        p =>
          p.type === "Property" &&
          !p.computed &&
          p.kind === "init" &&
          isPureLiteral(p.value)
      );
    default:
      return false;
  }
}

/** True when the reference is written through: `x.a = 1`, `x[0]++`, `x.push(1)`, `delete x.a`. */
function isMutation(ref) {
  const id = ref.identifier;
  const member = id.parent;
  if (!member || member.type !== "MemberExpression" || member.object !== id) {
    return false;
  }
  const outer = member.parent;
  if (!outer) return false;
  if (outer.type === "AssignmentExpression" && outer.left === member) {
    return true;
  }
  if (outer.type === "UpdateExpression") return true;
  if (outer.type === "UnaryExpression" && outer.operator === "delete") {
    return true;
  }
  if (
    outer.type === "CallExpression" &&
    outer.callee === member &&
    !member.computed &&
    member.property.type === "Identifier" &&
    MUTATORS.has(member.property.name)
  ) {
    return true;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require `as const` on a module-level const object or array literal of literal values that the file never mutates."
    },
    schema: [],
    messages: {
      requireAsConst:
        "Add `as const` to `{{name}}`. An immutable literal value is typed as its exact literal."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      "Program > VariableDeclaration[kind='const'] > VariableDeclarator, Program > ExportNamedDeclaration > VariableDeclaration[kind='const'] > VariableDeclarator"(
        node
      ) {
        if (node.id.type !== "Identifier") return;
        if (node.id.typeAnnotation) return;
        const init = node.init;
        if (!init) return;
        if (
          init.type !== "ObjectExpression" &&
          init.type !== "ArrayExpression"
        ) {
          return;
        }
        const isEmpty =
          init.type === "ObjectExpression"
            ? init.properties.length === 0
            : init.elements.length === 0;
        if (isEmpty || !isPureLiteral(init)) return;

        const variable = sourceCode
          .getDeclaredVariables(node)
          .find(v => v.name === node.id.name);
        if (variable && variable.references.some(isMutation)) return;

        context.report({
          node: node.id,
          messageId: "requireAsConst",
          data: { name: node.id.name }
        });
      }
    };
  }
};
