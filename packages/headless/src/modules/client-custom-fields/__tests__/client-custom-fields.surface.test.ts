// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields public surface — both composables, curated
 * barrel, and the restored collection scope matrix (unit)
 *
 * ## Job To Be Done
 * Prove AC-27's structural half: the barrel offers BOTH composables with BOTH
 * scope matrices and BOTH context enums (the definitions collection's CLIENT
 * channel and the image editor's unchanged FIELD channel), the full
 * value-semantics seam; that it uses no `export *`; and that every internal
 * file's head carries the `@internal` marker. The RUNTIME enforcement half of
 * AC-27 — "importing `.services`/`.mappers`/`.schemas` from outside the module
 * fails the module-visibility lint" — is `eslint.config.mjs`'s existing
 * `internalBarrierPlugin`, cited not re-proven (contract_gaps).
 *
 * The FE-3240 identity channel matches every sibling client module: the
 * collection names the client by
 * `.for(ClientCustomFieldsContextTypes.CLIENT, id)`, gated by a matrix that
 * grants that context to `ScopeActorTypes.CLIENT` alone. The image editor's own
 * `ClientCustomFieldContextTypes.FIELD` / `CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX`
 * are UNCHANGED and are this file's untouched control throughout.
 *
 * `ScopeActorTypes` is imported by its deep path, never through the scope
 * barrel, mirroring `client-email.surface.test.ts`'s own load-order note.
 *
 * ## What Breaks If These Fail
 * A consumer loses a whole composable or the collection's client-identity
 * channel (the FE-2824 amputation archetype one altitude up), or an internal
 * file's marker slips and the barrier goes silently permissive.
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
  CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX,
  ClientCustomFieldContextTypes,
  ClientCustomFieldsContextTypes,
  useClientCustomFieldImage,
  useClientCustomFields
} from "..";
import { ScopeActorTypes, ScopeContextPatterns } from "../../scope/scope.types";
import { last, sortBy, split, trim, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

const INTERNAL_FILES = [
  "client-custom-fields.services.ts",
  "client-custom-fields.mappers.ts",
  "client-custom-fields.schemas.ts"
];

/** Every value (non-type) export AC-27 names — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = [
  "CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX",
  "CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX",
  "ClientCustomFieldContextTypes",
  "ClientCustomFieldsContextTypes",
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

  it("AC-27 offers both scope matrices and both context enums", () => {
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX).toBeDefined();
    expect(CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX).toBeDefined();
    expect(ClientCustomFieldsContextTypes.CLIENT).toBe("client");
    expect(ClientCustomFieldContextTypes.FIELD).toBe("field");
  });

  it("AC-27 keeps the collection matrix's only live cell on CLIENT — the CLIENT retarget plus the INVOICE and CANCEL_REQUEST selectors; self, staff and guest are null", () => {
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toEqual([
      ClientCustomFieldsContextTypes.CLIENT,
      {
        pattern: ScopeContextPatterns.SELECTOR,
        type: ClientCustomFieldsContextTypes.INVOICE
      },
      {
        pattern: ScopeContextPatterns.SELECTOR,
        type: ClientCustomFieldsContextTypes.CANCEL_REQUEST
      }
    ]);
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-27/AC-37 compiles the collection's `.for(CLIENT, id)` and the image editor's `.for(FIELD, id)` as the CLIENT actor, and refuses the collection's context for every other actor", () => {
    const diagnostics = compileProbe([
      `import { useClientCustomFields, useClientCustomFieldImage, ClientCustomFieldsContextTypes, ClientCustomFieldContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      `import { CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX } from ${JSON.stringify(MODULE_DIR)};`,
      `import type { ClientCustomFieldsScopeMatrix } from ${JSON.stringify(MODULE_DIR)};`,
      // 5 — control: the collection's `.for(CLIENT, id)` is the sanctioned channel.
      `useClientCustomFields().as(ScopeActorTypes.CLIENT).for(ClientCustomFieldsContextTypes.CLIENT, "x");`,
      // 6 — control: the IMAGE editor's FIELD retarget is UNCHANGED and clean.
      `useClientCustomFieldImage().as(ScopeActorTypes.CLIENT).for(ClientCustomFieldContextTypes.FIELD, "x");`,
      // 7-9 — the gate: the collection's context is unspellable for every non-CLIENT actor.
      `useClientCustomFields().as(ScopeActorTypes.STAFF).for(ClientCustomFieldsContextTypes.CLIENT, "x");`,
      `useClientCustomFields().as(ScopeActorTypes.GUEST).for(ClientCustomFieldsContextTypes.CLIENT, "x");`,
      `useClientCustomFields().as(ScopeActorTypes.SELF).for(ClientCustomFieldsContextTypes.CLIENT, "x");`
    ]);

    expect(diagnostics).toEqual([7, 8, 9]);
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

describe("AC-37 — the runtime scope surface: the collection publishes CLIENT→CLIENT, the image editor CLIENT→FIELD", () => {
  it("AC-37 the collection carries its restored CLIENT→CLIENT matrix on the exported function, before any call", async () => {
    const { useClientCustomFields } = await import("../useClientCustomFields");
    const { CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX } =
      await import("../client-custom-fields.types");

    expect(
      (useClientCustomFields as unknown as { scopeMatrix: unknown }).scopeMatrix
    ).toEqual(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX);
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
