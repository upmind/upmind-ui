// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — the single-email surface stays on the
 * barrel (AC-20)
 *
 * Colocated negative control: `client-email-history.single-amputation.must-fail.patch`
 * removes the `useClientReceivedEmail` / `UseClientReceivedEmail` named
 * re-exports. This is the ONE assertion that patch must flip red.
 */

import { describe, expect, it } from "vitest";
import { useClientReceivedEmail } from "..";

// -----------------------------------------------------------------------------

describe("client-email-history barrel — the single-email surface (AC-20)", () => {
  it("exports useClientReceivedEmail — a separately consumed capability, never folded into the collection", () => {
    expect(typeof useClientReceivedEmail).toBe("function");
  });
});
