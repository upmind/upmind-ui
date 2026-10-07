/**
 * @fileoverview `file-responsibility/consistent-type-definitions` — FE-3249 #7.
 *
 * Describe a shape with `type`, not `interface` — the repo convention. This is
 * the built-in `@typescript-eslint/consistent-type-definitions: ["error",
 * "type"]` with ONE structural carve-out the built-in lacks: an `interface`
 * used for DECLARATION MERGING is exempt, because there `type` is not legal.
 *
 * The carve-out is decidable: an `interface` declared inside an ambient module
 * — `declare global { … }` or `declare module "pkg" { … }` — augments an
 * existing declaration (`Window`, a third-party `JsonSchema7`, `RouteMeta`).
 * TypeScript accepts only `interface` for that; a `type` alias cannot reopen an
 * existing name. So an ambient interface is left alone; every other interface
 * is flagged and auto-fixed to `type`, `extends` folded into an intersection.
 *
 * A file may mix both — `system-analytics.types.ts` augments `Window` AND
 * declares plain `DataLayer*` shapes — so the exemption is per-declaration, by
 * ambient ancestry, never per-file.
 *
 * @module packages/eslint-plugin-file-responsibility/rules/consistent-type-definitions
 */

/** True when a node is inside a `declare global` / `declare module` block. */
function inAmbientModule(node) {
  for (let cur = node.parent; cur; cur = cur.parent) {
    if (cur.type === "TSModuleDeclaration") return true;
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description:
        "Require `type` over `interface`, except an interface used for declaration merging inside an ambient `declare global` / `declare module` block (FE-3249 #7).",
      recommended: true
    },
    schema: [],
    messages: {
      preferType:
        "Use `type` to describe a shape, not `interface`. (An interface augmenting an ambient `declare global` / `declare module` declaration is exempt — `type` cannot reopen an existing name.)"
    }
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    return {
      TSInterfaceDeclaration(node) {
        // Declaration merging needs `interface`; leave an ambient one alone.
        if (inAmbientModule(node)) return;

        context.report({
          node: node.id,
          messageId: "preferType",
          fix(fixer) {
            const fixes = [];
            // `interface` keyword → `type`. A `declare` modifier is part of the
            // node, so find the keyword token itself, not the first token.
            const kw = sourceCode.getFirstToken(node, (t) => t.value === "interface");
            if (kw) fixes.push(fixer.replaceText(kw, "type"));

            // Insert ` = ` between the name (and type params) and the body,
            // folding any `extends A, B` into a leading `A & B & ` intersection.
            const afterHead = (node.typeParameters ?? node.id).range[1];
            const bodyStart = node.body.range[0];
            const ext = node.extends ?? [];
            const prefix = ext.length
              ? ` = ${ext.map(e => sourceCode.getText(e)).join(" & ")} & `
              : " = ";
            fixes.push(fixer.replaceTextRange([afterHead, bodyStart], prefix));
            return fixes;
          }
        });
      }
    };
  }
};
