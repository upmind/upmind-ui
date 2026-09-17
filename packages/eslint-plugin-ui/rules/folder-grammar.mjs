/**
 * @fileoverview `ui/folder-grammar` — composed-component law CC-B (FE-3247 Lint 5).
 *
 * In a composed-component folder under `design-system/packages/ui/src/components/<folder>/`,
 * the namesake main `<Name>.vue` sits at the folder ROOT; every OTHER `.vue`
 * must sit under `parts/`. So a `.vue` file directly in the folder root whose
 * basename is NOT the folder's namesake main is an error — it is a part that
 * escaped `parts/`.
 *
 * The namesake main is the PascalCase of the folder name (`tabs` → `Tabs`,
 * `brand-gradient` → `BrandGradient`). A folder that legitimately hosts more
 * than one root main (a sibling-mains folder) is exempted by the
 * `sibling-mains` allow-list option (default empty).
 *
 * The rule reads only the linted file's OWN path, so it is decidable from the
 * filename alone — the SFC body is never parsed.
 *
 *   Valid:   `tabs/Tabs.vue` (namesake), `tabs/parts/TabsList.vue` (a part).
 *   Invalid: `tabs/TabsList.vue` (a part loose at the folder root).
 *
 * @module packages/eslint-plugin-ui/rules/folder-grammar
 */

const MARKER = "/src/components/";

/** PascalCase a folder name: `brand-gradient` → `BrandGradient`, `tabs` → `Tabs`. */
function pascalCase(folder) {
  return folder
    .split(/[-_]/)
    .filter(Boolean)
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "In a composed-component folder, the namesake main `<Name>.vue` sits at the folder root; every other `.vue` must live under `parts/` (CC-B).",
      recommended: true
    },
    schema: [
      {
        type: "object",
        properties: {
          "sibling-mains": {
            type: "array",
            items: { type: "string" },
            uniqueItems: true
          }
        },
        additionalProperties: false
      }
    ],
    messages: {
      partAtRoot:
        "`{{file}}` is a part loose at the root of `{{folder}}/`. Only the namesake main `{{namesake}}.vue` sits at the folder root; move this file under `{{folder}}/parts/` (CC-B). If `{{folder}}/` legitimately hosts sibling mains, add it to the rule's `sibling-mains` allow-list, or silence this file in place with `// eslint-disable-next-line ui/folder-grammar -- <reason>`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const marker = filename.indexOf(MARKER);
    if (marker === -1) return {};

    const after = filename.slice(marker + MARKER.length);
    const segments = after.split("/");
    // `<folder>/<file>` at root, or `<folder>/parts/<file>` (or deeper).
    const folder = segments[0];
    const rel = segments.slice(1);

    // Only a `.vue` sitting DIRECTLY in the folder root is a candidate. A file
    // under `parts/` (rel.length > 1) is always allowed; a non-`.vue` file is
    // out of scope.
    if (rel.length !== 1) return {};
    const base = rel[0];
    if (!base.endsWith(".vue")) return {};

    const allowList = context.options[0]?.["sibling-mains"] ?? [];
    if (allowList.includes(folder)) return {};

    const namesake = pascalCase(folder);
    const name = base.slice(0, -".vue".length);
    if (name === namesake) return {};

    return {
      Program(node) {
        context.report({
          node,
          messageId: "partAtRoot",
          data: { file: base, folder, namesake }
        });
      }
    };
  }
};
