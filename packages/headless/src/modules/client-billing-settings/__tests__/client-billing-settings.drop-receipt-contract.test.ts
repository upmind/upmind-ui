// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings drop receipt — the FE-3137 staff-cell
 * receipt
 *
 * ## Job To Be Done
 * Pin that the staff-cell drop (rows D1-D6, `Dropped-with-Linear-issue`) has
 * a committed, surviving receipt naming the tracker issue — so the drop stays
 * visible rather than silently vanishing (the FE-2824 archetype: shape
 * present, capability quietly gone, every gate green).
 *
 * ## What Breaks If These Fail
 * A dropped capability with no durable record — the next reader has no way
 * to know six staff-cell capabilities were deliberately, not accidentally,
 * left out.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DROP_RECEIPT_PATH = join(
  import.meta.dirname,
  "..",
  "docs",
  "dropped-capabilities.md"
);

describe("client-billing-settings drop receipt (FE-3137)", () => {
  it("the staff drop receipt is committed and survives a fresh clone", () => {
    expect(existsSync(DROP_RECEIPT_PATH)).toBe(true);
  });

  it("carries the Dropped-with-Linear-issue disposition and its FE-3137 reference", () => {
    const contents = readFileSync(DROP_RECEIPT_PATH, "utf-8");

    expect(contents).toContain("Dropped-with-Linear-issue");
    expect(contents).toContain("FE-3137");
  });

  it("names every dropped row D1-D6", () => {
    const contents = readFileSync(DROP_RECEIPT_PATH, "utf-8");

    for (const row of ["D1", "D2", "D3", "D4", "D5", "D6"]) {
      expect(contents).toContain(row);
    }
  });
});
