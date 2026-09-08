// -----------------------------------------------------------------------------
/**
 * @fileoverview The return-target gate — ADR 023 Amendment 1 change 4
 *
 * ## Job To Be Done
 * The standalone auth app boots from a return target and hands back to it once
 * the visitor is authenticated. `readReturnTarget` is the only thing between
 * that hand-back and an attacker-chosen destination: it yields a bare
 * same-origin path and nothing else — no absolute URL, no protocol-relative
 * host, no non-string.
 *
 * ## What Breaks If These Fail
 * A login link carrying `?returnUrl=https://evil.example` walks a customer
 * off-origin the instant their session is minted — an open redirect on the one
 * screen that mints credentials.
 */

import { describe, expect, it } from "vitest";
import { readReturnTarget } from "../index";

// -----------------------------------------------------------------------------

/** Vue Router hands a repeated query key over as an array, never a string. */
const REPEATED_KEY = ["/basket", "//evil.example"];

describe("readReturnTarget", () => {
  it("returns a bare same-origin path", () => {
    expect(readReturnTarget({ returnUrl: "/basket" })).toBe("/basket");
  });

  it("keeps the target's own query and hash", () => {
    expect(readReturnTarget({ returnUrl: "/basket?step=2#summary" })).toBe(
      "/basket?step=2#summary"
    );
  });

  it("returns the site root", () => {
    expect(readReturnTarget({ returnUrl: "/" })).toBe("/");
  });

  it("refuses an absolute URL on another host", () => {
    expect(
      readReturnTarget({ returnUrl: "https://evil.example/basket" })
    ).toBeUndefined();
  });

  it("refuses an absolute URL even back at this host", () => {
    expect(
      readReturnTarget({ returnUrl: "http://localhost/basket" })
    ).toBeUndefined();
  });

  it("refuses a protocol-relative host", () => {
    expect(readReturnTarget({ returnUrl: "//evil.example" })).toBeUndefined();
  });

  it("refuses a javascript: target", () => {
    expect(
      readReturnTarget({ returnUrl: "javascript:alert(1)" })
    ).toBeUndefined();
  });

  it("refuses a path with no leading slash", () => {
    expect(readReturnTarget({ returnUrl: "basket" })).toBeUndefined();
  });

  it("refuses a path smuggled behind leading whitespace", () => {
    expect(readReturnTarget({ returnUrl: " /basket" })).toBeUndefined();
  });

  it("refuses a repeated query key", () => {
    expect(readReturnTarget({ returnUrl: REPEATED_KEY })).toBeUndefined();
  });

  it("refuses a value that is not a string", () => {
    expect(readReturnTarget({ returnUrl: 1 })).toBeUndefined();
    expect(readReturnTarget({ returnUrl: null })).toBeUndefined();
    expect(readReturnTarget({ returnUrl: {} })).toBeUndefined();
  });

  it("returns nothing when the query names no target", () => {
    expect(readReturnTarget({})).toBeUndefined();
    expect(readReturnTarget({ redirect: "/basket" })).toBeUndefined();
  });
});
