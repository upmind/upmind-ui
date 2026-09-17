/**
 * @fileoverview RuleTester specs for `services-purity` (FE-3249 #2).
 *
 * The rule runs ONLY in a services file, so the invalid cases use a
 * `*.services.ts` filename and the "rule is off elsewhere" case uses a
 * `.utils.ts` filename. >=2 invalid discriminators: a `formatName` util and a
 * `toUpper` util, both misplaced in a services file.
 *
 * Run: node --test rules/services-purity.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import servicesPurity from "./services-purity.mjs";

const SERVICES = "brand-terms.services.ts";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("services-purity", () => {
  ruleTester.run("services-purity", servicesPurity, {
    valid: [
      // (a) REQUEST — exported fn whose body opens the query seam.
      {
        filename: SERVICES,
        code: `import { useQuery } from "../query";
export function load() {
  const { query, useUrl } = useQuery();
  return query({ queryKey: ["x"], url: useUrl("x") });
}`
      },
      // (b) MACHINE SERVICE — async, first param `context`.
      {
        filename: SERVICES,
        code: `export async function checkSession(context: AuthContext, _event) {
  return { session: context.session };
}`
      },
      // (c) DELEGATE via a bare sibling-module barrel — `useBasket().fetch()`.
      {
        filename: SERVICES,
        code: `import { useBasket } from "../basket";
export const read = () => useBasket().fetch();`
      },
      // (c) DELEGATE via a `.services` import source.
      {
        filename: SERVICES,
        code: `import { fetchThing } from "../foo/foo.services";
export function wrap() { return fetchThing(); }`
      },
      // (d) FACTORY — a `create*Services` function returns a bag of services.
      {
        filename: SERVICES,
        code: `export function createClientAuthServices() {
  return { authenticate, register };
}`
      },
      // (d) FACTORY — an arrow with an object-expression body.
      {
        filename: SERVICES,
        code: `export const createServices = () => ({ read, write });`
      },
      // (d) DELEGATE in-file — dispatches to a helper declared in the same file.
      {
        filename: SERVICES,
        code: `function loadStaffUser(t) { return t; }
export async function loadUser(token) { return loadStaffUser(token); }`
      },
      // (d) DELEGATE in-file — to a local const-arrow helper.
      {
        filename: SERVICES,
        code: `const driveGuestMint = () => Promise.resolve();
export function mintGuestToken() { return driveGuestMint(); }`
      },
      // A non-exported util in a services file is not governed.
      {
        filename: SERVICES,
        code: `function formatName(s) { return s.trim(); }`
      },
      // The rule is OFF outside a services file — a util here is fine.
      {
        filename: "brand-terms.utils.ts",
        code: `export function formatName(s) { return s.trim(); }`
      }
    ],
    invalid: [
      // Discriminator 1: an exported `formatName` util — no request, not
      // machine, not a delegate.
      {
        filename: SERVICES,
        code: `export function formatName(s) { return s.trim(); }`,
        errors: [{ messageId: "misplacedUtil" }]
      },
      // Discriminator 2: an exported const arrow util.
      {
        filename: SERVICES,
        code: `export const toUpper = (s) => s.toUpperCase();`,
        errors: [{ messageId: "misplacedUtil" }]
      },
      // Discriminator 3: a call to a DEEP relative import (`../a/b`) is NOT a
      // delegate origin, so this stays a misplaced util.
      {
        filename: SERVICES,
        code: `import { helper } from "../a/b";
export function pick() { return helper(); }`,
        errors: [{ messageId: "misplacedUtil" }]
      }
    ]
  });
});
