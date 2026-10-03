// -----------------------------------------------------------------------------
/**
 * @fileoverview legacy-invoices scope matrices — the all-`never` retarget
 * refusal is a COMPILE-TIME fact (unit, AC-13, ruling OD1, decision D-34)
 *
 * ## Job To Be Done
 * `packages/headless/vitest.config.ts` declares no `typecheck` block, and the
 * test folders sit outside both TypeScript projects — a `@ts-expect-error`
 * written in a spec here is read by no compiler and asserts nothing. This
 * file drives the REAL TypeScript compiler over throwaway probe files built
 * on the module's own REAL exported composables, and asserts WHICH LINE
 * carries a diagnostic — the house pattern `scope/__tests__/scope.surface.test.ts`
 * establishes (read as pattern reference, per this layer's own allowed reads).
 * Each probe carries a CONTROL line that must stay clean, so a probe that
 * merely fails to resolve the module can never pass.
 *
 * ## What Breaks If These Fail
 * `.for(entity, id)` compiling on either composable would let a consumer
 * spell a retarget this resource has no oracle equivalent for (ruling OD1 —
 * the archive hangs off no parent entity) — a silent capability the design
 * never authorised, undetectable by any runtime specification because the
 * package's own vitest config never runs `tsc` over this directory.
 *
 * @anchor legacy-invoices.feature
 * @anchor AC-13
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { mapValues, sortBy, uniq, values } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");
const SCOPE_TYPES = join(MODULE_DIR, "../scope/scope.types");
const MODULE_INDEX = join(MODULE_DIR, "index");

const path = (file: string): string => JSON.stringify(file);

/** Lines 1-2 of every probe: the real barrel export and the real actor enum. */
const PREAMBLE = [
  `import { useLegacyInvoices, useLegacyInvoice } from ${path(MODULE_INDEX)};`,
  `import { ScopeActorTypes } from ${path(SCOPE_TYPES)};`
];

/**
 * The two probes, each a separate file in ONE program. Type-checking the
 * module's real source is the whole cost here, and one program pays it once
 * for both rather than once per case.
 */
const PROBES: Record<string, string[]> = {
  "collection-retarget-refused": [
    ...PREAMBLE,
    `useLegacyInvoices().as(ScopeActorTypes.CLIENT).useMeta();`,
    `useLegacyInvoices().as(ScopeActorTypes.CLIENT).for("anything", "c-9");`
  ],
  "single-read-retarget-refused": [
    ...PREAMBLE,
    `useLegacyInvoice().as(ScopeActorTypes.CLIENT).useMeta();`,
    `useLegacyInvoice().as(ScopeActorTypes.CLIENT).for("anything", "c-9");`
  ]
};

/**
 * Type-check every probe as one real program and return, per probe, the
 * 1-based line numbers that carry a diagnostic. `types: []` keeps ambient
 * `@types` packages out; every import resolves from source, so a broken
 * import surfaces as its own diagnostic rather than as silence. Diagnostics
 * are bucketed by the file that produced them, so one probe can never answer
 * for another.
 *
 * @param probes - Probe programs by name, one statement per line.
 * @returns Each probe's diagnostic line numbers, ascending and deduped.
 */
function compileProbes(
  probes: Record<string, string[]>
): Record<string, number[]> {
  const dir = mkdtempSync(join(tmpdir(), "legacy-invoices-probe-"));

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

describe("legacy-invoices scope matrices — the all-never retarget refusal is compile-time (AC-13)", () => {
  let reported: Record<string, number[]>;

  beforeAll(() => {
    reported = compileProbes(PROBES);
  }, 120000);

  it("@AC-13 useLegacyInvoices().as(...).for(...) never compiles, while the control call stays clean", () => {
    expect(reported["collection-retarget-refused"]).toEqual([4]);
  });

  it("@AC-13 useLegacyInvoice().as(...).for(...) never compiles, while the control call stays clean", () => {
    expect(reported["single-read-retarget-refused"]).toEqual([4]);
  });
});
