/**
 * @fileoverview `scope-based/scoped-factory` — a four-layer module is built by
 * `createScopedComposable` with its `<MODULE>_SCOPE_MATRIX` value as the third
 * argument, and returns exactly the four layers.
 *
 * For `use<Module>.ts` whose four layer files (`.actions`, `.context`, `.meta`,
 * `.internals`) all exist beside it:
 *  - the file calls `createScopedComposable`;
 *  - the factory function it passes (an inline function, or a function of this
 *    file given by name) returns an object with exactly `useActions`,
 *    `useContext`, `useInternals` and `useMeta`, no direct props;
 *  - the call's third argument is an identifier named `<MODULE>_SCOPE_MATRIX`,
 *    so `scopeMatrix` is readable at runtime.
 *
 * @module packages/eslint-plugin-scope-based/rules/scoped-factory
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  basenameOf,
  isFunctionNode,
  isTestFile,
  propertyKeyName,
  SCOPE_MATRIX_NAME_RE
} from "../util.mjs";

const LAYERS = ["actions", "context", "internals", "meta"];
const EXPECTED = ["useActions", "useContext", "useInternals", "useMeta"];

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a module with the four layer files to call createScopedComposable with its <MODULE>_SCOPE_MATRIX value as the third argument and return exactly useActions, useContext, useInternals and useMeta."
    },
    schema: [],
    messages: {
      notScoped:
        "This module has the four layer files, so `{{name}}` must be built with `createScopedComposable`.",
      layerKeys:
        "The scoped factory must return exactly `useActions`, `useContext`, `useInternals` and `useMeta`. Found: {{found}}.",
      matrixValue:
        "`createScopedComposable` must receive the module's matrix value as its third argument (`<MODULE>_SCOPE_MATRIX`), so `scopeMatrix` is readable at runtime. Found: {{found}}.",
      matrixName:
        "The third argument of `createScopedComposable` must be the module's matrix value, named `<MODULE>_SCOPE_MATRIX`. Found: {{found}}."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};
    const base = basenameOf(filename);
    const m = base.match(/^(use[A-Z][A-Za-z0-9_]*)\.ts$/);
    if (!m) return {};
    const name = m[1];
    const dir = dirname(filename);
    if (!LAYERS.every(layer => existsSync(join(dir, `${name}.${layer}.ts`)))) {
      return {};
    }

    const functionsByName = new Map();
    const calls = [];

    function checkReturned(fn) {
      const objects = [];
      if (fn.body.type === "ObjectExpression") objects.push(fn.body);
      else if (fn.body.type === "BlockStatement") {
        for (const stmt of fn.body.body) {
          if (
            stmt.type === "ReturnStatement" &&
            stmt.argument?.type === "ObjectExpression"
          ) {
            objects.push(stmt.argument);
          }
        }
      }
      for (const obj of objects) {
        const keys = obj.properties
          .map(p => propertyKeyName(p) ?? "...")
          .sort();
        if (keys.join(",") !== EXPECTED.join(",")) {
          context.report({
            node: obj,
            messageId: "layerKeys",
            data: { found: keys.join(", ") || "none" }
          });
        }
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) functionsByName.set(node.id.name, node);
      },
      VariableDeclarator(node) {
        if (node.id.type === "Identifier" && isFunctionNode(node.init)) {
          functionsByName.set(node.id.name, node.init);
        }
      },
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "createScopedComposable"
        ) {
          calls.push(node);
        }
      },
      "Program:exit"(program) {
        if (calls.length === 0) {
          context.report({
            node: program,
            loc: { line: 1, column: 0 },
            messageId: "notScoped",
            data: { name }
          });
          return;
        }
        for (const call of calls) {
          const matrix = call.arguments[2];
          if (!matrix) {
            context.report({
              node: call,
              messageId: "matrixValue",
              data: { found: `${call.arguments.length} argument(s)` }
            });
          } else if (
            matrix.type !== "Identifier" ||
            !SCOPE_MATRIX_NAME_RE.test(matrix.name)
          ) {
            context.report({
              node: matrix,
              messageId: "matrixName",
              data: { found: context.sourceCode.getText(matrix) }
            });
          }
          for (const arg of call.arguments) {
            const fn =
              arg.type === "Identifier"
                ? functionsByName.get(arg.name)
                : isFunctionNode(arg)
                  ? arg
                  : null;
            if (fn) checkReturned(fn);
          }
        }
      }
    };
  }
};
