/**
 * @fileoverview RuleTester specs for `code-quality/no-chained-array-passes`.
 *
 * Run: node --test packages/eslint-plugin-code-quality/rules/no-chained-array-passes.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import noChainedArrayPasses from "./no-chained-array-passes.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-chained-array-passes", () => {
  ruleTester.run("no-chained-array-passes", noChainedArrayPasses, {
    valid: [
      { code: `items.filter(f);` },
      { code: `items.map(f);` },
      { code: `items.filter(f).forEach(g);` },
      { code: `items.map(f).join(",");` },
      { code: `items.reduce(f, []);` },
      { code: `a.filter(f); b.map(g);` },
      {
        code: `import { filter } from "lodash";\nfunction f(a) { return filter(a, x); }`
      },
      {
        code: `import { filter } from "lodash";\nfunction f(a, b) { filter(a, x); filter(b, y); }`
      },
      {
        code: `import { filter } from "lodash";\nfunction f(a) { filter(a, x); }\nfunction g(a) { filter(a, y); }`
      },
      {
        code: `import { filter } from "lodash";\nfilter(a, x);\nfunction g() { filter(a, y); }`
      },
      {
        code: `import { filter } from "./local";\nfunction f(a) { filter(a, x); filter(a, y); }`
      },
      {
        code: `import { map } from "lodash";\nfunction f(a) { map(a, x); map(a, y); }`
      }
    ],
    invalid: [
      {
        code: `items.filter(f).map(g);`,
        errors: [{ messageId: "chain" }]
      },
      {
        code: `items.map(f).filter(g);`,
        errors: [{ messageId: "chain" }]
      },
      {
        code: `items.flatMap(f).filter(g);`,
        errors: [{ messageId: "chain" }]
      },
      {
        code: `items.filter(f).filter(g);`,
        errors: [{ messageId: "chain" }]
      },
      {
        code: `items.reject(f).map(g);`,
        errors: [{ messageId: "chain" }]
      },
      {
        code: `const out = items.filter(f).map(g).join(",");`,
        errors: [{ messageId: "chain" }]
      },
      {
        code: `import { filter } from "lodash";\nfunction f(a) { filter(a, x); filter(a, y); }`,
        errors: [{ messageId: "split", data: { name: "a" } }]
      },
      {
        code: `import { filter, reject } from "lodash-es";\nfunction f(a) { filter(a, x); reject(a, y); }`,
        errors: [{ messageId: "split", data: { name: "a" } }]
      },
      {
        code: `import { reject as r } from "lodash";\nfunction f(a) { r(a, x); r(a, y); }`,
        errors: [{ messageId: "split", data: { name: "a" } }]
      },
      {
        code: `import { filter } from "lodash";\nfilter(a, x);\nfilter(a, y);`,
        errors: [{ messageId: "split", data: { name: "a" } }]
      },
      {
        code: `import { filter } from "lodash";\nconst f = a => { filter(a, x); filter(a, y); };`,
        errors: [{ messageId: "split", data: { name: "a" } }]
      },
      {
        code: `import { filter } from "lodash";\nfunction f(a) { filter(a, x); filter(a, y); filter(a, z); }`,
        errors: [
          { messageId: "split", data: { name: "a" } },
          { messageId: "split", data: { name: "a" } }
        ]
      }
    ]
  });
});
