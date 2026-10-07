/**
 * @fileoverview `file-responsibility/no-promise-wrap` — a precondition rejects
 * inline; it never hand-builds a promise.
 *
 * In `*.services*.ts`, and in the `guards` of a `*.machine.ts`, flag
 * `new Promise(...)`. Reject a precondition with
 * `Promise.reject(new DetailedError(...))`, or `throw` in an async guard.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/no-promise-wrap
 */

import { isMachineFile, isServicesFile, isTestFile } from "../util.mjs";

/** True when the node sits inside a `guards: { ... }` property. */
function insideGuards(node) {
  for (let cur = node.parent; cur; cur = cur.parent) {
    if (
      cur.type === "Property" &&
      !cur.computed &&
      cur.key.type === "Identifier" &&
      cur.key.name === "guards"
    ) {
      return true;
    }
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow `new Promise(...)` in a services file and in a machine's guards."
    },
    schema: [],
    messages: {
      promiseWrap:
        "Do not build a promise by hand. Reject inline with `Promise.reject(new DetailedError(...))`, or `throw` in an async guard."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (isTestFile(filename)) return {};
    const services = isServicesFile(filename);
    const machine = isMachineFile(filename);
    if (!services && !machine) return {};

    return {
      NewExpression(node) {
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "Promise"
        ) {
          return;
        }
        if (services || insideGuards(node)) {
          context.report({ node, messageId: "promiseWrap" });
        }
      }
    };
  }
};
