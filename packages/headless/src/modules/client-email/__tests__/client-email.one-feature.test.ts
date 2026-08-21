// -----------------------------------------------------------------------------
/**
 * @module client-email/__tests__/client-email.one-feature
 * @description The merge that made `client-email.feature` the module's ONE
 * spec: one `.feature`, one `.steps.ts`, one traceability test, one `Feature:`
 * keyword and no scenario name written twice — the four ways a concatenation
 * masquerades as a merge.
 *
 * Two bans ride with it. `canary` was pilot slang that reached filenames and
 * exported symbols, so the claim is over TRACKED names rather than the working
 * tree. And module code may not READ `docs/sdd`: comments are stripped before
 * the sweep, because a historical provenance receipt is a record of where a
 * ruling was written down, not a reach for it.
 *
 * ## What Breaks If These Fail
 * The module grows a second spec nobody drives, the entry's module key silently
 * publishes one file and drops the other, or a test starts depending on
 * planning material that is deleted the moment the story closes.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../../../../package.json";
import {
  countBy,
  filter,
  flatMap,
  flatten,
  keys,
  map,
  reject,
  size,
  values
} from "lodash-es";

// -----------------------------------------------------------------------------

const TEST_DIR = import.meta.dirname;
const MODULES_DIR = join(TEST_DIR, "..", "..");
const REPO_ROOT = join(MODULES_DIR, "..", "..", "..", "..");

const MODULE = "client-email";
/** A file naming the banned spelling in order to ban it answers its own question. */
const SELF = "client-email.one-feature.test.ts";
const CANARY_INFIX = /(^|[./])canary([./]|$)/i;
const SDD_PATH = /docs\/sdd/;
const CODE_EXTENSIONS = /\.(?:ts|feature)$/;

const artefacts = readdirSync(TEST_DIR);

const named = (suffix: string) =>
  filter(artefacts, file => file.endsWith(suffix));

/** Source with its comments removed, so a provenance receipt is not a read. */
function code(path: string): string {
  return readFileSync(path, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/^\s*#.*$/gm, "");
}

function sourceFiles(directory: string): string[] {
  return flatMap(readdirSync(directory), entry => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory())
      return entry === "node_modules" ? [] : sourceFiles(path);

    return CODE_EXTENSIONS.test(entry) && entry !== SELF ? [path] : [];
  });
}

const trackedFiles = filter(
  execFileSync("git", ["ls-files"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024
  }).split("\n")
);

const featureText = readFileSync(join(TEST_DIR, `${MODULE}.feature`), "utf-8");

const scenarioNames = map(
  filter(featureText.split("\n"), line =>
    /^\s*(?:Scenario|Scenario Outline):/.test(line)
  ),
  line => line.replace(/^\s*(?:Scenario|Scenario Outline):\s*/, "").trim()
);

// -----------------------------------------------------------------------------

describe("client-email — ONE feature, ONE catalog, ONE traceability test", () => {
  it("keeps exactly one .feature, named for the module", () => {
    expect(named(".feature")).toStrictEqual([`${MODULE}.feature`]);
  });

  it("keeps exactly one step catalog and one traceability test, named for the module", () => {
    expect(named(".steps.ts")).toStrictEqual([`${MODULE}.steps.ts`]);
    expect(named(".traceability.test.ts")).toStrictEqual([
      `${MODULE}.traceability.test.ts`
    ]);
  });

  it("merged into ONE Feature block rather than concatenating two", () => {
    expect(
      size(filter(featureText.split("\n"), line => /^Feature:/.test(line)))
    ).toBe(1);
  });

  it("carries every scenario exactly once, so the merge dropped none and doubled none", () => {
    expect(scenarioNames.length).toBeGreaterThan(30);
    expect(
      keys(filter(countBy(scenarioNames), occurrences => occurrences > 1))
    ).toStrictEqual([]);
  });
});

describe("client-email — the two names the merge banished", () => {
  it("leaves no tracked path in the repo carrying the canary infix", () => {
    expect(filter(trackedFiles, path => CANARY_INFIX.test(path))).toStrictEqual(
      []
    );
  });

  it("publishes no canary key or target through the package's exports map", () => {
    expect(
      filter(
        [...keys(manifest.exports), ...flatten(map(values(manifest.exports)))],
        entry => /canary/i.test(String(entry))
      )
    ).toStrictEqual([]);
  });

  it("reads no docs/sdd path from any module's executable code", () => {
    const offenders = reject(
      map(sourceFiles(MODULES_DIR), path => ({
        file: relative(REPO_ROOT, path),
        reads: size(code(path).match(SDD_PATH))
      })),
      entry => entry.reads === 0
    );

    expect(offenders).toStrictEqual([]);
  });

  // The two sweeps above are absence claims, worth nothing until the same walk
  // is shown to find something.
  it("runs a sweep that can actually find a path", () => {
    const walked = sourceFiles(MODULES_DIR);

    expect(walked.length).toBeGreaterThan(100);
    expect(
      filter(walked, path => /client-email\.steps/.test(code(path))).length
    ).toBeGreaterThan(0);
  });

  it("names no docs/sdd path in this module's tests at all, comments included", () => {
    const offenders = filter(
      map(
        reject(artefacts, file => file === SELF),
        file => join(TEST_DIR, file)
      ),
      path =>
        statSync(path).isFile() && SDD_PATH.test(readFileSync(path, "utf-8"))
    );

    expect(map(offenders, path => relative(REPO_ROOT, path))).toStrictEqual([]);
  });
});
