// -----------------------------------------------------------------------------
/**
 * @fileoverview The curated public barrel
 *
 * ## Job To Be Done
 * The barrel publishes exactly its declared set: nothing missing, nothing extra, no `headless` composables.
 *
 * ## What Breaks If These Fail
 * A later phase widens the barrel, or an internal component becomes a public contract nobody chose.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as foundation from "@upmind-automation/foundation";
import * as headless from "@upmind-automation/headless";
import * as barrel from "../index";
import { map, reject } from "lodash-es";

// -----------------------------------------------------------------------------

const OPEN_Q3 = [
  "Config",
  "ConfigErrors",
  "ConfigSkeleton",
  "ProductHero",
  "ProductHeroSkeleton",
  "ProductImage",
  "PRODUCT_HERO_DIRECTION",
  "CurrentPrice",
  "ExPrice",
  "Pricing",
  "PricingSkeleton",
  "PricingTotal",
  "TermRow",
  "ProductCard",
  "ProductCardSkeleton"
];

const AMENDMENT_1 = ["Promotion"];

const ORGANISMS = [
  "UpmProductConfigure",
  "UpmProductNotFound",
  "UpmTermsSelect"
];

const RENDERERS = ["productRenderers"];

const PUBLISHED = [...OPEN_Q3, ...AMENDMENT_1, ...ORGANISMS, ...RENDERERS];

const PUBLISHED_TYPES = ["ConfigProps", "ConfigureProps", "Item"];

const PUBLIC_COMPONENTS = [...OPEN_Q3, ...AMENDMENT_1, ...ORGANISMS];

const HEADLESS_COMPOSABLES = [
  "useProductConfig",
  "useConfig",
  "useBasketProductsPending",
  "useRoutingEngine",
  "useQueryParams"
];

const exported = Object.keys(barrel)
  .filter(name => name !== "default")
  .sort();

// -----------------------------------------------------------------------------

const SOURCE_ROOT = resolve(import.meta.dirname, "..");

function everyComponentFile(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) return everyComponentFile(path);
    return path.endsWith(".vue") ? [path] : [];
  });
}

const componentFiles = everyComponentFile(SOURCE_ROOT);

function fileOf(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const file = (value as { __file?: unknown }).__file;
  return typeof file === "string" ? file : undefined;
}

const publicComponentFiles = new Set(
  PUBLIC_COMPONENTS.map(name => fileOf(barrel[name as keyof typeof barrel]))
);

const internalComponentFiles = componentFiles.filter(
  file => !publicComponentFiles.has(file)
);

const barrelSource = readFileSync(join(SOURCE_ROOT, "index.ts"), "utf8");

function publishedTypeNames(source: string): string[] {
  const found = new Set<string>();

  for (const block of source.matchAll(/export\s+type\s*\{([^}]*)\}/g)) {
    for (const member of block[1].split(",")) {
      const name = member
        .trim()
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) found.add(name);
    }
  }

  for (const block of source.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const member of block[1].split(",")) {
      const inline = /^\s*type\s+(.+)$/.exec(member);
      const name = inline?.[1]
        .split(/\s+as\s+/)
        .pop()
        ?.trim();
      if (name) found.add(name);
    }
  }

  for (const alias of source.matchAll(/export\s+type\s+(\w+)\s*=/g)) {
    found.add(alias[1]);
  }

  return [...found].sort();
}

// -----------------------------------------------------------------------------

describe("the product package's curated public barrel", () => {
  it("publishes every symbol Open Q3 derived from cross-module usage", () => {
    expect(exported).toEqual(expect.arrayContaining(OPEN_Q3));
  });

  it("publishes Promotion, which Amendment 1 moved here rather than to ui", () => {
    expect(exported).toContain("Promotion");
  });

  it("publishes the organisms a host page mounts", () => {
    expect(exported).toEqual(expect.arrayContaining(ORGANISMS));
  });

  it("publishes the renderer set", () => {
    expect(exported).toEqual(expect.arrayContaining(RENDERERS));
  });

  it("publishes nothing beyond that set", () => {
    const unexpected = exported.filter(name => !PUBLISHED.includes(name));

    expect(
      unexpected,
      `the barrel widened past its declared set: ${unexpected.join(", ")}`
    ).toEqual([]);
  });

  it("finds the package's components on disk, and the declared ones among them", () => {
    expect(componentFiles.length).toBeGreaterThan(PUBLIC_COMPONENTS.length);
    expect(internalComponentFiles.length).toBeGreaterThan(0);

    for (const name of PUBLIC_COMPONENTS) {
      const value = barrel[name as keyof typeof barrel];
      const isConstant = name.toUpperCase() === name;

      if (isConstant) continue;
      expect(
        fileOf(value),
        `${name} carries no source file to match on`
      ).toBeTruthy();
    }
  });

  it("keeps every component behind an undeclared file internal", () => {
    const internal = new Set(internalComponentFiles);
    const leaked = Object.entries(barrel)
      .filter(([, value]) => {
        const file = fileOf(value);
        return Boolean(file && internal.has(file));
      })
      .map(([name, value]) => `${name} (${fileOf(value)})`);

    expect(
      leaked,
      `internal components became a public contract: ${leaked.join(", ")}`
    ).toEqual([]);
  });

  it("re-exports no headless composable, so each has one import path", () => {
    const leaked = HEADLESS_COMPOSABLES.filter(name => exported.includes(name));

    expect(leaked).toEqual([]);
  });

  it("re-exports nothing at all from headless or foundation", () => {
    const upstream = new Set([
      ...Object.keys(headless),
      ...Object.keys(foundation)
    ]);
    const passedThrough = exported.filter(name => upstream.has(name));

    expect(
      passedThrough,
      `a lower package's symbols are published from here: ${passedThrough.join(", ")}`
    ).toEqual([]);
  });

  it("publishes real components behind the component names", () => {
    const components = PUBLIC_COMPONENTS.filter(
      name => /^[A-Z][a-z]/.test(name) || name.startsWith("Upm")
    );

    for (const name of components) {
      const value: unknown = barrel[name as keyof typeof barrel];
      expect(value, `${name} is not exported`).toBeTruthy();
      expect(
        typeof value === "object" || typeof value === "function",
        `${name} is published as a ${typeof value}, not a component`
      ).toBe(true);
    }
  });

  // The barrel dropped the duplicate `NotFound` alias; UpmProductNotFound
  // (already covered by the organisms assertion above) is the one export.

  it("keeps the count within the declared set", () => {
    expect(exported.length).toBe(PUBLISHED.length);
  });

  it("publishes exactly the types it declares, and no more", () => {
    const types = publishedTypeNames(barrelSource);
    const unexpected = types.filter(name => !PUBLISHED_TYPES.includes(name));
    const missing = PUBLISHED_TYPES.filter(name => !types.includes(name));

    expect(
      unexpected,
      `the barrel publishes types nobody declared: ${unexpected.join(", ")}`
    ).toEqual([]);
    expect(
      missing,
      `the barrel stopped publishing declared types: ${missing.join(", ")}`
    ).toEqual([]);
    expect(types.length).toBe(PUBLISHED_TYPES.length);
  });

  it("re-exports by wildcard only from its own folders", () => {
    const targets = map(
      [...barrelSource.matchAll(/^\s*export\s+\*\s+from\s+"([^"]+)"/gm)],
      match => match[1]
    );
    const foreign = reject(targets, target => /^\.\/[\w/-]+$/.test(target));

    expect(
      foreign,
      `a wildcard re-exports from outside the package: ${foreign.join(", ")}`
    ).toEqual([]);
  });
});

describe("the constants a consumer switches on", () => {
  it("leaves the template names to the host, which picks the layout for the brand's raw template", () => {
    expect(exported).not.toContain("PRODUCT_TEMPLATE");
  });

  it("carries both hero directions", () => {
    expect(barrel.PRODUCT_HERO_DIRECTION.HORIZONTAL).toBe("horizontal");
    expect(barrel.PRODUCT_HERO_DIRECTION.VERTICAL).toBe("vertical");
    expect(Object.keys(barrel.PRODUCT_HERO_DIRECTION)).toHaveLength(2);
  });

  it("publishes the pricing list as Pricing, not the same-named internal atom", () => {
    const props = (barrel.Pricing as { props?: unknown }).props;
    const names = Array.isArray(props) ? props : Object.keys(props ?? {});

    expect(barrel.Pricing).not.toBe(barrel.CurrentPrice);
    expect(
      names.length,
      "the published Pricing takes no props at all"
    ).toBeGreaterThan(0);
  });
});
