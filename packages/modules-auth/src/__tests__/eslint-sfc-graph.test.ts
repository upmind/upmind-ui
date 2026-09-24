// -----------------------------------------------------------------------------
/**
 * @fileoverview The import graph reads an SFC reached from TypeScript.
 *
 * ## Job To Be Done
 * eslint-plugin-import parses a `.vue` reached from `.ts` with the SFC parser; stderr stays clean.
 *
 * ## What Breaks If These Fail
 * Every import rule silently stops at the first SFC, and lint still exits 0.
 *
 * Kept in its own file so the plugin's parse cache is cold when it runs.
 */

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

function workspaceRoot() {
  let candidate = resolve(process.cwd());
  while (!existsSync(join(candidate, "pnpm-workspace.yaml"))) {
    const parent = dirname(candidate);
    if (parent === candidate) throw new Error("no workspace root above cwd");
    candidate = parent;
  }
  return candidate;
}

const ROOT = workspaceRoot();

const BARREL = "packages/modules-auth/src/shell.ts";
const BARREL_SOURCE = [
  'import Login from "./Login.vue";',
  "",
  "export const shellLogin = Login;",
  ""
].join("\n");

const GAVE_UP = /parseForESLint|Error while parsing/;

async function lintCapturingDiagnostics(text: string, filePath: string) {
  const captured: string[] = [];
  const write = process.stderr.write.bind(process.stderr);
  const { warn, error } = console;
  const collect = (...args: unknown[]) => {
    captured.push(args.map(String).join(" "));
  };
  process.stderr.write = chunk => {
    captured.push(String(chunk));
    return true;
  };
  console.warn = collect;
  console.error = collect;
  try {
    const eslint = new ESLint({ cwd: ROOT });
    const [result] = await eslint.lintText(text, { filePath });
    return { messages: result.messages, captured };
  } finally {
    process.stderr.write = write;
    console.warn = warn;
    console.error = error;
  }
}

describe("eslint's import graph across an SFC boundary", () => {
  it("parses the SFC it reaches from a TypeScript import", async () => {
    const { messages, captured } = await lintCapturingDiagnostics(
      BARREL_SOURCE,
      BARREL
    );

    expect(captured.filter(line => GAVE_UP.test(line))).toEqual([]);
    expect(messages.filter(message => message.fatal)).toEqual([]);
  }, 30000);
});
