// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings public surface — the curated barrel and
 * the FE-3240 client-identity channel (unit)
 *
 * ## Job To Be Done
 * Pin the barrel's RUNTIME export set exactly — both composables, the scope
 * matrix and its context enum, and nothing else — and prove the FE-3240
 * contract at the type level: the client whose settings are read/edited is
 * named by `.for(ClientBillingSettingsContextTypes.CLIENT, id)`, the same
 * identity channel every sibling client module carries; the matrix grants that
 * context to `ScopeActorTypes.CLIENT` alone, so `.for()` is spellable as the
 * CLIENT actor and unspellable for staff, guest and self.
 *
 * The type-level half runs through {@link compileProbe} — the same executable
 * compiler probe `client-address.surface.test.ts` and `scope.surface.test.ts`
 * use, because `packages/headless/tsconfig.json` excludes `**\/__tests__/**`,
 * so a `@ts-expect-error` written here would be checked by nothing.
 *
 * ## Divergence from the contract, recorded not papered over
 * The bare `.as(STAFF)` / `.as(GUEST)` / `.as(SELF)` builders are NOT
 * themselves compile errors — `ScopeBuilderResult` accepts every
 * `ScopeActorTypes` and reads the matrix row only to decide whether `.for()`
 * exists. A `null as never` row removes `.for(...)` and nothing else, so the
 * probe asserts `.for(CLIENT, id)` for `.as(CLIENT)` and for no other actor.
 *
 * ## What Breaks If These Fail
 * The FE-2824 shape one altitude up: the client-identity channel every sibling
 * exposes is silently absent here, or the barrel drops a symbol the conversion
 * curates.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientBillingSettings from "..";
import {
  CLIENT_BILLING_SETTINGS_SCOPE_MATRIX,
  ClientBillingSettingsContextTypes
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { last, sortBy, split, trim, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/** Every value (non-type) export the barrel is curated to offer. */
const EXPECTED_RUNTIME_EXPORTS = [
  "CLIENT_BILLING_SETTINGS_SCOPE_MATRIX",
  "ClientBillingSettingsContextTypes",
  "useBillingSettings"
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
  it("offers the one composable — the settings editor", () => {
    expect(typeof clientBillingSettings.useBillingSettings).toBe("function");
  });

  it("exports exactly the curated value surface — nothing internal leaks", () => {
    expect(sortBy(Object.keys(clientBillingSettings))).toEqual(
      sortBy(EXPECTED_RUNTIME_EXPORTS)
    );
  });

  it("curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });

  it("AC-1 re-exports the scope matrix and its context enum from the barrel", () => {
    expect(CLIENT_BILLING_SETTINGS_SCOPE_MATRIX).toBeDefined();
    expect(ClientBillingSettingsContextTypes.CLIENT).toBe("client");
  });

  it("AC-1 keeps the matrix's only live cell on CLIENT — self, staff and guest are null", () => {
    expect(CLIENT_BILLING_SETTINGS_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientBillingSettingsContextTypes.CLIENT
    );
    expect(
      CLIENT_BILLING_SETTINGS_SCOPE_MATRIX[ScopeActorTypes.SELF]
    ).toBeNull();
    expect(
      CLIENT_BILLING_SETTINGS_SCOPE_MATRIX[ScopeActorTypes.STAFF]
    ).toBeNull();
    expect(
      CLIENT_BILLING_SETTINGS_SCOPE_MATRIX[ScopeActorTypes.GUEST]
    ).toBeNull();
  });

  it("AC-1 compiles `.for(CLIENT, id)` for the composable as the CLIENT actor, and for no other actor", () => {
    const diagnostics = compileProbe([
      `import { useBillingSettings, ClientBillingSettingsContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      `import { CLIENT_BILLING_SETTINGS_SCOPE_MATRIX } from ${JSON.stringify(MODULE_DIR)};`,
      `import type { ClientBillingSettingsScopeMatrix } from ${JSON.stringify(MODULE_DIR)};`,
      // 5-6 — controls: `.for(CLIENT, id)` is the sanctioned channel, so a
      // probe that merely fails to resolve cannot pass.
      `useBillingSettings().as(ScopeActorTypes.CLIENT).for(ClientBillingSettingsContextTypes.CLIENT, "x");`,
      `useBillingSettings().as(ScopeActorTypes.CLIENT).for(ClientBillingSettingsContextTypes.CLIENT, "y");`,
      // 7-9 — the gate: `.for()` is unspellable for every non-CLIENT actor.
      `useBillingSettings().as(ScopeActorTypes.STAFF).for(ClientBillingSettingsContextTypes.CLIENT, "x");`,
      `useBillingSettings().as(ScopeActorTypes.GUEST).for(ClientBillingSettingsContextTypes.CLIENT, "x");`,
      `useBillingSettings().as(ScopeActorTypes.SELF).for(ClientBillingSettingsContextTypes.CLIENT, "x");`
    ]);

    expect(diagnostics).toEqual([7, 8, 9]);
  }, 60000);
});
