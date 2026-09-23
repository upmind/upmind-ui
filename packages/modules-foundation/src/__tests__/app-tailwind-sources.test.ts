// -----------------------------------------------------------------------------
/**
 * @fileoverview Every UI package a host mounts is named in that host's Tailwind
 * source list — ADR 023 constraint 1
 *
 * ## Job To Be Done
 * Tailwind generates a utility class only where it reads the class in a source
 * file. It scans the app tree on its own; a package outside that tree is read
 * only where an `@source` line names it. One line covers `client-vue` today,
 * because every component lives there. This epic moves those components into ten
 * packages, and each move takes a package's classes out of the covered tree.
 *
 * Nothing else reports the omission. The app builds, the type-check passes, every
 * unit suite passes, and the page renders — with the classes missing. Measured on
 * the later phases of this stack: the catalogue category grid and the product grid
 * lost `md:grid-cols-*` and drew one column at every width, on a page a customer
 * opens, for every phase after the one that moved it.
 *
 * ## Where the expectation comes from
 * From the package manifests and the package tree, never from the CSS being
 * graded. WHICH packages a host must name is its own `dependencies` list
 * intersected with the packages that hold `.vue` files, both read at run time.
 * So a new package, or a new dependency edge, makes the host red until the line
 * exists, and a line pointing at a package the host does not depend on is an
 * orphan rather than a passing silence.
 *
 * ## What Breaks If These Fail
 * Silent layout loss on a customer-facing page: a grid collapses to one column,
 * a breakpoint never fires, a spacing scale falls back to the base value.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(process.cwd(), "..", "..");
const PACKAGES_ROOT = join(REPO_ROOT, "packages");
const SCOPE = "@upmind-automation/";

/** The trees that hold a host: an app or a playground. */
const HOST_ROOTS = ["apps", "playgrounds"];

/** Where a host keeps its Tailwind entry, by convention. */
const ENTRY_PATHS = ["src/main.css", "app/main.css", "src/styles.css"];

// -----------------------------------------------------------------------------

/**
 * Every package under `packages/` that ships at least one `.vue` file, as a
 * `{ dir, name }` pair. A directory name and a package name are different
 * strings since the `modules-` prefix: an `@source` glob is a path and needs
 * `dir`, a host's `dependencies` key is a specifier and needs `name`.
 */
function readComponentPackages(): { dir: string; name: string }[] {
  const holdsVue = (dir: string): boolean =>
    readdirSync(dir, { withFileTypes: true }).some(entry => {
      if (entry.isDirectory()) return holdsVue(join(dir, entry.name));
      return entry.name.endsWith(".vue");
    });

  return readdirSync(PACKAGES_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(dir => existsSync(join(PACKAGES_ROOT, dir, "package.json")))
    .filter(dir => existsSync(join(PACKAGES_ROOT, dir, "src")))
    .filter(dir => holdsVue(join(PACKAGES_ROOT, dir, "src")))
    .map(dir => ({
      dir,
      name: JSON.parse(
        readFileSync(join(PACKAGES_ROOT, dir, "package.json"), "utf8")
      ).name
    }))
    .sort((a, b) => a.dir.localeCompare(b.dir));
}

/** Every host with a Tailwind entry, paired with its manifest. */
function readHosts(): { name: string; entry: string; manifest: string }[] {
  const hosts: { name: string; entry: string; manifest: string }[] = [];

  for (const root of HOST_ROOTS) {
    const rootPath = join(REPO_ROOT, root);
    if (!existsSync(rootPath)) continue;

    for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const base = join(rootPath, entry.name);
      const manifest = join(base, "package.json");
      if (!existsSync(manifest)) continue;

      const found = ENTRY_PATHS.map(path => join(base, path)).find(existsSync);
      if (!found) continue;

      hosts.push({ name: `${root}/${entry.name}`, entry: found, manifest });
    }
  }

  return hosts.sort((a, b) => a.name.localeCompare(b.name));
}

/** The scoped runtime dependencies a host declares, as full specifiers. */
function readScopedDependencies(manifest: string): string[] {
  const { dependencies = {} } = JSON.parse(readFileSync(manifest, "utf8"));

  return Object.keys(dependencies)
    .filter(name => name.startsWith(SCOPE))
    .sort();
}

/**
 * The packages an `@source` list reaches, by resolving each glob against the
 * entry's own directory. A glob outside `packages/` is not a package line.
 */
function readSourcedPackages(entry: string): string[] {
  const lines = readFileSync(entry, "utf8").matchAll(
    /@source\s+['"]([^'"]+)['"]/g
  );
  const reached = new Set<string>();

  for (const [, glob] of lines) {
    const head = glob.split("*")[0];
    const resolved = resolve(dirname(entry), head);
    const fromPackages = relative(PACKAGES_ROOT, resolved);
    if (fromPackages.startsWith("..")) continue;

    const [name] = fromPackages.split("/");
    if (name) reached.add(name);
  }

  return [...reached].sort();
}

// -----------------------------------------------------------------------------

const COMPONENT_PACKAGES = readComponentPackages();
const HOSTS = readHosts();

describe("Tailwind source coverage", () => {
  it("finds the hosts and the packages that ship components", () => {
    expect(COMPONENT_PACKAGES.length).toBeGreaterThan(0);
    expect(HOSTS.length).toBeGreaterThan(0);
  });

  describe.each(HOSTS)("$name", ({ entry, manifest }) => {
    const declared = readScopedDependencies(manifest);
    const expected = COMPONENT_PACKAGES.filter(pkg =>
      declared.includes(pkg.name)
    ).map(pkg => pkg.dir);
    const sourced = readSourcedPackages(entry);

    it.each(expected)(
      "names packages/%s in its @source list",
      (name: string) => {
        expect(sourced).toContain(name);
      }
    );

    it("names no package it does not depend on", () => {
      expect(sourced.filter(name => !expected.includes(name))).toEqual([]);
    });

    it("points every package line at a directory that exists", () => {
      const missing = sourced.filter(
        name => !statSync(join(PACKAGES_ROOT, name, "src")).isDirectory()
      );

      expect(missing).toEqual([]);
    });
  });
});
