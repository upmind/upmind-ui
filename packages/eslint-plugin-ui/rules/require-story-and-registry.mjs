/**
 * @fileoverview `ui/require-story-and-registry` — composed-component laws
 * CC24 + CC25 (FE-3247 Lint 17).
 *
 * A composed main `<folder>/<Name>.vue` (the namesake main at the folder root)
 * must be wired into the package three ways:
 *
 *   CC24 — a sibling `<Name>.stories.ts` sits in the folder.
 *   CC25 — the folder's `registry.ts` names `<Name>`.
 *   CC25 — the folder's `index.ts` names `<Name>`.
 *
 * The rule reads the filesystem relative to the linted `.vue`'s own path: it
 * checks the story file exists, and that `registry.ts` / `index.ts` exist and
 * mention the component name. A missing story, or a registry/index that omits
 * the name, is the error.
 *
 * Only the namesake main (PascalCase of the folder) is governed — a part under
 * `parts/`, a non-`.vue` file, or a non-namesake root `.vue` is out of scope.
 *
 * @module packages/eslint-plugin-ui/rules/require-story-and-registry
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const MARKER = "/src/components/";

/** PascalCase a folder name: `brand-gradient` → `BrandGradient`, `tabs` → `Tabs`. */
function pascalCase(folder) {
  return folder
    .split(/[-_]/)
    .filter(Boolean)
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join("");
}

/** True when the file exists and its text contains `name` as a whole word. */
function mentions(file, name) {
  if (!existsSync(file)) return false;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return false;
  }
  return new RegExp(`\\b${name}\\b`).test(text);
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "A composed main must have a sibling `<Name>.stories.ts`, and the folder's registry.ts and index.ts must name it (CC24, CC25).",
      recommended: true
    },
    schema: [],
    messages: {
      missingStory:
        "Composed main `{{name}}` has no sibling `{{story}}` in `{{folder}}/`. A composed main ships a `PropFirst` story (CC24); add `{{story}}`, or silence it in place with `// eslint-disable-next-line ui/require-story-and-registry -- <reason>`.",
      missingFromRegistry:
        "`{{folder}}/registry.ts` does not name the composed main `{{name}}`. The registry must list the composed main and its item type (CC25); add `{{name}}` to `registry.ts`, or silence it in place with `// eslint-disable-next-line ui/require-story-and-registry -- <reason>`.",
      missingFromIndex:
        "`{{folder}}/index.ts` does not name the composed main `{{name}}`. The barrel must export the composed main (CC25); add `{{name}}` to `index.ts`, or silence it in place with `// eslint-disable-next-line ui/require-story-and-registry -- <reason>`."
    }
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    const marker = filename.indexOf(MARKER);
    if (marker === -1) return {};

    const after = filename.slice(marker + MARKER.length);
    const segments = after.split("/");
    const folder = segments[0];
    const rel = segments.slice(1);

    // Only the namesake main sitting DIRECTLY at the folder root is governed.
    if (rel.length !== 1) return {};
    const base = rel[0];
    if (!base.endsWith(".vue")) return {};
    const name = base.slice(0, -".vue".length);
    if (name !== pascalCase(folder)) return {};

    const dir = dirname(filename);
    const storyBase = `${name}.stories.ts`;

    return {
      Program(node) {
        if (!existsSync(join(dir, storyBase))) {
          context.report({
            node,
            messageId: "missingStory",
            data: { name, folder, story: storyBase }
          });
        }
        if (!mentions(join(dir, "registry.ts"), name)) {
          context.report({
            node,
            messageId: "missingFromRegistry",
            data: { name, folder }
          });
        }
        if (!mentions(join(dir, "index.ts"), name)) {
          context.report({
            node,
            messageId: "missingFromIndex",
            data: { name, folder }
          });
        }
      }
    };
  }
};
