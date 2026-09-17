/**
 * @fileoverview RuleTester specs for `query-only-in-services` (FE-3249 #1).
 *
 * The rule keys on the FILE TYPE, so every case sets a `filename`. Valid and
 * invalid are both covered, with >=2 invalid discriminators (a `.machine.ts`
 * `useQuery`, a `.utils.ts` `useMutation`, a `.types.ts` `useQuery`).
 *
 * Run: node --test rules/query-only-in-services.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import queryOnlyInServices from "./query-only-in-services.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

test("query-only-in-services", () => {
  ruleTester.run("query-only-in-services", queryOnlyInServices, {
    valid: [
      // A services file — the query seam belongs here.
      {
        filename: "brand-terms.services.ts",
        code: `const q = useQuery();`
      },
      // An actor arm services file.
      {
        filename: "auth.services.client.ts",
        code: `const m = useMutation();`
      },
      // The query module that DEFINES the helpers — under a `/query/` dir.
      {
        filename: "src/modules/query/useQuery.ts",
        code: `export function useQuery() { return {}; }\nconst self = useQuery();`
      },
      // The query module barrel.
      {
        filename: "src/modules/query/index.ts",
        code: `const q = useQuery();`
      },
      // A non-query call in a non-services file is untouched.
      {
        filename: "brand-terms.machine.ts",
        code: `const s = useSelector();`
      }
    ],
    invalid: [
      // Discriminator 1: `useQuery` in a `.machine.ts`.
      {
        filename: "brand-terms.machine.ts",
        code: `const q = useQuery();`,
        errors: [{ messageId: "queryOutsideServices" }]
      },
      // Discriminator 2: `useMutation` in a `.utils.ts`.
      {
        filename: "brand-terms.utils.ts",
        code: `const m = useMutation();`,
        errors: [{ messageId: "queryOutsideServices" }]
      },
      // Discriminator 3: `useQuery` in a `.types.ts`.
      {
        filename: "brand-terms.types.ts",
        code: `const q = useQuery();`,
        errors: [{ messageId: "queryOutsideServices" }]
      }
    ]
  });
});
