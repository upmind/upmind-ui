// -----------------------------------------------------------------------------
/**
 * @fileoverview The PUBLISHED package surface — measured with no bundler in
 * play (Task 62 · ruling F-1 · W-D22).
 *
 * ## Job To Be Done
 * A consumer reaches the package through its ONE barrel and cannot reach
 * anything else inside it. Every other read-back in this bundle resolves that
 * specifier through a Vite/Vitest **alias**, and an alias outranks package
 * `exports` — so it stays green with the `exports` map missing. This file is
 * the only proof of the published contract: resolution runs in a **spawned Node
 * process** whose cwd is a real consumer package, so the resolver in play is
 * Node's own.
 *
 * ## What Breaks If These Fail
 * The map is absent and every path inside the package is reachable again, which
 * is the boundary W-D22 exists to close.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { flatMap, forEach, fromPairs, keys, map } from "lodash-es";

// -----------------------------------------------------------------------------

const packageRoot = join(import.meta.dirname, "..", "..");
const repoRoot = join(packageRoot, "..", "..");

/** A real consumer of the package, outside it — the vantage point that matters. */
const consumerCwd = join(repoRoot, "playgrounds", "labs-nuxt");

const BUILT_ENTRIES = ["dist/index.js", "dist/index.d.ts"];

const SANCTIONED = [
  "@upmind-automation/headless",
  "@upmind-automation/headless/package.json"
];

/**
 * The subpaths W-D22 bans. `/modules/*` is the one the story's own source used
 * to reach for; `__tests__/fixtures` is the one a sanctioned `/modules/*` would
 * have forced the map to sanction too.
 */
const BANNED = [
  "@upmind-automation/headless/modules/client-email",
  "@upmind-automation/headless/scenarios",
  "@upmind-automation/headless/dist/index.js",
  "@upmind-automation/headless/src/modules/client-email/__tests__/fixtures/get-clients-id-emails.json"
];

type Resolution = { ok: boolean; url?: string; code?: string };

/**
 * Shipped `.ts` under `src/` — `__tests__` excluded, since a spec naming a
 * banned symbol in order to ban it would answer its own question.
 */
function sourceFilesMatching(pattern: RegExp): string[] {
  const walk = (dir: string): string[] =>
    flatMap(readdirSync(dir, { withFileTypes: true }), entry => {
      const path = join(dir, entry.name);
      if (entry.isDirectory())
        return entry.name === "__tests__" ? [] : walk(path);
      return entry.name.endsWith(".ts") &&
        pattern.test(readFileSync(path, "utf8"))
        ? [path]
        : [];
    });

  return walk(join(packageRoot, "src"));
}

/**
 * Node's own resolver, in its own process: no Vite, no Vitest, no alias map.
 * `import.meta.resolve` reads `exports` exactly as a published consumer would.
 */
function resolveOutsideBundler(
  specifiers: string[]
): Record<string, Resolution> {
  const script = `
    const out = {};
    for (const specifier of ${JSON.stringify(specifiers)}) {
      try {
        out[specifier] = { ok: true, url: import.meta.resolve(specifier) };
      } catch (error) {
        out[specifier] = { ok: false, code: error.code };
      }
    }
    process.stdout.write(JSON.stringify(out));
  `;

  return JSON.parse(
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: consumerCwd,
      encoding: "utf8"
    })
  );
}

beforeAll(() => {
  const missing = BUILT_ENTRIES.filter(
    entry => !existsSync(join(packageRoot, entry))
  );
  if (!missing.length) return;

  // The published surface cannot be measured off source, so the build IS a
  // precondition of this file rather than a separate lane's business.
  execFileSync("pnpm", ["--filter", "@upmind-automation/headless", "build"], {
    cwd: repoRoot,
    stdio: "pipe"
  });
}, 600000);

// -----------------------------------------------------------------------------

describe("headless — the published exports map, resolved with no alias in play (Task 62)", () => {
  it("emits every file the exports map points at", () => {
    forEach(BUILT_ENTRIES, entry =>
      expect(existsSync(join(packageRoot, entry)), entry).toBe(true)
    );
  });

  it("resolves the two sanctioned specifiers to the built files", () => {
    const resolved = resolveOutsideBundler(SANCTIONED);

    expect(resolved["@upmind-automation/headless"].url).toContain(
      "/packages/headless/dist/index.js"
    );
    expect(resolved["@upmind-automation/headless/package.json"].url).toContain(
      "/packages/headless/package.json"
    );
  });

  it("refuses every deep subpath — the boundary is the resolver's, not a lint rule's", () => {
    const resolved = resolveOutsideBundler(BANNED);

    expect(
      fromPairs(map(keys(resolved), key => [key, resolved[key].code]))
    ).toEqual(
      fromPairs(
        map(BANNED, specifier => [specifier, "ERR_PACKAGE_PATH_NOT_EXPORTED"])
      )
    );
  });

  it("declares types before import in every entry, so dist/*.d.ts stays findable under moduleResolution bundler", async () => {
    const manifest = (await import("../../package.json")).default as {
      exports: Record<string, Record<string, string> | string>;
    };

    forEach(["." as const], entry => {
      const conditions = manifest.exports[entry] as Record<string, string>;
      expect(keys(conditions)[0], entry).toBe("types");
    });
  });
});

describe("headless — the package has NO scenario concept at all (G3b)", () => {
  it("the published barrel carries no scenario key and no map", async () => {
    const barrel = await import("../../dist/index.js");

    expect(keys(barrel).length).toBeGreaterThan(10);
    expect(keys(barrel)).not.toContain("CLIENT_EMAILS_SCENARIO");
    expect(keys(barrel)).not.toContain("CLIENT_EMAIL_SCENARIO");
    expect(keys(barrel)).not.toContain("scenarios");
  });

  it("declares no ./scenarios entry point to publish one through", async () => {
    const manifest = (await import("../../package.json")).default as {
      exports: Record<string, unknown>;
    };

    expect(keys(manifest.exports)).not.toContain("./scenarios");
  });

  it("holds no scenario key anywhere in its SOURCE, built or not", () => {
    expect(existsSync(join(packageRoot, "src/scenarios.ts"))).toBe(false);
    expect(sourceFilesMatching(/_SCENARIO\b/)).toEqual([]);
  });

  // The sweep above is an absence claim, so it is worth nothing until it is
  // shown to find something: this is the same walk over a symbol the module
  // tree does carry.
  it("runs a sweep that can actually find a symbol", () => {
    expect(
      sourceFilesMatching(/CLIENT_EMAILS_SCOPE_MATRIX/).length
    ).toBeGreaterThan(0);
  });
});
