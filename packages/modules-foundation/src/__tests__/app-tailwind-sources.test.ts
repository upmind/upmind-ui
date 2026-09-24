// -----------------------------------------------------------------------------
/**
 * @fileoverview Every UI package a host mounts is named in its Tailwind `@source` list.
 *
 * ## Job To Be Done
 * A host names each dependency that ships `.vue` files in an `@source` line.
 *
 * ## What Breaks If These Fail
 * Silent layout loss: the app builds and renders with the package's classes missing.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(process.cwd(), "..", "..");
const PACKAGES_ROOT = join(REPO_ROOT, "packages");
const SCOPE = "@upmind-automation/";

const HOST_ROOTS = ["apps", "playgrounds"];

const ENTRY_PATHS = ["src/main.css", "app/main.css", "src/styles.css"];

// -----------------------------------------------------------------------------

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

function readScopedDependencies(manifest: string): string[] {
  const { dependencies = {} } = JSON.parse(readFileSync(manifest, "utf8"));

  return Object.keys(dependencies)
    .filter(name => name.startsWith(SCOPE))
    .sort();
}

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
