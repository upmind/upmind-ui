/**
 * @fileoverview RuleTester specs for `tests/int-replay-only`.
 *
 * Run: node --test packages/eslint-plugin-tests/rules/int-replay-only.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./int-replay-only.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const MODULES = "/repo/packages/headless/src/modules";
const INT = `${MODULES}/stats/__tests__/stats.replay.int.test.ts`;
const UNIT = `${MODULES}/stats/__tests__/stats.unit.test.ts`;
const RECORDER = `${MODULES}/stats/__tests__/stats.fixtures.ts`;

const MSW = `import { http, HttpResponse } from "msw";`;
const lines = (...parts) => parts.join("\n");

test("int-replay-only", () => {
  ruleTester.run("int-replay-only", rule, {
    valid: [
      {
        filename: INT,
        code: lines(
          MSW,
          `http.post("*/oauth/access_token", () => HttpResponse.json(token));`
        )
      },
      {
        filename: INT,
        code: lines(
          MSW,
          `http.post("/oauth/access_token", () => HttpResponse.json(token));`
        )
      },
      {
        filename: RECORDER,
        code: lines(MSW, `http.get("/api/stats", () => HttpResponse.json({}));`)
      },
      {
        filename: INT,
        code: lines(
          `import { http } from "./local-http";`,
          `http.get("/api/stats", () => null);`
        )
      },
      {
        filename: INT,
        code: lines(MSW, `const other = { get: () => 1 };`, `other.get("/x");`)
      },
      {
        filename: INT,
        code: lines(
          MSW,
          `const state = { accounts: [] };`,
          `const edited = { ...state, extra: 1 };`
        )
      },
      {
        filename: INT,
        code: lines(
          `const recorded = recordedSelf();`,
          `const copy = { ...recorded };`
        )
      },
      {
        filename: INT,
        code: lines(`const answer = { accounts: [], total: 0 };`)
      },
      {
        filename: UNIT,
        code: lines(`const input = { ...recordedSelf(), accounts: [] };`)
      },
      {
        filename: INT,
        code: lines(
          `let recorded = recordedSelf();`,
          `const edited = { ...recorded, accounts: [] };`
        )
      }
    ],
    invalid: [
      {
        filename: INT,
        code: lines(MSW, `http.get("/api/stats", () => HttpResponse.json({}));`),
        errors: [
          {
            messageId: "ownHandler",
            data: { method: "get", route: JSON.stringify("/api/stats") }
          }
        ]
      },
      {
        filename: INT,
        code: lines(MSW, `http.post("*/api/stats", () => HttpResponse.json({}));`),
        errors: [{ messageId: "ownHandler" }]
      },
      {
        filename: INT,
        code: lines(MSW, `http.all("*/oauth/access_token_extra", () => null);`),
        errors: [{ messageId: "ownHandler" }]
      },
      {
        filename: UNIT,
        code: lines(MSW, `http.delete("/api/stats/1", () => null);`),
        errors: [{ messageId: "ownHandler" }]
      },
      {
        filename: INT,
        code: lines(
          MSW,
          `const override = (route: string) => http.get(route, () => null);`
        ),
        errors: [
          {
            messageId: "ownHandler",
            data: { method: "get", route: "<computed route>" }
          }
        ]
      },
      {
        filename: INT,
        code: lines(
          `import { http as mswHttp } from "msw";`,
          `mswHttp.put("/api/stats", () => null);`
        ),
        errors: [{ messageId: "ownHandler" }]
      },
      {
        filename: INT,
        code: lines(
          MSW,
          `http.post("*/oauth/access_token", () => null);`,
          `http.patch("/api/stats", () => null);`
        ),
        errors: [{ messageId: "ownHandler", line: 3 }]
      },
      {
        filename: INT,
        code: lines(`const answer = { ...recordedSelf(), accounts: [] };`),
        errors: [{ messageId: "editedRecording" }]
      },
      {
        filename: INT,
        code: lines(
          `const recorded = recordedSelf();`,
          `const answer = { ...recorded, accounts: [] };`
        ),
        errors: [{ messageId: "editedRecording" }]
      },
      {
        filename: INT,
        code: lines(
          `const recorded = recordedSelf();`,
          `function build() {`,
          `  return { ...recorded, accounts: [] };`,
          `}`
        ),
        errors: [{ messageId: "editedRecording" }]
      },
      {
        filename: `${MODULES}/stats/__tests__/stats.integration.test.ts`,
        code: lines(`const answer = { ...recordedSelf(), accounts: [] };`),
        errors: [{ messageId: "editedRecording" }]
      },
      {
        filename: `${MODULES}/stats/__tests__/stats.replay.test.ts`,
        code: lines(`const answer = { ...recordedSelf(), accounts: [] };`),
        errors: [{ messageId: "editedRecording" }]
      },
      {
        filename: INT,
        code: lines(`const answer = { accounts: [], ...recordedSelf() };`),
        errors: [{ messageId: "editedRecording" }]
      },
      {
        filename: INT,
        code: lines(
          MSW,
          `http.get("/api/stats", () => HttpResponse.json({ ...recordedSelf(), accounts: [] }));`
        ),
        errors: [
          { messageId: "ownHandler" },
          { messageId: "editedRecording" }
        ]
      }
    ]
  });
});
