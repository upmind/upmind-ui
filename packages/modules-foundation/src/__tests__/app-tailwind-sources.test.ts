// -----------------------------------------------------------------------------
/**
 * @fileoverview Every UI package a host mounts reaches its Tailwind sources.
 *
 * ## Job To Be Done
 * A host reaches each dependency that ships `.vue` files, through the package's
 * own `styles` entry or an `@source` line; each `styles` entry sources its own
 * `src`; and a host that aliases a package by bare name resolves its `styles`
 * entry first.
 *
 * ## What Breaks If These Fail
 * Silent layout loss: the app builds and renders with the package's classes missing.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compact,
  concat,
  difference,
  endsWith,
  filter,
  find,
  get,
  includes,
  isString,
  keys,
  map,
  size,
  some,
  sortBy,
  split,
  startsWith,
  toArray,
  uniq
} from "lodash-es";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(process.cwd(), "..", "..");
const PACKAGES_ROOT = join(REPO_ROOT, "packages");
const SCOPE = "@upmind-automation/";
const STYLES_EXPORT = "./styles";

const HOST_ROOTS = ["apps", "playgrounds"];

const ENTRY_PATHS = ["src/main.css", "app/main.css", "src/styles.css"];

const CONFIG_PATHS = ["vite.config.ts", "nuxt.config.ts"];

type ComponentPackage = { dir: string; name: string; styles?: string };

type Host = { name: string; entry: string; manifest: string; config?: string };

// -----------------------------------------------------------------------------

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8"));
}

function holdsVue(dir: string): boolean {
  return some(readdirSync(dir, { withFileTypes: true }), entry => {
    if (entry.isDirectory()) return holdsVue(join(dir, entry.name));
    return endsWith(entry.name, ".vue");
  });
}

function readComponentPackages(): ComponentPackage[] {
  const dirs = filter(
    map(
      filter(readdirSync(PACKAGES_ROOT, { withFileTypes: true }), entry =>
        entry.isDirectory()
      ),
      "name"
    ),
    dir =>
      existsSync(join(PACKAGES_ROOT, dir, "package.json")) &&
      existsSync(join(PACKAGES_ROOT, dir, "src")) &&
      holdsVue(join(PACKAGES_ROOT, dir, "src"))
  );

  return sortBy(
    map(dirs, dir => {
      const manifest = readJson(join(PACKAGES_ROOT, dir, "package.json"));
      const target = get(manifest, ["exports", STYLES_EXPORT]);
      const found: ComponentPackage = { dir, name: String(manifest.name) };
      if (isString(target)) found.styles = join(PACKAGES_ROOT, dir, target);
      return found;
    }),
    "dir"
  );
}

function readHosts(): Host[] {
  const hosts: Host[] = [];

  for (const root of HOST_ROOTS) {
    const rootPath = join(REPO_ROOT, root);
    if (!existsSync(rootPath)) continue;

    for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const base = join(rootPath, entry.name);
      const manifest = join(base, "package.json");
      if (!existsSync(manifest)) continue;

      const found = find(
        map(ENTRY_PATHS, path => join(base, path)),
        existsSync
      );
      if (!found) continue;

      const config = find(
        map(CONFIG_PATHS, path => join(base, path)),
        existsSync
      );
      hosts.push({
        name: `${root}/${entry.name}`,
        entry: found,
        manifest,
        config
      });
    }
  }

  return sortBy(hosts, "name");
}

function readScopedDependencies(manifest: string): string[] {
  const dependencies = get(readJson(manifest), "dependencies", {});

  return sortBy(filter(keys(dependencies), name => startsWith(name, SCOPE)));
}

/** The package directories a CSS file's `@source` globs land in. */
function sourcedDirs(file: string): string[] {
  const lines = readFileSync(file, "utf8").matchAll(
    /@source\s+['"]([^'"]+)['"]/g
  );
  const reached: string[] = [];

  for (const [, glob] of lines) {
    const [head] = split(glob, "*");
    const fromPackages = relative(PACKAGES_ROOT, resolve(dirname(file), head));
    if (startsWith(fromPackages, "..")) continue;

    const [name] = split(fromPackages, "/");
    if (name) reached.push(name);
  }

  return uniq(reached);
}

