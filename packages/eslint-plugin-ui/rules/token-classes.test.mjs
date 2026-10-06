import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./token-classes.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

const root = mkdtempSync(join(tmpdir(), "token-classes-"));
process.on("exit", () => rmSync(root, { recursive: true, force: true }));
const manifest = join(root, "tokens.json");
writeFileSync(
  manifest,
  JSON.stringify({
    semantic: { "bg-known": "x" },
    contextual: { row: "y" }
  }),
  "utf8"
);
const withManifest = [{ tokensManifest: manifest }];
const missingManifest = [{ tokensManifest: join(root, "absent.json") }];

const tpl = classes => `<template><div class="${classes}"></div></template>`;
const bound = expression =>
  `<template><div :class="${expression}"></div></template>`;
const variants = "/repo/packages/modules-card/src/variants.ts";

test("token-classes", () => {
  ruleTester.run("token-classes", rule, {
    valid: [
      {
        code: tpl(`bg-surface text-body p-4 bg-(--bg-control-checked)`),
        filename: "Card.vue"
      },
      {
        code: tpl(`hover:bg-surface data-[state=open]:p-4 md:flex`),
        filename: "Card.vue"
      },
      { code: tpl(`w-[var(--row)]`), filename: "Card.vue" },
      {
        code: bound(`cn('bg-surface', open && 'p-4')`),
        filename: "Card.vue"
      },
      { code: `const a = "bg-gray-500 w-[10px]";`, filename: "util.ts" },
      { code: `const v = cva("bg-surface p-4");`, filename: variants },
      { code: tpl(`bg-(--known)`), filename: "Card.vue" },
      {
        code: tpl(`bg-(--bg-known)`),
        filename: "Card.vue",
        options: withManifest
      },
      {
        code: tpl(`w-[var(--row)]`),
        filename: "Card.vue",
        options: withManifest
      },
      {
        code: tpl(`bg-(--anything) w-[var(--anything)]`),
        filename: "Card.vue",
        options: missingManifest
      }
    ],
    invalid: [
      {
        code: tpl(`bg-gray-500`),
        filename: "Card.vue",
        errors: [{ messageId: "palette", data: { token: "bg-gray-500" } }]
      },
      {
        code: tpl(`text-[#fff]`),
        filename: "Card.vue",
        errors: [{ messageId: "hex", data: { token: "text-[#fff]" } }]
      },
      {
        code: tpl(`w-[123px]`),
        filename: "Card.vue",
        errors: [{ messageId: "arbitrary", data: { token: "w-[123px]" } }]
      },
      {
        code: tpl(`hover:bg-gray-500`),
        filename: "Card.vue",
        errors: [{ messageId: "palette" }]
      },
      {
        code: tpl(`bg-gray-500/50`),
        filename: "Card.vue",
        errors: [{ messageId: "palette" }]
      },
      {
        code: tpl(`bg-surface bg-red-500 p-4 text-[#000]`),
        filename: "Card.vue",
        errors: [{ messageId: "palette" }, { messageId: "hex" }]
      },
      {
        code: bound(`open ? 'bg-blue-600' : 'p-4'`),
        filename: "Card.vue",
        errors: [{ messageId: "palette" }]
      },
      {
        code: bound("{ 'text-[#fff]': on }"),
        filename: "Card.vue",
        errors: [{ messageId: "hex" }]
      },
      {
        code: `const v = cva("bg-gray-500 p-4");`,
        filename: variants,
        errors: [{ messageId: "palette" }]
      },
      {
        code: "const v = cva(`w-[10px]`);",
        filename: variants,
        errors: [{ messageId: "arbitrary" }]
      },
      {
        code: tpl(`bg-(--missing)`),
        filename: "Card.vue",
        options: withManifest,
        errors: [{ messageId: "unknownToken" }]
      },
      {
        code: tpl(`w-[var(--missing)]`),
        filename: "Card.vue",
        options: withManifest,
        errors: [{ messageId: "unknownToken" }]
      }
    ]
  });
});
