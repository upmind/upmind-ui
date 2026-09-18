/**
 * @fileoverview RuleTester spec for `schemas-in-schema-file` (FE-3249 #5).
 *
 * Both directions are exercised through different `filename`s, so a gutted rule
 * turns this spec red.
 *
 * Run: node --test rules/schemas-in-schema-file.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./schemas-in-schema-file.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("schemas-in-schema-file", () => {
  ruleTester.run("schemas-in-schema-file", rule, {
    valid: [
      // A `*Uischema` export inside the schemas file — its correct home.
      {
        filename: "auth.schemas.ts",
        code: `export const loginUischema = { type: "Control" };`
      },
      // A `*Schema` function inside the schemas file.
      {
        filename: "client-company.schemas.ts",
        code: `export function useQuerySchema() { return {}; }`
      },
      // An actor-variant schemas file is still a schemas file.
      {
        filename: "auth.schemas.admin.ts",
        code: `export const useSchema = () => ({});`
      },
      // A NON-exported `const fooSchema` is untouched, wherever it sits.
      {
        filename: "auth.services.ts",
        code: `const fooSchema = { type: "object" };`
      },
      // A lowercase suffix is not the governed suffix (case-sensitive).
      {
        filename: "foo.ts",
        code: `export const fooschema = {};`
      },
      // An unrelated export is fine outside a schemas file.
      {
        filename: "foo.ts",
        code: `export const loginModel = {};`
      },
      // Test files are never governed, even with a schema export.
      {
        filename: "auth.services.test.ts",
        code: `export const querySchema = {};`
      }
    ],
    invalid: [
      // A locally-declared schema exported via a specifier is still flagged.
      {
        code: `const fooSchema = {}; export { fooSchema };`,
        filename: "modules/foo/foo.services.ts",
        errors: [{ messageId: "schemaOutsideSchemaFile" }]
      },
      // Discriminator 1: an exported `*Uischema` FUNCTION in a services file.
      {
        filename: "auth.services.ts",
        code: `export function useLoginUischema() { return {}; }`,
        errors: [{ messageId: "schemaOutsideSchemaFile" }]
      },
      // Discriminator 2: an exported `*Schema` const OBJECT in a plain file.
      {
        filename: "foo.ts",
        code: `export const querySchema = {};`,
        errors: [{ messageId: "schemaOutsideSchemaFile" }]
      },
      // Discriminator 3: an exported `*Schema` const in a mappers file
      // (a schema in the wrong sibling concern is still wrong).
      {
        filename: "user.mappers.ts",
        code: `export const fooSchema = { type: "object" };`,
        errors: [{ messageId: "schemaOutsideSchemaFile" }]
      }
    ]
  });
});
