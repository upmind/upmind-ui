/**
 * @fileoverview `scope-based/arm-in-matrix` — an arm's actor must be declared
 * in the module's scope matrix.
 *
 * One-directional: every `.{actor}.ts` arm's actor MUST appear as a key in the
 * module's scope matrix (`{ [ScopeActorTypes.CLIENT]: … }`). The reverse does
 * not hold — a matrix entry needn't have an arm (arms stay opt-in). So an arm
 * for an actor the matrix never declares is an orphan (a typo, or a capability
 * the matrix forgot to admit).
 *
 * If the module declares no scope matrix at all, there is nothing to match
 * against and the rule stays silent.
 *
 * SCOPE (known limitation): "the module's matrix" is the union of every
 * `[ScopeActorTypes.X]` key across the module directory. This is exact for a
 * single-composable module (the common case) and correct for module-named
 * data-layer arms (`{module}.services.{actor}.ts`), which are module-scoped. In
 * a directory hosting MULTIPLE composables with DIVERGENT matrices, a
 * composable-named arm (`useX.actions.{actor}.ts`) for an actor its own
 * composable omits but a sibling declares would pass — resolving each arm to
 * its specific composable's matrix isn't decidable from naming alone (matrices
 * are module-level), so the union is the honest scope, not a per-composable check.
 *
 * @module packages/eslint-plugin-scope-based/rules/arm-in-matrix
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ARM_FILENAME_RE, basenameOf } from "../util.mjs";

const ACTOR_ENUM = { client: "CLIENT", staff: "STAFF", guest: "GUEST" };
// A scope-matrix computed key: `[ScopeActorTypes.CLIENT]:`.
const MATRIX_KEY_RE =
  /\[\s*ScopeActorTypes\.(CLIENT|STAFF|GUEST|SELF)\s*\]\s*:/g;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "An arm's actor must be declared in the module's scope matrix; an arm for an undeclared actor is an orphan.",
      recommended: true
    },
    schema: [],
    messages: {
      orphanArm:
        "Arm actor `{{actor}}` (`ScopeActorTypes.{{enum}}`) is not declared in the module's scope matrix (declared: {{declared}}). Add it to the matrix, or the arm is an orphan."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const armMatch = basenameOf(filename).match(ARM_FILENAME_RE);
    if (!armMatch) return {};

    const actor = armMatch[2];
    const enumName = ACTOR_ENUM[actor];
    const dir = dirname(filename);

    return {
      Program(node) {
        const declared = new Set();
        let entries;
        try {
          entries = readdirSync(dir);
        } catch {
          return;
        }
        for (const entry of entries) {
          if (!entry.endsWith(".ts")) continue;
          let text;
          try {
            text = readFileSync(join(dir, entry), "utf8");
          } catch {
            continue;
          }
          MATRIX_KEY_RE.lastIndex = 0;
          let m;
          while ((m = MATRIX_KEY_RE.exec(text)) !== null) declared.add(m[1]);
        }

        // No matrix anywhere in the module → nothing to match against.
        if (declared.size === 0) return;

        if (!declared.has(enumName)) {
          context.report({
            node,
            messageId: "orphanArm",
            data: {
              actor,
              enum: enumName,
              declared: [...declared].join(", ")
            }
          });
        }
      }
    };
  }
};
