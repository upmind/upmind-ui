// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company public surface — both composables + the schema
 * fragments, curated barrel (unit, AC-28)
 *
 * ## Job To Be Done
 * Prove AC-28's RUNTIME surface: the barrel offers BOTH composables — the
 * collection AND the per-company form editor — with both scope matrices, both
 * context enums; that it offers the two schema-fragment exports
 * (`useCompanySchema`/`useCompanyUischema`, design.md D5's ONE deviation from
 * the reference conversion's "no schema exports" law); that
 * `useClientCompanyServices` is NOT on the barrel (D6); and that it uses no
 * `export *`.
 *
 * AC-28's type-export half is NOT proven here. Type exports erase at runtime;
 * the package's own `pnpm type-check` is that half's proof (parity.yaml C35).
 *
 * This is the amputation guard. `client-company.surface-amputation.must-fail.patch`
 * removes the two schema-fragment re-exports and must land here, red — the
 * cross-module composition seam `basket-billing/unified/schemas.ts` composes.
 *
 * ## What Breaks If These Fail
 * A consumer loses a whole surface (the FE-2824 archetype one altitude up), a
 * cross-module composer loses the fragment it composes into a parent schema
 * (D5), or the module re-exposes an internal the Module Visibility Law keeps
 * private (D6).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientCompany from "..";
import {
  CLIENT_COMPANIES_SCOPE_MATRIX,
  CLIENT_COMPANY_SCOPE_MATRIX,
  ClientCompaniesContextTypes,
  ClientCompanyContextTypes,
  useClientCompanies,
  useClientCompanyManager,
  useCompanySchema,
  useCompanyUischema
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";

// -----------------------------------------------------------------------------

/** Every value (non-type) export AC-28 names — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = [
  "CLIENT_COMPANIES_SCOPE_MATRIX",
  "CLIENT_COMPANY_SCOPE_MATRIX",
  "ClientCompaniesContextTypes",
  "ClientCompanyContextTypes",
  "useClientCompanies",
  "useClientCompanyManager",
  "useCompanySchema",
  "useCompanyUischema"
];

const barrelSource = (): string =>
  readFileSync(join(import.meta.dirname, "..", "index.ts"), "utf-8");

// -----------------------------------------------------------------------------

describe("client-company public surface (AC-28)", () => {
  it("AC-28 offers BOTH composables — the collection and the per-company form editor", () => {
    expect(typeof useClientCompanies).toBe("function");
    expect(typeof useClientCompanyManager).toBe("function");
  });

  it("AC-28 offers both scope matrices and both context enums", () => {
    expect(CLIENT_COMPANIES_SCOPE_MATRIX).toBeDefined();
    expect(CLIENT_COMPANY_SCOPE_MATRIX).toBeDefined();
    expect(ClientCompaniesContextTypes.CLIENT).toBeDefined();
    expect(ClientCompanyContextTypes.COMPANY).toBe("company");
  });

  it("AC-28 keeps the collection matrix's only live cell on CLIENT — self, staff and guest are dropped (R1)", () => {
    expect(CLIENT_COMPANIES_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientCompaniesContextTypes.CLIENT
    );
    expect(CLIENT_COMPANIES_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_COMPANIES_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_COMPANIES_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-28 keeps the manager matrix's only live cell on CLIENT → COMPANY — self, staff and guest are dropped (R1)", () => {
    expect(CLIENT_COMPANY_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientCompanyContextTypes.COMPANY
    );
    expect(CLIENT_COMPANY_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_COMPANY_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_COMPANY_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-28/D5 offers the two schema-fragment exports a larger form composes (basket-billing/unified)", () => {
    expect(typeof useCompanySchema).toBe("function");
    expect(typeof useCompanyUischema).toBe("function");
  });

  it("AC-28/D6 does not offer useClientCompanyServices — the services layer stays @internal", () => {
    expect(clientCompany).not.toHaveProperty("useClientCompanyServices");
  });

  it("AC-28 exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientCompany).sort()).toEqual(
      [...EXPECTED_RUNTIME_EXPORTS].sort()
    );
  });

  it("AC-28 curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });
});
