// -----------------------------------------------------------------------------
/**
 * @fileoverview scope public surface — the two context patterns are mutually
 * exclusive (unit, AC-2)
 *
 * ## Job To Be Done
 * The exclusivity between the two `.for()` shapes is enforced in the TYPE
 * SYSTEM, and the type system is invisible to the test suite:
 * `packages/headless/vitest.config.ts` declares no `typecheck` block, and both
 * `tsconfig.json` and `tsconfig.build.json` exclude `**\/__tests__/**`. So a
 * `@ts-expect-error` written here would be checked by nothing and would assert
 * nothing. {@link compileProbes} runs the real TypeScript compiler over
 * throwaway files built on this module's real builder, and asserts WHICH lines
 * carry a diagnostic. Each probe carries a CONTROL line that must stay clean,
 * so a probe that simply fails to resolve the module can never pass.
 *
 * ## What Breaks If These Fail
 * A retarget context can be spelled with no entity, so the read silently falls
 * back to the session's own data and serves one actor another's view — FE-2824.
 * Or an owner id rides in through the catalogue channel, which is the private
 * keying axis ADR-001's amendment exists to forbid.
 *
 * @anchor scope.feature
 * @anchor AC-2
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { mapValues, sortBy, uniq, values } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

const path = (file: string): string => JSON.stringify(join(MODULE_DIR, file));

/**
 * Lines 1-5 of every probe: the real builder, the real `selector()` marker, and
 * a mixed cell declaring one retarget member and two catalogues. One statement
 * per line, so a diagnostic's line number names the call that produced it.
 */
const PREAMBLE = [
  `import { createScopedComposable } from ${path("scope.builder")};`,
  `import { selector } from ${path("scope.utils")};`,
  `import { ScopeActorTypes } from ${path("scope.types")};`,
  `const MATRIX = { [ScopeActorTypes.SELF]: null as never, [ScopeActorTypes.STAFF]: null as never, [ScopeActorTypes.CLIENT]: ["values", selector("invoice"), selector("cancel_request")], [ScopeActorTypes.GUEST]: null as never } as const;`,
  `const useCustomFields = createScopedComposable("client-custom-fields", () => ({ ready: true }), MATRIX);`
];

/**
 * The three probes, each a separate file in ONE program. Type-checking the
 * scope module's source is the whole cost here, and one program pays it once
 * for all three rather than once per case.
 */
const PROBES: Record<string, string[]> = {
  "retarget-without-entity": [
    ...PREAMBLE,
    `useCustomFields().as(ScopeActorTypes.CLIENT).for("values", "c-9");`,
    `useCustomFields().as(ScopeActorTypes.CLIENT).for("values");`
  ],
  "catalogue-with-entity": [
    ...PREAMBLE,
    `useCustomFields().as(ScopeActorTypes.CLIENT).for("invoice");`,
    `useCustomFields().as(ScopeActorTypes.CLIENT).for("invoice", "c-9");`
  ],
  "one-shape-per-member": [
    ...PREAMBLE,
    `useCustomFields().as(ScopeActorTypes.CLIENT).for("cancel_request");`,
    `useCustomFields().as(ScopeActorTypes.CLIENT).for("values", "c-9");`,
    `useCustomFields().as(ScopeActorTypes.CLIENT).for("contract", "c-9");`,
    `useCustomFields().as(ScopeActorTypes.STAFF).for("invoice");`
  ]
};

/**
 * Type-check every probe as one real program and return, per probe, the 1-based
 * line numbers that carry a diagnostic. `types: []` keeps ambient `@types`
 * packages out; every import resolves from source, so a broken import surfaces
 * as its own diagnostic rather than as silence. Diagnostics are bucketed by the
 * file that produced them, so one probe can never answer for another.
 *
 * @param probes - Probe programs by name, one statement per line.
 * @returns Each probe's diagnostic line numbers, ascending and deduped.
 */
function compileProbes(
  probes: Record<string, string[]>
): Record<string, number[]> {
  const dir = mkdtempSync(join(tmpdir(), "scope-probe-"));

  const files = mapValues(probes, (lines, name) => {
    const file = join(dir, `${name}.ts`);
    writeFileSync(file, `${lines.join("\n")}\n`);
    return file;
  });

  const script = `
    const ts = require(${JSON.stringify(require.resolve("typescript"))});
    const files = ${JSON.stringify(values(files))};
    const program = ts.createProgram(files, {
      noEmit: true, strict: true, skipLibCheck: true,
      target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.Preserve, types: []
    });
    const found = {};
    for (const file of files) found[file] = [];
    for (const d of ts.getPreEmitDiagnostics(program)) {
      if (!d.file || typeof d.start !== "number") continue;
      if (!found[d.file.fileName]) continue;
      found[d.file.fileName].push(d.file.getLineAndCharacterOfPosition(d.start).line + 1);
    }
    console.log(JSON.stringify(found));
  `;

  const stdout = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf-8"
  });
  const found = JSON.parse(
    stdout.trim().split("\n").at(-1) as string
  ) as Record<string, number[]>;

  return mapValues(files, file => sortBy(uniq(found[file])));
}

// -----------------------------------------------------------------------------

describe("the two context patterns are mutually exclusive (AC-2)", () => {
  let reported: Record<string, number[]>;

  beforeAll(() => {
    reported = compileProbes(PROBES);
  }, 120000);

  it("@AC-2 refuses a retarget context named without the entity it targets, while the two-argument control stays clean", () => {
    expect(reported["retarget-without-entity"]).toEqual([7]);
  });

  it("@AC-2 refuses a catalogue read handed an entity id, while the one-argument control stays clean", () => {
    expect(reported["catalogue-with-entity"]).toEqual([7]);
  });

  it("@AC-2 offers each member of a mixed cell exactly one call shape, and no member of another actor's cell", () => {
    // The cell declares three members for CLIENT and none for STAFF. Lines 6-7
    // are the controls; 8 asks for a member the cell never declared and 9 asks
    // on an actor the module does not serve at all.
    expect(reported["one-shape-per-member"]).toEqual([8, 9]);
  });
});
