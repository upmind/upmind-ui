// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone public surface — both composables, curated barrel (unit)
 *
 * ## Job To Be Done
 * Prove AC-16, AC-19, AC-29, AC-31, AC-32's RUNTIME surface: the barrel offers
 * BOTH composables — the collection AND the per-phone editor — with both scope
 * matrices and both context enums; that it offers no `useClientPhoneServices`,
 * `usePhoneSchema` or `usePhoneUischema`; that the manager's construction takes
 * no `clientId`-carrying option (ruling 2, row R1); that both matrices set
 * `SELF` / `STAFF` / `GUEST` to `null` (ruling 1, rows S1-S7); and that the
 * barrel uses no `export *`.
 *
 * This is THE AMPUTATION GUARD. The 2026-08-05 client-email delivery removed
 * `useClientEmailManager` from the module and stayed green precisely because
 * nothing asserted the manager's EXISTENCE. The
 * `manager-amputation.must-fail.patch` removes this module's equivalent
 * export block and must land here, red.
 *
 * `ScopeActorTypes` is imported by its deep path — never through the scope
 * barrel, whose static import from this package faults `createScopedComposable`
 * on load order (the aggregator-barrel `export *` hazard,
 * `code-quality.companion.md`).
 *
 * ## What Breaks If These Fail
 * A consumer loses a whole surface (the FE-2824 archetype one altitude up), an
 * internal the Module Visibility Law keeps private leaks out, or the
 * advertised-but-absent `clientId` option (row R1) survives the conversion.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientPhone from "..";
import {
  CLIENT_PHONES_SCOPE_MATRIX,
  CLIENT_PHONE_SCOPE_MATRIX,
  ClientPhoneContextTypes,
  ClientPhonesContextTypes,
  useClientPhoneManager,
  useClientPhones
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";

// -----------------------------------------------------------------------------

/** Every value (non-type) export the AC set names — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = [
  "CLIENT_PHONES_SCOPE_MATRIX",
  "CLIENT_PHONE_SCOPE_MATRIX",
  "ClientPhoneContextTypes",
  "ClientPhonesContextTypes",
  "useClientPhoneManager",
  "useClientPhones"
];

const barrelSource = (): string =>
  readFileSync(join(import.meta.dirname, "..", "index.ts"), "utf-8");

const MODULE_DIR = join(import.meta.dirname, "..");

/**
 * Type-check `lines` as a real program against this module's real barrel and
 * return the 1-based line numbers that carry a diagnostic. `tsconfig.json`
 * and `tsconfig.build.json` both exclude `**\/__tests__/**`, so a bare
 * `@ts-expect-error` written in this file is never checked by anything —
 * this runs the real TypeScript compiler over a throwaway file instead.
 * Ported from `client-address.surface.test.ts`'s identical helper.
 */
function compileProbe(lines: string[]): number[] {
  const dir = mkdtempSync(join(tmpdir(), "client-phone-probe-"));
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

describe("client-phone public surface (AC-16, AC-29)", () => {
  it("AC-16 / AC-29 offers BOTH composables — the collection and the per-phone editor", () => {
    expect(typeof useClientPhones).toBe("function");
    expect(typeof useClientPhoneManager).toBe("function");
  });

  it("AC-29 offers both scope matrices and both context enums", () => {
    expect(CLIENT_PHONES_SCOPE_MATRIX).toBeDefined();
    expect(CLIENT_PHONE_SCOPE_MATRIX).toBeDefined();
    expect(ClientPhonesContextTypes.CLIENT).toBeDefined();
    expect(ClientPhoneContextTypes.PHONE).toBe("phone");
  });

  it("AC-31 keeps the collection matrix's only live cell on CLIENT — self, staff and guest resolve to no context", () => {
    expect(CLIENT_PHONES_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientPhonesContextTypes.CLIENT
    );
    expect(CLIENT_PHONES_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_PHONES_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_PHONES_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-31 keeps the manager matrix's only live cell on CLIENT → PHONE — self, staff and guest resolve to no context", () => {
    expect(CLIENT_PHONE_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientPhoneContextTypes.PHONE
    );
    expect(CLIENT_PHONE_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_PHONE_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_PHONE_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-29 offers no other way to obtain the form definition — no usePhoneSchema/usePhoneUischema on the barrel (D-4)", () => {
    expect(clientPhone).not.toHaveProperty("usePhoneSchema");
    expect(clientPhone).not.toHaveProperty("usePhoneUischema");
  });

  it("AC-29 removes the services barrel export — useClientPhoneServices is internal now (D-3)", () => {
    expect(clientPhone).not.toHaveProperty("useClientPhoneServices");
  });

  it("AC-32 takes zero constructor arguments on both composables — no clientId option anywhere (ruling 2, row R1)", () => {
    expect(useClientPhones).toHaveLength(0);
    expect(useClientPhoneManager).toHaveLength(0);
  });

  it("AC-43 is constructed WITH its scope matrix — not a type-only claim (AC-31 covers the runtime denial; this covers the wiring)", () => {
    expect(useClientPhones.scopeMatrix).toBe(CLIENT_PHONES_SCOPE_MATRIX);
  });

  it("AC-29 exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientPhone).sort()).toEqual(EXPECTED_RUNTIME_EXPORTS);
  });

  it("AC-29 curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });
});

describe("client-phone published request state and schema family (AC-40, AC-41, AC-45)", () => {
  it("AC-40 publishes the query handle's own live criteria as `query`", () => {
    const phones = useClientPhones();
    const query = phones.useContext().query;

    expect(query).toBeDefined();
    expect(query.value).toHaveProperty("pagination");
    expect(query.value).toHaveProperty("sort");
    // Same ref on repeated reads — never a snapshot copy taken once and held.
    expect(phones.useContext().query).toBe(query);
  });

  it("AC-41 publishes the query schema family as plain, JSON-serialisable objects", () => {
    const phones = useClientPhones();
    const family = phones.useContext().schemas.query;

    expect(() => JSON.stringify(family.schema)).not.toThrow();
    expect(() => JSON.stringify(family.uischema)).not.toThrow();
    expect(() => JSON.stringify(family.sortUischema)).not.toThrow();
    expect(family.sortUischema).toMatchObject({
      type: "Control",
      scope: "#/properties/sort"
    });
  });

  it("AC-45 exposes exactly what the playground's table channel reads — schemas.query.{schema,sortUischema}, query, filterBy, sortBy", () => {
    const phones = useClientPhones();
    const context = phones.useContext();
    const actions = phones.useActions();

    expect(context.schemas.query.schema).toBeDefined();
    expect(context.schemas.query.sortUischema).toBeDefined();
    expect(context.query).toBeDefined();
    expect(typeof actions.filterBy).toBe("function");
    expect(typeof actions.sortBy).toBe("function");
  });
});

describe("client-phone — SortEntry.field is narrowed to the declared sort enum (AC-36, type-safety)", () => {
  it("keeps a declared field clean and reds an undeclared one at compile time", () => {
    const diagnostics = compileProbe([
      `import { SortEntry } from ${JSON.stringify(join(MODULE_DIR, "client-phone.types"))};`,
      `import { SortDirection } from ${JSON.stringify(join(MODULE_DIR, "../query/query.types"))};`,
      `const ok: SortEntry = { field: "created_at", dir: SortDirection.ASC };`,
      `const bad: SortEntry = { field: "name", dir: SortDirection.ASC };`
    ]);

    expect(diagnostics).toEqual([4]);
  }, 60000);
});
