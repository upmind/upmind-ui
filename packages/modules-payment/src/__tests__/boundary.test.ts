// -----------------------------------------------------------------------------
/**
 * @fileoverview `payment` speaks no Nuxt
 *
 * ## Job To Be Done
 * Nothing the package's entry points reach imports Nuxt core.
 *
 * ## What Breaks If These Fail
 * The organism cannot mount in cart.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());
const SOURCE_EXTENSIONS = [".ts", ".vue", ".mts", ".js", ".mjs"];

const PUBLIC_ENTRY_POINTS = ["src/index.ts"];

const NUXT_CORE = ["#app", "#imports", "nuxt", "nuxt/kit", "nuxt/app"];

function relativeToPackage(path: string) {
  return path.slice(PACKAGE_ROOT.length + 1);
}

function withoutComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

const IMPORT_FORMS = [
  /\b(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g
];

function specifiersIn(source: string) {
  const found: string[] = [];
  const code = withoutComments(source);
  for (const form of IMPORT_FORMS) {
    for (const match of code.matchAll(form)) {
      if (match[1]) found.push(match[1]);
    }
  }
  return found;
}

function resolveRelative(from: string, specifier: string) {
  const base = join(dirname(from), specifier);
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map(extension => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map(extension => join(base, `index${extension}`))
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    if (statSync(candidate).isDirectory()) continue;
    return candidate;
  }
  return undefined;
}

function closureOf(entryPoints: string[]) {
  const bare = new Set<string>();
  const files = new Set<string>();
  const unresolved: string[] = [];
  const queue = entryPoints
    .map(entry => join(PACKAGE_ROOT, entry))
    .filter(entry => existsSync(entry));

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || files.has(file)) continue;
    files.add(file);

    for (const specifier of specifiersIn(readFileSync(file, "utf8"))) {
      if (!specifier.startsWith(".")) {
        bare.add(specifier);
        continue;
      }
      const target = resolveRelative(file, specifier);
      if (!target) {
        unresolved.push(`${relativeToPackage(file)} -> ${specifier}`);
        continue;
      }
      queue.push(target);
    }
  }

  return { bare: [...bare].sort(), files: [...files], unresolved };
}

function sourceFiles(directory: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      if (entry === "__tests__") continue;
      found.push(...sourceFiles(path));
      continue;
    }
    if ([".ts", ".vue"].includes(extname(entry))) found.push(path);
  }
  return found;
}

function reaches(bare: string[], names: string[]) {
  return names.filter(name =>
    bare.some(
      specifier => specifier === name || specifier.startsWith(`${name}/`)
    )
  );
}

const organisms = closureOf(PUBLIC_ENTRY_POINTS);
const modules = sourceFiles(join(PACKAGE_ROOT, "src"));

const allFiles = [
  ...modules,
  ...readdirSync(PACKAGE_ROOT)
    .filter(entry => extname(entry) === ".ts")
    .map(entry => join(PACKAGE_ROOT, entry))
];

const manifest = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")
) as {
  devDependencies?: Record<string, string>;
  exports?: Record<string, string>;
};

// -----------------------------------------------------------------------------

describe("the payment package's resolved import boundary", () => {
  it("resolves a real graph, and every edge in it", () => {
    expect(organisms.files.length).toBeGreaterThan(1);
    expect(organisms.unresolved).toEqual([]);
  });

  it("keeps Nuxt core out of every organism", () => {
    expect(reaches(organisms.bare, NUXT_CORE)).toEqual([]);
  });

  it("speaks Nuxt in no file it ships", () => {
    const speakers = allFiles
      .filter(file => {
        const specifiers = specifiersIn(readFileSync(file, "utf8"));
        return reaches(specifiers, NUXT_CORE).length > 0;
      })
      .map(relativeToPackage)
      .sort();

    expect(speakers).toEqual([]);
    expect(manifest.devDependencies ?? {}).not.toHaveProperty("nuxt");
    expect(manifest.exports ?? {}).not.toHaveProperty("./nuxt");
  });
});
