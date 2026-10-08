/**
 * @fileoverview Registration landing rules (unit)
 *
 * ## Job To Be Done
 * Pin the pure rules of the registration landing from their design tables: the
 * expiry verdict of every `expires` shape, the redirect filter over the attack
 * list, the verify mapper over its nil inputs and the two-factor input. The
 * blocked-address 403 mapping is proven in the machine spec, and the analytics
 * parse by the AC-11 cases of the integration spec.
 *
 * ## What Breaks If These Fail
 * A past link is shown as valid or a good link as expired, a guest is sent to
 * an outside address after activation, a nil verify answer crashes the landing
 * or hides the set-password step.
 */

import { describe, expect, it } from "vitest";
import {
  isLinkExpired,
  mapVerifyRegistration,
  toSafeRedirect
} from "../auth.mappers";
import { forEach } from "lodash-es";

// -----------------------------------------------------------------------------

const NOW = new Date("2026-09-28T12:00:00Z");

const EXPIRED = [
  "2020",
  "202001",
  "20200101",
  "2020-01",
  "2020-01-01",
  "2020-01-01 10:00:00",
  "2020-01-01T10:00:00Z",
  "2020-01-01T10:00:00+02:00",
  "2020-01-01T10:00:00+02",
  "2020-01-01T10:00:00+0200",
  "2020-01-01T10:00:00.123456Z",
  "2020-01-01T10:00:00,5Z",
  "2020-01-01T10",
  "2020-01-01T10Z",
  "2020-01-01T10:00:00 Z",
  "2020-01-01T24:00:00",
  "20200101T1000Z",
  " 2020-01-01",
  "2020-02-29",
  "2026-09-28T14:00:00+02:00"
];

const NOT_EXPIRED = [
  "20300101",
  "2030-01-01T00:00:00Z",
  "2026-09-28T12:00:00.001Z",
  "1735689600",
  "12345678",
  "202013",
  "2020-13-01",
  "2020-02-30",
  "2019-02-29",
  "1900-02-29",
  "2020-01-01 25:00:00",
  "2020-01-01T24:00:01",
  "2020-01-01T10:00:60",
  "2020-01T10:00",
  "2020T10",
  "2020-01-01T10:00:00 +02:00",
  "junk",
  ""
];

const REDIRECTS: [string, string | undefined][] = [
  ["/billing?tab=1", "/billing?tab=1"],
  ["\\/billing", "/billing"],
  ["//evil.example", undefined],
  ["/\\evil.example", undefined],
  ["https://evil.example", undefined],
  ["javascript:alert(1)", undefined],
  ["/auth/login", undefined],
  ["/\t/evil.example", undefined],
  ["/a/../\\evil.example", undefined],
  ["/x/..//evil.example", undefined],
  ["/.//evil.example", undefined],
  ["/search?q=a b", undefined],
  ["billing", undefined],
  ["/\n/evil.example", undefined],
  ["/\r/evil.example", undefined],
  ["/\u0000/evil.example", undefined],
  [" //evil.example", undefined],
  ["/billing?next=a:b", "/billing?next=a:b"],
  ["", undefined]
];

// -----------------------------------------------------------------------------

describe("expiry rule (isLinkExpired)", () => {
  forEach(EXPIRED, value => {
    it(`AC-10 reads ${JSON.stringify(value)} as expired`, () => {
      expect(isLinkExpired(value, NOW)).toBe(true);
    });
  });

  forEach(NOT_EXPIRED, value => {
    it(`AC-10 reads ${JSON.stringify(value)} as not expired`, () => {
      expect(isLinkExpired(value, NOW)).toBe(false);
    });
  });

  it("AC-10 reads an absent value as not expired", () => {
    expect(isLinkExpired(undefined, NOW)).toBe(false);
  });
});

describe("redirect filter (toSafeRedirect)", () => {
  forEach(REDIRECTS, ([raw, safe]) => {
    it(`AC-18 publishes ${String(safe)} for ${JSON.stringify(raw)}`, () => {
      expect(toSafeRedirect(raw)).toBe(safe);
    });
  });

  it("AC-18 publishes nothing for an absent value", () => {
    expect(toSafeRedirect(undefined)).toBeUndefined();
  });
});

describe("verify mapper (mapVerifyRegistration)", () => {
  const SET_PASSWORD_STEP = {
    needsPassword: true,
    needsCompleteStep: true,
    twoFARequired: false,
    twoFAProvider: ""
  };

  it("maps an envelope with a nil data to the set-password step", () => {
    expect(mapVerifyRegistration({ status: 200, data: null })).toStrictEqual(
      SET_PASSWORD_STEP
    );
  });

  it("maps an empty object to the set-password step", () => {
    expect(mapVerifyRegistration({})).toStrictEqual(SET_PASSWORD_STEP);
  });

  it("throws on a null value so the landing publishes an error", () => {
    expect(() => mapVerifyRegistration(null)).toThrow();
  });

  it("AC-5 maps a two-factor answer with its provider in lower case", () => {
    expect(
      mapVerifyRegistration({
        has_password: true,
        has_name: true,
        twofa_enabled: true,
        twofa_provider: "TOTP"
      })
    ).toStrictEqual({
      needsPassword: false,
      needsCompleteStep: false,
      twoFARequired: true,
      twoFAProvider: "totp"
    });
  });

  it("AC-5 maps a two-factor answer with no provider to an empty provider", () => {
    expect(
      mapVerifyRegistration({
        has_password: true,
        has_name: true,
        twofa_enabled: true
      }).twoFAProvider
    ).toBe("");
  });
});
