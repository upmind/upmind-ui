/**
 * @fileoverview RuleTester spec for `internal-file-marker`.
 *
 * An internal file (machine, services, mappers, schemas, session-store, and
 * their actor variants) must carry the internal marker as line 1:
 *   - a missing or misplaced marker is an error and autofix inserts it;
 *   - public files are never governed;
 *   - the `patterns` option replaces the default internal set.
 *
 * Run: node --test rules/internal-file-marker.test.mjs
 */

import test from "node:test";
import { RuleTester } from "eslint";
import tsParser from "@typescript-eslint/parser";

import rule from "./internal-file-marker.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: "latest",
    sourceType: "module"
  }
});

const MARKER = "/** @internal */";
const body = `export const a = 1;`;
const internalFiles = [
  "modules/foo/foo.machine.ts",
  "modules/foo/foo.machine.client.ts",
  "modules/foo/foo.services.ts",
  "modules/foo/foo.services.client.ts",
  "modules/foo/foo.mappers.ts",
  "modules/foo/foo.schemas.ts",
  "modules/foo/session-store.ts"
];

test("internal-file-marker", () => {
  ruleTester.run("internal-file-marker", rule, {
    valid: [
      ...internalFiles.map(filename => ({
        code: `${MARKER}\n${body}`,
        filename
      })),
      { code: body, filename: "modules/foo/foo.types.ts" },
      { code: body, filename: "modules/foo/foo.utils.ts" },
      { code: body, filename: "modules/foo/useFoo.ts" },
      { code: body, filename: "modules/foo/index.ts" },
      { code: body, filename: "modules/foo/foo.services.test.ts" },
      {
        code: body,
        filename: "modules/foo/foo.services.ts",
        options: [{ patterns: ["\\.custom\\.ts$"] }]
      },
      {
        code: `${MARKER}\n${body}`,
        filename: "modules/foo/foo.custom.ts",
        options: [{ patterns: ["\\.custom\\.ts$"] }]
      }
    ],
    invalid: [
      ...internalFiles.map(filename => ({
        code: body,
        filename,
        errors: [{ messageId: "missingMarker" }],
        output: `${MARKER}\n${body}`
      })),
      {
        code: `// header\n${MARKER}\n${body}`,
        filename: "modules/foo/foo.machine.ts",
        errors: [{ messageId: "missingMarker" }],
        output: `${MARKER}\n// header\n${MARKER}\n${body}`
      },
      {
        code: `\n${MARKER}\n${body}`,
        filename: "modules/foo/foo.services.ts",
        errors: [{ messageId: "missingMarker" }],
        output: `${MARKER}\n\n${MARKER}\n${body}`
      },
      {
        code: `/* @internal */\n${body}`,
        filename: "modules/foo/foo.mappers.ts",
        errors: [{ messageId: "missingMarker" }],
        output: `${MARKER}\n/* @internal */\n${body}`
      },
      {
        code: `/** @public */\n${body}`,
        filename: "modules/foo/foo.schemas.ts",
        errors: [{ messageId: "missingMarker" }],
        output: `${MARKER}\n/** @public */\n${body}`
      },
      {
        code: body,
        filename: "modules/foo/foo.custom.ts",
        options: [{ patterns: ["\\.custom\\.ts$"] }],
        errors: [{ messageId: "missingMarker" }],
        output: `${MARKER}\n${body}`
      }
    ]
  });
});
