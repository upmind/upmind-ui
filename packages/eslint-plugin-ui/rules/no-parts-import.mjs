/**
 * @fileoverview `ui/no-parts-import` — composed-component law CC-C (FE-3247 Lint 6).
 *
 * A file OUTSIDE `design-system/packages/ui/src/components/**` must not import a
 * component from a `.../components/<folder>/parts/...` path. Consumers reach a
 * composed component through its folder barrel (`.../components/tabs`), never by
 * deep-linking a part — the parts are the package's private interior.
 *
 * This is the decidable core of CC-C: it flags ANY import specifier whose path
 * contains `/components/<folder>/parts/`, made from a file whose OWN path is NOT
 * under `.../src/components/`. Internal sibling wiring (a part importing a part)
 * is left alone; only cross-boundary deep-links are the error.
 *
 *   Valid:   `import { Tabs } from ".../components/tabs";`  (the barrel).
 *   Invalid: `import TabsList from ".../components/tabs/parts/TabsList.vue";`
 *            from an app file.
 *
 * @module packages/eslint-plugin-ui/rules/no-parts-import
 */

const INTERNAL_MARKER = "/src/components/";
// A deep-link into a folder's private parts: `/components/<folder>/parts/`.
const PARTS_PATH_RE = /\/components\/[^/]+\/parts\//;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A consumer outside design-system/packages/ui/src/components/** must import a composed component through its folder barrel, never deep-link a `parts/` file (CC-C).",
      recommended: true
    },
    schema: [],
    messages: {
      partsImport:
        "Import `{{source}}` deep-links a composed component's private `parts/`. Import the component from its folder barrel (e.g. `.../components/<folder>`) instead; `parts/` is the package's interior (CC-C). If this deep-link is genuinely needed, silence it in place with `// eslint-disable-next-line ui/no-parts-import -- <reason>`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    // A file INSIDE the components tree is the interior — its parts wiring is
    // allowed. Only a consumer OUTSIDE the tree is held to the barrier.
    if (filename.includes(INTERNAL_MARKER)) return {};

    const flag = (node, source) => {
      if (typeof source === "string" && PARTS_PATH_RE.test(source)) {
        context.report({ node, messageId: "partsImport", data: { source } });
      }
    };

    return {
      ImportDeclaration(node) {
        flag(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) flag(node, node.source.value);
      },
      ExportAllDeclaration(node) {
        if (node.source) flag(node, node.source.value);
      },
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "Identifier" || callee.name !== "require") return;
        const arg = node.arguments[0];
        if (arg && arg.type === "Literal") flag(node, arg.value);
      },
      ImportExpression(node) {
        const arg = node.source;
        if (arg && arg.type === "Literal") flag(node, arg.value);
      }
    };
  }
};
