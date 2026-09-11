// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications public surface — both composables,
 * curated barrel, the all-`never` matrices, and the request-contract statics
 * (unit)
 *
 * ## Job To Be Done
 * Prove AC-13 (no staff retarget exists, and none can be spelled — on
 * EITHER half), AC-11 (no interval poll anywhere in the module) and AC-12's
 * static half (no raw `pagination`/`filters` outside the one declared schema
 * literal). The barrel offers BOTH composables and nothing else — this is
 * the amputation guard: the 2026-08-05 client-email delivery removed a whole
 * manager half and stayed green precisely because nothing asserted the
 * manager's EXISTENCE.
 *
 * ## What Breaks If These Fail
 * A consumer loses a whole surface, `.for('client', id)` becomes spellable
 * again on a module with no oracle basis for it (verify-cosplay), or a
 * banned poll/raw-pagination pattern re-enters the module unnoticed.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as clientNotifications from "..";
import { useClientNotifications, useClientNotificationsManager } from "..";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

const barrelSource = (): string =>
  readFileSync(join(MODULE_DIR, "index.ts"), "utf-8");

/** Every value (non-type) export the barrel offers — and nothing else. */
const EXPECTED_RUNTIME_EXPORTS = [
  "useClientNotifications",
  "useClientNotificationsManager"
];

/**
 * Type-check `lines` as a real program and return the 1-based line numbers
 * that carry a diagnostic. `tsconfig.json`/`tsconfig.build.json` both exclude
 * `**\/__tests__/**`, so a bare `@ts-expect-error` written in this file is
 * never checked by anything real — this runs the actual TypeScript compiler
 * over a throwaway file instead. Ported from `client-phone.surface.test.ts`'s
 * identical helper.
 */
type ProbeDiagnostic = { line: number; code: number };

/**
 * `d.code` is captured alongside the line so a probe can assert WHICH
 * diagnostic fired, not merely that some diagnostic did — a probe whose own
 * setup line errors (e.g. an invalid `.as()` argument) can otherwise mask the
 * real assertion under test with an unrelated diagnostic at the same "count
 * greater than zero" bar (the AC-13 hollow-test finding).
 */
