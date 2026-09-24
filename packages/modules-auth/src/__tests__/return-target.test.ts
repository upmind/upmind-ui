// -----------------------------------------------------------------------------
/**
 * @fileoverview The return-target gate.
 *
 * ## Job To Be Done
 * `readReturnTarget` yields a normalised bare same-origin path and nothing else.
 *
 * ## What Breaks If These Fail
 * An open redirect on the screen that mints credentials: `/\evil.example` reads as a host.
 */

import { describe, expect, it } from "vitest";
import { readReturnTarget } from "../index";

// -----------------------------------------------------------------------------

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

  it("refuses a host smuggled behind a backslash", () => {
    expect(readReturnTarget({ returnUrl: "/\\evil.example" })).toBeUndefined();
    expect(readReturnTarget({ returnUrl: "/\\/evil.example" })).toBeUndefined();
    expect(
      readReturnTarget({ returnUrl: "/\\\\evil.example" })
    ).toBeUndefined();
  });

  it("refuses a host smuggled behind a control character", () => {
    expect(readReturnTarget({ returnUrl: "/\t/evil.example" })).toBeUndefined();
    expect(readReturnTarget({ returnUrl: "/\n/evil.example" })).toBeUndefined();
    expect(readReturnTarget({ returnUrl: "/\r/evil.example" })).toBeUndefined();
  });

  it("refuses a scheme with a single slash", () => {
    expect(
      readReturnTarget({ returnUrl: "https:/evil.example" })
    ).toBeUndefined();
  });

  it("refuses a protocol-relative host wearing a trailing backslash", () => {
    expect(
      readReturnTarget({ returnUrl: "//evil.example/\\" })
    ).toBeUndefined();
  });

  it("hands back the normalised path, not the raw query value", () => {
    expect(readReturnTarget({ returnUrl: "/basket/../admin" })).toBe("/admin");
    expect(readReturnTarget({ returnUrl: "/basket/./step" })).toBe(
      "/basket/step"
    );
  });

  it("hands back a path free of the characters a raw value would carry", () => {
    expect(readReturnTarget({ returnUrl: "/bas\nket" })).toBe("/basket");
    expect(readReturnTarget({ returnUrl: "/basket " })).toBe("/basket");
  });

  it("keeps a target whose own query names another host", () => {
    expect(readReturnTarget({ returnUrl: "/basket?next=//evil.example" })).toBe(
      "/basket?next=//evil.example"
    );
  });

  it("keeps an encoded backslash as the path segment it is", () => {
    expect(readReturnTarget({ returnUrl: "/%5Cevil.example" })).toBe(
      "/%5Cevil.example"
    );
  });
});
