// -----------------------------------------------------------------------------
/**
 * @fileoverview eslint reaches inside the new packages' SFCs — ADR 023 §3
 *
 * ## Job To Be Done
 * Nine domain packages and their apps arrive over Phases 3-9, and each one
 * brings `.vue` files to a repo whose flat config has to be told about every new
 * home. A config that does not cover a path lints it as zero files and EXITS 0,
 * so the lane it guards goes green over unlinted code. Coverage therefore has to
 * be asserted the only way it can be proved: plant a violation in an SFC at each
 * new home and require the rule to catch it — in the TEMPLATE, which only a real
 * SFC parser can see, and in the `<script setup lang="ts">` body.
 *
 * ## What Breaks If These Fail
 * Every package lint in the repo passes while an entire new package goes
 * unchecked. A negative control that lints a whole package to prove itself green
 * proves nothing, because the files it was pointed at were never read.
 */

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

/** The flat config lives at the workspace root, wherever the runner started. */
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

/** One SFC home per new box the canary stands up. */
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

/** A `key`-less `v-for`: visible only to something that parsed the template. */
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
