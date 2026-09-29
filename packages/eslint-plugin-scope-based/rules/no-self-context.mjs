/**
 * @fileoverview `scope-based/no-self-context` — a module never takes its own
 * record as a `.for()` context.
 *
 * `.for()` names ANOTHER entity the actor acts for: a client, a contract, a
 * lead. A module's own record is a record id, and it arrives on `.withId(id)`
 * (ADR-001, amendment 2026-09-15). A `*ContextTypes` member whose value is the
 * module's own name (`CONTRACT = "contract"` in `modules/contract/`) makes the
 * module load itself through `.for()` — the FE-3029 defect, copied from a
 * template that did the same.
 *
 * The rule reads `modules/<name>/<file>.types.ts` and reports a member of any
 * enum named `…ContextTypes` whose string value is `<name>`, compared with `-`
 * and `_` treated alike.
 *
 * @module packages/eslint-plugin-scope-based/rules/no-self-context
 */

const MODULE_TYPES_FILE = /\/modules\/([^/]+)\/[^/]+\.types\.ts$/;

const normalise = value => value.replace(/[-_]/g, "_").toLowerCase();

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow a context type whose value is the module's own entity; a module's own record comes from `.withId(id)`, never `.for()` (ADR-001, amendment 2026-09-15).",
      recommended: true
    },
    schema: [],
    messages: {
      selfContext:
        "`{{member}}` makes `{{module}}` load its own record through `.for()`. `.for()` only names another entity the actor acts for; read the module's own record from `.withId(id)` (`config.id`) and drop this member (ADR-001, amendment 2026-09-15)."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const match = MODULE_TYPES_FILE.exec(filename.replace(/\\/g, "/"));
    if (!match) return {};
    const moduleName = normalise(match[1]);

    return {
      TSEnumDeclaration(node) {
        if (!node.id.name.endsWith("ContextTypes")) return;
        const members = node.body?.members ?? node.members ?? [];
        for (const member of members) {
          const value = member.initializer;
          if (value?.type !== "Literal" || typeof value.value !== "string")
            continue;
          if (normalise(value.value) !== moduleName) continue;
          context.report({
            node: member,
            messageId: "selfContext",
            data: {
              member: `${node.id.name}.${member.id.name ?? member.id.value}`,
              module: match[1]
            }
          });
        }
      }
    };
  }
};
