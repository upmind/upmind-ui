// -----------------------------------------------------------------------------
/**
 * @fileoverview client-address public surface — the curated barrel and the
 * scope matrices (unit, AC-33/AC-34/AC-35/AC-36)
 *
 * ## Job To Be Done
 * AC-35 pins the barrel's RUNTIME export set exactly: both composables, both
 * scope matrices, both context enums, the two address-type constants the live
 * `type` control consumes, the one curated mapper (R6/D-5) and the two
 * schema-FRAGMENT exports (R7/D-6) — and nothing else. The retired
 * `useClientAddressServices` (R4) and the internals `useSchema` / `useUischema`
 * / `mapAddresses` / `mapIAddressData` are asserted ABSENT, and the barrel is
 * asserted to carry no `export *`.
 *
 * AC-33/AC-34 are proven by an EXECUTABLE compile probe, not by an inert
 * `@ts-expect-error`. `packages/headless/tsconfig.json` and
 * `tsconfig.build.json` both exclude `**\/__tests__/**`, so a `@ts-expect-error`
 * written here is never checked by anything — it would assert nothing and fail
 * nothing. {@link compileProbe} instead runs the real TypeScript compiler over
 * a throwaway file that imports this module's real barrel, and asserts WHICH
 * lines carry a diagnostic. Its control line (the CLIENT call that must stay
 * clean) is what keeps it from passing on a probe that simply fails to resolve.
 *
 * AC-36 pins the two members that would otherwise be advertised-but-absent:
 * the manager takes NO arguments (the cosmetic `clientId` of PR-2/D-3 is gone)
 * and the schema fragments are pure functions of their arguments.
 *
 * ## Divergence from the contract, recorded not papered over
 * The design says `.as(STAFF)` / `.as(GUEST)` are themselves compile-time
 * errors. Measured here: they are NOT. `ScopeBuilderResult` (`scope.builder.ts`)
 * accepts every `ScopeActorTypes` and uses the matrix row only to decide
 * whether `.for()` exists, so a `null as never` row removes `.for(...)` and
 * nothing else. `scope.builder.ts` is protected core (NFR-4) and D-2 forbids
 * editing it, so the module cannot make the bare `.as()` an error. What the
 * `null as never` rows really buy — and what is asserted below — is that
 * `.as(STAFF).for(ADDRESS, id)`, `.as(GUEST).for(...)` and `.as(SELF).for(...)`
 * do not compile, while `.as(CLIENT).for(ADDRESS, id)` does.
 *
 * ## What Breaks If These Fail
 * A consumer loses a whole surface (the FE-2824 archetype one altitude up), a
 * cross-module composer loses the schema fragment it composes into a parent
 * form (D-6), the module re-exposes an internal the Module Visibility Law keeps
 * private (R4), or a dropped staff cell silently becomes reachable.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientAddress from "..";
import {
  ADDRESS_TYPE_KEYS,
  AddressTypes,
  CLIENT_ADDRESS_SCOPE_MATRIX,
  CLIENT_ADDRESSES_SCOPE_MATRIX,
  ClientAddressContextTypes,
  ClientAddressesContextTypes,
  mapAddress,
  useClientAddressManager,
  useClientAddresses,
  useSchemaDefinitions,
  useUischemaDefinitions
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";

// -----------------------------------------------------------------------------

/** Every value (non-type) export design.md §3 names — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = [
  "ADDRESS_TYPE_KEYS",
  "AddressTypes",
  "CLIENT_ADDRESSES_SCOPE_MATRIX",
  "CLIENT_ADDRESS_SCOPE_MATRIX",
  "ClientAddressContextTypes",
  "ClientAddressesContextTypes",
  "mapAddress",
  "useClientAddressManager",
  "useClientAddresses",
  "useSchemaDefinitions",
  "useUischemaDefinitions"
];

/** Named absent by ruling — retired, or internal and reached via useContext(). */
const EXPECTED_ABSENT_EXPORTS = [
  "useClientAddressServices",
  "useSchema",
  "useUischema",
  "mapAddresses",
  "mapIAddressData",
  "mapIAddressDataDiff"
];

const MODULE_DIR = join(import.meta.dirname, "..");

const barrelSource = (): string =>
  readFileSync(join(MODULE_DIR, "index.ts"), "utf-8");

/**
 * Type-check `lines` as a real program against this module's real barrel and
 * return the 1-based line numbers that carry a diagnostic. `types: []` keeps
 * ambient `@types` packages out; every import is resolved from source, so a
 * broken import surfaces as its own diagnostic rather than as silence.
 */
