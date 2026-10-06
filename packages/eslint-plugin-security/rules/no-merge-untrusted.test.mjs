import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-merge-untrusted.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-merge-untrusted", () => {
  ruleTester.run("no-merge-untrusted", rule, {
    valid: [
      { code: `merge({}, defaults, pick(req.body, ["name"]));` },
      { code: `merge({}, defaults);` },
      { code: `Object.assign(target, defaults);` },
      { code: `Object.assign(req.body, defaults);` },
      { code: `Object.assign({}, JSON.stringify(value));` },
      { code: `set(obj, "a.b", 1);` },
      { code: `merge({}, other.body);` },
      { code: `for (const key in obj) { target[key] = obj[key]; }` },
      {
        code: `for (const key in req.body) { target[other] = 1; }`
      },
      {
        code: `for (const key in req.body) { target.x = req.body[key]; }`
      }
    ],
    invalid: [
      {
        code: `merge({}, req.body);`,
        errors: [{ messageId: "mergeUntrusted", data: { name: "merge" } }]
      },
      {
        code: `Object.assign(target, JSON.parse(raw));`,
        errors: [
          { messageId: "mergeUntrusted", data: { name: "Object.assign" } }
        ]
      },
      {
        code: `defaultsDeep({}, req.query);`,
        errors: [
          { messageId: "mergeUntrusted", data: { name: "defaultsDeep" } }
        ]
      },
      {
        code: `mergeWith({}, req.params, customizer);`,
        errors: [{ messageId: "mergeUntrusted", data: { name: "mergeWith" } }]
      },
      {
        code: `_.merge({}, req.body);`,
        errors: [{ messageId: "mergeUntrusted", data: { name: "merge" } }]
      },
      {
        code: `merge({}, event.body);`,
        errors: [{ messageId: "mergeUntrusted" }]
      },
      {
        code: `merge({}, route.query);`,
        errors: [{ messageId: "mergeUntrusted" }]
      },
      {
        code: `merge({}, req.body.profile);`,
        errors: [{ messageId: "mergeUntrusted" }]
      },
      {
        code: `merge({}, getQuery(event));`,
        errors: [{ messageId: "mergeUntrusted" }]
      },
      {
        code: `async function h(event) { merge({}, await readBody(event)); }`,
        errors: [{ messageId: "mergeUntrusted" }]
      },
      {
        code: `setWith({}, "a", 1, req.body);`,
        errors: [{ messageId: "mergeUntrusted", data: { name: "setWith" } }]
      },
      {
        code: `for (const key in req.body) { target[key] = req.body[key]; }`,
        errors: [{ messageId: "assignInLoop", data: { key: "key" } }]
      },
      {
        code: `for (const key of JSON.parse(raw)) { target[key] = 1; }`,
        errors: [{ messageId: "assignInLoop", data: { key: "key" } }]
      }
    ]
  });
});
