/**
 * @fileoverview RuleTester spec for `bind-subscribe`.
 *
 * Discriminators: a `subscribe` property re-exposing `x.subscribe` unbound
 * fails and names the object; a bound method, an arrow wrapper, or a different
 * property key passes.
 *
 * Run: node --test rules/bind-subscribe.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./bind-subscribe.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("bind-subscribe", () => {
  ruleTester.run("bind-subscribe", rule, {
    valid: [
      { code: `const o = { subscribe: actor.subscribe.bind(actor) };` },
      { code: `const o = { subscribe: (cb) => actor.subscribe(cb) };` },
      { code: `const o = { listen: actor.subscribe };` },
      { code: `const o = { subscribe: actor.send };` },
      { code: `const o = { subscribe };` }
    ],
    invalid: [
      {
        code: `const o = { subscribe: actor.subscribe };`,
        errors: [{ messageId: "bindSubscribe", data: { object: "actor" } }]
      },
      {
        code: `const o = { "subscribe": ref.child.subscribe };`,
        errors: [{ messageId: "bindSubscribe", data: { object: "ref.child" } }]
      }
    ]
  });
});
