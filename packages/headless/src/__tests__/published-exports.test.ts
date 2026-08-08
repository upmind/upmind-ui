// -----------------------------------------------------------------------------
/**
 * @fileoverview The PUBLISHED package surface — measured with no bundler in
 * play (Task 62 · ruling F-1 · W-D22).
 *
 * ## Job To Be Done
 * A consumer reaches the scenario map as `@upmind-automation/headless/scenarios`
 * and cannot reach anything else inside the package. Every other read-back in
 * this bundle resolves that specifier through a Vite/Vitest **alias**, and an
 * alias outranks package `exports` — so it stays green with the `exports` map
 * and the build entry both missing. This file is the only proof of the
 * published contract: resolution runs in a **spawned Node process** whose cwd is
 * a real consumer package, so the resolver in play is Node's own.
 *
 * ## What Breaks If These Fail
 * `pnpm build` emits `dist/index.js` alone, `"./scenarios"` dangles at a file
 * that was never written, and the failure surfaces only on publish — after the
 * playground has been green for weeks. Or the map is absent and every path
 * inside the package is reachable again, which is the boundary W-D22 exists to
 * close.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { forEach, fromPairs, keys, map } from "lodash-es";

// -----------------------------------------------------------------------------

const packageRoot = join(import.meta.dirname, "..", "..");
const repoRoot = join(packageRoot, "..", "..");

/** A real consumer of the package, outside it — the vantage point that matters. */
const consumerCwd = join(repoRoot, "playgrounds", "labs-nuxt");

const BUILT_ENTRIES = [
  "dist/index.js",
  "dist/scenarios.js",
  "dist/scenarios.d.ts"
];

const SANCTIONED = [
  "@upmind-automation/headless",
  "@upmind-automation/headless/scenarios",
  "@upmind-automation/headless/package.json"
];

/**
 * The subpaths W-D22 bans. `/modules/*` is the one the story's own source used
 * to reach for; `__tests__/fixtures` is the one a sanctioned `/modules/*` would
 * have forced the map to sanction too.
 */
const BANNED = [
  "@upmind-automation/headless/modules/client-email",
  "@upmind-automation/headless/src/scenarios",
  "@upmind-automation/headless/dist/scenarios.js",
  "@upmind-automation/headless/src/modules/client-email/__tests__/fixtures/get-clients-id-emails.json"
];

type Resolution = { ok: boolean; url?: string; code?: string };

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
  it("emits every file the exports map points at — including the second lib entry", () => {
    forEach(BUILT_ENTRIES, entry =>
      expect(existsSync(join(packageRoot, entry)), entry).toBe(true)
    );
  });

  it("resolves the three sanctioned specifiers to the built files", () => {
    const resolved = resolveOutsideBundler(SANCTIONED);

    expect(resolved["@upmind-automation/headless"].url).toContain(
      "/packages/headless/dist/index.js"
    );
    expect(resolved["@upmind-automation/headless/scenarios"].url).toContain(
      "/packages/headless/dist/scenarios.js"
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

    forEach(["." as const, "./scenarios" as const], entry => {
      const conditions = manifest.exports[entry] as Record<string, string>;
      expect(keys(conditions)[0], entry).toBe("types");
    });
  });
});

describe("headless — the scenario keys never touch the main barrel (F-1)", () => {
  it("the published main barrel carries neither scenario key nor the map", async () => {
    const barrel = await import("../../dist/index.js");

    expect(keys(barrel).length).toBeGreaterThan(10);
    expect(keys(barrel)).not.toContain("CLIENT_EMAILS_SCENARIO");
    expect(keys(barrel)).not.toContain("CLIENT_EMAIL_SCENARIO");
    expect(keys(barrel)).not.toContain("scenarios");
  });

  it("the published ./scenarios entry carries both keys and a boot THUNK per key — enumerating it instantiates no scope", async () => {
    const entry = (await import("../../dist/scenarios.js")) as {
      default: Record<string, () => unknown>;
      CLIENT_EMAILS_SCENARIO: string;
      CLIENT_EMAIL_SCENARIO: string;
    };

    expect(keys(entry)).toEqual(
      expect.arrayContaining([
        "CLIENT_EMAILS_SCENARIO",
        "CLIENT_EMAIL_SCENARIO"
      ])
    );
    expect(keys(entry.default)).toEqual([
      entry.CLIENT_EMAILS_SCENARIO,
      entry.CLIENT_EMAIL_SCENARIO
    ]);
    forEach(entry.default, thunk => expect(typeof thunk).toBe("function"));
  });

  it("the SOURCE main barrel cannot be evaluated at all — a live runtime import cycle through modules/scope (DEFECT, owed to the developer seat)", async () => {
    // Not a law — a characterisation of a standing defect, so it is measured
    // rather than discovered again by the next reader. The runtime edge that
    // closes the loop is `modules/scope/scope.utils.ts -> ../session-store`:
    // from there the graph reaches `useUpmind -> query -> basket ->
    // client-company.services -> client-email/index`, which calls
    // `createScopedComposable` while `scope.builder.ts` is still initialising.
    // The published `dist/` barrel above is unaffected (rollup re-orders it),
    // and `import "../modules/session-store"` before the barrel also loads
    // clean. DELETE this case with the fix — it goes RED when the cycle dies.
    await expect(import("../index")).rejects.toThrow(
      /createScopedComposable\) is not a function/
    );
  });
});
