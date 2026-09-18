/**
 * @fileoverview `ui/no-cva-in-composed` — composed-component law CC3a.
 *
 * A composed main owns no presentation: the primitive it wraps does the class
 * merge. So a composed main imports no `cva` (variant builder) and no `cn`
 * (class-merge helper), and never calls `cn(...)`.
 *
 * Three discriminators, three message ids:
 *   1. `import { cva } from "class-variance-authority"` (or a local re-export) —
 *      an import specifier bringing in the name `cva`, from ANY source.
 *   2. `import { cn } from "../../lib/utils"` — importing the name `cn`.
 *   3. `cn("x")` — a call to `cn`.
 *
 * Valid:   a main with neither import and no `cn()` call.
 * Invalid: `import { cva } from "class-variance-authority";`
 * Invalid: `import { cn } from "../../lib/utils";`
 * Invalid: a `cn("x")` call.
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/no-cva-in-composed -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/no-cva-in-composed
 */

/** The banned imported names — the presentation machinery a primitive owns. */
const BANNED_IMPORTS = new Set(["cva", "cn"]);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing `cva`/`cn` or calling `cn()` in a composed main; the primitive owns the class merge (CC3a).",
      recommended: true
    },
    schema: [],
    messages: {
      cvaImport:
        "A composed main must not import `cva` (CC3a). The primitive owns its variants; the main is prop-first with no presentation. If this is deliberate, silence it with `// eslint-disable-next-line ui/no-cva-in-composed -- <reason>`.",
      cnImport:
        "A composed main must not import `cn` (CC3a). The primitive does the class merge, not the main. If this is deliberate, silence it with `// eslint-disable-next-line ui/no-cva-in-composed -- <reason>`.",
      cnCall:
        "A composed main must not call `cn(...)` (CC3a). Delegate the class merge to the primitive. If this is deliberate, silence it with `// eslint-disable-next-line ui/no-cva-in-composed -- <reason>`."
    }
  },

  create(context) {
    return {
      // `import { cva } from "..."` / `import { cn } from "..."` — any source.
      ImportDeclaration(node) {
        for (const spec of node.specifiers) {
          if (spec.type !== "ImportSpecifier") continue;
          const imported = spec.imported;
          const name =
            imported.type === "Identifier"
              ? imported.name
              : imported.type === "Literal"
                ? imported.value
                : undefined;
          if (!BANNED_IMPORTS.has(name)) continue;
          context.report({
            node: spec,
            messageId: name === "cva" ? "cvaImport" : "cnImport"
          });
        }
      },

      // `cn("x")` — a call to the class-merge helper.
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type === "Identifier" && callee.name === "cn") {
          context.report({ node, messageId: "cnCall" });
        }
      }
    };
  }
};
