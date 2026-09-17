/**
 * @fileoverview RuleTester spec for `ui/folder-grammar` (CC-B, FE-3247 Lint 5).
 *
 * The rule decides from the linted file's OWN path — the namesake main sits at
 * the folder root, every other `.vue` under `parts/`. To keep the test honest
 * about paths (not string literals), it builds a real component folder tree in
 * a fresh temp dir, then lints each `.vue` by its real `filename`. The SFC body
 * is never parsed, so the linted `code` is an inert JS module; only `filename`
 * carries the signal.
 *
 * Both directions are covered, and each discriminator is load-bearing: gutting
 * the namesake/root check turns an invalid spec green.
 *
 * Run: node --test packages/eslint-plugin-ui/rules/folder-grammar.test.mjs
 */

import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import folderGrammar from "./folder-grammar.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

// Real fixture tree in a temp dir, mirroring
// design-system/packages/ui/src/components/**. Every `touch`ed path is a real
// file on disk, so the rule's path arithmetic runs against a genuine layout.
const root = mkdtempSync(join(tmpdir(), "ui-folder-grammar-"));
const UI = join(root, "design-system/packages/ui/src/components");
function touch(relPath, content = "") {
  const abs = join(UI, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, "utf8");
  return abs;
}
process.on("exit", () => rmSync(root, { recursive: true, force: true }));

// A composed folder: namesake main at root, parts under parts/.
const tabsMain = touch("tabs/Tabs.vue");
const tabsPart = touch("tabs/parts/TabsList.vue");
// The violation: a part loose at the folder root.
const tabsLoosePart = touch("tabs/TabsList.vue");

// A hyphenated folder — namesake is the PascalCase of the whole slug.
const gradientMain = touch("brand-gradient/BrandGradient.vue");
// A loose non-namesake `.vue` at a hyphenated folder root.
const gradientLoose = touch("brand-gradient/GradientStop.vue");

// A non-`.vue` file at the folder root is out of scope.
const tabsIndex = touch("tabs/index.ts", `export {};\n`);
// A file outside the components tree is out of scope.
const stray = join(root, "somewhere/Loose.vue");
mkdirSync(dirname(stray), { recursive: true });
writeFileSync(stray, "", "utf8");

// The linted `code` is inert — only `filename` is read.
const at = filename => ({ code: `export {};`, filename });

test("folder-grammar", () => {
  ruleTester.run("folder-grammar", folderGrammar, {
    valid: [
      // Namesake main at the folder root.
      at(tabsMain),
      // A part correctly nested under parts/.
      at(tabsPart),
      // Hyphenated-folder namesake main.
      at(gradientMain),
      // A non-`.vue` file at the root is not governed.
      at(tabsIndex),
      // A `.vue` outside the components tree is not governed.
      at(stray),
      // sibling-mains allow-list exempts the whole folder.
      {
        code: `export {};`,
        filename: gradientLoose,
        options: [{ "sibling-mains": ["brand-gradient"] }]
      }
    ],
    invalid: [
      // A part loose at the folder root.
      { ...at(tabsLoosePart), errors: [{ messageId: "partAtRoot" }] },
      // Non-namesake `.vue` at a hyphenated folder root, no allow-list.
      { ...at(gradientLoose), errors: [{ messageId: "partAtRoot" }] }
    ]
  });
});