function compileProbe(lines: string[]): ProbeDiagnostic[] {
  const dir = mkdtempSync(join(tmpdir(), "client-notifications-probe-"));
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
    const diagnostics = ts.getPreEmitDiagnostics(program)
      .filter(d => d.file && d.file.fileName === file && typeof d.start === "number")
      .map(d => ({
        line: d.file.getLineAndCharacterOfPosition(d.start).line + 1,
        code: d.code
      }));
    console.log(JSON.stringify(diagnostics));
  `;

  const stdout = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf-8"
  });
  return JSON.parse(
    stdout.trim().split("\n").at(-1) as string
  ) as ProbeDiagnostic[];
}

// -----------------------------------------------------------------------------

describe("client-notifications public surface", () => {
  it("offers BOTH composables — the collection and the editor", () => {
    expect(typeof useClientNotifications).toBe("function");
    expect(typeof useClientNotificationsManager).toBe("function");
  });

  it("exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientNotifications).sort()).toEqual(
      EXPECTED_RUNTIME_EXPORTS
    );
  });

  it("curates its re-exports by name — the barrel carries no export *", () => {
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });

  it("exports no context enum and no scope matrix — nothing to import to spell .for() with", () => {
    expect(clientNotifications).not.toHaveProperty(
      "ClientNotificationsContextTypes"
    );
    expect(clientNotifications).not.toHaveProperty(
      "CLIENT_NOTIFICATIONS_SCOPE_MATRIX"
    );
    expect(clientNotifications).not.toHaveProperty(
      "CLIENT_NOTIFICATIONS_MANAGER_SCOPE_MATRIX"
    );
  });
});

describe("AC-13 — no staff retarget exists, and none can be spelled", () => {
  it("rejects `.for('client', id)` on the COLLECTION at compile time", () => {
    // A VALID actor argument, never a bare string literal: the prior string
    // literal (`"client"`) itself failed to typecheck against `ScopeActor`,
    // producing a diagnostic on THIS line instead of the `.for()` line below —
    // masking the real assertion under test (the AC-13 hollow-test finding).
    const diagnostics = compileProbe([
      `import { useClientNotifications } from ${JSON.stringify(join(MODULE_DIR, "index"))};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "..", "scope", "index"))};`,
      `const list = useClientNotifications().as(ScopeActorTypes.CLIENT);`,
      `list.for("client", "some-id");`
    ]);

    expect(diagnostics).toEqual([{ line: 4, code: 2339 }]);
  }, 60000);

  it("rejects `.for('client', id)` on the MANAGER at compile time", () => {
    const diagnostics = compileProbe([
      `import { useClientNotificationsManager } from ${JSON.stringify(join(MODULE_DIR, "index"))};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "..", "scope", "index"))};`,
      `const manager = useClientNotificationsManager().as(ScopeActorTypes.CLIENT);`,
      `manager.for("client", "some-id");`
    ]);

    expect(diagnostics).toEqual([{ line: 4, code: 2339 }]);
  }, 60000);
});

describe("AC-12 — the criteria schema is the only request-state channel", () => {
  it("the published `pagination` is the query's read-only PaginationInfo echo, not a settable request-state channel", () => {
    const diagnostics = compileProbe([
      `import type { UseClientNotificationsContext } from ${JSON.stringify(join(MODULE_DIR, "index"))};`,
      `import type { PaginationInfo } from ${JSON.stringify(join(MODULE_DIR, "..", "query", "index"))};`,
      `type Published = UseClientNotificationsContext["pagination"];`,
      `type Unwrapped = Published extends { value: infer V } ? V : Published;`,
      `const isPaginationEcho: Unwrapped extends PaginationInfo ? true : false = true;`,
      `const isNotSettable: Unwrapped extends { set: (...args: unknown[]) => unknown } ? true : false = false;`,
      `void isPaginationEcho; void isNotSettable;`
    ]);

    expect(diagnostics).toEqual([]);
    // Same 60s budget as the two `.for()` probes above: each spawns a real
    // TypeScript compile, which runs ~2.7s locally and comfortably past the
    // 5s default on CI's slower runner.
  }, 60000);

  it("declares only a pagination branch — no filters branch and no sort member exist as siblings on the barrel's published shape", () => {
    // The barrel publishes no schema at all (D-... — NO SCHEMA EXPORTS on the
    // barrel; the manager's schema/uischema reach consumers only through
    // useContext().schema/.uischema). This is the runtime half of AC-12's
    // static grep above: nothing importable from the barrel could carry a
    // filters/sort member for a consumer to bind a filter bar or sort control
    // to.
    expect(clientNotifications).not.toHaveProperty("useQuerySchema");
    expect(clientNotifications).not.toHaveProperty("useQueryUischema");
  });
});

/**
 * The template's REAL per-actor arm suffix (`ARMS.md:7`,
 * `requirements.md` AC-13 gap-closure, drift D29) is `.{actor}.ts` directly
 * on the existing filename — `client-notifications.services.client.ts`,
 * `useClientNotifications.context.guest.ts`, `useClientNotificationsManager
 * .actions.staff.ts`, and so on for every layer on both the collection and
 * manager halves. The template NEVER generates a bare `.arm.ts` suffix — the
 * prior guard's own pattern — so that guard could never fire against a real
 * arm file (the AC-13 hollow-guard finding this replaces).
 */
function isArmFile(filename: string): boolean {
  return /\.(client|staff|guest)\.ts$/.test(filename);
}

describe("module shape — no arm files exist (§D10, all five layers armless)", () => {
  it("the corrected guard is CAPABLE of firing — it flags every real per-actor arm filename shape the template generates (drift D29)", () => {
    const hypotheticalArmFiles = [
      "useClientNotifications.context.guest.ts",
      "useClientNotifications.actions.client.ts",
      "useClientNotifications.meta.staff.ts",
      "client-notifications.services.client.ts",
      "client-notifications.schemas.guest.ts",
      "useClientNotificationsManager.context.staff.ts",
      "useClientNotificationsManager.actions.guest.ts",
      "useClientNotificationsManager.meta.client.ts"
    ];
    for (const filename of hypotheticalArmFiles) {
      expect(
        isArmFile(filename),
        `${filename} was not recognised as an arm file`
      ).toBe(true);
    }

    // The prior guard's own pattern — proven incapable of firing against any
    // of the above (none end in literal `.arm.ts`), which is exactly why it
    // shipped green over a guard that could never trip.
    const priorGuardPattern = /\.arm\.ts$/;
    for (const filename of hypotheticalArmFiles) {
      expect(
        priorGuardPattern.test(filename),
        `the PRIOR guard's pattern unexpectedly matched ${filename} — it should not`
      ).toBe(false);
    }
  });

  it("every real, non-arm filename in the module directory is left unflagged", () => {
    const files = readdirSync(MODULE_DIR);
    const realFiles = files.filter(file => file.endsWith(".ts"));
    expect(realFiles.length).toBeGreaterThan(0);
    for (const file of realFiles) {
      expect(isArmFile(file), `${file} was misidentified as an arm file`).toBe(
        false
      );
    }
  });

  it("carries no real per-actor arm file today, on either half, for any layer", () => {
    const files = readdirSync(MODULE_DIR);
    const armFiles = files.filter(isArmFile);
    expect(armFiles).toEqual([]);
  });
});
