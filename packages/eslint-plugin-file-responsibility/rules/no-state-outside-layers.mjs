/**
 * @fileoverview `file-responsibility/no-state-outside-layers` — state is minted
 * once, in the scope factory; a services, utils or mappers file never holds it.
 *
 * In `*.services*.ts`, `*.utils.ts` and `*.mappers.ts`, flag:
 *  - a call to `ref`, `shallowRef`, `reactive`, `computed` or `watch`;
 *  - a module-level mutable store: a top-level `let`, or a top-level `const`
 *    initialised with an empty `[]`, `{}`, `new Map()`, `new Set()`,
 *    `new WeakMap()` or `new WeakSet()`.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/no-state-outside-layers
 */

import {
  isMappersFile,
  isServicesFile,
  isTestFile,
  isUtilsFile
} from "../util.mjs";

const STATE_CALLS = new Set([
  "ref",
  "shallowRef",
  "reactive",
  "computed",
  "watch"
]);
const STORE_CLASSES = new Set(["Map", "Set", "WeakMap", "WeakSet"]);

/** True for an empty container initialiser. */
function isEmptyStore(init) {
  if (!init) return false;
  if (init.type === "ArrayExpression") return init.elements.length === 0;
  if (init.type === "ObjectExpression") return init.properties.length === 0;
  return (
    init.type === "NewExpression" &&
    init.callee.type === "Identifier" &&
    STORE_CLASSES.has(init.callee.name)
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow state (ref, reactive, computed, watch, a module-level store) in a services, utils or mappers file."
    },
    schema: [],
    messages: {
      stateCall:
        "Do not call `{{name}}` here. State is minted once in the scope factory and handed down.",
      moduleStore:
        "Do not hold a module-level mutable store here. State is minted once in the scope factory and handed down."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};
    if (
      !isServicesFile(filename) &&
      !isUtilsFile(filename) &&
      !isMappersFile(filename)
    ) {
      return {};
    }

    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        if (!STATE_CALLS.has(node.callee.name)) return;
        context.report({
          node,
          messageId: "stateCall",
          data: { name: node.callee.name }
        });
      },
      "Program > VariableDeclaration"(node) {
        if (node.kind === "let") {
          context.report({ node, messageId: "moduleStore" });
          return;
        }
        if (node.kind !== "const") return;
        for (const decl of node.declarations) {
          if (isEmptyStore(decl.init)) {
            context.report({ node: decl, messageId: "moduleStore" });
          }
        }
      },
      "Program > ExportNamedDeclaration > VariableDeclaration"(node) {
        if (node.kind === "let") {
          context.report({ node, messageId: "moduleStore" });
          return;
        }
        if (node.kind !== "const") return;
        for (const decl of node.declarations) {
          if (isEmptyStore(decl.init)) {
            context.report({ node: decl, messageId: "moduleStore" });
          }
        }
      }
    };
  }
};
