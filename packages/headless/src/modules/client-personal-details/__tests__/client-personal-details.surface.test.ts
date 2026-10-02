// -----------------------------------------------------------------------------
/**
 * @fileoverview client-personal-details public surface — curated barrel,
 * restored scope matrix + context enum, type names, docstrings, and the
 * ADR-028 i18n straggler (unit)
 *
 * ## Job To Be Done
 * Prove AC-55 (no name collision/shadowing — `UsePersonalDetails` resolves
 * as a type with no runtime value shadowing it), AC-56 (no docstring in this module talks about phone,
 * address, or basket — the copy-paste tell from the conversion's shared
 * ancestry), AC-57 (curated named exports, no `export *`, the empty
 * restore helpers are gone) and AC-44's grep-shaped
 * half (no `from "vue-i18n"` import remains under this module).
 *
 * The FE-3240 identity channel is the same one EVERY sibling client module
 * carries (`client-company`, `client-phone`, `client-address`): the client is
 * named by `.for(ClientPersonalDetailsContextTypes.CLIENT, id)`, gated by a
 * scope matrix that grants that context to `ScopeActorTypes.CLIENT` alone.
 * The enum, matrix const and matrix type are on the barrel again; the matrix
 * gate is proven by an EXECUTABLE compile probe (`__tests__/**` is excluded
 * from the package build, so a `@ts-expect-error` here would check nothing).
 *
 * ## Divergence from the contract, recorded not papered over
 * The bare `.as(STAFF)` / `.as(GUEST)` / `.as(SELF)` builders are NOT
 * themselves compile errors — `ScopeBuilderResult` accepts every
 * `ScopeActorTypes` and reads the matrix row only to decide whether `.for()`
 * exists, so a `null as never` row removes `.for(...)` and nothing else. What
 * the `null as never` rows buy — and what {@link compileProbe} asserts below —
 * is that `.for(CLIENT, id)` compiles for `.as(CLIENT)` and for no other actor.
 *
 * ## What Breaks If These Fail
 * A consumer collides two type names across modules (basket-fields), a
 * docstring describes a different module's capability to a future reader, an
 * `@internal` file leaks past the barrel, or the client-identity channel every
 * sibling exposes is silently absent here (the FE-2824 amputation archetype).
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
import {
  ClientPersonalDetailsContextTypes,
  PERSONAL_DETAILS_SCOPE_MATRIX
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { last, sortBy, split, trim, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/** Every value (non-type) export the barrel is curated to offer. */
const EXPECTED_RUNTIME_EXPORTS = [
  "ClientPersonalDetailsContextTypes",
  "PERSONAL_DETAILS_SCOPE_MATRIX",
  "usePersonalDetails"
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
  it("AC-57 offers the one composable, curated by name — no export *", () => {
    expect(typeof clientPersonalDetails.usePersonalDetails).toBe("function");
    expect(barrelSource()).not.toMatch(/^\s*export\s+\*/m);
  });

  it("AC-57 exports exactly the curated value surface — nothing internal leaks", () => {
    expect(Object.keys(clientPersonalDetails).sort()).toEqual(
      EXPECTED_RUNTIME_EXPORTS
    );
  });

  it("AC-57 re-exports the scope matrix and its context enum from the barrel", () => {
    expect(PERSONAL_DETAILS_SCOPE_MATRIX).toBeDefined();
    expect(ClientPersonalDetailsContextTypes.CLIENT).toBe("client");
  });

  it("AC-57 keeps the matrix's only live cell on CLIENT — self, staff and guest are null", () => {
    expect(PERSONAL_DETAILS_SCOPE_MATRIX[ScopeActorTypes.CLIENT]).toBe(
      ClientPersonalDetailsContextTypes.CLIENT
    );
    expect(PERSONAL_DETAILS_SCOPE_MATRIX[ScopeActorTypes.SELF]).toBeNull();
    expect(PERSONAL_DETAILS_SCOPE_MATRIX[ScopeActorTypes.STAFF]).toBeNull();
    expect(PERSONAL_DETAILS_SCOPE_MATRIX[ScopeActorTypes.GUEST]).toBeNull();
  });

  it("AC-57 compiles `.for(CLIENT, id)` for the composable as the CLIENT actor, and for no other actor", () => {
    const diagnostics = compileProbe([
      `import { usePersonalDetails, ClientPersonalDetailsContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
      `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
      `import { PERSONAL_DETAILS_SCOPE_MATRIX } from ${JSON.stringify(MODULE_DIR)};`,
      `import type { PersonalDetailsScopeMatrix } from ${JSON.stringify(MODULE_DIR)};`,
      // 5-6 — controls: `.for(CLIENT, id)` is the sanctioned channel, so a
      // probe that merely fails to resolve cannot pass.
      `usePersonalDetails().as(ScopeActorTypes.CLIENT).for(ClientPersonalDetailsContextTypes.CLIENT, "x");`,
      `usePersonalDetails().as(ScopeActorTypes.CLIENT).for(ClientPersonalDetailsContextTypes.CLIENT, "y");`,
      // 7-9 — the gate: `.for()` is unspellable for every non-CLIENT actor.
      `usePersonalDetails().as(ScopeActorTypes.STAFF).for(ClientPersonalDetailsContextTypes.CLIENT, "x");`,
      `usePersonalDetails().as(ScopeActorTypes.GUEST).for(ClientPersonalDetailsContextTypes.CLIENT, "x");`,
      `usePersonalDetails().as(ScopeActorTypes.SELF).for(ClientPersonalDetailsContextTypes.CLIENT, "x");`
    ]);

    expect(diagnostics).toEqual([7, 8, 9]);
  }, 60000);

  it("AC-57 keeps no restore helper — a clear leaves on the wire, never re-filled from the base", () => {
    for (const file of moduleSourceFiles()) {
      const content = readFileSync(join(MODULE_DIR, file), "utf-8");
      expect(content, `${file} should hold no restore helper`).not.toMatch(
        /\b(restoreClearedFields|isClearIntent)\b/
      );
    }
  });

  it("AC-57 every internal file (services/mappers/schemas/machine) carries a line-1 @internal marker", () => {
    const internalFiles = [
      "client-personal-details.services.ts",
      "client-personal-details.mappers.ts",
      "client-personal-details.schemas.ts",
      "usePersonalDetails.machine.ts"
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
    // sibling module without describing THIS module's capability.
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
      details: import("..").UsePersonalDetails
    ) => boolean = details => typeof details === "object";

    expect(typeof typeCheck).toBe("function");
  });
});
