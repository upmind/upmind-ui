/**
 * @fileoverview `scope-based/complete-layer-set` — the decidable half of
 * variance-law clause 1.
 *
 * Rather than compare return shapes across actors (noisy, judgement-heavy), it
 * checks the two things that ARE mechanically decidable:
 *
 *   1. LAYER COMPLETENESS — a scoped composable `useX.ts` (one that uses
 *      `createScopedComposable`, or already has any of its sub-layer files) must
 *      carry the full sub-composable set: `useX.actions.ts`, `useX.context.ts`,
 *      `useX.meta.ts`, `useX.internals.ts`. A partial split (some layers, not
 *      all) is the error.
 *
 *   2. INTERNAL MARKER — a module's data-layer files (`{module}.services.ts`,
 *      `.machine.ts`, `.mappers.ts`, `.schemas.ts`) must carry the `@internal`
 *      head marker the Module Visibility Law requires.
 *
 * @module packages/eslint-plugin-scope-based/rules/complete-layer-set
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { basenameOf } from "../util.mjs";

const SUB_LAYERS = ["actions", "context", "meta", "internals"];
const COMPOSABLE_ENTRY_RE = /^(use[A-Z][A-Za-z0-9_]*)\.ts$/;
// Base data-layer files only — an actor arm (`.services.client.ts`) ends with
// the actor segment, so it never matches these.
const INTERNAL_DATA_RE = /^(.*)\.(services|machine|mappers|schemas)\.ts$/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A scoped composable must carry its full sub-composable layer set, and data-layer files must be marked @internal (variance-law clause 1 + Module Visibility Law).",
      recommended: true
    },
    schema: [],
    messages: {
      missingLayer:
        "Scoped composable `{{composable}}` is missing its `{{layer}}` layer (expected `{{expected}}`). A scoped composable carries the full set: actions, context, meta, internals.",
      missingInternal:
        "Data-layer file `{{file}}` must carry an `@internal` head marker (Module Visibility Law) — it is reachable only through the module's public composable, never cross-module."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const dir = dirname(filename);
    const base = basenameOf(filename);
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    // AST-detected (not a text regex, so a comment/string mention of the
    // factory can't misclassify a flat composable as scoped, W66): a real
    // import of, or call to, createScopedComposable.
    let usesScopedFactory = false;

    return {
      "ImportSpecifier[imported.name='createScopedComposable']"() {
        usesScopedFactory = true;
      },
      "CallExpression[callee.name='createScopedComposable']"() {
        usesScopedFactory = true;
      },

      "Program:exit"(node) {
        const entryMatch = base.match(COMPOSABLE_ENTRY_RE);
        if (entryMatch) {
          const composable = entryMatch[1];
          const present = SUB_LAYERS.filter(layer =>
            existsSync(join(dir, `${composable}.${layer}.ts`))
          );
          const isScoped = present.length > 0 || usesScopedFactory;
          if (isScoped) {
            for (const layer of SUB_LAYERS) {
              if (present.includes(layer)) continue;
              context.report({
                node,
                messageId: "missingLayer",
                data: {
                  composable,
                  layer,
                  expected: `${composable}.${layer}.ts`
                }
              });
            }
          }
          return;
        }

        const dataMatch = base.match(INTERNAL_DATA_RE);
        if (dataMatch) {
          // Full-text scan, not a fixed 15-line window: the marker is a head
          // marker, but a file whose import block pushes @internal past line 15
          // must not be falsely flagged (W89). A stray later mention only ever
          // means "internal", so scanning the whole file is boundary-proof.
          if (!/@internal\b/.test(sourceCode.getText())) {
            context.report({
              node,
              messageId: "missingInternal",
              data: { file: base }
            });
          }
        }
      }
    };
  }
};
