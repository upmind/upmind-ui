// -----------------------------------------------------------------------------
/**
 * @fileoverview A refused return target is not an absent one.
 *
 * ## Job To Be Done
 * `hasReturnTarget` is true for every vector `readReturnTarget` refuses.
 *
 * ## What Breaks If These Fail
 * The landing cannot tell a refused target from none, so the visitor is told the wrong thing.
 */

import { describe, expect, it } from "vitest";
import { AUTH_QUERY, hasReturnTarget, readReturnTarget } from "../index";

// -----------------------------------------------------------------------------

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
