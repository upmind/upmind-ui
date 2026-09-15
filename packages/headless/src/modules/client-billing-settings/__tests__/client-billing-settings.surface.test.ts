// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings public surface — the curated barrel and
 * the FE-3240 identity-seam conversion (unit)
 *
 * ## Job To Be Done
 * Pin the barrel's RUNTIME export set exactly — both composables and nothing
 * else — and prove the FE-3240 contract at the type level: the scope matrix and
 * its context enum are removed from the surface, `.for()` is unspellable on
 * both composables (the client whose settings are read/edited rides in
 * `.withId(clientId)`, not a `.for()` context — ADR-001 amendment 2026-09-15),
 * and the `.withId()` control stays clean.
 *
 * The type-level half runs through {@link compileProbe} — the same executable
 * compiler probe `client-address.surface.test.ts` and `scope.surface.test.ts`
 * use, because `packages/headless/tsconfig.json` excludes `**\/__tests__/**`,
 * so a `@ts-expect-error` written here would be checked by nothing.
 *
 * ## What Breaks If These Fail
 * The FE-2824 shape one altitude up: a removed context channel silently
 * returns, so an owner id can ride in through `.for()` again — the private
 * keying axis ADR-001's amendment exists to forbid — or the barrel re-exposes
 * a symbol the conversion retired.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientBillingSettings from "..";
import { last, sortBy, split, trim, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/** Every value (non-type) export the barrel is curated to offer. */
const EXPECTED_RUNTIME_EXPORTS = [
  "useBillingSettings",
  "useBillingSettingsManager"
];

/**
 * The FE-3240 removed value symbols — the scope matrix and its context enum.
 * A client's own settings are the ONE record they have, marked with
 * `.withId(clientId)`, so this module names no context and re-exports neither.
 */
const REMOVED_VALUE_SYMBOLS = [
  "CLIENT_BILLING_SETTINGS_SCOPE_MATRIX",
  "ClientBillingSettingsContextTypes"
];

const barrelSource = (): string =>
  readFileSync(join(MODULE_DIR, "index.ts"), "utf-8");

/**
 * Type-check `lines` as a real program against this module's real barrel and
 * return the 1-based line numbers that carry a diagnostic.
 */
function compileProbe(lines: string[]): number[] {
  const dir = mkdtempSync(join(tmpdir(), "cbs-probe-"));
  const file = join(dir, "probe.ts");
  writeFileSync(file, `${lines.join("\n")}\n`);

  const script = `
    const ts = require(${JSON.stringify(require.resolve("typescript"))});
    const file = ${JSON.stringify(file)};
    const program = ts.createProgram([file], {
      noEmit: true, strict: true, skipLibCheck: true,
      target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.Preserve, types: []
    });
    const found = ts.getPreEmitDiagnostics(program)
      .filter(d => d.file && d.file.fileName === file && typeof d.start === "number")
      .map(d => d.file.getLineAndCharacterOfPosition(d.start).line + 1);
    console.log(JSON.stringify([...new Set(found)]));
  `;

  const stdout = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf-8"
  });
  return sortBy(uniq(JSON.parse(last(split(trim(stdout), "\n")) as string)));
}

// -----------------------------------------------------------------------------

describe("client-billing-settings public surface", () => {
  it("offers both composables — the settings read half and the editor half", () => {
    expect(typeof clientBillingSettings.useBillingSettings).toBe("function");
    expect(typeof clientBillingSettings.useBillingSettingsManager).toBe(
      "function"
    );
  });

  it("exports exactly the curated value surface — nothing internal leaks", () => {
    expect(sortBy(Object.keys(clientBillingSettings))).toEqual(
      sortBy(EXPECTED_RUNTIME_EXPORTS)
    );
  });

  it("curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });

  it("AC-1 the removed scope-matrix and context-enum value symbols are absent from the barrel", () => {
    for (const symbol of REMOVED_VALUE_SYMBOLS) {
      expect(
        clientBillingSettings,
        `${symbol} must not be re-exported from the barrel (FE-3240)`
      ).not.toHaveProperty(symbol);
    }
  });

  it("AC-1 refuses to import the removed value/type symbols or spell `.for()` on either composable, while the `.withId()` control stays clean", () => {
    const diagnostics = compileProbe([
      `import { useBillingSettings, useBillingSettingsManager } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      `import { CLIENT_BILLING_SETTINGS_SCOPE_MATRIX } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ClientBillingSettingsContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
      `import type { ClientBillingSettingsScopeMatrix } from ${JSON.stringify(MODULE_DIR)};`,
      // 6-7 — controls: the client id rides in `.withId()` on both composables.
      `useBillingSettings().as(ScopeActorTypes.CLIENT).withId("x");`,
      `useBillingSettingsManager().as(ScopeActorTypes.CLIENT).withId("x");`,
      // 8-9 — `.for()` is unspellable on both: the matrix is all-`never`.
      `useBillingSettings().as(ScopeActorTypes.CLIENT).for("settings", "x");`,
      `useBillingSettingsManager().as(ScopeActorTypes.CLIENT).for("settings", "x");`
    ]);

    expect(diagnostics).toEqual([3, 4, 5, 8, 9]);
  }, 60000);
});
