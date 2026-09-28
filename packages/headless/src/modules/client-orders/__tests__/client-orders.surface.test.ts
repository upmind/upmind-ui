// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders public surface — the client-self-only cell
 * (unit, AC-23)
 *
 * ## Job To Be Done
 * AC-23 proves the cell stays `client x self` at COMPILE time, not just by
 * runtime convention: every `.for(...)` retarget is a type error, on every
 * actor, because design 5.2/8.6 declare `CLIENT_ORDERS_SCOPE_MATRIX` with
 * every cell `null as never` — there is no live `.for()` cell at all (unlike
 * a module with one delegated actor). `.as('self')` is the control line that
 * MUST stay clean, so a probe that simply fails to resolve the module can
 * never pass this test.
 *
 * The compile probe itself ({@link compileProbe}) runs the real TypeScript
 * compiler over a throwaway file that imports the real barrel — not an inert
 * `@ts-expect-error`, which `__tests__/**` exclusion from both tsconfigs
 * would leave unchecked — mirroring
 * `client-address/__tests__/client-address.surface.test.ts` ([h24]).
 *
 * ## Scope of this pass
 * Only `useClientOrders` (the collection) is probed. `useClientOrder` (the
 * manager, T19/Phase 5) is not yet built — this pass does not claim manager
 * coverage.
 *
 * ## What Breaks If These Fail
 * A future edit that flips one matrix cell from `null` to a context value
 * silently reopens `.for('client', id)` retargeting — the exact scope FE-3237
 * Out of Scope and ADR-001 forbid for this module — and nothing else in the
 * suite would catch it, because every other spec drives `.as('self')` only.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_ORDERS_SCOPE_MATRIX, useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/**
 * Type-check `lines` as a real program against this module's real barrel and
 * return the 1-based line numbers that carry a diagnostic. `types: []` keeps
 * ambient `@types` packages out; every import is resolved from source, so a
 * broken import surfaces as its own diagnostic rather than as silence.
 */
function compileProbe(lines: string[]): number[] {
  const dir = mkdtempSync(join(tmpdir(), "client-orders-probe-"));
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

describe("client-orders public surface (AC-23)", () => {
  it("offers the collection composable", () => {
    expect(typeof useClientOrders).toBe("function");
  });

  it("declares every scope-matrix cell null — no live .for() cell exists at all", () => {
    expect(CLIENT_ORDERS_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(CLIENT_ORDERS_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBeNull();
    expect(CLIENT_ORDERS_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(CLIENT_ORDERS_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });
});

describe("client-orders refuses every .for() retarget at compile time (AC-23)", () => {
  it("every actor's .for(...) is a type error, while .as('self') alone stays clean", () => {
    const diagnostics = compileProbe([
      `import { useClientOrders } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      // 3 — the control: the one real cell this module serves must stay clean.
      `useClientOrders().as(ScopeActorTypes.SELF);`,
      `useClientOrders().as(ScopeActorTypes.SELF).for("client", "x");`,
      `useClientOrders().as(ScopeActorTypes.CLIENT).for("client", "x");`,
      `useClientOrders().as(ScopeActorTypes.STAFF).for("client", "x");`,
      `useClientOrders().as(ScopeActorTypes.GUEST).for("client", "x");`
    ]);

    expect(diagnostics).not.toContain(3);
    expect(diagnostics).toEqual(expect.arrayContaining([4, 5, 6, 7]));
  }, 60000);
});
