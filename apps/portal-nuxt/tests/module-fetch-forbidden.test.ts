import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * tasks.md 5.7 / AC6.5 — "no module fetches": every module's data is a
 * fixture it is handed. Read-back names the exact grep:
 * `grep -rnE "\$fetch|useFetch|useAsyncData|useQuery|axios|fetch\(" apps/portal-nuxt/app/portal/modules`
 * filed with the fixture directory listing. Run programmatically here so a
 * later module regresses this in CI, not only at read-back time.
 *
 * Built from `fileURLToPath(import.meta.url)` alone, never
 * `new URL(relative, import.meta.url)` — Vite statically rewrites that
 * pattern for asset resolution, which silently turns it into an
 * `http://localhost` URL under this app's vitest config.
 */
const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const MODULES_DIR = join(TESTS_DIR, "..", "app", "portal", "modules");
const FIXTURES_DIR = join(TESTS_DIR, "..", "app", "portal", "fixtures");
const FORBIDDEN = /\$fetch|useFetch|useAsyncData|useQuery|axios|fetch\(/;

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

describe("modules — AC6.5: no module fetches; every module's data is a fixture", () => {
  it("carries no network-call pattern anywhere under app/portal/modules", () => {
    const offenders = listFiles(MODULES_DIR)
      .filter(file => /\.(vue|ts)$/.test(file))
      .filter(file => FORBIDDEN.test(readFileSync(file, "utf8")))
      .map(file => file.replace(MODULES_DIR, "app/portal/modules"));

    expect(offenders).toEqual([]);
  });

  it("has a non-empty fixture directory the modules are handed data from", () => {
    const fixtureFiles = readdirSync(FIXTURES_DIR).filter(entry =>
      entry.endsWith(".fixture.ts")
    );
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });
});
