import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-wildcard-cors.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-wildcard-cors", () => {
  ruleTester.run("no-wildcard-cors", rule, {
    valid: [
      { code: `cors({ origin: "https://app.upmind.com" });` },
      { code: `cors({ origin: ["https://a.com", "https://b.com"] });` },
      { code: `cors({ origin: true });` },
      { code: `cors({ origin: allowed });` },
      {
        code: `res.setHeader("Access-Control-Allow-Origin", "https://app.upmind.com");`
      },
      { code: `res.setHeader("Access-Control-Allow-Origin", origin);` },
      { code: `res.setHeader("Content-Type", "*");` },
      { code: `res.setHeader("Access-Control-Allow-Headers", "*");` },
      { code: `const h = { "Access-Control-Allow-Methods": "*" };` },
      { code: `const o = { name: "*" };` }
    ],
    invalid: [
      {
        code: `cors({ origin: "*" });`,
        errors: [{ messageId: "wildcardCors" }]
      },
      {
        code: `cors({ "origin": "*" });`,
        errors: [{ messageId: "wildcardCors" }]
      },
      {
        code: `res.setHeader("Access-Control-Allow-Origin", "*");`,
        errors: [{ messageId: "wildcardCors" }]
      },
      {
        code: `res.header("Access-Control-Allow-Origin", "*");`,
        errors: [{ messageId: "wildcardCors" }]
      },
      {
        code: `headers.set("access-control-allow-origin", "*");`,
        errors: [{ messageId: "wildcardCors" }]
      },
      {
        code: `res.append("Access-Control-Allow-Origin", "*");`,
        errors: [{ messageId: "wildcardCors" }]
      },
      {
        code: `setHeader(event, "Access-Control-Allow-Origin", "*");`,
        errors: [{ messageId: "wildcardCors" }]
      },
      {
        code: `setResponseHeader(event, "Access-Control-Allow-Origin", "*");`,
        errors: [{ messageId: "wildcardCors" }]
      },
      {
        code: `const h = { "Access-Control-Allow-Origin": "*" };`,
        errors: [{ messageId: "wildcardCors" }]
      }
    ]
  });
});
