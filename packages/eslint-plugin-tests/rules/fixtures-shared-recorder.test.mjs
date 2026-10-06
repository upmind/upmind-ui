/**
 * @fileoverview RuleTester specs for `tests/fixtures-shared-recorder`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/fixtures-shared-recorder.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./fixtures-shared-recorder.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const FILE =
  "/repo/packages/headless/src/modules/stats/__tests__/stats.fixtures.ts";
const GENERATOR = `import { Generator } from "@upmind-automation/test-fixtures/generator";`;
const TOKENS = `import { mintClientToken } from "../../auth/__tests__/auth.tokens";`;
const lines = (...parts) => parts.join("\n");

test("fixtures-shared-recorder", () => {
  ruleTester.run("fixtures-shared-recorder", rule, {
    valid: [
      { filename: FILE, code: lines(GENERATOR, TOKENS) },
      {
        filename: FILE,
        code: lines(
          `import { Generator } from "../../../test-fixtures/generator";`,
          `import { mintStaffToken } from "../../auth/__tests__/auth.tokens";`
        )
      },
      {
        filename: FILE,
        code: lines(
          GENERATOR,
          `import { mintClientToken, mintStaffToken } from "../auth/__tests__/auth.tokens";`
        )
      },
      {
        filename: FILE,
        code: lines(
          GENERATOR,
          `import { mintClientToken as mint } from "../../auth/__tests__/auth.tokens";`
        )
      },
      {
        filename: FILE,
        code: lines(GENERATOR, TOKENS, `const path = "/api/stats";`)
      },
      {
        filename: FILE,
        code: lines(GENERATOR, TOKENS, "const path = `/api/${name}`;")
      }
    ],
    invalid: [
      {
        filename: FILE,
        code: lines(TOKENS, `const a = 1;`),
        errors: [{ messageId: "noGenerator" }]
      },
      {
        filename: FILE,
        code: lines(GENERATOR, `const a = 1;`),
        errors: [{ messageId: "noMintedToken" }]
      },
      {
        filename: FILE,
        code: lines(`const a = 1;`),
        errors: [{ messageId: "noGenerator" }, { messageId: "noMintedToken" }]
      },
      {
        filename: FILE,
        code: lines(`import { Generator } from "./my-own-generator";`, TOKENS),
        errors: [{ messageId: "noGenerator" }]
      },
      {
        filename: FILE,
        code: lines(`import { Generator } from "../generator";`, TOKENS),
        errors: [{ messageId: "noGenerator" }]
      },
      {
        filename: FILE,
        code: lines(
          `import { Recorder } from "@upmind-automation/test-fixtures/generator";`,
          TOKENS
        ),
        errors: [{ messageId: "noGenerator" }]
      },
      {
        filename: FILE,
        code: lines(GENERATOR, `import { mintClientToken } from "./my-tokens";`),
        errors: [{ messageId: "noMintedToken" }]
      },
      {
        filename: FILE,
        code: lines(
          GENERATOR,
          `import { buildHeaders } from "../../auth/__tests__/auth.tokens";`
        ),
        errors: [{ messageId: "noMintedToken" }]
      },
      {
        filename: FILE,
        code: lines(
          GENERATOR,
          TOKENS,
          `const url = "https://x.test/oauth/access_token";`
        ),
        errors: [{ messageId: "ownLogin", line: 3 }]
      },
      {
        filename: FILE,
        code: lines(
          GENERATOR,
          TOKENS,
          "const url = `${base}/oauth/access_token`;"
        ),
        errors: [{ messageId: "ownLogin", line: 3 }]
      },
      {
        filename: FILE,
        code: lines(
          GENERATOR,
          TOKENS,
          `const a = "oauth/access_token";`,
          `const b = "/oauth/access_token";`
        ),
        errors: [
          { messageId: "ownLogin", line: 3 },
          { messageId: "ownLogin", line: 4 }
        ]
      },
      {
        filename: FILE,
        code: lines(`const url = "/oauth/access_token";`),
        errors: [
          { messageId: "noGenerator" },
          { messageId: "noMintedToken" },
          { messageId: "ownLogin" }
        ]
      }
    ]
  });
});
