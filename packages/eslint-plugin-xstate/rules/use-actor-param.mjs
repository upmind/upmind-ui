/**
 * @fileoverview `xstate/use-actor-param` — a composable takes the configured
 * actor type, not a raw XState actor type.
 *
 * A parameter of a function named `use*` whose type annotation references
 * `ActorRef`, `AnyActorRef`, `Interpreter` or `AnyInterpreter` fails. The
 * message names the configured actor type (default: `UseActor`).
 *
 * Valid:   `function useThing(actor: UseActor<Machine>) {}`
 * Invalid: `function useThing(actor: AnyActorRef) {}`
 *
 * @module packages/eslint-plugin-xstate/rules/use-actor-param
 */

const DEFAULT_FORBIDDEN = [
  "ActorRef",
  "AnyActorRef",
  "Interpreter",
  "AnyInterpreter"
];

/** Collect every type-reference name inside a type node. */
function collectTypeNames(node, names) {
  if (!node || typeof node !== "object") return;
  if (node.type === "TSTypeReference" && node.typeName.type === "Identifier") {
    names.push({ name: node.typeName.name, node });
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) collectTypeNames(child, names);
    } else if (value && typeof value.type === "string") {
      collectTypeNames(value, names);
    }
  }
}

/** The name of the function a node declares, or null. */
function functionName(node) {
  if (node.type === "FunctionDeclaration") return node.id?.name ?? null;
  const parent = node.parent;
  if (
    parent?.type === "VariableDeclarator" &&
    parent.id.type === "Identifier"
  ) {
    return parent.id.name;
  }
  return null;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw XState actor types as composable parameters; use the configured actor type."
    },
    schema: [
      {
        type: "object",
        properties: {
          forbidden: { type: "array", items: { type: "string" }, minItems: 1 },
          use: { type: "string" }
        },
        additionalProperties: false
      }
    ],
    messages: {
      actorParam:
        "A composable parameter must not be typed `{{name}}`. Use `{{use}}` instead."
    }
  },

  create(context) {
    const forbidden = new Set(
      context.options[0]?.forbidden ?? DEFAULT_FORBIDDEN
    );
    const use = context.options[0]?.use ?? "UseActor";

    function check(node) {
      const name = functionName(node);
      if (!name || !/^use[A-Z0-9]/.test(name)) return;
      for (const param of node.params) {
        const found = [];
        collectTypeNames(param.typeAnnotation, found);
        for (const { name: typeName, node: typeNode } of found) {
          if (forbidden.has(typeName)) {
            context.report({
              node: typeNode,
              messageId: "actorParam",
              data: { name: typeName, use }
            });
          }
        }
      }
    }

    return {
      FunctionDeclaration: check,
      ArrowFunctionExpression: check,
      FunctionExpression: check
    };
  }
};
