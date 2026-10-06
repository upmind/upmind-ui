/**
 * @fileoverview `code-quality/no-comment-in-imports` — no comment inside an
 * import block.
 *
 * The linter orders imports. A comment between the first and the last import
 * declaration (a `// ---` group label, a note) has no place there.
 *
 * @module packages/eslint-plugin-code-quality/rules/no-comment-in-imports
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow any comment between the first and the last import declaration."
    },
    schema: [],
    messages: {
      commentInImports:
        "Remove this comment. An import block holds no comment; the linter orders it."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      "Program:exit"(program) {
        const imports = program.body.filter(
          n => n.type === "ImportDeclaration"
        );
        if (imports.length < 2) return;
        const start = imports[0].range[1];
        const end = imports[imports.length - 1].range[0];
        for (const comment of sourceCode.getAllComments()) {
          if (comment.range[0] >= start && comment.range[1] <= end) {
            context.report({ loc: comment.loc, messageId: "commentInImports" });
          }
        }
      }
    };
  }
};
