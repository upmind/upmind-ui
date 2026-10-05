// -----------------------------------------------------------------------------
/**
 * @fileoverview The curated public barrel.
 *
 * ## Job To Be Done
 * The barrel publishes only this package's own UI, no `headless` composable,
 * and no template name: the page owns its template names.
 *
 * ## What Breaks If These Fail
 * A `headless` composable or a lower package's symbol gains a second import
 * path, or the package picks a page layout again.
 */

import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as foundation from "@upmind-automation/foundation";
import * as headless from "@upmind-automation/headless";
import * as product from "@upmind-automation/product";
import * as barrel from "../index";

// -----------------------------------------------------------------------------

const HEADLESS_COMPOSABLES = [
  "useProductCategories",
  "useProducts",
  "useRoutingEngine",
  "useQueryParams"
];

const exported = Object.keys(barrel)
  .filter(name => name !== "default")
  .sort();

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());
const SOURCE_ROOT = join(PACKAGE_ROOT, "src");

function fileOf(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const file = (value as { __file?: unknown }).__file;
  return typeof file === "string" ? file : undefined;
}

// -----------------------------------------------------------------------------

describe("the catalogue package's curated public barrel", () => {
  it("publishes no component from outside this package at all", () => {
    const foreign = Object.entries(barrel)
      .map(([name, value]) => ({ name, file: fileOf(value) }))
      .filter(entry => entry.file && !entry.file.startsWith(`${SOURCE_ROOT}/`))
      .map(entry => `${entry.name} (${entry.file})`);

    expect(
      foreign,
      `these are republished from another package: ${foreign.join(", ")}`
    ).toEqual([]);
  });

  it("re-exports no headless composable, so each has one import path", () => {
    const leaked = HEADLESS_COMPOSABLES.filter(name => exported.includes(name));

    expect(leaked).toEqual([]);
  });

  it("re-exports nothing from headless, foundation or product", () => {
    const upstream = new Set([
      ...Object.keys(headless),
      ...Object.keys(foundation),
      ...Object.keys(product)
    ]);
    const passedThrough = exported.filter(name => upstream.has(name));

    expect(
      passedThrough,
      `a lower package's symbols are published from here: ${passedThrough.join(", ")}`
    ).toEqual([]);
  });
});

describe("the template names the page owns", () => {
  it("publishes no template name", () => {
    const templateNames = exported.filter(name => /template/i.test(name));

    expect(templateNames).toEqual([]);
  });
});
