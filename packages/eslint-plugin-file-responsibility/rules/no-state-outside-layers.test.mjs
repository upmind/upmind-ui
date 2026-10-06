/**
 * @fileoverview RuleTester spec for `no-state-outside-layers`.
 *
 * In `*.services*.ts`, `*.utils.ts` and `*.mappers.ts`:
 *   - a call to ref / shallowRef / reactive / computed / watch is an error;
 *   - a top-level `let`, or a top-level `const` initialised with an empty
 *     container, is an error;
 *   - other files, non-empty constants and function-local containers are legal.
 *
 * Run: node --test rules/no-state-outside-layers.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-state-outside-layers.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const services = "modules/foo/foo.services.ts";
const servicesArm = "modules/foo/foo.services.client.ts";
const utils = "modules/foo/foo.utils.ts";
const mappers = "modules/foo/foo.mappers.ts";

test("no-state-outside-layers", () => {
  ruleTester.run("no-state-outside-layers", rule, {
    valid: [
      { code: `const a = ref(0);`, filename: "modules/foo/useFoo.ts" },
      { code: `const a = ref(0);`, filename: "modules/foo/foo.machine.ts" },
      { code: `const a = ref(0);`, filename: "modules/foo/foo.types.ts" },
      {
        code: `let a = 1; const m = new Map();`,
        filename: "modules/foo/index.ts"
      },
      { code: `import { ref } from "vue";`, filename: services },
      { code: `const KEYS = ["a", "b"];`, filename: services },
      { code: `const DEFAULTS = { a: 1 };`, filename: utils },
      { code: `const LIMIT = 10;`, filename: mappers },
      { code: `export const MAP_KEY = "foo";`, filename: services },
      {
        code: `export async function load() { const rows = []; let n = 0; const seen = new Set(); return rows.length + n + seen.size; }`,
        filename: services
      },
      { code: `const fn = () => { let a = 1; return a; };`, filename: utils }
    ],
    invalid: [
      ...["ref", "shallowRef", "reactive", "computed", "watch"].map(name => ({
        code: `const a = ${name}(0);`,
        filename: services,
        errors: [{ messageId: "stateCall", data: { name } }]
      })),
      {
        code: `const a = ref(0);`,
        filename: servicesArm,
        errors: [{ messageId: "stateCall" }]
      },
      {
        code: `const a = ref(0);`,
        filename: utils,
        errors: [{ messageId: "stateCall" }]
      },
      {
        code: `const a = computed(() => 1);`,
        filename: mappers,
        errors: [{ messageId: "stateCall" }]
      },
      {
        code: `export async function load() { const a = ref(0); return a; }`,
        filename: services,
        errors: [{ messageId: "stateCall", data: { name: "ref" } }]
      },
      {
        code: `watch(source, () => {});`,
        filename: utils,
        errors: [{ messageId: "stateCall", data: { name: "watch" } }]
      },
      {
        code: `let count = 0;`,
        filename: services,
        errors: [{ messageId: "moduleStore" }]
      },
      {
        code: `export let count = 0;`,
        filename: utils,
        errors: [{ messageId: "moduleStore" }]
      },
      {
        code: `const cache = [];`,
        filename: services,
        errors: [{ messageId: "moduleStore" }]
      },
      {
        code: `const cache = {};`,
        filename: mappers,
        errors: [{ messageId: "moduleStore" }]
      },
      ...["Map", "Set", "WeakMap", "WeakSet"].map(name => ({
        code: `const cache = new ${name}();`,
        filename: services,
        errors: [{ messageId: "moduleStore" }]
      })),
      {
        code: `export const cache = new Map();`,
        filename: utils,
        errors: [{ messageId: "moduleStore" }]
      },
      {
        code: `export const cache = [];`,
        filename: services,
        errors: [{ messageId: "moduleStore" }]
      }
    ]
  });
});
