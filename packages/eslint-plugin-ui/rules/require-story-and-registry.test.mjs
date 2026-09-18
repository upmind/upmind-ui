/**
 * @fileoverview RuleTester spec for `ui/require-story-and-registry`
 * (CC24 + CC25, FE-3247 Lint 17).
 *
 * The rule reads the filesystem relative to the linted `.vue`'s path, so the
 * test builds real component folders in a fresh temp dir — a fully-wired good
 * folder and three broken ones — and lints each namesake main by its real
 * `filename`. Both directions are covered; each discriminator is load-bearing.
 *
 * Run: node --test packages/eslint-plugin-ui/rules/require-story-and-registry.test.mjs
 */

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import requireStoryAndRegistry from "./require-story-and-registry.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const root = mkdtempSync(join(tmpdir(), "ui-story-registry-"));
const UI = join(root, "design-system/packages/ui/src/components");
function touch(relPath, content = "") {
  const abs = join(UI, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
  return abs;
}
process.on("exit", () => rmSync(root, { recursive: true, force: true }));

// GOOD folder — full wiring: main + story + registry/index that name Tabs.
const goodMain = touch("tabs/Tabs.vue");
touch("tabs/Tabs.stories.ts", `export const PropFirst = {};\n`);
touch(
  "tabs/registry.ts",
  `export default defineRegistryEntry({ name: "Tabs", exports: ["Tabs", "TabItem"] });\n`
);
touch(
  "tabs/index.ts",
  `export { default as Tabs } from "./Tabs.vue";\nexport type { TabItem } from "./types.ts";\n`
);
// A part in the good folder — out of scope, must stay silent.
const goodPart = touch("tabs/parts/TabsList.vue");

// BAD-1: story file missing.
const noStoryMain = touch("badge/Badge.vue");
touch(
  "badge/registry.ts",
  `export default defineRegistryEntry({ name: "Badge" });\n`
);
touch("badge/index.ts", `export { default as Badge } from "./Badge.vue";\n`);

// BAD-2: registry.ts present but never names the component.
const noRegistryNameMain = touch("chip/Chip.vue");
touch("chip/Chip.stories.ts", `export const PropFirst = {};\n`);
touch(
  "chip/registry.ts",
  `export default defineRegistryEntry({ name: "Something" });\n`
);
touch("chip/index.ts", `export { default as Chip } from "./Chip.vue";\n`);

// BAD-3: index.ts missing entirely + registry missing name — two reports.
const noIndexMain = touch("pill/Pill.vue");
touch("pill/Pill.stories.ts", `export const PropFirst = {};\n`);
touch(
  "pill/registry.ts",
  `export default defineRegistryEntry({ name: "Nope" });\n`
);

const at = filename => ({ code: `export {};`, filename });

test("require-story-and-registry", () => {
  ruleTester.run("require-story-and-registry", requireStoryAndRegistry, {
    valid: [
      // Fully wired composed main.
      at(goodMain),
      // A part is not governed.
      at(goodPart)
    ],
    invalid: [
      {
        ...at(noStoryMain),
        errors: [{ messageId: "missingStory" }]
      },
      {
        ...at(noRegistryNameMain),
        errors: [{ messageId: "missingFromRegistry" }]
      },
      {
        ...at(noIndexMain),
        errors: [
          { messageId: "missingFromRegistry" },
          { messageId: "missingFromIndex" }
        ]
      }
    ]
  });
});
