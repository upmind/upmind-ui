// -----------------------------------------------------------------------------
/**
 * @fileoverview The two ends of the catalogue's lazy DAC import still agree.
 *
 * ## Job To Be Done
 * The name the catalogue's widget reads from its dynamic import of this package
 * is a component this package publishes.
 *
 * ## What Breaks If These Fail
 * The domain search box is missing from a DAC category, and nothing reports an error.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as barrel from "../index";
import { get } from "lodash-es";

// -----------------------------------------------------------------------------

const REPO_ROOT = resolve(process.cwd(), "..", "..");

const WIDGET_MODULE = join(
  REPO_ROOT,
  "packages/modules-catalogue/src/products/WidgetDAC.vue"
);

const LAZY_READ =
  /import\(\s*["']@upmind-automation\/domain["']\s*\)\s*\.then\(\s*\(\s*\{\s*([A-Za-z0-9_$]+)\s*\}\s*\)\s*=>\s*([A-Za-z0-9_$]+)\s*\)/;

function lazyRead() {
  expect(
    existsSync(WIDGET_MODULE),
    `browse's half of the seam is not at ${WIDGET_MODULE}; the seam this ` +
      `spec grades has moved or been deleted`
  ).toBe(true);

  const read = LAZY_READ.exec(readFileSync(WIDGET_MODULE, "utf8"));

  expect(
    read,
    `no dynamic import of this package found in ${WIDGET_MODULE}, so this ` +
      `spec has nothing to grade the barrel against`
  ).toBeTruthy();

  return { taken: read?.[1] ?? "", returned: read?.[2] ?? "" };
}

// -----------------------------------------------------------------------------

describe("the name the catalogue's lazy import reads", () => {
  it("is the name the loader hands on", () => {
    const { taken, returned } = lazyRead();

    expect(returned).toBe(taken);
  });

  it("is published by this package's barrel", () => {
    const { taken } = lazyRead();

    expect(
      Object.keys(barrel),
      `browse reads ${taken}, which this package does not publish, so the ` +
        `widget resolves to nothing`
    ).toContain(taken);
  });

  it("names a component, not a bare value", () => {
    const published: unknown = get(barrel, lazyRead().taken);

    expect(
      typeof published === "object" || typeof published === "function"
    ).toBe(true);
    expect(published).toBeTruthy();
  });
});
