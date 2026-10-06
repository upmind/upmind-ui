/**
 * @fileoverview `tests/e2e-spec-file-kebab` — an e2e spec file name is
 * kebab-case, for example `partial-payments.spec.ts` (§Self-check).
 *
 * @module packages/eslint-plugin-tests/rules/e2e-spec-file-kebab
 */

import { basenameOf } from "../util.mjs";

const SPEC_SUFFIX = /\.spec\.(?:ts|tsx|mts|cts|js|mjs)$/;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description: "An e2e spec file name is kebab-case.",
      recommended: true
    },
    schema: [],
    messages: {
      notKebab:
        "`{{name}}` is not kebab-case. Name an e2e spec `{{suggestion}}.spec.ts`."
    }
  },

  create(context) {
    const name = basenameOf(context.filename ?? context.getFilename());
    if (!SPEC_SUFFIX.test(name)) return {};
    const stem = name.replace(SPEC_SUFFIX, "");
    if (KEBAB.test(stem)) return {};

    const suggestion = stem
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[._\s]+/g, "-")
      .toLowerCase();

    return {
      Program(program) {
        context.report({
          node: program,
          loc: { line: 1, column: 0 },
          messageId: "notKebab",
          data: { name, suggestion }
        });
      }
    };
  }
};
