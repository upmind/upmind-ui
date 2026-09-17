/**
 * @fileoverview RuleTester spec for `no-type-reexport` (FE-3249 #4).
 *
 * Both directions per discriminator:
 *   - a value re-export and a plain type import stay legal (valid);
 *   - `export type { X } from`, `export { type X } from`, and a barrel
 *     `export * from "*.types"` are errors.
 *
 * Run: node --test rules/no-type-reexport.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./no-type-reexport.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("no-type-reexport", () => {
  ruleTester.run("no-type-reexport", rule, {
    // Every case runs from a file inside `modules/account/`, so a `./…`
    // source is the same module and a `../other/…` source is a cross-module
    // re-export.
    valid: [
      // A value re-export is fine.
      {
        code: `export { foo } from "../other/bar";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts"
      },
      // A plain type import is not a re-export.
      {
        code: `import type { X } from "./account.types";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts"
      },
      // A star re-export of a non-types module is fine.
      {
        code: `export * from "../other/bar";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts"
      },
      // A local value export is not a re-export.
      {
        code: `const foo = 1; export { foo };`,
        filename: "/repo/packages/headless/src/modules/account/index.ts"
      },
      // The module's own barrel re-exports its own types file — its surface.
      {
        code: `export * from "./account.types";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts"
      },
      // A same-module type re-export is the module publishing its own surface.
      {
        code: `export type { Foo } from "./account.types";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts"
      },
      // A package re-export (ajv) is provided on purpose, not a cross-module leak.
      {
        code: `export type { JSONSchema } from "ajv";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts"
      }
    ],
    invalid: [
      // Discriminator 1: a type-only re-export of ANOTHER module.
      {
        code: `export type { Foo } from "../other/other.types";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts",
        errors: [{ messageId: "noTypeReexport" }]
      },
      // Discriminator 2: an inline type specifier from another module.
      {
        code: `export { type Bar } from "../thing/thing.types";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts",
        errors: [{ messageId: "noTypeReexport" }]
      },
      // Discriminator 2, mixed: only the type specifier is flagged.
      {
        code: `export { value, type T } from "../m/m.types";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts",
        errors: [{ messageId: "noTypeReexport" }]
      },
      // Discriminator 3: a barrel re-export of another module's types file.
      {
        code: `export * from "../other/x.types";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts",
        errors: [{ messageId: "noTypeReexport" }]
      },
      // Discriminator 3, actor-variant types module.
      {
        code: `export * from "../other/user.types.customer";`,
        filename: "/repo/packages/headless/src/modules/account/index.ts",
        errors: [{ messageId: "noTypeReexport" }]
      }
    ]
  });
});
