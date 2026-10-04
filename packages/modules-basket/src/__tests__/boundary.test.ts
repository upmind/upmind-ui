// -----------------------------------------------------------------------------
/**
 * @fileoverview `basket` speaks no Nuxt.
 *
 * ## Job To Be Done
 * Nothing here imports Nuxt core.
 *
 * ## What Breaks If These Fail
 * A Nuxt-only file breaks the Vite cart build.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());
const SOURCE_ROOT = join(PACKAGE_ROOT, "src");

const NUXT_CORE = ["#app", "#imports", "nuxt", "nuxt/kit", "nuxt/app"];

const SOURCE_EXTENSIONS = [".ts", ".vue", ".mts"];

function productionFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      return entry === "__tests__" ? [] : productionFiles(path);
    }
    if (entry.endsWith(".spec.ts")) return [];

    return SOURCE_EXTENSIONS.includes(extname(entry)) ? [path] : [];
  });
}

const IMPORT_FORMS = [
  /\b(?:import|export)\b[^;]*?\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*\(\s*["']([^"']+)["']/g,
  /\bimport\s+["']([^"']+)["']/g
];

const files = productionFiles(SOURCE_ROOT);

const allFiles = [
  ...files,
  ...readdirSync(PACKAGE_ROOT)
    .filter(entry => extname(entry) === ".ts")
    .map(entry => join(PACKAGE_ROOT, entry))
];

const manifest = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")
) as {
  exports?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const imports = files.flatMap(file => {
  const code = readFileSync(file, "utf8");

  return IMPORT_FORMS.flatMap(form =>
    [...code.matchAll(form)].map(match => ({
      file: file.slice(PACKAGE_ROOT.length + 1),
      specifier: match[1]
    }))
  );
});

const workspaceImports = imports.filter(entry =>
  entry.specifier.startsWith("@upmind")
);

// -----------------------------------------------------------------------------

describe("the tree this spec reads", () => {
  it("finds the package's production files and their imports", () => {
    expect(files.length).toBeGreaterThan(20);
    expect(workspaceImports.length).toBeGreaterThan(20);
  });
});

describe("the Nuxt half, which no file here is allowed", () => {
  function namesNuxt(specifier: string) {
    return NUXT_CORE.some(
      name => specifier === name || specifier.startsWith(`${name}/`)
    );
  }

  it("keeps Nuxt core out of every organism", () => {
    const organisms = imports
      .filter(entry => namesNuxt(entry.specifier))
      .map(entry => `${entry.file} -> ${entry.specifier}`);

    expect(
      organisms,
      `an organism speaks Nuxt, so the Vite cart cannot mount it: ${organisms.join(", ")}`
    ).toEqual([]);
  });

  it("speaks Nuxt in no file it ships", () => {
    const speakers = allFiles
      .filter(file =>
        IMPORT_FORMS.some(form =>
          [...readFileSync(file, "utf8").matchAll(form)].some(
            match => match[1] !== undefined && namesNuxt(match[1])
          )
        )
      )
      .map(file => file.slice(PACKAGE_ROOT.length + 1))
      .sort();

    expect(speakers).toEqual([]);
    expect(manifest.devDependencies ?? {}).not.toHaveProperty("nuxt");
    expect(manifest.exports ?? {}).not.toHaveProperty("./nuxt");
  });
});
