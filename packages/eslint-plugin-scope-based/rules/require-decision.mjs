/**
 * @fileoverview `scope-based/require-decision` — variance-law clause 5.
 *
 * Every `@decision` comment block must carry `what:`, `why:` and `rejected:`.
 * Any missing field means the deviation is unjustified.
 *
 * Because grouping runs off real comment nodes (not a line-walk over raw text),
 * two back-to-back `// @decision` runs are two separate blocks — an incomplete
 * second block can no longer inherit the first's fields (the `law-checker.mjs`
 * `extractCommentBlockAround` merge bug, F5).
 *
 * @module packages/eslint-plugin-scope-based/rules/require-decision
 */

import { getDecisionBlocks, REQUIRED_DECISION_FIELDS } from "../util.mjs";

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require every @decision block to carry what/why/rejected (variance-law clause 5).",
      recommended: true
    },
    schema: [],
    messages: {
      missingFields:
        "@decision block is missing required field(s): {{missing}}. A complete block carries `what:`, `why:` and `rejected:`."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program() {
        for (const block of getDecisionBlocks(sourceCode)) {
          const missing = REQUIRED_DECISION_FIELDS.filter(
            field => !block.fields[field]
          );
          if (missing.length === 0) continue;
          context.report({
            loc: block.node.loc,
            messageId: "missingFields",
            data: { missing: missing.join(", ") }
          });
        }
      }
    };
  }
};
