// -----------------------------------------------------------------------------
/**
 * @fileoverview `catalogue` reaches `domain` only through one lazy import.
 *
 * ## Job To Be Done
 * Nothing the package's entry points reach imports `domain` at runtime except the
 * one dynamic import in the DAC widget, and nothing imports Nuxt.
 *
 * ## What Breaks If These Fail
 * A catalogue that never shows the domain search loads the whole domain tree anyway.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assign, filter, flatMap, map } from "lodash-es";

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

const IMPORT_KIND = {
  STATIC: "static",
  TYPE: "type",
  DYNAMIC: "dynamic"
} as const;

type ImportKind = (typeof IMPORT_KIND)[keyof typeof IMPORT_KIND];

type Reference = { specifier: string; kind: ImportKind };

const FROM_FORM = /\b(?:import|export)\b([^;]*?)\bfrom\s*["']([^"']+)["']/g;
const DYNAMIC_FORM = /\bimport\s*\(\s*["']([^"']+)["']/g;
const SIDE_EFFECT_FORM = /\bimport\s+["']([^"']+)["']/g;

/** A whole `import type` / `export type` statement is erased at build; an inline `type` is not. */
const TYPE_ONLY_CLAUSE = /^\s*type\b/;

function kindOfClause(clause: string): ImportKind {
  if (TYPE_ONLY_CLAUSE.test(clause)) return IMPORT_KIND.TYPE;
  return IMPORT_KIND.STATIC;
}

/**
 * Run separately: one alternation loses a side-effect `import "x";` to the from-form's gap.
 */
function referencesIn(source: string): Reference[] {
  const code = withoutComments(source);
  const found: Reference[] = [];
  for (const match of code.matchAll(FROM_FORM)) {
    found.push({ specifier: match[2], kind: kindOfClause(match[1]) });
  }
  for (const match of code.matchAll(DYNAMIC_FORM)) {
    found.push({ specifier: match[1], kind: IMPORT_KIND.DYNAMIC });
  }
  for (const match of code.matchAll(SIDE_EFFECT_FORM)) {
    found.push({ specifier: match[1], kind: IMPORT_KIND.STATIC });
  }
  return found;
}

function specifiersIn(source: string) {
  return map(referencesIn(source), reference => reference.specifier);
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
  exports?: Record<string, string>;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const RELATIVE_ESCAPES = [/(^|\/)\.\.\/domain\//, /\/domain\/src\//];

const DOMAIN_PACKAGE = "@upmind-automation/domain";
const DOMAIN_SPECIFIER = /(^|[/@])domain(\/|$)/;
const LAZY_HOME = "src/products/WidgetDAC.vue";

const domainReferences = flatMap(organisms.files, file =>
  map(
    filter(referencesIn(readFileSync(file, "utf8")), reference =>
      DOMAIN_SPECIFIER.test(reference.specifier)
    ),
    reference => assign({ file: relativeToPackage(file) }, reference)
  )
);

function domainReferencesOf(kind: ImportKind) {
  return map(
    filter(domainReferences, reference => reference.kind === kind),
    reference => `${reference.file} -> ${reference.specifier}`
  );
}

const escaping = organisms.files
  .map(file => ({
    file: relativeToPackage(file),
    hits: specifiersIn(readFileSync(file, "utf8")).filter(specifier =>
      RELATIVE_ESCAPES.some(pattern => pattern.test(specifier))
    )
  }))
  .filter(entry => entry.hits.length > 0);

// -----------------------------------------------------------------------------

describe("the catalogue package's resolved import boundary", () => {
  it("resolves a real graph, and every edge in it", () => {
    expect(organisms.files.length).toBeGreaterThan(1);
    expect(organisms.unresolved).toEqual([]);
  });

  it("imports domain statically at no hop", () => {
    const reach = domainReferencesOf(IMPORT_KIND.STATIC);

    expect(
      reach,
      `browse loads the domain package with its own code, so a catalogue ` +
        `that never shows the domain search still ships it: ${reach.join(", ")}`
    ).toEqual([]);

    expect(
      escaping.map(entry => `${entry.file} -> ${entry.hits.join(", ")}`),
      `a relative path spells the same edge without naming the package`
    ).toEqual([]);
  });

  it("loads domain through exactly one dynamic import, in the DAC widget", () => {
    expect(domainReferencesOf(IMPORT_KIND.DYNAMIC)).toEqual([
      `${LAZY_HOME} -> ${DOMAIN_PACKAGE}`
    ]);
  });

  it("declares the domain package it loads", () => {
    expect(Object.keys(manifest.dependencies ?? {})).toContain(DOMAIN_PACKAGE);
  });

  it("keeps Nuxt core out of every organism", () => {
    expect(
      reaches(organisms.bare, NUXT_CORE),
      "an organism speaks Nuxt, so cart cannot mount it"
    ).toEqual([]);
  });

  it("speaks Nuxt in no file it ships", () => {
    const speakers = allFiles
      .filter(
        file =>
          reaches(specifiersIn(readFileSync(file, "utf8")), NUXT_CORE).length >
          0
      )
      .map(relativeToPackage)
      .sort();

    expect(speakers).toEqual([]);
    expect(manifest.devDependencies ?? {}).not.toHaveProperty("nuxt");
    expect(manifest.exports ?? {}).not.toHaveProperty("./nuxt");
  });
});

describe("the import reader the boundary rests on", () => {
  it.each([
    [
      'import type { DomainTemplates } from "@upmind-automation/domain";',
      IMPORT_KIND.TYPE
    ],
    [
      'export type { DomainTemplates } from "@upmind-automation/domain";',
      IMPORT_KIND.TYPE
    ],
    [
      'import { UpmDacWidget } from "@upmind-automation/domain";',
      IMPORT_KIND.STATIC
    ],
    [
      'import { type DomainTemplates } from "@upmind-automation/domain";',
      IMPORT_KIND.STATIC
    ],
    [
      'export { UpmDacWidget } from "@upmind-automation/domain";',
      IMPORT_KIND.STATIC
    ],
    ['import "@upmind-automation/domain";', IMPORT_KIND.STATIC],
    [
      'const widget = () => import("@upmind-automation/domain");',
      IMPORT_KIND.DYNAMIC
    ]
  ])("reads %s as a %s reference", (source, kind) => {
    expect(map(referencesIn(source), "kind")).toEqual([kind]);
  });
});
