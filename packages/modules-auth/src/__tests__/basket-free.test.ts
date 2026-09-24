// -----------------------------------------------------------------------------
/**
 * @fileoverview `auth` resolves to no commerce package and speaks no Nuxt.
 *
 * ## Job To Be Done
 * No entry point's import closure reaches a package above `auth`, and no file imports Nuxt.
 *
 * ## What Breaks If These Fail
 * A login screen pulls the basket module graph into every host, including hosts with no basket.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());
const SOURCE_EXTENSIONS = [".ts", ".vue", ".mts", ".js", ".mjs"];

const ORGANISM_ENTRIES = ["src/index.ts"];

const ENTRY_POINTS = [...ORGANISM_ENTRIES];

const ABOVE_AUTH = [
  "@upmind-automation/client-vue",
  "@upmind-automation/basket",
  "@upmind-automation/client",
  "@upmind-automation/checkout"
];

const REACHED = [
  "@upmind-automation/foundation",
  "@upmind-automation/headless",
  "@upmind/ui",
  "class-variance-authority",
  "lodash-es",
  "vue",
  "vue-i18n",
  "vue-router"
];

const UNREACHABLE = ["src/components/Expired.vue"];

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

function resolvedGraph(entries: string[] = ENTRY_POINTS) {
  const bare = new Set<string>();
  const files = new Set<string>();
  const unresolved: string[] = [];
  const queue = entries
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

const graph = resolvedGraph();
const organisms = resolvedGraph(ORGANISM_ENTRIES);
const modules = sourceFiles(join(PACKAGE_ROOT, "src"));

const allFiles = [
  ...modules,
  ...readdirSync(PACKAGE_ROOT)
    .filter(entry => extname(entry) === ".ts")
    .map(entry => join(PACKAGE_ROOT, entry))
];

function reaches(bare: string[], names: string[]) {
  return names.filter(name =>
    bare.some(
      specifier => specifier === name || specifier.startsWith(`${name}/`)
    )
  );
}

// -----------------------------------------------------------------------------

describe("the Nuxt half, which this package no longer has", () => {
  it("keeps Nuxt core out of every organism", () => {
    expect(
      reaches(organisms.bare, NUXT_CORE),
      "an organism speaks Nuxt, so the Vite cart cannot mount it"
    ).toEqual([]);
  });

  it("speaks Nuxt in no file it ships", () => {
    const speaking = allFiles
      .filter(
        file =>
          reaches(specifiersIn(readFileSync(file, "utf8")), NUXT_CORE).length >
          0
      )
      .map(relativeToPackage)
      .sort();

    expect(speaking).toEqual([]);
  });
});

describe("the auth package's resolved import boundary", () => {
  it("resolves a real graph, and every edge in it", () => {
    expect(graph.files.length).toBeGreaterThan(1);
    expect(graph.unresolved).toEqual([]);
  });

  it("reaches every module under src bar the ones declared unreachable", () => {
    const missed = modules
      .filter(file => !graph.files.includes(file))
      .map(relativeToPackage)
      .filter(file => !UNREACHABLE.includes(file));

    expect(missed).toEqual([]);
  });

  it("resolves to no package that sits above auth", () => {
    const reached = ABOVE_AUTH.filter(name =>
      graph.bare.some(
        specifier => specifier === name || specifier.startsWith(`${name}/`)
      )
    );

    expect(reached).toEqual([]);
  });

  it("reaches exactly the packages a §7 leaf may reach, and no others", () => {
    expect(graph.bare).toEqual(REACHED);
  });

  it("takes the summary aside from its host rather than building one", () => {
    const built = modules
      .filter(file => {
        const source = readFileSync(file, "utf8");
        return (
          source.includes("cart.basket_section") ||
          source.includes("shopping-bag-02")
        );
      })
      .map(relativeToPackage);

    expect(built).toEqual([]);
  });
});
