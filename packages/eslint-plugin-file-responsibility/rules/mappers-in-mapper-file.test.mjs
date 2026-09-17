/**
 * @fileoverview RuleTester spec for `mappers-in-mapper-file` (FE-3249 #6).
 *
 * Both directions are exercised through different `filename`s, and the
 * services-file machine-service exception is tested both ways, so a gutted
 * rule turns this spec red.
 *
 * Run: node --test rules/mappers-in-mapper-file.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./mappers-in-mapper-file.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("mappers-in-mapper-file", () => {
  ruleTester.run("mappers-in-mapper-file", rule, {
    valid: [
      // A `map*` function inside the mappers file — its correct home.
      {
        filename: "user.mappers.ts",
        code: `export function mapUser(u) { return u; }`
      },
      // A `parse*` arrow in an actor-variant mappers file.
      {
        filename: "user.mappers.admin.ts",
        code: `export const parseThing = () => ({});`
      },
      // THE EXCEPTION, present: a machine-service `parse(context, event)` in a
      // services file. The machine invokes it, so it stays put.
      {
        filename: "auth.services.ts",
        code: `export async function parse(context, event) { return context; }`
      },
      // The exception with the destructured `{ context }` machine signature.
      {
        filename: "auth.services.ts",
        code: `export const parse = async ({ context, event }) => context;`
      },
      // A NON-exported `map*` is untouched, wherever it sits.
      {
        filename: "foo.utils.ts",
        code: `const mapUser = (u) => u;`
      },
      // A non-function `map*` export is not a mapper function.
      {
        filename: "foo.utils.ts",
        code: `export const mapColor = "#fff";`
      },
      // Test files are never governed.
      {
        filename: "user.services.test.ts",
        code: `export function mapUser(u) { return u; }`
      }
    ],
    invalid: [
      // A locally-declared mapper exported via a specifier is still flagged.
      {
        code: `const parseUser = () => ({}); export { parseUser };`,
        filename: "modules/foo/foo.utils.ts",
        errors: [{ messageId: "mapperOutsideMapperFile" }]
      },
      // Discriminator 1: an exported `map*` function in a services file that
      // is NOT the machine signature (sync, no `context` first param).
      {
        filename: "user.services.ts",
        code: `export function mapUser(u) { return u; }`,
        errors: [{ messageId: "mapperOutsideMapperFile" }]
      },
      // Discriminator 2: an exported `parse*` arrow in a plain utils file.
      {
        filename: "foo.utils.ts",
        code: `export const parseThing = () => ({});`,
        errors: [{ messageId: "mapperOutsideMapperFile" }]
      },
      // Discriminator 3: the OTHER side of the exception — an async `parse`
      // whose first param is NOT `context`, so it is not a machine service,
      // in a services file. It must move to the mappers file.
      {
        filename: "auth.services.ts",
        code: `export async function parse(payload, event) { return payload; }`,
        errors: [{ messageId: "mapperOutsideMapperFile" }]
      }
    ]
  });
});
