// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders public surface — the client-self-only cell
 * (unit, AC-23)
 *
 * ## Job To Be Done
 * AC-23 proves the cell stays `client x self` at COMPILE time, for both
 * composables: every `.for(...)` retarget of `useClientOrders()` and of
 * `useClientOrder()` is a type error on every actor, because design 5.2/8.6
 * declare both scope matrices with every cell `null as never`. The two
 * `.as('self')` lines are the controls that MUST stay clean, so a probe that
 * fails to resolve the module can never pass this test.
 *
 * The compile probe runs the real TypeScript compiler over a throwaway file
 * that imports the real barrel, as
 * `client-address/__tests__/client-address.surface.test.ts` does ([h24]).
 *
 * ## What Breaks If These Fail
 * A matrix cell flipped from `null` to a context value silently reopens
 * `.for('client', id)` retargeting on the history or on one order, the scope
 * FE-3237 Out of Scope and ADR-001 forbid for this module.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  CLIENT_ORDERS_SCOPE_MATRIX,
  CLIENT_ORDER_MANAGER_SCOPE_MATRIX
} from "../client-orders.types";

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
  it.each([
    ["useClientOrders", CLIENT_ORDERS_SCOPE_MATRIX],
    ["useClientOrder", CLIENT_ORDER_MANAGER_SCOPE_MATRIX]
  ] as const)("%s declares every scope-matrix cell null", (_name, matrix) => {
    for (const actor of [
      ScopeActorTypes.SELF,
      ScopeActorTypes.CLIENT,
      ScopeActorTypes.STAFF,
      ScopeActorTypes.GUEST
    ]) {
      expect(matrix[actor]).toBeNull();
    }
  });
});

describe("client-orders refuses every .for() retarget at compile time (AC-23)", () => {
  it("every actor's .for(...) is a type error on both composables, while .as('self') alone stays clean", () => {
    const actors = ["SELF", "CLIENT", "STAFF", "GUEST"];
    const diagnostics = compileProbe([
      `import { useClientOrder, useClientOrders } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      `useClientOrders().as(ScopeActorTypes.SELF);`,
      `useClientOrder().as(ScopeActorTypes.SELF).withId("x");`,
      ...actors.map(
        actor =>
          `useClientOrders().as(ScopeActorTypes.${actor}).for("client", "x");`
      ),
      ...actors.map(
        actor =>
          `useClientOrder().as(ScopeActorTypes.${actor}).for("client", "x");`
      )
    ]);

    expect(diagnostics).not.toContain(3);
    expect(diagnostics).not.toContain(4);
    expect(diagnostics).toEqual(
      expect.arrayContaining([5, 6, 7, 8, 9, 10, 11, 12])
    );
  }, 60000);
});
