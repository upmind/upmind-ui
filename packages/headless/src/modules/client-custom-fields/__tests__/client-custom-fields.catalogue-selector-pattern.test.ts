// -----------------------------------------------------------------------------
/**
 * @fileoverview client-custom-fields — a catalogue is a SELECTOR, a client is a
 * RETARGET (AC-27/AC-37, unit)
 *
 * ## Job To Be Done
 * The two context patterns are mutually exclusive (`scope.types.ts`,
 * `ScopeContextPatterns`): a RETARGET member names an entity and DEMANDS an id,
 * a SELECTOR member is the whole answer and FORBIDS one. AC-27 grades what the
 * module offers at run time, not only when the code is compiled — this file
 * grades the other half, that each catalogue member is declared as the pattern
 * it actually is, by type-checking real call sites against the real barrel.
 *
 * A catalogue declared bare would compile as a retarget: the picker and every
 * consumer would be asked for an id the catalogue has no entity to supply.
 *
 * ## What Breaks If These Fail
 * `.for(CANCEL_REQUEST)` stops compiling and the catalogue becomes unreachable
 * without inventing an id, or `.for(CLIENT)` starts compiling with no client
 * named and the read silently falls back to the session's own.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import "./mocks";
import { sortBy, split, last, trim, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

/**
 * Type-check `lines` as a real program against this module's real barrel and
 * return the 1-based line numbers carrying a diagnostic — the same probe
 * `client-custom-fields.surface.test.ts` uses for the actor gate.
 */
function compileProbe(lines: string[]): number[] {
  const dir = mkdtempSync(join(tmpdir(), "ccf-pattern-"));
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

const PREAMBLE = [
  `import { useClientCustomFields, ClientCustomFieldsContextTypes } from ${JSON.stringify(MODULE_DIR)};`,
  `import { ScopeActorTypes } from ${JSON.stringify(join(MODULE_DIR, "../scope/scope.types"))};`,
  `const collection = () => useClientCustomFields().as(ScopeActorTypes.CLIENT);`
];

// -----------------------------------------------------------------------------

describe("client-custom-fields — the catalogue members are SELECTOR, the client member is RETARGET (AC-27/AC-37)", () => {
  it("AC-27 every declared catalogue is reachable with no id, and the client member still demands one", () => {
    const diagnostics = compileProbe([
      ...PREAMBLE,
      `collection().for(ClientCustomFieldsContextTypes.INVOICE);`,
      `collection().for(ClientCustomFieldsContextTypes.CANCEL_REQUEST);`,
      `collection().for(ClientCustomFieldsContextTypes.CLIENT, "x");`,
      `collection().for(ClientCustomFieldsContextTypes.CLIENT);`
    ]);

    expect(diagnostics).toEqual([7]);
  }, 60000);

  it("AC-37 a catalogue refuses an id — neither catalogue can be spelled as a retarget", () => {
    const diagnostics = compileProbe([
      ...PREAMBLE,
      `collection().for(ClientCustomFieldsContextTypes.INVOICE, "x");`,
      `collection().for(ClientCustomFieldsContextTypes.CANCEL_REQUEST, "x");`,
      `collection().for(ClientCustomFieldsContextTypes.CLIENT, "x");`
    ]);

    expect(diagnostics).toEqual([4, 5]);
  }, 60000);
});
