// -----------------------------------------------------------------------------
/**
 * @fileoverview The optional-host checks for browse and `domain`.
 *
 * ## Job To Be Done
 * portal-nuxt neither declares nor imports `domain`; cart-nuxt takes both packages.
 *
 * ## What Breaks If These Fail
 * The optional package ships to every brand.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(process.cwd(), "..", "..");

const HOSTS = [
  { app: "cart", source: "src" },
  { app: "cart-nuxt", source: "app" },
  { app: "portal-nuxt", source: "app" }
];

const PACKAGE = "@upmind-automation/catalogue";
const DOMAIN = "@upmind-automation/domain";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".vue", ".mts", ".js", ".mjs"];

function sourceFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (entry === "node_modules" || entry === ".nuxt" || entry === "dist") {
      continue;
    }
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path));
      continue;
    }
    if (SOURCE_EXTENSIONS.includes(extname(entry))) found.push(path);
  }
  return found;
}

/**
 * String-aware comment stripping: `import.meta.glob` patterns in cart's `main.ts` contain a slash-star.
 */
function withoutComments(source: string) {
  let out = "";
  let index = 0;
  let quote: string | undefined;

  while (index < source.length) {
    const character = source[index];
    const next = source[index + 1];

    if (quote) {
      if (character === "\\") {
        out += character + (next ?? "");
        index += 2;
        continue;
      }
      if (character === quote) quote = undefined;
      out += character;
      index += 1;
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      out += character;
      index += 1;
      continue;
    }

    if (character === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      out += " ";
      index = end < 0 ? source.length : end + 2;
      continue;
    }

    if (character === "/" && next === "/") {
      const end = source.indexOf("\n", index);
      out += " ";
      index = end < 0 ? source.length : end;
      continue;
    }

    out += character;
    index += 1;
  }

  return out;
}

const IMPORT_FORMS = [
  /\b(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g
];

function importsOf(app: string, source: string, specifier: string) {
  const root = join(REPO_ROOT, "apps", app, source);
  const found: Array<{ file: string; specifier: string }> = [];

  for (const file of sourceFiles(root)) {
    const code = withoutComments(readFileSync(file, "utf8"));
    for (const form of IMPORT_FORMS) {
      for (const match of code.matchAll(form)) {
        if (!match[1]?.startsWith(specifier)) continue;
        found.push({
          file: file.slice(REPO_ROOT.length + 1),
          specifier: match[1]
        });
      }
    }
  }
  return found;
}

function manifestOf(app: string) {
  return JSON.parse(
    readFileSync(join(REPO_ROOT, "apps", app, "package.json"), "utf8")
  ) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}

const wiring = HOSTS.map(host => ({
  ...host,
  imports: importsOf(host.app, host.source, PACKAGE),
  dependencies: {
    ...manifestOf(host.app).dependencies,
    ...manifestOf(host.app).devDependencies
  }
}));

// -----------------------------------------------------------------------------

describe("the host that proves the optional package optional", () => {
  const portal = wiring.find(host => host.app === "portal-nuxt");

  it("ships browse with no domain dependency declared", () => {
    expect(
      Object.keys(portal?.dependencies ?? {}),
      `portal declares ${DOMAIN}, so browse no longer demonstrates that the ` +
        `optional package is optional`
    ).not.toContain(DOMAIN);
  });

  it("imports nothing of the domain package anywhere in its source", () => {
    const reach = importsOf("portal-nuxt", "app", DOMAIN).map(
      entry => `${entry.file} -> ${entry.specifier}`
    );

    expect(reach).toEqual([]);
  });

  it("is the exception, not the rule — cart-nuxt takes both", () => {
    const cartNuxt = wiring.find(host => host.app === "cart-nuxt");

    expect(Object.keys(cartNuxt?.dependencies ?? {})).toContain(PACKAGE);
    expect(Object.keys(cartNuxt?.dependencies ?? {})).toContain(DOMAIN);
  });
});
