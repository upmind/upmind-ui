/**
 * @fileoverview RuleTester spec for `types-in-types-file` (FE-3249 #3).
 *
 * Both directions per discriminator, keyed on `filename`:
 *   - a types file is the correct home (valid);
 *   - a non-exported local type stays legal (valid);
 *   - an exported type / interface / enum outside a types file is an error;
 *   - a named export of a locally-declared type is an error too.
 *
 * Run: node --test rules/types-in-types-file.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./types-in-types-file.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("types-in-types-file", () => {
  ruleTester.run("types-in-types-file", rule, {
    valid: [
      // The correct home: an exported type in a `*.types.ts` file.
      {
        code: `export type X = string;`,
        filename: "modules/foo/foo.types.ts"
      },
      // An actor-variant types file is also the correct home.
      {
        code: `export interface Props { id: string }`,
        filename: "modules/foo/foo.types.customer.ts"
      },
      // A local, non-exported type stays legal in a non-services concern file.
      {
        code: `type Local = number;`,
        filename: "modules/foo/foo.utils.ts"
      },
      // In a services file, a co-located derived type stays exempt even local.
      {
        code: `type UseFoo = ReturnType<typeof createFoo>;`,
        filename: "modules/foo/foo.services.ts"
      },
      // A function-scoped local type in a services file is an implementation
      // detail, not a top-level declaration, so it is untouched.
      {
        code: `export async function checkSession(context) { type Row = number; return context; }`,
        filename: "modules/foo/foo.services.ts"
      },
      // A local, non-exported interface stays legal too.
      {
        code: `interface Local { id: string }`,
        filename: "modules/foo/foo.ts"
      },
      // A value export is not a type export.
      {
        code: `export const y = 1;`,
        filename: "modules/foo/foo.services.ts"
      },
      // Test files are never governed.
      {
        code: `export type X = string;`,
        filename: "modules/foo/foo.test.ts"
      },
      // A composable exports the return type of its own co-located factory.
      // The alias derives its shape from a value, so it is exempt.
      {
        code: `export type UseFoo = ReturnType<typeof createFoo>;`,
        filename: "modules/foo/useFoo.ts"
      },
      // A named export of a co-located derived type is exempt too.
      {
        code: `type UseFoo = ReturnType<typeof createFoo>; export { UseFoo };`,
        filename: "modules/foo/foo.actions.ts"
      },
      // `Awaited<…>` derives from a value the same way, so it is exempt.
      {
        code: `export type FooData = Awaited<ReturnType<typeof loadFoo>>;`,
        filename: "modules/foo/foo.context.ts"
      }
    ],
    invalid: [
      // A NON-exported top-level type in a services file is a violation too —
      // a services file carries no type declarations (the FE-3031 gap).
      {
        code: `type DurableFilterSlot = { id: string };`,
        filename: "modules/foo/foo.services.ts",
        errors: [{ messageId: "localTypeInServicesFile" }]
      },
      // A NON-exported top-level interface in a services file likewise.
      {
        code: `interface FilterState { open: boolean }`,
        filename: "modules/foo/foo.services.ts",
        errors: [{ messageId: "localTypeInServicesFile" }]
      },
      // Discriminator 1: an exported interface in an unsuffixed `.ts`.
      {
        code: `export interface Props {}`,
        filename: "modules/foo/foo.ts",
        errors: [{ messageId: "typeOutsideTypesFile" }]
      },
      // Discriminator 2: an exported enum in a services file.
      {
        code: `export enum Status { On, Off }`,
        filename: "modules/foo/foo.services.ts",
        errors: [{ messageId: "typeOutsideTypesFile" }]
      },
      // Discriminator 3: an exported type alias in a utils file.
      {
        code: `export type X = string;`,
        filename: "modules/foo/foo.utils.ts",
        errors: [{ messageId: "typeOutsideTypesFile" }]
      },
      // Discriminator 4: a named export of a locally-declared type.
      {
        code: `type X = string; export { X };`,
        filename: "modules/foo/foo.services.ts",
        errors: [{ messageId: "typeOutsideTypesFile" }]
      },
      // Discriminator 4 again, for an interface via a named export.
      {
        code: `interface I { id: string } export { I };`,
        filename: "modules/foo/foo.ts",
        errors: [{ messageId: "typeOutsideTypesFile" }]
      }
    ]
  });
});
