/**
 * @fileoverview `xstate/actor-stubs` (XState 5 only) — a machine file declares
 * stubs and never imports its services.
 *
 * A `*.machine.ts` that imports from a `*.services.ts` fails. The machine
 * declares actor stubs, and the composable calls `.provide()` with the real
 * services. The rule reads the installed `xstate` major and stays silent
 * below 5.
 *
 * Valid:   `import { setup } from "xstate"` in `basket.machine.ts`
 * Invalid: `import services from "./basket.services"` in `basket.machine.ts`
 *
 * @module packages/eslint-plugin-xstate/rules/actor-stubs
 */

import { belowV5, isMachineFile, xstateMajorSchema } from "../util.mjs";

const SERVICES_SOURCE = /\.services(\.[A-Za-z0-9-]+)*(\.[cm]?tsx?)?$/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "XState 5 only: disallow a machine file importing from a services file; declare stubs and provide() instead."
    },
    schema: [xstateMajorSchema],
    messages: {
      actorStubs:
        "A machine file must not import `{{source}}`. Declare actor stubs in the machine and call `.provide()` from the composable."
    }
  },

  create(context) {
    if (!isMachineFile(context.filename) || belowV5(context)) return {};
    function check(node) {
      const source = node.source?.value;
      if (typeof source === "string" && SERVICES_SOURCE.test(source)) {
        context.report({ node, messageId: "actorStubs", data: { source } });
      }
    }
    return {
      ImportDeclaration: check,
      ExportAllDeclaration: check,
      ExportNamedDeclaration: check
    };
  }
};
