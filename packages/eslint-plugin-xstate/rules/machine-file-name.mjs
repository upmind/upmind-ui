/**
 * @fileoverview `xstate/machine-file-name` — a machine lives in `*.machine.ts`.
 *
 * A file that calls `createMachine` must be named `*.machine.ts` or
 * `*.machine.<context>.ts`. Tests, specs and fixtures are exempt.
 *
 * Valid:   `basket.machine.ts` calling `createMachine`
 * Invalid: `basket.helpers.ts` calling `createMachine`
 *
 * @module packages/eslint-plugin-xstate/rules/machine-file-name
 */

import {
  importsXstate,
  isCreateMachineCall,
  isMachineFile,
  isTestFile
} from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a file that calls createMachine to be named *.machine.ts or *.machine.<context>.ts."
    },
    schema: [],
    messages: {
      machineFileName:
        "A file that calls `createMachine` must be named `*.machine.ts` or `*.machine.<context>.ts`. Rename this file or move the machine."
    }
  },

  create(context) {
    const filename = context.filename;
    if (isMachineFile(filename) || isTestFile(filename)) return {};
    if (!importsXstate(context.sourceCode.ast)) return {};
    return {
      CallExpression(node) {
        if (isCreateMachineCall(node)) {
          context.report({ node, messageId: "machineFileName" });
        }
      }
    };
  }
};
