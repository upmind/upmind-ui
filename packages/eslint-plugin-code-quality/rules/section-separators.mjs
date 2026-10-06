/**
 * @fileoverview `code-quality/section-separators` — one separator style.
 *
 * Two forms are legal: `// --- name` at the top of a section, and the
 * 80-character line (`// ` and 77 dashes) for a major section. Flagged:
 *  - a `// ===` separator;
 *  - a comment made only of dashes whose length is not the 80-character form;
 *  - a separator that closes a block or the file (nothing but `}` or the end
 *    of the file follows it).
 *
 * @module packages/eslint-plugin-code-quality/rules/section-separators
 */

const LONG_VALUE = ` ${"-".repeat(77)}`;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Allow only `// --- name` and the 80-character separator; no `// ===`, no odd dash length, no closing separator."
    },
    schema: [],
    messages: {
      equals: "Use `// --- name`, not a `// ===` separator.",
      length:
        "Use `// --- name` for a section or the 80-character line for a major section.",
      closing: "Remove the closing separator. A separator opens a section."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type !== "Line") continue;
          const value = comment.value;

          if (/^\s*={3,}/.test(value)) {
            context.report({ loc: comment.loc, messageId: "equals" });
            continue;
          }

          const dashOnly = /^\s*-{2,}\s*$/.test(value);
          if (dashOnly && value !== LONG_VALUE) {
            context.report({ loc: comment.loc, messageId: "length" });
            continue;
          }

          const isSeparator = dashOnly || /^\s*---\s+\S/.test(value);
          if (!isSeparator) continue;
          const next = sourceCode.getTokenAfter(comment);
          if (
            next === null ||
            (next.type === "Punctuator" && next.value === "}")
          ) {
            context.report({ loc: comment.loc, messageId: "closing" });
          }
        }
      }
    };
  }
};
