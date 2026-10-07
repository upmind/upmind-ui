/**
 * @fileoverview `code-quality/file-header` — every file carries the header.
 *
 * The header is the 80-character separator (`// ` and 77 dashes) followed at
 * once by a JSDoc block that holds `@module <module>/<file>` and
 * `@description`. It sits after the imports (or at the top of a file with no
 * import). The first separator line in the file is the header's. An internal
 * file keeps `/** @internal *\/` as line 1 ahead of it.
 *
 * An empty file has no header to carry and is not checked.
 *
 * @module packages/eslint-plugin-code-quality/rules/file-header
 */

const SEPARATOR = `// ${"-".repeat(77)}`;
const MODULE_TAG = /@module\s+[A-Za-z0-9_.-]+\/[^\s*]+/;
const DESCRIPTION_TAG = /@description\b/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require the separator line and a JSDoc block with `@module <module>/<file>` and `@description`."
    },
    schema: [],
    messages: {
      noSeparator:
        "Add the file header: the 80-character separator, then a JSDoc block with `@module <module>/<file>` and `@description`.",
      noBlock:
        "Follow the separator with a JSDoc block (`/** @module <module>/<file> @description ... */`).",
      noModule:
        "Add `@module <module>/<file>` to the header block (for example `auth/services.client`).",
      noDescription: "Add `@description` to the header block."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      "Program:exit"(program) {
        if (program.body.length === 0) return;
        const comments = sourceCode.getAllComments();
        const at = comments.findIndex(
          c => c.type === "Line" && `//${c.value}`.trimEnd() === SEPARATOR
        );
        if (at === -1) {
          context.report({
            loc: { line: 1, column: 0 },
            messageId: "noSeparator"
          });
          return;
        }
        const block = comments[at + 1];
        const isHeaderBlock =
          block &&
          block.type === "Block" &&
          block.value.startsWith("*") &&
          sourceCode.text
            .slice(comments[at].range[1], block.range[0])
            .trim() === "";
        if (!isHeaderBlock) {
          context.report({ loc: comments[at].loc, messageId: "noBlock" });
          return;
        }
        if (!MODULE_TAG.test(block.value)) {
          context.report({ loc: block.loc, messageId: "noModule" });
        }
        if (!DESCRIPTION_TAG.test(block.value)) {
          context.report({ loc: block.loc, messageId: "noDescription" });
        }
      }
    };
  }
};
