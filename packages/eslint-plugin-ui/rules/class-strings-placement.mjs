/**
 * @fileoverview `ui/class-strings-placement` — composed-component law CC26.
 *
 * Class strings live in a `<template>` (`cn()`/`class`) or in `variants.ts`
 * (`cva` exports), never in a script `const`, record, or computed. This rule
 * covers the decidable core: a `const` whose initializer is a Tailwind-looking
 * string literal, or an object/record literal of string-literal values where a
 * value looks like Tailwind classes.
 *
 * The heuristic is deliberately conservative: the string must contain a token
 * from a Tailwind-ish allow-list. A const whose string does not match is NOT
 * flagged, so plain copy (`const label = "Save";`) passes.
 *
 * Valid:   `const label = "Save";`
 * Invalid: `const box = "flex items-center gap-2 p-4";`
 * Invalid: `const SIZES = { sm: "p-2 text-sm", lg: "p-4 text-lg" };`
 *
 * A genuine exception is silenced in place with
 * `// eslint-disable-next-line ui/class-strings-placement -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/class-strings-placement
 */

/**
 * Conservative Tailwind-token heuristic. A string "looks like" Tailwind when a
 * token in it matches one of these class shapes at a word boundary.
 */
const TAILWIND_RE =
  /(^|\s)(flex|grid|p-\d|px-\d|py-\d|m-\d|text-|bg-|border|rounded|gap-\d|items-|justify-|w-|h-)/;

/** True when `value` is a string that looks like a run of Tailwind classes. */
function looksTailwind(value) {
  return typeof value === "string" && TAILWIND_RE.test(value);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind class strings in a script const/record; they belong in a template or in variants.ts (CC26).",
      recommended: true
    },
    schema: [],
    messages: {
      classString:
        "This class string belongs in the `<template>` (on the element, via `class`/`cn()`) or in `variants.ts`, not in a script const (CC26). If this really is not a class list, silence it with `// eslint-disable-next-line ui/class-strings-placement -- <reason>`.",
      classRecord:
        "This record of class strings belongs in `variants.ts`, not in a script const (CC26). If these really are not class lists, silence it with `// eslint-disable-next-line ui/class-strings-placement -- <reason>`."
    }
  },

  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind !== "const") return;

        for (const decl of node.declarations) {
          const init = decl.init;
          if (!init) continue;

          // `const box = "flex items-center gap-2 p-4";`
          if (init.type === "Literal" && looksTailwind(init.value)) {
            context.report({ node: decl, messageId: "classString" });
            continue;
          }

          // `const SIZES = { sm: "p-2 text-sm", lg: "p-4 text-lg" };`
          if (init.type === "ObjectExpression") {
            const hasTailwindValue = init.properties.some(
              (prop) =>
                prop.type === "Property" &&
                prop.value.type === "Literal" &&
                looksTailwind(prop.value.value)
            );
            if (hasTailwindValue) {
              context.report({ node: decl, messageId: "classRecord" });
            }
          }
        }
      }
    };
  }
};
