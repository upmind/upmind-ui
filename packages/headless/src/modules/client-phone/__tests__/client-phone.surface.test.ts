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

import { readFileSync } from "node:fs";
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

  it("AC-31 keeps the collection matrix's only live cell on CLIENT — self, staff and guest are compile-time errors", () => {
    expect(CLIENT_PHONES_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientPhonesContextTypes.CLIENT
    );
    expect(CLIENT_PHONES_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_PHONES_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_PHONES_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-31 keeps the manager matrix's only live cell on CLIENT → PHONE — self, staff and guest are compile-time errors", () => {
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

  it("AC-29 exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientPhone).sort()).toEqual(EXPECTED_RUNTIME_EXPORTS);
  });

  it("AC-29 curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });
});
