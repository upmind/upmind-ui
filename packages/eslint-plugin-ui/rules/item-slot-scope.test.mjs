import test from "node:test";
import { RuleTester } from "eslint";
import vueParser from "vue-eslint-parser";
import tsParser from "@typescript-eslint/parser";

import rule from "./item-slot-scope.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: vueParser,
    ecmaVersion: "latest",
    sourceType: "module",
    parserOptions: { parser: tsParser }
  }
});

test("item-slot-scope", () => {
  ruleTester.run("item-slot-scope", rule, {
    valid: [
      {
        code: `<template><li v-for="item in items"><slot name="item" :item="item" /></li></template>`
      },
      {
        code: `<template><li v-for="item in items"><slot name="item" v-bind="item" /></li></template>`
      },
      {
        code: `<template><li v-for="item in items"><slot name="item" :id="item.id" /></li></template>`
      },
      {
        code: `<template><li v-for="{ id } in items"><slot :id="id" /></li></template>`
      },
      {
        code: `<template><ul><li v-for="item in items"><div><slot :item="item" /></div></li></ul></template>`
      },
      { code: `<template><div><slot name="header" /></div></template>` }
    ],
    invalid: [
      {
        code: `<template><li v-for="item in items"><slot name="item" /></li></template>`,
        errors: [{ messageId: "itemSlotScope", data: { names: "`item`" } }]
      },
      {
        code: `<template><li v-for="item in items"><slot name="item" :other="foo" /></li></template>`,
        errors: [{ messageId: "itemSlotScope" }]
      },
      {
        code: `<template><ul><li v-for="item in items"><div><slot /></div></li></ul></template>`,
        errors: [{ messageId: "itemSlotScope" }]
      },
      {
        code: `<template><li v-for="{ id, label } in items"><slot name="item" /></li></template>`,
        errors: [
          { messageId: "itemSlotScope", data: { names: "`id`, `label`" } }
        ]
      }
    ]
  });
});
