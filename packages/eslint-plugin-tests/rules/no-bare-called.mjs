/**
 * @fileoverview `tests/no-bare-called` — assert the data a mock received, not
 * only that it ran (code-tests §Test Actual Behavior).
 *
 * Flags `toHaveBeenCalled()` / `toHaveBeenCalledTimes(n)` on a mock when the
 * same test holds no `toHaveBeenCalledWith` (or Nth/Last variant) on that same
 * mock. A negative assertion (`.not.toHaveBeenCalled()`, `toHaveBeenCalledTimes(0)`)
 * states absence and stays valid. An assertion on `mock.mock.calls` counts as
 * an assertion on the data.
 *
 * @module packages/eslint-plugin-tests/rules/no-bare-called
 */

import { enclosingTestFunction, parseExpectChain } from "../util.mjs";

const BARE = new Set([
  "toHaveBeenCalled",
  "toHaveBeenCalledTimes",
  "toBeCalled"
]);
const WITH_DATA = new Set([
  "toHaveBeenCalledWith",
  "toHaveBeenNthCalledWith",
  "toHaveBeenLastCalledWith",
  "toBeCalledWith",
  "lastCalledWith",
  "nthCalledWith"
]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A mock called-assertion needs a toHaveBeenCalledWith on the same mock in the same test.",
      recommended: true
    },
    schema: [],
    messages: {
      bareCalled:
        "`{{mock}}` is asserted as called with no `toHaveBeenCalledWith` on it in this test. Assert the data the mock received."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    /** @type {Map<object | null, { bare: { node: object, mock: string }[], withData: Set<string>, calls: string[] }>} */
    const byTest = new Map();

    function entryFor(node) {
      const key = enclosingTestFunction(node);
      const entry = byTest.get(key) ?? {
        bare: [],
        withData: new Set(),
        calls: []
      };
      byTest.set(key, entry);
      return entry;
    }

    return {
      CallExpression(node) {
        const chain = parseExpectChain(node);
        if (!chain || !chain.subject) return;
        const mock = sourceCode.getText(chain.subject);
        const entry = entryFor(node);

        if (BARE.has(chain.matcher)) {
          if (chain.negated) return;
          const arg = node.arguments[0];
          if (
            chain.matcher === "toHaveBeenCalledTimes" &&
            arg?.type === "Literal" &&
            arg.value === 0
          ) {
            return;
          }
          entry.bare.push({ node, mock });
        } else if (WITH_DATA.has(chain.matcher) && !chain.negated) {
          entry.withData.add(mock);
        } else {
          entry.calls.push(mock);
        }
      },

      "Program:exit"() {
        for (const { bare, withData, calls } of byTest.values()) {
          for (const { node, mock } of bare) {
            const dataChecked =
              withData.has(mock) ||
              calls.some(text => text.startsWith(`${mock}.mock.`));
            if (!dataChecked) {
              context.report({ node, messageId: "bareCalled", data: { mock } });
            }
          }
        }
      }
    };
  }
};