/** Whether a `styles` entry's own `@source` globs cover its package's `src`. */
function sourcesItsOwnSrc(pkg: ComponentPackage): boolean {
  if (!pkg.styles || !existsSync(pkg.styles)) return false;

  const src = join(PACKAGES_ROOT, pkg.dir, "src");
  const lines = readFileSync(pkg.styles, "utf8").matchAll(
    /@source\s+['"]([^'"]+)['"]/g
  );
  return some(toArray(lines), ([, glob]) => {
    const [head] = split(glob, "*");
    return resolve(dirname(pkg.styles ?? ""), head) === src;
  });
}

function importedStyles(entry: string): string[] {
  const lines = readFileSync(entry, "utf8").matchAll(
    /@import\s+['"]([^'"]+)\/styles['"]/g
  );
  return uniq(compact(map(toArray(lines), ([, name]) => name)));
}

function reachedDirs(entry: string, packages: ComponentPackage[]): string[] {
  const imported = importedStyles(entry);
  const throughStyles = map(
    filter(
      packages,
      pkg => includes(imported, pkg.name) && sourcesItsOwnSrc(pkg)
    ),
    "dir"
  );
  return sortBy(uniq(concat(sourcedDirs(entry), throughStyles)));
}

function aliasKeyAt(config: string, key: string): number {
  return readFileSync(config, "utf8").indexOf(`"${key}":`);
}

/** The text of one alias entry, from its key up to the next scoped key. */
function aliasEntry(config: string, key: string): string {
  const text = readFileSync(config, "utf8");
  const start = text.indexOf(`"${key}":`);
  const rest = text.slice(start + key.length + 3);
  const [entry] = split(rest, /"@upmind/);
  return entry;
}

// -----------------------------------------------------------------------------

const COMPONENT_PACKAGES = readComponentPackages();
const HOSTS = readHosts();

const STYLED_PACKAGES = filter(COMPONENT_PACKAGES, pkg => isString(pkg.styles));

describe("Tailwind source coverage", () => {
  it("finds the hosts and the packages that ship components", () => {
    expect(size(COMPONENT_PACKAGES)).toBeGreaterThan(0);
    expect(size(HOSTS)).toBeGreaterThan(0);
  });

  describe.each(STYLED_PACKAGES)("packages/$dir's styles entry", pkg => {
    it("sources its own src", () => {
      expect(sourcesItsOwnSrc(pkg)).toBe(true);
    });
  });

  describe.each(HOSTS)("$name", ({ entry, manifest, config }) => {
    const declared = readScopedDependencies(manifest);
    const expected = map(
      filter(COMPONENT_PACKAGES, pkg => includes(declared, pkg.name)),
      "dir"
    );
    const reached = reachedDirs(entry, COMPONENT_PACKAGES);

    it.each(expected)("reaches packages/%s's sources", (name: string) => {
      expect(reached).toContain(name);
    });

    it("reaches no package it does not depend on", () => {
      expect(difference(reached, expected)).toEqual([]);
    });

    it("points every package line at a directory that exists", () => {
      const missing = filter(
        sourcedDirs(entry),
        name => !statSync(join(PACKAGES_ROOT, name, "src")).isDirectory()
      );

      expect(missing).toEqual([]);
    });

    const aliased = filter(
      STYLED_PACKAGES,
      pkg =>
        includes(importedStyles(entry), pkg.name) &&
        isString(config) &&
        aliasKeyAt(config, pkg.name) !== -1
    );

    it.each(map(aliased, "name"))(
      "resolves %s/styles before its bare alias",
      (name: string) => {
        const pkg = find(STYLED_PACKAGES, { name });
        const styles = aliasKeyAt(config ?? "", `${name}/styles`);
        const target = relative(PACKAGES_ROOT, pkg?.styles ?? "");

        expect(styles).not.toBe(-1);
        expect(styles).toBeLessThan(aliasKeyAt(config ?? "", name));
        expect(aliasEntry(config ?? "", `${name}/styles`)).toContain(target);
      }
    );
  });
});
