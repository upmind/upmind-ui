// -----------------------------------------------------------------------------
/**
 * @fileoverview The import graph reads an SFC reached from TypeScript
 *
 * ## Job To Be Done
 * The new packages publish their organisms from `.ts` barrels, so every SFC in
 * them is reached by an `import` from TypeScript. The import plugin follows that
 * edge and parses what it finds — with the TypeScript parser unless the config
 * hands `.vue` to the SFC parser on that path too. When it does not, the plugin
 * reports the file unparseable, gives up on it, and says so on stderr while
 * still EXITING 0.
 *
 * ## What Breaks If These Fail
 * Every import rule silently stops at the first SFC boundary: an unresolved
 * import, a cycle or an upward reach through a `.vue` file is no longer seen.
 * Three of the six negative controls guarding the ADR 023 boundary are eslint
 * controls, so the boundary they prove becomes unguarded — and nothing goes red,
 * because the plugin only warns on a stream nobody reads.
 *
 * The assertion is on stderr because that is the only place the failure appears.
 * This file stays alone so the plugin's parse cache is cold when it runs.
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

/** A `.ts` file in the new package importing the SFC beside it. */
const BARREL = "packages/auth/src/shell.ts";
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
