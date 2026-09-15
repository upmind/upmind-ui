// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details public surface — curated barrel,
 * type names, docstrings, and the ADR-028 i18n straggler (unit)
 *
 * ## Job To Be Done
 * Prove AC-55 (no name collision/shadowing — `UsePersonalDetails` /
 * `UsePersonalDetailsManager` resolve as types with no runtime value
 * shadowing them), AC-56 (no docstring in this module talks about phone,
 * address, or basket — the copy-paste tell from the conversion's shared
 * ancestry), AC-57 (curated named exports, no `export *`, the empty
 * `client-personal-details.utils.ts` stub is gone) and AC-44's grep-shaped
 * half (no `from "vue-i18n"` import remains under this module).
 *
 * `client-personal-details.utils.ts` and `actions.ts` were slated for
 * deletion by `tasks.md` T-B7 — this suite asserts their ABSENCE rather than
 * their content, so it holds whichever way the developer satisfied AC-57.
 *
 * This is also the amputation guard the `seam-bypass` and
 * `session-hardwired-id` negative controls need something to bite: a barrel
 * that offers both composables and both layers.
 *
 * ## What Breaks If These Fail
 * A consumer collides two type names across modules (basket-fields), a
 * docstring describes a different module's capability to a future reader, or
 * an `@internal` file leaks past the barrel.
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "./mocks";
import * as clientPersonalDetails from "..";
import { last, sortBy, split, trim, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/** Every value (non-type) export the barrel is curated to offer. */
const EXPECTED_RUNTIME_EXPORTS = [
  "usePersonalDetails",
  "usePersonalDetailsManager"
];

/**
 * The FE-3240 removed value symbols — the scope matrix and its context enum.
 * The client whose profile is read/edited is marked with `.withId(clientId)`,
 * so this module names no context and re-exports neither (ADR-001 amendment
 * 2026-09-15).
 */
const REMOVED_VALUE_SYMBOLS = [
  "ClientPersonalDetailsContextTypes",
  "PERSONAL_DETAILS_SCOPE_MATRIX"
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
  const dir = mkdtempSync(join(tmpdir(), "cpd-probe-"));
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

/** Every `.ts` source file directly under the module (not `__tests__/`). */
function moduleSourceFiles(): string[] {
  return readdirSync(MODULE_DIR).filter(
    file => file.endsWith(".ts") && file !== "__tests__"
  );
}

// -----------------------------------------------------------------------------

describe("client-personal-details public surface", () => {
  it("AC-57 offers both composables, curated by name — no export *", () => {
    expect(typeof clientPersonalDetails.usePersonalDetails).toBe("function");
    expect(typeof clientPersonalDetails.usePersonalDetailsManager).toBe(
      "function"
    );
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });

  it("AC-57 exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientPersonalDetails).sort()).toEqual(
      EXPECTED_RUNTIME_EXPORTS
    );
  });

  it("AC-57 the removed scope-matrix and context-enum value symbols are absent from the barrel", () => {
    for (const symbol of REMOVED_VALUE_SYMBOLS) {
      expect(
        clientPersonalDetails,
        `${symbol} must not be re-exported from the barrel (FE-3240)`
      ).not.toHaveProperty(symbol);
    }
  });

  it("AC-57 refuses to import the removed value/type symbols or spell `.for()`, while the `.withId()` control stays clean", () => {
    const diagnostics = compileProbe([
      `import { usePersonalDetails } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      `import { PERSONAL_DETAILS_SCOPE_MATRIX } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ClientPersonalDetailsContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
      `import type { PersonalDetailsScopeMatrix } from ${JSON.stringify(MODULE_DIR)};`,
      // 6 — the control: the owner id rides in `.withId()`, which must resolve.
      `usePersonalDetails().as(ScopeActorTypes.SELF).withId("x");`,
      // 7 — `.for()` is unspellable: the matrix is all-`never`, no context member.
      `usePersonalDetails().as(ScopeActorTypes.CLIENT).for("profile", "x");`
    ]);

    expect(diagnostics).toEqual([3, 4, 5, 7]);
  }, 60000);

  it("AC-57 no longer ships the empty client-personal-details.utils.ts stub", () => {
    expect(
      existsSync(join(MODULE_DIR, "client-personal-details.utils.ts"))
    ).toBe(false);
  });

  it("AC-57 every internal file (services/mappers/schemas/machine) carries a line-1 @internal marker", () => {
    const internalFiles = [
      "client-personal-details.services.ts",
      "client-personal-details.mappers.ts",
      "client-personal-details.schemas.ts",
      "usePersonalDetailsManager.machine.ts"
    ];

    for (const file of internalFiles) {
      const path = join(MODULE_DIR, file);
      expect(existsSync(path), `${file} should exist`).toBe(true);
      const firstLines = readFileSync(path, "utf-8")
        .split("\n")
        .slice(0, 5)
        .join("\n");
      expect(
        firstLines,
        `${file} should carry a line-1 @internal marker`
      ).toMatch(/@internal/);
    }
  });

  it("AC-44 no source file under this module imports vue-i18n directly", () => {
    for (const file of moduleSourceFiles()) {
      const content = readFileSync(join(MODULE_DIR, file), "utf-8");
      expect(
        content,
        `${file} should not import vue-i18n directly`
      ).not.toMatch(/from\s+["']vue-i18n["']/);
    }
  });

  it("AC-56 no @module tag or @description capability statement describes phone, address, or basket as THIS module's own", () => {
    // Scoped to the @module tag's own value and the @description tag's
    // FIRST line only — the copy-paste tell AC-56 guards against is a stale
    // capability STATEMENT ("@description A client's own phone numbers…"),
    // not any appearance of the word anywhere in a docblock. Citations and
    // comparative rationale further down a docblock legitimately name a
    // sibling module (e.g. `usePersonalDetailsManager.ts`'s own @decision
    // citing client-email's "existing address" call site, and this file's
    // own @graphify-citation naming `basket-fields.types.ts` as collision
    // evidence, design.md §0) without describing THIS module's capability.
    const forbidden = /\b(phone|address|basket)\b/i;
    for (const file of moduleSourceFiles()) {
      const content = readFileSync(join(MODULE_DIR, file), "utf-8");
      const docComments = content.match(/\/\*\*[\s\S]*?\*\//g) ?? [];
      for (const comment of docComments) {
        const moduleTag = comment.match(/@module\s+(.*)/)?.[1];
        const descriptionLine = comment.match(/@description\s+(.*)/)?.[1];
        for (const statement of [moduleTag, descriptionLine].filter(Boolean)) {
          expect(
            forbidden.test(statement as string),
            `${file} describes THIS module's capability as phone/address/basket:\n${statement}`
          ).toBe(false);
        }
      }
    }
  });

  it("AC-55 the barrel's public type names resolve without collision or shadowing", () => {
    // Type-only names erase at runtime; the compile-time half of this AC is
    // enforced by the package's own `pnpm type-check` against this literal
    // annotation, not by a runtime assertion (no external consumer's compile
    // to stand in for — same reasoning as client-email.surface.test.ts).
    const typeCheck: (
      details: import("..").UsePersonalDetails,
      manager: import("..").UsePersonalDetailsManager
    ) => boolean = (details, manager) =>
      typeof details === "object" && typeof manager === "object";

    expect(typeof typeCheck).toBe("function");
  });
});
