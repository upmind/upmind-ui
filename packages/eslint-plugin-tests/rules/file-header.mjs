/**
 * @fileoverview `tests/file-header` — a test file opens with a JSDoc block that
 * holds `@fileoverview`, `## Job To Be Done` and `## What Breaks If These Fail`
 * (code-tests §File Structure).
 *
 * The block is the first `/** ... *\/` comment before the first statement. Line
 * comments before it (a divider line) are allowed.
 *
 * @module packages/eslint-plugin-tests/rules/file-header
 */

const REQUIRED = [
  { label: "@fileoverview", pattern: /@fileoverview\b/ },
  { label: "## Job To Be Done", pattern: /^[\s*]*##\s+Job To Be Done\b/im },
  {
    label: "## What Breaks If These Fail",
    pattern: /^[\s*]*##\s+What Breaks If These Fail\b/im
  }
];

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A test file opens with a JSDoc header holding @fileoverview, Job To Be Done and What Breaks If These Fail.",
      recommended: true
    },
    schema: [],
    messages: {
      noHeader:
        "A test file opens with a JSDoc block holding `@fileoverview`, `## Job To Be Done` and `## What Breaks If These Fail`.",
      missingPart:
        "The file header is missing `{{part}}`. A test file header holds `@fileoverview`, `## Job To Be Done` and `## What Breaks If These Fail`."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program(program) {
        const firstStatementStart = program.body[0]?.range[0] ?? Infinity;
        const header = sourceCode
          .getAllComments()
          .find(
            comment =>
              comment.type === "Block" &&
              comment.value.startsWith("*") &&
              comment.range[1] <= firstStatementStart
          );
        const loc = { line: 1, column: 0 };

        if (!header) {
          context.report({ loc, messageId: "noHeader" });
          return;
        }
        const missing = REQUIRED.filter(
          ({ pattern }) => !pattern.test(header.value)
        ).map(({ label }) => label);
        if (missing.length > 0) {
          context.report({
            loc: header.loc,
            messageId: "missingPart",
            data: { part: missing.join("`, `") }
          });
        }
      }
    };
  }
};
