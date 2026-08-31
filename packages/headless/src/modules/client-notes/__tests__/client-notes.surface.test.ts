// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notes public surface — both composables, curated barrel (unit)
 *
 * ## Job To Be Done
 * Prove the barrel offers BOTH composables — the collection AND the per-asset
 * editor — with both scope matrices and both context enums; that it exports
 * NO schema/uischema member (decision D7 — `useSchema`/`useUischema` reach
 * consumers only through `useClientNoteManager().useContext()`); that both
 * matrices set STAFF/GUEST to `null` at runtime (operator cell ruling,
 * 2026-08-27 — S1-S6); that the barrel uses no `export *`; and (decision D1 /
 * parity row X3) that no file under this module imports `IVaultAssetForm`,
 * the already-inaccurate submodule form type.
 *
 * THE AMPUTATION GUARD. The 2026-08-05 client-email delivery removed
 * `useClientEmailManager` from its module and stayed green because nothing
 * asserted the manager's EXISTENCE. This module ships BOTH halves and this
 * spec is the guard that neither can be silently dropped.
 *
 * ## What Breaks If These Fail
 * A consumer loses a whole surface (the FE-2824 archetype one altitude up),
 * a schema export leaks internal shape the module never promised, or the
 * dropped staff cell resolves to something other than a compile-time error.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientNotes from "..";
import {
  CLIENT_NOTES_SCOPE_MATRIX,
  CLIENT_NOTE_SCOPE_MATRIX,
  ClientNoteContextTypes,
  ClientNotesContextTypes,
  useClientNoteManager,
  useClientNotes
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/** Every value (non-type) export the module's design promises — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = [
  "CLIENT_NOTES_SCOPE_MATRIX",
  "CLIENT_NOTE_SCOPE_MATRIX",
  "ClientNotesContextTypes",
  "ClientNoteContextTypes",
  "useClientNoteManager",
  "useClientNotes"
];

const barrelSource = (): string =>
  readFileSync(join(MODULE_DIR, "index.ts"), "utf-8");

// -----------------------------------------------------------------------------

describe("client-notes public surface (barrel)", () => {
  it("exports both composables and both scope matrices, and nothing else at runtime", () => {
    const actual = Object.keys(clientNotes).sort();
    expect(actual).toEqual([...EXPECTED_RUNTIME_EXPORTS].sort());
  });

  it("exports NO schema or uischema member (decision D7)", () => {
    const actual = Object.keys(clientNotes);
    expect(
      actual.some(key => /schema/i.test(key) || /uischema/i.test(key))
    ).toBe(false);
  });

  it("uses no `export *` in the barrel — curated named re-exports only", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s*\*\s*from/m);
  });

  it("useClientNotes and useClientNoteManager are both present (the amputation guard)", () => {
    expect(typeof useClientNotes).toBe("function");
    expect(typeof useClientNoteManager).toBe("function");
  });

  it("both scope matrices resolve STAFF and GUEST to null at runtime — .as('staff')/.as('guest') address nothing", () => {
    expect(CLIENT_NOTES_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_NOTES_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
    expect(CLIENT_NOTES_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientNotesContextTypes.CLIENT
    );

    expect(CLIENT_NOTE_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_NOTE_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
    expect(CLIENT_NOTE_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientNoteContextTypes.NOTE
    );
  });

  it("ClientNoteContextTypes names the ENTITY, not the owner (decision D5)", () => {
    expect(ClientNoteContextTypes.NOTE).toBe("client-note");
  });

  it("publishes scopeMatrix on the EXPORTED composable reference itself, before ever calling it (repair item 4)", () => {
    // The playground's port reads `composable.scopeMatrix` off the exported
    // reference BEFORE invoking it, and treats an ABSENT matrix as "no
    // refusal" — so this reads the property first and never calls either
    // composable in this test, matching the exact ordering the defect hinged
    // on.
    expect((useClientNotes as { scopeMatrix?: unknown }).scopeMatrix).toBe(
      CLIENT_NOTES_SCOPE_MATRIX
    );
    expect(
      (useClientNoteManager as { scopeMatrix?: unknown }).scopeMatrix
    ).toBe(CLIENT_NOTE_SCOPE_MATRIX);
  });

  it("no file under this module imports IVaultAssetForm (decision D1 / parity row X3)", () => {
    const files = readdirSync(MODULE_DIR).filter(
      file => file.endsWith(".ts") && !file.endsWith(".d.ts")
    );
    for (const file of files) {
      const source = readFileSync(join(MODULE_DIR, file), "utf-8");
      expect(
        source,
        `${file} has an import statement naming IVaultAssetForm`
      ).not.toMatch(/^\s*import\s+[^;]*\bIVaultAssetForm\b[^;]*;/m);
    }
  });
});
