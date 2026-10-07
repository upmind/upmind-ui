/**
 * @fileoverview `scope-based/is-ready-contract` — the lifecycle members live in
 * the actions layer, and `isReady` returns `Promise<boolean>`.
 *
 * In `use*.ts` files:
 *  - the shared actions layer (`use<Module>.actions.ts`) returns an `isReady`
 *    member from each `create<Module>Actions` factory;
 *  - `destroy`, `isReady`, `onDone` and `refresh` are returned only by an
 *    actions file (shared or actor arm), never by another layer;
 *  - an `isReady` function declared in the file is `async` or annotated
 *    `Promise<boolean>`.
 *
 * The typed form (the value's inferred type) is listed in the ledger as
 * needing typed linting.
 *
 * @module packages/eslint-plugin-scope-based/rules/is-ready-contract
 */

import {
  composableFile,
  isFunctionNode,
  isTestFile,
  onReturnedObjects,
  propertyKeyName
} from "../util.mjs";

const LIFECYCLE = new Set(["destroy", "isReady", "onDone", "refresh"]);

/** True for an annotation `Promise<boolean>`. */
function isPromiseBoolean(returnType) {
  const ref = returnType?.typeAnnotation;
  if (ref?.type !== "TSTypeReference" || ref.typeName.name !== "Promise") {
    return false;
  }
  const arg = (ref.typeArguments ?? ref.typeParameters)?.params?.[0];
  return arg?.type === "TSBooleanKeyword";
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require isReady in the actions layer, keep destroy/isReady/onDone/refresh out of other layers, and type isReady as Promise<boolean>."
    },
    schema: [],
    messages: {
      missingIsReady:
        "The actions factory `{{name}}` must return `isReady: () => Promise<boolean>`.",
      wrongLayer:
        "`{{name}}` belongs to the actions layer. Do not return it from the {{layer}} layer.",
      isReadyType: "`isReady` must be `async` or annotated `Promise<boolean>`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const info = composableFile(filename);
    if (isTestFile(filename) || !info) return {};
    const isActions = info.layer === "actions";
    const isSharedActions = isActions && info.actor === null;
    const layer = info.layer ?? "scope factory";

    const visitors = onReturnedObjects((objectNode, factoryName) => {
      const keys = new Set();
      for (const prop of objectNode.properties) {
        const name = propertyKeyName(prop);
        if (!name) continue;
        keys.add(name);
        if (LIFECYCLE.has(name) && !isActions) {
          context.report({
            node: prop,
            messageId: "wrongLayer",
            data: { name, layer }
          });
        }
      }
      if (
        isSharedActions &&
        /^create.*Actions$/.test(factoryName) &&
        !keys.has("isReady")
      ) {
        context.report({
          node: objectNode,
          messageId: "missingIsReady",
          data: { name: factoryName }
        });
      }
    });

    function checkIsReady(fn) {
      if (!isFunctionNode(fn)) return;
      if (fn.async || isPromiseBoolean(fn.returnType)) return;
      context.report({ node: fn, messageId: "isReadyType" });
    }

    return {
      ...visitors,
      FunctionDeclaration(node) {
        if (node.id?.name === "isReady") checkIsReady(node);
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && node.id.name === "isReady") {
          checkIsReady(node.init);
        }
      },
      Property(node) {
        if (propertyKeyName(node) === "isReady" && !node.shorthand) {
          checkIsReady(node.value);
        }
      }
    };
  }
};
