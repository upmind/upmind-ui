/**
 * @fileoverview `scope-based/services-factory-fns` — the services factory
 * returns functions.
 *
 * In a `*.services*.ts` file, a factory function that returns an object
 * literal may carry as members only function references (an arrow or function
 * expression, a method, a shorthand or identifier reference, a spread) and the
 * module's key constants (an `UPPER_CASE` or `*Key` member). A member that is a
 * literal, an array, an object, a `new`, an operator expression, or a
 * `computed(...)`, `ref(...)`, `shallowRef(...)` or `reactive(...)` call is a
 * flag or a derived value, and belongs in meta or context.
 *
 * This is the syntactic form of the rule; it cannot read the value type of an
 * identifier or of a call. Any other call is left alone, because a wrapper such
 * as `asyncDebounce(load)` returns a function. Review judges those. See the
 * ledger entry for the typed variant.
 *
 * @module packages/eslint-plugin-scope-based/rules/services-factory-fns
 */

import { isTestFile, onReturnedObjects, propertyKeyName } from "../util.mjs";

const NON_FUNCTION_VALUES = new Set([
  "Literal",
  "TemplateLiteral",
  "ArrayExpression",
  "ObjectExpression",
  "NewExpression",
  "BinaryExpression",
  "LogicalExpression",
  "UnaryExpression",
  "ConditionalExpression"
]);
const REACTIVE_CALLS = new Set(["computed", "ref", "shallowRef", "reactive"]);

/** True for a key-constant member name. */
function isKeyConstant(name) {
  return /^[A-Z][A-Z0-9_]*$/.test(name) || /Key$/.test(name);
}

/** True when a value is certainly not a function. */
function isNonFunction(value) {
  if (NON_FUNCTION_VALUES.has(value.type)) return true;
  return (
    value.type === "CallExpression" &&
    value.callee.type === "Identifier" &&
    REACTIVE_CALLS.has(value.callee.name)
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require the members of a services factory's returned object to be functions or key constants."
    },
    schema: [],
    messages: {
      nonFunctionMember:
        "`{{name}}` is not a function. The services factory returns functions and the module's key constant only; put a flag or derived value in meta or context."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};
    if (!/\.services(\.[A-Za-z0-9-]+)*\.ts$/.test(filename)) return {};

    return onReturnedObjects(objectNode => {
      for (const prop of objectNode.properties) {
        if (prop.type !== "Property" || prop.method) continue;
        const name = propertyKeyName(prop);
        if (!name || isKeyConstant(name)) continue;
        if (isNonFunction(prop.value)) {
          context.report({
            node: prop,
            messageId: "nonFunctionMember",
            data: { name }
          });
        }
      }
    });
  }
};
