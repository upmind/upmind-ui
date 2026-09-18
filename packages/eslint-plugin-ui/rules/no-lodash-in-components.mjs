/**
 * @fileoverview `ui/no-lodash-in-components` — composed-component law CC13a.
 *
 * `design-system/packages/ui/src/components/**` may not import `lodash-es`
 * (or `lodash`, or a `lodash-es/*` deep path). Native methods and the local
 * `lib/utils.ts` helpers stand in — the ban is stated in
 * `design-system/packages/ui/COMPONENT_SPEC.md:62-64` and confirmed live:
 * zero files under `src/components/**` import lodash today; the 28 real
 * importers all sit under the vendored `src/form/**` subtree, which the
 * `eslint.config.mjs` glob for this rule excludes.
 *
 * This is the UI-library carve-out of the repo-wide Lodash mandate
 * (`.claude/rules/code-quality.companion.md`): lodash everywhere EXCEPT the
 * composed components.
 *
 * A genuinely-needed lodash import (none exists today) is silenced in place
 * with `// eslint-disable-next-line ui/no-lodash-in-components -- <reason>`.
 *
 * @module packages/eslint-plugin-ui/rules/no-lodash-in-components
 */

/** True for `lodash-es`, `lodash`, and any `lodash-es/x` / `lodash/x` deep path. */
function isLodashSource(value) {
  return (
    value === "lodash-es" ||
    value === "lodash" ||
    value.startsWith("lodash-es/") ||
    value.startsWith("lodash/")
  );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow importing lodash inside design-system/packages/ui composed components; the components carve out of the repo-wide Lodash mandate (COMPONENT_SPEC.md, CC13a).",
      recommended: true
    },
    schema: [],
    messages: {
      lodashImport:
        "A composed component must not import `{{source}}`. lodash is banned under design-system/packages/ui/src/components/** (COMPONENT_SPEC.md); use a native method or a local `lib/utils.ts` helper. If this import is genuinely needed, silence it with `// eslint-disable-next-line ui/no-lodash-in-components -- <reason>`."
    }
  },

  create(context) {
    const flag = (node, source) => {
      if (typeof source === "string" && isLodashSource(source)) {
        context.report({ node, messageId: "lodashImport", data: { source } });
      }
    };

    return {
      // `import … from "lodash-es"`
      ImportDeclaration(node) {
        flag(node, node.source.value);
      },
      // `export … from "lodash-es"` (re-export)
      ExportNamedDeclaration(node) {
        if (node.source) flag(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        if (node.source) flag(node, node.source.value);
      },
      // `require("lodash-es")`
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "require") return;
        const arg = node.arguments[0];
        if (arg && arg.type === "Literal") flag(node, arg.value);
      },
      // dynamic `import("lodash-es")` — an ImportExpression, not a CallExpression
      ImportExpression(node) {
        const arg = node.source;
        if (arg && arg.type === "Literal") flag(node, arg.value);
      }
    };
  }
};
