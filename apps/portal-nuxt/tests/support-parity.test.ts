import { describe, expect, it } from "vitest";
import type { MockDataset } from "~/portal/mock/types";
import { DATA_REF_ID, dataRef, resolveDataRef } from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";

/** Legacy's support screens, graded on vue-app 1.74.0 — the rows `docs/legacy-parity-support.md` sends here. */

function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

function controlsText(): string {
  return JSON.stringify(
    resolveDataRef(dataRef(DATA_REF_ID.TICKETS_CONTROLS), clone(), {})
  );
}

describe("the tickets list carries legacy's controls and no more", () => {
  it("sorts by date, reference and subject", () => {
    const controls = controlsText();
    for (const label of [
      "Newest first",
      "Oldest first",
      "By reference",
      "By subject"
    ]) {
      expect(controls).toContain(label);
    }
  });

  it("filters by status and date, and offers no department filter", () => {
    const controls = controlsText();
    // The Active tab holds one status, so no status control stands here.
    expect(controls).toContain("Raised");
    expect(controls).not.toContain("Any department");
  });
});
