/**
 * @fileoverview `xstate/setup-first` (XState 5 only) — machines start from
 * `setup(...)`.
 *
 * `createMachine` must be called as `setup(...).createMachine(...)`. The rule
 * reads the installed `xstate` major and stays silent below 5.
 *
 * Valid:   `setup({ guards }).createMachine({})`
 * Invalid: `createMachine({})`
 *
 * @module packages/eslint-plugin-xstate/rules/setup-first
 */

import {
  belowV5,
  importsXstate,
  isCreateMachineCall,
  isSetupCreateMachine,
  xstateMajorSchema
} from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "XState 5 only: require createMachine to be called as setup(...).createMachine(...)."
    },
    schema: [xstateMajorSchema],
    messages: {
      setupFirst:
        "Call `setup({ ... }).createMachine({ ... })`, not a bare `createMachine`."
    }
  },

  create(context) {
    if (belowV5(context) || !importsXstate(context.sourceCode.ast)) return {};
    return {
      CallExpression(node) {
        if (isCreateMachineCall(node) && !isSetupCreateMachine(node)) {
          context.report({ node, messageId: "setupFirst" });
        }
      }
    };
  }
};
