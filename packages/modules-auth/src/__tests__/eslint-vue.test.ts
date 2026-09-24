// -----------------------------------------------------------------------------
/**
 * @fileoverview eslint reaches inside the new packages' SFCs.
 *
 * ## Job To Be Done
 * A violation planted in an SFC template and script at each new home is caught.
 *
 * ## What Breaks If These Fail
 * An uncovered path lints as zero files and exits 0, so a whole package goes unchecked.
 */

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

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

const HOMES = {
  authPackage: "packages/modules-auth/src/Login.vue",
  foundationPackage: "packages/modules-foundation/src/modules/hero/Hero.vue",
  authApp: "apps/auth/src/SignedIn.vue"
};

const CLEAN = [
  '<script setup lang="ts">',
  "const items: string[] = [];",
  "</script>",
  "",
  "<template>",
  "  <ul>",
  '    <li v-for="item in items" :key="item">{{ item }}</li>',
  "  </ul>",
  "</template>",
  ""
].join("\n");

const TEMPLATE_VIOLATION = CLEAN.replace(' :key="item"', "");

const SCRIPT_VIOLATION = CLEAN.replace(
  "const items: string[] = [];",
  "const items: string[] = [];\nconst neverUsed = 1;"
);

let eslint: ESLint;

async function lint(text: string, filePath: string) {
  const [result] = await eslint.lintText(text, { filePath });
  return result.messages;
}

describe("eslint's reach into the new packages' SFCs", () => {
  beforeAll(() => {
    eslint = new ESLint({ cwd: ROOT });
  });

  it("hands every new SFC home to a real SFC parser", async () => {
    for (const path of Object.values(HOMES)) {
      const config = await eslint.calculateConfigForFile(path);

      expect(config.languageOptions?.parser?.meta?.name).toBe(
        "vue-eslint-parser"
      );
    }
  }, 30000);

  it("reads a clean SFC at every new home without complaint", async () => {
    for (const path of Object.values(HOMES)) {
      expect(await lint(CLEAN, path)).toEqual([]);
    }
  }, 30000);

  it("catches a template violation at every new home", async () => {
    for (const path of Object.values(HOMES)) {
      const messages = await lint(TEMPLATE_VIOLATION, path);

      expect(messages.map(message => message.ruleId)).toContain(
        "vue/require-v-for-key"
      );
      expect(messages.every(message => !message.fatal)).toBe(true);
    }
  }, 30000);

  it("catches a script-setup violation at every new home", async () => {
    for (const path of Object.values(HOMES)) {
      const messages = await lint(SCRIPT_VIOLATION, path);

      expect(messages.map(message => message.ruleId)).toContain(
        "@typescript-eslint/no-unused-vars"
      );
      expect(messages.every(message => !message.fatal)).toBe(true);
    }
  }, 30000);

  it("does not silently ignore any new SFC home", async () => {
    for (const path of Object.values(HOMES)) {
      expect(await eslint.isPathIgnored(path)).toBe(false);
    }
  }, 30000);
});
