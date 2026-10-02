// -----------------------------------------------------------------------------
/**
 * @fileoverview What the payment barrel publishes
 *
 * ## Job To Be Done
 * The barrel publishes this package's own surface through its declared entry point, and no lower package's.
 *
 * ## What Breaks If These Fail
 * A host reaches payment-detail state or a lower package's symbols through `payment`, and couples to both.
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as foundation from "@upmind-automation/foundation";
import * as headless from "@upmind-automation/headless";
import * as barrel from "../index";

// -----------------------------------------------------------------------------

const PACKAGE_ROOT = resolve(process.cwd());
const SOURCE_ROOT = join(PACKAGE_ROOT, "src");

const exported = Object.keys(barrel)
  .filter(name => name !== "default")
  .sort();

const manifest = JSON.parse(
  readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8")
) as { exports?: Record<string, string> };

// -----------------------------------------------------------------------------

describe("the payment barrel", () => {
  it("is reachable through the entry point the package publishes", () => {
    expect(manifest.exports?.["."]).toBe("./src/index.ts");
  });

  it("publishes no payment-detail machine, context or store", () => {
    const data = exported.filter(name =>
      /^(use)?Payment(Details?|Detail)(Context|Machine|Store|State)?$/.test(
        name
      )
    );

    expect(
      data,
      `payment-detail state is published from the barrel: ${data.join(", ")}`
    ).toEqual([]);
  });

  it("re-exports nothing from headless or foundation", () => {
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

  it("re-exports nothing by wildcard from another package", () => {
    const barrelSource = readFileSync(join(SOURCE_ROOT, "index.ts"), "utf8");
    const wildcards = [
      ...barrelSource.matchAll(
        /^\s*export\s+\*(?:\s+as\s+\w+)?\s+from\s+["']([^"']+)["']/gm
      )
    ].map(match => match[1]);
    const fromPackages = wildcards.filter(
      specifier => !specifier.startsWith(".")
    );

    expect(
      fromPackages,
      `another package's whole surface is republished here: ${fromPackages.join(", ")}`
    ).toEqual([]);
  });
});
