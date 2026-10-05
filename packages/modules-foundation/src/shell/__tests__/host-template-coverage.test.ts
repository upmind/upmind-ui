// -----------------------------------------------------------------------------
/**
 * @fileoverview Every host's records draw every page name its packages can pick.
 *
 * ## Job To Be Done
 * A host owes a page for every name a brand can pick; a record with a gap throws.
 *
 * ## What Breaks If These Fail
 * A brand's chosen sign-in arrangement throws in production instead of rendering.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { difference, filter, flatMap, map, uniq } from "lodash-es";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(process.cwd(), "..", "..");

const PACKAGE_TEMPLATE = {
  auth: {
    file: "packages/modules-auth/src/types.ts",
    constant: "AUTH_TEMPLATE"
  },
  invoice: {
    file: "packages/modules-invoice/src/types.ts",
    constant: "ORDER_TEMPLATE"
  }
};

type PackageName = keyof typeof PACKAGE_TEMPLATE;

const HOSTS: Array<{
  name: string;
  records: string[];
  packages: PackageName[];
}> = [
  {
    name: "auth app",
    records: ["apps/auth/src/shell.ts"],
    packages: ["auth"]
  },
  {
    name: "portal-nuxt",
    records: [
      "apps/portal-nuxt/app/portal/auth/shell.ts",
      "apps/portal-nuxt/app/portal/billing/shell.ts"
    ],
    packages: ["auth", "invoice"]
  },
  {
    name: "labs-nuxt",
    records: ["playgrounds/labs-nuxt/app/shell/shell.ts"],
    packages: ["auth", "invoice"]
  }
];

function read(path: string): string {
  const full = join(REPO_ROOT, path);
  if (!existsSync(full)) return "";
  return readFileSync(full, "utf8");
}

function publishedNames(pkg: PackageName): string[] {
  const { file, constant } = PACKAGE_TEMPLATE[pkg];
  const body = new RegExp(
    `export\\s+enum\\s+${constant}\\s*\\{([^}]*)\\}`
  ).exec(read(file));

  if (body === null) return [];

  return map([...body[1].matchAll(/^\s*(\w+)\s*=/gm)], match => match[1]);
}

function filledNames(records: string[], constant: string): string[] {
  return flatMap(records, record =>
    map(
      [
        ...read(record).matchAll(
          new RegExp(`\\[\\s*${constant}\\.(\\w+)\\s*\\]`, "g")
        )
      ],
      match => match[1]
    )
  );
}

const CASES = flatMap(HOSTS, host =>
  map(host.packages, pkg => ({
    host: host.name,
    package: pkg,
    published: publishedNames(pkg),
    filled: filledNames(host.records, PACKAGE_TEMPLATE[pkg].constant)
  }))
);

// -----------------------------------------------------------------------------

describe("the surface this spec grades", () => {
  it.each(CASES)("reads $package's published names for $host", entry => {
    expect(
      entry.published.length,
      `${entry.package} publishes no template names this spec can read, so ` +
        `${entry.host} is graded against nothing`
    ).toBeGreaterThan(0);
  });
});

describe("every page name a host can be asked for", () => {
  it.each(CASES)("$host draws every $package name", entry => {
    const missing = difference(entry.published, entry.filled);

    expect(
      missing,
      `${entry.host}'s record has no page for ${missing.join(", ")}, so a brand ` +
        `that asks for one gets an error instead of a page`
    ).toEqual([]);
  });

  it.each(CASES)("$host draws no $package name twice", entry => {
    const doubled = uniq(
      filter(
        entry.filled,
        name => filter(entry.filled, other => other === name).length > 1
      )
    );

    expect(doubled).toEqual([]);
  });

  it.each(CASES)(
    "$host draws no $package name the package never offered",
    entry => {
      expect(difference(entry.filled, entry.published)).toEqual([]);
    }
  );
});
