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

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "./mocks";
import * as clientCustomFields from "..";
import {
  CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX,
  CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX,
  ClientCustomFieldContextTypes,
  ClientCustomFieldsContextTypes,
  useClientCustomFieldImage,
  useClientCustomFields
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";

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
    expect(ClientCustomFieldsContextTypes.VALUES).toBe("custom_field_values");
    expect(ClientCustomFieldContextTypes.FIELD).toBe("field");
  });

  it("AC-27 keeps the collection matrix's only live cell on CLIENT — self, staff and guest are dropped", () => {
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientCustomFieldsContextTypes.VALUES
    );
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

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

describe("AC-37 — the runtime scope matrix reaches createScopedComposable on both composables", () => {
  it("useClientCustomFields carries CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX on the exported function, before any call", async () => {
    const { useClientCustomFields } = await import("../useClientCustomFields");
    const { CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX } =
      await import("../client-custom-fields.types");

    expect(
      (useClientCustomFields as unknown as { scopeMatrix: unknown }).scopeMatrix
    ).toEqual(CLIENT_CUSTOM_FIELDS_SCOPE_MATRIX);
  });

  it("useClientCustomFieldImage carries CLIENT_CUSTOM_FIELD_IMAGE_SCOPE_MATRIX on the exported function, before any call", async () => {
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
