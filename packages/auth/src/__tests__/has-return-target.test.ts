// -----------------------------------------------------------------------------
/**
 * @fileoverview A refusal is not an absence — ADR 023 Amendment 1 change 4
 *
 * ## Job To Be Done
 * `readReturnTarget` answers `undefined` for BOTH "the query named nothing" and
 * "the query named something this app will not go to". Those are different
 * events for the visitor: one is a normal arrival, the other is a link that
 * tried to walk them off-origin. `hasReturnTarget` is the distinction, and it
 * has to be true for every vector the gate refuses.
 *
 * ## What Breaks If These Fail
 * The landing cannot tell the two apart, so either every visitor with no
 * `returnUrl` is told their destination was refused, or nobody is — and the one
 * visitor who was walked at is told nothing happened.
 */

import { describe, expect, it } from "vitest";
import { AUTH_QUERY, hasReturnTarget, readReturnTarget } from "../index";

// -----------------------------------------------------------------------------

/** Every vector `readReturnTarget` refuses. Each one is PRESENT, not absent. */
const REFUSED = [
  "//evil.example",
  "/\\evil.example",
  "/\\/evil.example",
  "/\\\\evil.example",
  "https://evil.example/basket",
  "http://localhost/basket",
  "https:/evil.example",
  "javascript:alert(1)",
  "basket",
  " /basket",
  "/\t/evil.example",
  "/\n/evil.example",
  "/\r/evil.example",
  "//evil.example/\\"
];

describe("hasReturnTarget", () => {
  it("is true for a target the gate accepts", () => {
    expect(hasReturnTarget({ returnUrl: "/basket" })).toBe(true);
  });

  it("is true for every target the gate refuses", () => {
    for (const returnUrl of REFUSED) {
      expect(readReturnTarget({ returnUrl })).toBeUndefined();
      expect(hasReturnTarget({ returnUrl })).toBe(true);
    }
  });

  it("is false when the query names no target", () => {
    expect(hasReturnTarget({})).toBe(false);
  });

  it("is false for a different query key", () => {
    expect(hasReturnTarget({ redirect: "/basket" })).toBe(false);
  });

  it("is false for a key present with no value", () => {
    expect(hasReturnTarget({ returnUrl: null })).toBe(false);
    expect(hasReturnTarget({ returnUrl: "" })).toBe(false);
  });

  it("publishes the query key the landing reads a refusal from", () => {
    expect(AUTH_QUERY.RETURN_REFUSED).toBe("returnRefused");
  });
});
