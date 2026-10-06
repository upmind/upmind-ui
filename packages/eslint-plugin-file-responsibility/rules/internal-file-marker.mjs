/**
 * @fileoverview `file-responsibility/internal-file-marker` — an internal file
 * carries `/** @internal *\/` as line 1.
 *
 * A file whose name matches the configured internal patterns must start with
 * the exact line `/** @internal *\/`. The default patterns cover
 * `*.machine.ts`, `*.services.ts`, `*.mappers.ts`, `*.schemas.ts` (and actor
 * variants) and `session-store.*`. The `patterns` option replaces them with a
 * list of regular-expression sources matched against the file path. Autofix
 * inserts the marker.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/internal-file-marker
 */

import { INTERNAL_FILE_PATTERNS, isTestFile } from "../util.mjs";

const MARKER = "/** @internal */";
const DEFAULT_PATTERNS = INTERNAL_FILE_PATTERNS;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Require `/** @internal */` as line 1 of an internal module file (machine, services, mappers, schemas, session-store)."
    },
    schema: [
      {
        type: "object",
        properties: {
          patterns: { type: "array", items: { type: "string" } }
        },
        additionalProperties: false
      }
    ],
    messages: {
      missingMarker: "Add `/** @internal */` as line 1 of this internal file."
    }
  },

  create(context) {
    const filename = (context.filename ?? context.getFilename()).replace(
      /\\/g,
      "/"
    );
    if (isTestFile(filename)) return {};
    const options = context.options[0] ?? {};
    const patterns = (options.patterns ?? DEFAULT_PATTERNS).map(
      source => new RegExp(source)
    );
    if (!patterns.some(re => re.test(filename))) return {};

    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      Program() {
        const first = sourceCode.lines[0] ?? "";
        if (first.trim() === MARKER) return;
        context.report({
          loc: { line: 1, column: 0 },
          messageId: "missingMarker",
          fix: fixer => fixer.insertTextBeforeRange([0, 0], `${MARKER}\n`)
        });
      }
    };
  }
};
