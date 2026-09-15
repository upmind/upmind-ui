// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields public surface — both composables, curated barrel (unit)
 *
 * ## Job To Be Done
 * Prove AC-27's structural half: the barrel offers BOTH composables with
 * both scope matrices, both context enums and the full value-semantics seam;
 * that it uses no `export *`; and that every internal file's head carries the
 * `@internal` marker. The RUNTIME enforcement half of AC-27 — "importing
 * `.services`/`.mappers`/`.schemas` from outside the module fails the
 * module-visibility lint" — is `eslint.config.mjs`'s existing
 * `internalBarrierPlugin` (marker-based, scoped to headless modules), already
 * wired into `pnpm lint`; re-implementing an ESLint-API check here would
 * duplicate that gate rather than add coverage, so it is cited, not re-proven
 * (contract_gaps).
 *
 * `ScopeActorTypes` is imported by its deep path, never through the scope
 * barrel, mirroring `client-email.surface.test.ts`'s own load-order note.
 *
 * ## What Breaks If These Fail
 * A consumer loses a whole composable (the FE-2824 amputation archetype one
 * altitude up), or an internal file's marker slips and the barrier goes
 * silently permissive.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "./mocks";
import * as clientCustomFields from "..";
import {
  CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX,
  ClientCustomFieldContextTypes,
  useClientCustomFieldImage,
  useClientCustomFields
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { last, sortBy, split, trim, uniq, values } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

const INTERNAL_FILES = [
  "client-custom-fields.services.ts",
  "client-custom-fields.mappers.ts",
  "client-custom-fields.schemas.ts"
];

/** Every value (non-type) export AC-27 names — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = [
  "CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX",
  "ClientCustomFieldContextTypes",
  "mapCustomField",
  "mapCustomFieldDisplay",
  "mapCustomFieldValue",
  "mapCustomFieldValues",
  "mapCustomFieldValuesToRequest",
  "resolveFieldByValue",
  "useClientCustomFieldImage",
  "useClientCustomFields",
  "useCustomFieldsModel",
  "useCustomFieldsSchema",
  "useCustomFieldsUischema"
];

/**
 * The FE-3240 removed COLLECTION value symbols. The collection names no
 * context — its client is marked with `.withId(clientId)` — so the barrel
 * re-exports neither the matrix nor the enum (ADR-001 amendment 2026-09-15).
 * The IMAGE editor's own `ClientCustomFieldContextTypes.FIELD` and
 * `CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX` are UNCHANGED and stay exported.
 */
const REMOVED_VALUE_SYMBOLS = [
  "CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX",
  "ClientCustomFieldsContextTypes"
];

const barrelSource = (): string =>
  readFileSync(join(MODULE_DIR, "index.ts"), "utf-8");

/**
 * Type-check `lines` as a real program against this module's real barrel and
 * return the 1-based line numbers that carry a diagnostic — the executable
 * form of the type-level contract this module's own build excludes
 * (`__tests__/**`), mirroring `client-address.surface.test.ts`'s own probe.
 */
function compileProbe(lines: string[]): number[] {
  const dir = mkdtempSync(join(tmpdir(), "ccf-probe-"));
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

/**
 * Reads only the file's head (~15 lines, matching `eslint.config.mjs`'s own
 * marker window) — a structural presence check the test itself performs at
 * run time, not this prover reading the file's logic by hand.
 */
const fileHead = (filename: string): string =>
  readFileSync(join(MODULE_DIR, filename), "utf-8")
    .split("\n")
    .slice(0, 15)
    .join("\n");

// -----------------------------------------------------------------------------

describe("client-custom-fields public surface (AC-27)", () => {
  it("AC-27 offers BOTH composables — the definitions collection and the image editor", () => {
    expect(typeof useClientCustomFields).toBe("function");
    expect(typeof useClientCustomFieldImage).toBe("function");
  });

  it("AC-27 keeps only the IMAGE editor's matrix and context enum — the collection's are removed", () => {
    expect(CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX).toBeDefined();
    expect(ClientCustomFieldContextTypes.FIELD).toBe("field");
    for (const symbol of REMOVED_VALUE_SYMBOLS) {
      expect(
        clientCustomFields,
        `${symbol} must not be re-exported from the barrel (FE-3240)`
      ).not.toHaveProperty(symbol);
    }
  });

  it("AC-27/AC-37 the collection cannot spell `.for()` and its removed symbols do not import, while `.withId()` and the image FIELD retarget stay clean", () => {
    const diagnostics = compileProbe([
      `import { useClientCustomFields, useClientCustomFieldImage, ClientCustomFieldContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      `import { CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ClientCustomFieldsContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
      `import type { ClientCustomFieldsScopeMatrix } from ${JSON.stringify(MODULE_DIR)};`,
      // 6 — control: the collection's client id rides in `.withId()`.
      `useClientCustomFields().as(ScopeActorTypes.SELF).withId("x");`,
      // 7 — control: the IMAGE editor's FIELD context is UNCHANGED, a real retarget.
      `useClientCustomFieldImage().as(ScopeActorTypes.CLIENT).for(ClientCustomFieldContextTypes.FIELD, "x");`,
      // 8 — `.for()` is unspellable on the collection: its matrix is all-`never`.
      `useClientCustomFields().as(ScopeActorTypes.CLIENT).for("custom_field_values", "x");`
    ]);

    expect(diagnostics).toEqual([3, 4, 5, 8]);
  }, 60000);

  it("AC-27 keeps the image matrix's only live cell on CLIENT → FIELD — self, staff and guest are dropped", () => {
    expect(CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientCustomFieldContextTypes.FIELD
    );
    expect(
      CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX[ScopeActorTypes.SELF]
    ).toBeNull();
    expect(
      CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX[ScopeActorTypes.STAFF]
    ).toBeNull();
    expect(
      CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX[ScopeActorTypes.GUEST]
    ).toBeNull();
  });

  it("AC-27 exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientCustomFields).sort()).toEqual(
      [...EXPECTED_RUNTIME_EXPORTS].sort()
    );
  });

  it("AC-27 curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });

  it.each(INTERNAL_FILES)(
    "AC-27 %s carries the @internal marker in its head",
    filename => {
      expect(fileHead(filename)).toMatch(/@internal\b/);
    }
  );
});

describe("AC-37 — the runtime scope surface: the image editor offers CLIENT→FIELD, the collection offers no context", () => {
  it("AC-37 the collection advertises no retarget context for any actor at run time", async () => {
    const { useClientCustomFields } = await import("../useClientCustomFields");
    const collMatrix = (
      useClientCustomFields as unknown as {
        scopeMatrix?: Record<string, unknown>;
      }
    ).scopeMatrix;

    // The collection names no context — its client rides in `.withId()`. Every
    // declared cell (if the all-`never` matrix is attached at all) is null, so
    // no actor is offered a retarget at run time; the compile probe above pins
    // the same property at the type level via `.for()` being unspellable.
    for (const cell of values(collMatrix ?? {})) {
      expect(cell).toBeNull();
    }
  });

  it("AC-37 the IMAGE editor carries its unchanged CLIENT→FIELD matrix on the exported function, before any call", async () => {
    const { useClientCustomFieldImage } =
      await import("../useClientCustomFieldImage");
    const { CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX } =
      await import("../client-custom-fields.types");

    expect(
      (useClientCustomFieldImage as unknown as { scopeMatrix: unknown })
        .scopeMatrix
    ).toEqual(CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX);
  });
});

describe("AC-28 — the request carries only what the client declared", () => {
  it("client-custom-fields.services.ts declares the query schema and drops the dead params/sort literal", () => {
    const source = readFileSync(
      join(MODULE_DIR, "client-custom-fields.services.ts"),
      "utf-8"
    );

    expect(source).toMatch(
      /criteria:\s*\{\s*schema:\s*useQuerySchema\(\)\s*\}/
    );
    expect(source).not.toMatch(/\.\.\.params/);
    expect(source).not.toMatch(/RequestSortDirection\.ASC,\s*"order"/);
  });
});