function compileProbe(lines: string[]): number[] {
  const dir = mkdtempSync(join(tmpdir(), "client-address-probe-"));
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
    const lines = ts.getPreEmitDiagnostics(program)
      .filter(d => d.file && d.file.fileName === file && typeof d.start === "number")
      .map(d => d.file.getLineAndCharacterOfPosition(d.start).line + 1);
    console.log(JSON.stringify([...new Set(lines)]));
  `;

  const stdout = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf-8"
  });
  return JSON.parse(stdout.trim().split("\n").at(-1) as string) as number[];
}

// -----------------------------------------------------------------------------

describe("client-address public surface (AC-35)", () => {
  it("AC-35 offers BOTH composables — the collection and the per-address form editor", () => {
    expect(typeof useClientAddresses).toBe("function");
    expect(typeof useClientAddressManager).toBe("function");
  });

  it("AC-35 offers both scope matrices and both context enums", () => {
    expect(CLIENT_ADDRESSES_SCOPE_MATRIX).toBeDefined();
    expect(CLIENT_ADDRESS_SCOPE_MATRIX).toBeDefined();
    expect(ClientAddressesContextTypes.CLIENT).toBeDefined();
    expect(ClientAddressContextTypes.ADDRESS).toBe("address");
  });

  it("AC-35/D-5 offers the one curated mapper export invoices composes with", () => {
    expect(typeof mapAddress).toBe("function");
  });

  it("AC-35/D-6 offers the two schema-FRAGMENT exports a larger form composes", () => {
    expect(typeof useSchemaDefinitions).toBe("function");
    expect(typeof useUischemaDefinitions).toBe("function");
  });

  it("AC-35/R4 does not offer useClientAddressServices — retired, not deprecated", () => {
    expect(clientAddress).not.toHaveProperty("useClientAddressServices");
  });

  it("AC-35 keeps the parsers and the bulk mappers internal", () => {
    for (const name of EXPECTED_ABSENT_EXPORTS) {
      expect(clientAddress).not.toHaveProperty(name);
    }
  });

  it("AC-35 exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientAddress).sort()).toEqual(
      [...EXPECTED_RUNTIME_EXPORTS].sort()
    );
  });

  it("AC-35 curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });
});

describe("client-address dropped and unsupported cells (AC-33, AC-34)", () => {
  it("AC-33 keeps the collection matrix's only live cell on CLIENT — self, staff and guest are null", () => {
    expect(CLIENT_ADDRESSES_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientAddressesContextTypes.CLIENT
    );
    expect(CLIENT_ADDRESSES_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_ADDRESSES_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_ADDRESSES_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-33 keeps the manager matrix's only live cell on CLIENT → ADDRESS — self, staff and guest are null", () => {
    expect(CLIENT_ADDRESS_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientAddressContextTypes.ADDRESS
    );
    expect(CLIENT_ADDRESS_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_ADDRESS_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_ADDRESS_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-33/AC-34 refuses to compile an address context for staff, guest or self — while the CLIENT control stays clean", () => {
    const diagnostics = compileProbe([
      `import { useClientAddressManager, ClientAddressContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      // 3 — the control: the ONE live cell must stay clean, so a probe that
      // simply fails to resolve the module can never pass this test.
      `useClientAddressManager().as(ScopeActorTypes.CLIENT).for(ClientAddressContextTypes.ADDRESS, "x");`,
      `useClientAddressManager().as(ScopeActorTypes.STAFF).for(ClientAddressContextTypes.ADDRESS, "x");`,
      `useClientAddressManager().as(ScopeActorTypes.GUEST).for(ClientAddressContextTypes.ADDRESS, "x");`,
      `useClientAddressManager().as(ScopeActorTypes.SELF).for(ClientAddressContextTypes.ADDRESS, "x");`
    ]);

    expect(diagnostics.sort()).toEqual([4, 5, 6]);
  }, 60000);
});

describe("client-address advertises nothing that does not work (AC-36)", () => {
  it("AC-36/PR-2 takes NO arguments — the cosmetic clientId that never reached a URL is gone", () => {
    const diagnostics = compileProbe([
      `import { useClientAddressManager } from ${JSON.stringify(MODULE_DIR)};`,
      // 2 — the control: the real, argument-free call.
      `useClientAddressManager();`,
      `useClientAddressManager(undefined, { clientId: "c" });`
    ]);

    expect(diagnostics).toEqual([3]);
  }, 60000);

  it("AC-36 offers the four address types the live type control renders", () => {
    expect(AddressTypes.map(entry => entry.key)).toEqual([1, 2, 3, 4]);
    expect(AddressTypes.map(entry => entry.value)).toEqual([
      "Home",
      "Office",
      "Holiday",
      "Company"
    ]);
    expect(ADDRESS_TYPE_KEYS).toEqual({
      HOME: 1,
      OFFICE: 2,
      HOLIDAY: 3,
      COMPANY: 4
    });
  });

  it("AC-36/D-6 the schema fragments are pure functions of their arguments — the same input gives the same output", () => {
    expect(useSchemaDefinitions({})).toEqual(useSchemaDefinitions({}));
    expect(useUischemaDefinitions({})).toEqual(useUischemaDefinitions({}));
    expect(useUischemaDefinitions({}, {})).toEqual(
      useUischemaDefinitions({}, {})
    );
  });

  it("AC-36/D-6 every schema-fragment argument is optional — the contract's `= {}` default", () => {
    expect(() => useSchemaDefinitions()).not.toThrow();
    expect(() => useUischemaDefinitions()).not.toThrow();
  });
});
