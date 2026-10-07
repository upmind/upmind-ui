/**
 * @fileoverview `xstate/no-v4-keys` (XState 5 only) — no v4 option keys.
 *
 * The keys `cond` and `services` fail in a v5 module. Use `guard` and
 * `actors`. The rule reads the installed `xstate` major and stays silent
 * below 5.
 *
 * Valid:   `{ guard: "isReady" }`, `{ actors: {} }`
 * Invalid: `{ cond: "isReady" }`, `{ services: {} }`
 *
 * @module packages/eslint-plugin-xstate/rules/no-v4-keys
 */

import {
  belowV5,
  importsXstate,
  propertyName,
  xstateMajorSchema
} from "../util.mjs";

const REPLACEMENTS = { cond: "guard", services: "actors" };

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "XState 5 only: disallow the v4 keys cond and services; use guard and actors."
    },
    schema: [xstateMajorSchema],
    messages: {
      v4Key:
        "The XState 4 key `{{key}}` is not valid in v5. Use `{{replacement}}`."
    }
  },

  create(context) {
    if (belowV5(context) || !importsXstate(context.sourceCode.ast)) return {};
    return {
      Property(node) {
        const key = propertyName(node);
        if (key && Object.hasOwn(REPLACEMENTS, key)) {
          context.report({
            node: node.key,
            messageId: "v4Key",
            data: { key, replacement: REPLACEMENTS[key] }
          });
        }
      }
    };
  }
};
