// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email public surface — both composables, curated barrel (unit)
 *
 * ## Job To Be Done
 * Prove AC-24's RUNTIME surface: the barrel offers BOTH composables — the
 * collection AND the per-email editor — with both scope matrices, both context
 * enums and the email categories; that it offers no `useSchema` /
 * `useUischema`; and that it uses no `export *`.
 *
 * AC-24's type-export half is NOT proven here. Type exports erase at runtime,
 * and the module has no external consumer whose compile this suite could stand
 * in for (in-repo consumers are covered by the package's own `pnpm type-check`).
 * A test that named them without a compiling consumer asserted only its own
 * setup; it was deleted rather than dressed up.
 *
 * This is the amputation guard. The 2026-08-05 delivery removed
 * `useClientEmailManager` from the module and stayed green precisely because
 * nothing asserted the manager's EXISTENCE. The manager-amputation
 * `*.must-fail.patch` removes that export block and must land here, red.
 *
 * `ScopeActorTypes` is imported by its deep path — exactly as
 * `client-email.types.ts` imports it — never through the scope barrel
 * (the aggregator-barrel `export *` hazard in `code-quality.companion.md`).
 *
 * ## What Breaks If These Fail
 * A consumer loses a whole surface (the FE-2824 archetype one altitude up) or
 * gains an internal the Module Visibility Law keeps private.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientEmail from "..";
import {
  CLIENT_EMAIL_SCOPE_MATRIX,
  CLIENT_EMAILS_SCOPE_MATRIX,
  ClientEmailContextTypes,
  ClientEmailsContextTypes,
  EmailTypes,
  useClientEmailManager,
  useClientEmails
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";

// -----------------------------------------------------------------------------

/** Every value (non-type) export AC-24 names — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = [
  "CLIENT_EMAILS_SCOPE_MATRIX",
  "CLIENT_EMAIL_SCOPE_MATRIX",
  "ClientEmailContextTypes",
  "ClientEmailsContextTypes",
  "EmailTypes",
  "useClientEmailManager",
  "useClientEmails"
];

const barrelSource = (): string =>
  readFileSync(join(import.meta.dirname, "..", "index.ts"), "utf-8");

// -----------------------------------------------------------------------------

describe("client-email public surface (AC-24)", () => {
  it("AC-24 offers BOTH composables — the collection and the per-email editor", () => {
    expect(typeof useClientEmails).toBe("function");
    expect(typeof useClientEmailManager).toBe("function");
  });

  it("AC-24 offers both scope matrices and both context enums", () => {
    expect(CLIENT_EMAILS_SCOPE_MATRIX).toBeDefined();
    expect(CLIENT_EMAIL_SCOPE_MATRIX).toBeDefined();
    expect(ClientEmailsContextTypes.CLIENT).toBeDefined();
    expect(ClientEmailContextTypes.EMAIL).toBe("email");
  });

  it("AC-24 keeps the collection matrix's only live cell on CLIENT — self, staff and guest are dropped", () => {
    expect(CLIENT_EMAILS_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientEmailsContextTypes.CLIENT
    );
    expect(CLIENT_EMAILS_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_EMAILS_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_EMAILS_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-24 manager matrix has EMAIL for CLIENT, null for others — .for('email', id) supported (FE-3111 pending)", () => {
    expect(CLIENT_EMAIL_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe("email");
    expect(CLIENT_EMAIL_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_EMAIL_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_EMAIL_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-24 offers the email categories, with the API's key 1 as Account", () => {
    expect(EmailTypes).toContainEqual({ key: 1, value: "Account" });
  });

  it("AC-24 offers no other way to obtain the form definition — no useSchema/useUischema on the barrel", () => {
    expect(clientEmail).not.toHaveProperty("useSchema");
    expect(clientEmail).not.toHaveProperty("useUischema");
  });

  it("AC-24 exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientEmail).sort()).toEqual(EXPECTED_RUNTIME_EXPORTS);
  });

  it("AC-24 curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });
});
