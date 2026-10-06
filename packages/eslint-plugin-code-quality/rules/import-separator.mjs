/**
 * @fileoverview `code-quality/import-separator` — an 80-character separator
 * follows the imports.
 *
 * The first non-blank line after the last import declaration is two slashes, a
 * space and 77 dashes. A file with no import is not checked. Autofix inserts
 * the separator on the line after the last import.
 *
 * @module packages/eslint-plugin-code-quality/rules/import-separator
 */

const SEPARATOR = `// ${"-".repeat(77)}`;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "layout",
    fixable: "code",
    docs: {
      description:
        "Require the 80-character separator line after the last import."
    },
    schema: [],
    messages: {
      missing:
        "Add the 80-character separator (`// ` and 77 dashes) after the imports."
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      "Program:exit"(program) {
        const imports = program.body.filter(
          n => n.type === "ImportDeclaration"
        );
        if (imports.length === 0) return;
        const last = imports[imports.length - 1];
        const lines = sourceCode.lines;
        let index = last.loc.end.line; // zero-based index of the line after the import
        while (index < lines.length && lines[index].trim() === "") index++;
        if (index < lines.length && lines[index].trim() === SEPARATOR) return;
        context.report({
          node: last,
          messageId: "missing",
          fix: fixer => fixer.insertTextAfter(last, `\n${SEPARATOR}`)
        });
      }
    };
  }
};
