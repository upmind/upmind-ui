/**
 * @fileoverview RuleTester spec for `actor-stubs`.
 *
 * Discriminators: a machine file importing a services file fails; a non-machine
 * file importing services passes; a machine file importing anything else
 * passes; below XState 5 the rule is silent.
 *
 * Run: node --test rules/actor-stubs.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./actor-stubs.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const v5 = [{ xstateMajor: 5 }];

test("actor-stubs", () => {
  ruleTester.run("actor-stubs", rule, {
    valid: [
      {
        code: `import { setup } from "xstate";`,
        filename: "basket.machine.ts",
        options: v5
      },
      {
        code: `import { helper } from "./basket.helpers";`,
        filename: "basket.machine.ts",
        options: v5
      },
      {
        code: `import services from "./basket.services";`,
        filename: "useBasket.ts",
        options: v5
      },
      {
        code: `import services from "./basket.services";`,
        filename: "basket.machine.ts",
        options: [{ xstateMajor: 4 }]
      },
      {
        code: `export * from "./basket.helpers";`,
        filename: "basket.machine.ts",
        options: v5
      },
      {
        code: `export * from "./basket.services";`,
        filename: "useBasket.ts",
        options: v5
      },
      {
        code: `export * from "./basket.services";`,
        filename: "basket.machine.ts",
        options: [{ xstateMajor: 4 }]
      }
    ],
    invalid: [
      {
        code: `import services from "./basket.services";`,
        filename: "basket.machine.ts",
        options: v5,
        errors: [
          { messageId: "actorStubs", data: { source: "./basket.services" } }
        ]
      },
      {
        code: `import { fetchBasket } from "./basket.services.ts";`,
        filename: "basket.machine.ts",
        options: v5,
        errors: [{ messageId: "actorStubs" }]
      },
      {
        code: `import services from "../shared/basket.services";`,
        filename: "basket.machine.client.ts",
        options: v5,
        errors: [{ messageId: "actorStubs" }]
      },
      {
        code: `export * from "./x.services";`,
        filename: "basket.machine.ts",
        options: v5,
        errors: [{ messageId: "actorStubs", data: { source: "./x.services" } }]
      },
      {
        code: `export { fetchBasket } from "./basket.services";`,
        filename: "basket.machine.ts",
        options: v5,
        errors: [{ messageId: "actorStubs" }]
      }
    ]
  });
});
