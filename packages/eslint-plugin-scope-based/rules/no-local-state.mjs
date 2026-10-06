/**
 * @fileoverview `scope-based/no-local-state` — a query-backed module carries no
 * state of its own (decision S2).
 *
 * In a module folder that has no `*.machine.ts`, flag `ref`, `shallowRef` and
 * `reactive` calls in any non-test file. The query handle holds the state;
 * nothing below the scope factory mints more. In a machine-backed module the
 * machine owns all state, so this rule stays silent there.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-local-state
 */

import { existsSync, readdirSync } from "node:fs";
import { isTestFile, moduleDirOf } from "../util.mjs";

const STATE_CALLS = new Set(["ref", "shallowRef", "reactive"]);

/** moduleDir -> has a machine file. */
const machineCache = new Map();

function hasMachine(moduleDir) {
  const cached = machineCache.get(moduleDir);
  if (cached !== undefined) return cached;
  const found =
    existsSync(moduleDir) &&
    readdirSync(moduleDir).some(f =>
      /\.machine(\.[A-Za-z0-9-]+)*\.ts$/.test(f)
    );
  machineCache.set(moduleDir, found);
  return found;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow ref, shallowRef and reactive in a module that has no machine."
    },
    schema: [],
    messages: {
      localState:
        "Do not call `{{name}}` in a module with no machine. A query-backed module holds no state of its own; the query handle does."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};
    const moduleDir = moduleDirOf(filename);
    if (!moduleDir || hasMachine(moduleDir)) return {};

    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        if (!STATE_CALLS.has(node.callee.name)) return;
        context.report({
          node,
          messageId: "localState",
          data: { name: node.callee.name }
        });
      }
    };
  }
};
