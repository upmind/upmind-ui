import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./parts-exported.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const root = mkdtempSync(join(tmpdir(), "parts-exported-"));
function touch(relPath) {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, "export const x = 1;\n", "utf8");
  return abs;
}
process.on("exit", () => rmSync(root, { recursive: true, force: true }));

const tabs = touch("src/components/Tabs/index.ts");
touch("src/components/Tabs/parts/TabsList.vue");
touch("src/components/Tabs/parts/TabsTrigger.vue");
const solo = touch("src/components/Solo/index.ts");
const mixed = touch("src/components/Mixed/index.ts");
touch("src/components/Mixed/parts/MixedItem.vue");
touch("src/components/Mixed/parts/helper.ts");
const outside = touch("src/lib/Tabs/index.ts");
touch("src/lib/Tabs/parts/TabsList.vue");

const both = `export { default as TabsList } from "./parts/TabsList.vue";
export { default as TabsTrigger } from "./parts/TabsTrigger.vue";`;

test("parts-exported", () => {
  ruleTester.run("parts-exported", rule, {
    valid: [
      { code: both, filename: tabs },
      {
        code: `import TabsList from "./parts/TabsList.vue";
import TabsTrigger from "./parts/TabsTrigger.vue";
export { TabsList, TabsTrigger };`,
        filename: tabs
      },
      {
        code: `export * from "./parts/TabsList.vue";
export * from "./parts/TabsTrigger";`,
        filename: tabs
      },
      { code: `export const x = 1;`, filename: solo },
      {
        code: `export { default as MixedItem } from "./parts/MixedItem.vue";`,
        filename: mixed
      },
      { code: `export const x = 1;`, filename: outside }
    ],
    invalid: [
      {
        code: `export const x = 1;`,
        filename: tabs,
        errors: [
          { messageId: "partNotExported", data: { part: "TabsList" } },
          { messageId: "partNotExported", data: { part: "TabsTrigger" } }
        ]
      },
      {
        code: `export { default as TabsList } from "./parts/TabsList.vue";`,
        filename: tabs,
        errors: [
          { messageId: "partNotExported", data: { part: "TabsTrigger" } }
        ]
      },
      {
        code: `import TabsList from "./parts/TabsList.vue";
import TabsTrigger from "./parts/TabsTrigger.vue";
export { TabsList };`,
        filename: tabs,
        errors: [
          { messageId: "partNotExported", data: { part: "TabsTrigger" } }
        ]
      },
      {
        code: `export const x = 1;`,
        filename: mixed,
        errors: [{ messageId: "partNotExported", data: { part: "MixedItem" } }]
      }
    ]
  });
});
