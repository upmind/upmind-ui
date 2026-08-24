import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const DROP_RECEIPT_PATH = join(
  __dirname,
  "..",
  "docs",
  "dropped-capabilities.md"
);

describe("client-personal-details drop receipt (AC-61)", () => {
  it("AC-61: the staff drop receipt is committed and survives a fresh clone", () => {
    expect(existsSync(DROP_RECEIPT_PATH)).toBe(true);
  });

  it("AC-61: the receipt carries the Dropped-with-Linear-issue disposition and its FE-2298 reference", () => {
    const contents = readFileSync(DROP_RECEIPT_PATH, "utf-8");

    expect(contents).toContain("Dropped-with-Linear-issue");
    expect(contents).toContain("FE-2298");
  });
});
