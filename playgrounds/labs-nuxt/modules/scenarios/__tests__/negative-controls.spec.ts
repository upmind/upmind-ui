// -----------------------------------------------------------------------------
/**
 * @module scenarios/__tests__/negative-controls.spec
 * @description The staleness alarm for this playground's negative controls.
 *
 * ## Job To Be Done
 * A `*.must-fail.patch` is a mutant: it breaks production source so the spec
 * beside it goes RED. Its whole worth is in landing. Once the source moves out
 * from under it the patch stops applying, the mutation never lands, and the
 * control keeps reading as protection while grading nothing.
 *
 * ## What Breaks If These Fail
 * A named control in the tree proves as much as no control at all, and the
 * FE-2824 shape it was committed to catch walks straight through a green suite.
 * `design-system/packages/ui/scripts/verify-must-fail.ts` raises this alarm for
 * that package; this playground carries the larger corpus and had none, so
 * drift here stayed invisible until a patch was applied by hand.
 *
 * BOUNDARY: this grades whether each mutant still LANDS, never whether the spec
 * beside it flips red — that needs a vitest run per patch and belongs in a
 * runner. A patch that lands can still be a survived mutant.
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { filter, flatMap, map, sortBy, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const PLAYGROUND_ROOT = process.cwd();

const SCANNED_ROOTS = ["app", "modules"];

const SKIPPED_DIRS = new Set(["node_modules", ".nuxt", "dist"]);

// Patch headers are repo-relative (`a/playgrounds/…`), so every git call has to
// run from the repo root or it inspects paths that do not exist.
const REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: PLAYGROUND_ROOT,
  encoding: "utf-8"
}).trim();

type Control = { patch: string; spec: string };

function walk(dir: string, keep: (entry: string) => boolean): string[] {
  return flatMap(readdirSync(dir), entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return SKIPPED_DIRS.has(entry) ? [] : walk(full, keep);
    }
    return keep(entry) ? [full] : [];
  });
}

const exists = (file: string): boolean => {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
};

/**
 * Whether git can land this patch on the tree as committed — no fuzz, no
 * three-way fallback, matching how a runner would apply it. `--check` inspects
 * only; it never writes.
 */
export function lands(patch: string): boolean {
  try {
    execFileSync("git", ["apply", "--check", patch], {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      stdio: "pipe"
    });
    return true;
  } catch {
    return false;
  }
}

/** The spec a control protects: its name up to the first classifying segment. */
export function specFor(patch: string): string {
  const stem = basename(patch, ".must-fail.patch").split(".")[0];
  return join(dirname(patch), `${stem}.spec.ts`);
}

// A root that is not there is left to the denominator assertion below rather
// than crashing collection — a run launched from the wrong directory must fail
// as "nothing was verified", never as an unreadable stack.
const CONTROLS: Control[] = map(
  flatMap(SCANNED_ROOTS, root => {
    const dir = join(PLAYGROUND_ROOT, root);
    return existsSync(dir)
      ? walk(dir, entry => entry.endsWith(".must-fail.patch"))
      : [];
  }),
  patch => ({ patch, spec: specFor(patch) })
);

const shown = (file: string): string => relative(PLAYGROUND_ROOT, file);

// -----------------------------------------------------------------------------

describe("negative controls — the alarm tells a landing mutant from a dead one", () => {
  const scratch = mkdtempSync(join(tmpdir(), "labs-negative-controls-"));

  const patchFile = (name: string, body: string): string => {
    const file = join(scratch, name);
    writeFileSync(file, body, "utf-8");
    return file;
  };

  it("reports a mutant whose context the tree no longer carries", () => {
    const drifted = patchFile(
      "drifted.patch",
      `--- a/playgrounds/labs-nuxt/package.json
+++ b/playgrounds/labs-nuxt/package.json
@@ -1,3 +1,3 @@
 {
-  "name": "a line this file has never carried",
+  "name": "the mutation",
   "private": true
`
    );

    expect(lands(drifted)).toBe(false);
  });

  it("clears a mutant the tree can still take", () => {
    const landable = patchFile(
      "landable.patch",
      `--- /dev/null
+++ b/playgrounds/labs-nuxt/modules/scenarios/__tests__/.probe-${process.pid}.ts
@@ -0,0 +1 @@
+export const probe = true;
`
    );

    expect(lands(landable)).toBe(true);
  });

  it("reads the protected spec off a control's own name", () => {
    expect(
      specFor(
        join("x", "__tests__", "force-presets.error-status.must-fail.patch")
      )
    ).toBe(join("x", "__tests__", "force-presets.spec.ts"));

    expect(
      specFor(
        join("x", "__tests__", "client-address-declaration.must-fail.patch")
      )
    ).toBe(join("x", "__tests__", "client-address-declaration.spec.ts"));
  });

  it("found controls to grade — an empty corpus must never read as a pass", () => {
    expect(CONTROLS.length).toBeGreaterThan(0);
    expect(
      uniq(map(CONTROLS, control => dirname(control.patch))).length
    ).toBeGreaterThan(1);
  });
});

describe("negative controls — every committed mutant still lands, and guards a spec", () => {
  it("leaves no mutant the source has moved out from under", () => {
    const stale = map(
      filter(CONTROLS, control => !lands(control.patch)),
      control => shown(control.patch)
    );

    expect(sortBy(stale)).toEqual([]);
  });

  it("leaves no mutant without the spec its own name claims to protect", () => {
    const orphans = map(
      filter(CONTROLS, control => !exists(control.spec)),
      control => `${shown(control.patch)} → ${shown(control.spec)}`
    );

    expect(sortBy(orphans)).toEqual([]);
  });

  it("leaves no mutant that mutates nothing", () => {
    const blank = map(
      filter(CONTROLS, control => statSync(control.patch).size === 0),
      control => shown(control.patch)
    );

    expect(sortBy(blank)).toEqual([]);
  });
});
