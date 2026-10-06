// -----------------------------------------------------------------------------
/**
 * @fileoverview velia-nuxt is cart-nuxt plus its basket URL, and nothing else
 *
 * ## Job To Be Done
 * velia-nuxt extends cart-nuxt, declares no alias, and owns no source beyond
 * its basket segment, its redirects and its router options.
 *
 * ## What Breaks If These Fail
 * A Velia-only page, component or alias drifts from cart-nuxt, or an alias of
 * Velia's own changes where cart-nuxt's imports resolve.
 */

import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import config from "../nuxt.config";
import { endsWith, flatMap, includes, some, sortBy } from "lodash-es";

// -----------------------------------------------------------------------------

vi.hoisted(() => {
  vi.stubGlobal("defineNuxtConfig", (nuxtConfig: unknown) => nuxtConfig);
});

const ROOT = resolve(import.meta.dirname, "..");

const NOT_SOURCE = ["node_modules", ".nuxt", ".output", "public", "tests"];

const SOURCE_EXTENSIONS = [".ts", ".mts", ".js", ".mjs", ".vue", ".tsx"];

const OWNED = [
  "app/funnels/segment.ts",
  "app/redirects.ts",
  "app/router.options.ts",
  "nuxt.config.ts"
];

function sourceFiles(directory: string): string[] {
  return flatMap(readdirSync(directory, { withFileTypes: true }), entry => {
    if (includes(NOT_SOURCE, entry.name)) return [];

    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return some(SOURCE_EXTENSIONS, extension => endsWith(entry.name, extension))
      ? [relative(ROOT, path)]
      : [];
  });
}

const layer = config as unknown as {
  extends: string[];
  alias?: Record<string, string>;
};

// -----------------------------------------------------------------------------

describe("the velia-nuxt layer", () => {
  it("extends cart-nuxt alone", () => {
    expect(layer.extends).toEqual(["../cart-nuxt"]);
  });

  it("declares no alias", () => {
    expect(layer.alias).toBeUndefined();
  });

  it("owns no source but its segment, its redirects and its router options", () => {
    expect(sortBy(sourceFiles(ROOT))).toEqual(OWNED);
  });
});
