/**
 * @fileoverview `tests/one-replay-int-test` — in a headless module, the only
 * `*.int.test.ts` is `<module>.replay.int.test.ts` (ADR 035, decision 5).
 * Every capability is a driven `.feature` scenario; token and transport
 * behaviour belong to the `query`, `session-store` and `auth` modules.
 *
 * The module is the directory that holds the `__tests__` folder. A file whose
 * name differs from `<module>.replay.int.test.ts` is reported. Scoped (via
 * `eslint.config.mjs`) to `packages/headless/src/modules/**`.
 *
 * @module packages/eslint-plugin-tests/rules/one-replay-int-test
 */

import { basenameOf } from "../util.mjs";

const INT_SUFFIX = ".int.test.ts";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A headless module keeps one integration test, <module>.replay.int.test.ts (ADR 035).",
      recommended: true
    },
    schema: [],
    messages: {
      notReplay:
        "`{{name}}` is not `{{expected}}`. A headless module keeps one integration test, the replay test (ADR 035). Drive each capability as a `.feature` scenario."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const name = basenameOf(filename);
    if (!name.endsWith(INT_SUFFIX)) return {};

    const parts = filename.split("/");
    const folder = parts[parts.length - 2];
    const moduleName =
      folder === "__tests__" ? parts[parts.length - 3] : folder;
    const expected = `${moduleName}.replay${INT_SUFFIX}`;
    if (name === expected) return {};

    return {
      Program(program) {
        context.report({
          node: program,
          loc: { line: 1, column: 0 },
          messageId: "notReplay",
          data: { name, expected }
        });
      }
    };
  }
};
