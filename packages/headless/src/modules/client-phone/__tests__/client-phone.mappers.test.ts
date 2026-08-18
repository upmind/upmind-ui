// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone mappers — the wire ⇄ view-model boundary (unit)
 *
 * ## Job To Be Done
 * Prove AC-2 and rows W1/W2/W4: a wire phone arrives as a `Phone` carrying its
 * parsed number (`libphonenumber-js` parse of `raw.phone` / `raw.phone_country_code`
 * — parity row W1), its display fields (`title` from `international_phone`,
 * `description` from `phone_country_code`), its status flags
 * (`meta.{isDefault,canDelete,isVerified}`), and its read-only `type`; and that
 * `mapIPhone` emits the outbound `{phone, phone_code, phone_country_code}` body
 * with NO `type` key (decision D-1, row W4 — legacy's required `type` select is
 * a signed drop, row L1; current headless already carries `type` read-only).
 *
 * The expected PARSED number is derived independently here by calling
 * `libphonenumber-js` directly against the recorded row's own `phone` /
 * `phone_country_code` — never by mirroring the mapper's internals — so the
 * assertion is a genuine cross-check, not a restatement of the implementation.
 *
 * ## What Breaks If These Fail
 * A UI reads a phone's default / deletable / verified state backwards, loses
 * its parsed number, or the outbound write body drifts from the wire contract
 * `mutations.int.test.ts` (AC-22) also exercises end-to-end.
 */

import { join } from "node:path";
import parsePhoneNumber from "libphonenumber-js";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapIPhone, mapPhone, mapPhones } from "../client-phone.mappers";
import type { IPhone } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type WireList = { data: Array<Record<string, unknown>> };

/** The account's real default phone row (row 0 of the recorded list). */
function recordedRow(): Record<string, unknown> {
  return getFixtureBody<WireList>("get-clients-id-phones", { recordingsDir })
    .data[0];
}

/**
 * The recorded row with AC-2's literal status combination applied — default,
 * non-deletable and unverified together. This account's real data holds no
 * `can_delete:false` row (every recorded phone answers `can_delete:true`), so
 * that one field is an OVERRIDE of a recorded row, never a hand-written wire
 * body — matching the `client-email` reference's `acTwoRow()` pattern.
 */
function acTwoRow(): Record<string, unknown> {
  return {
    ...recordedRow(),
    default: true,
    verified: 0,
    can_delete: false
  };
}

// -----------------------------------------------------------------------------

describe("mapPhone — AC-2 display and status fields", () => {
  it("AC-2 maps the documented default/non-deletable/unverified combo onto Phone.meta", () => {
    const wire = acTwoRow();

    const mapped = mapPhone(wire as unknown as IPhone);

    expect(mapped.meta).toEqual({
      isDefault: true,
      isVerified: false,
      canDelete: false
    });
  });

  it("AC-2 maps the recorded row's real default/verified/deletable flags", () => {
    const wire = recordedRow();

    const mapped = mapPhone(wire as unknown as IPhone);

    expect(mapped.meta).toEqual({
      isDefault: Boolean(wire.default),
      isVerified: Boolean(wire.verified),
      canDelete: Boolean(wire.can_delete)
    });
  });

  it("AC-2 carries the display fields — title from international_phone, description from phone_country_code", () => {
    const wire = recordedRow();

    const mapped = mapPhone(wire as unknown as IPhone);

    expect(mapped.title).toBe(wire.international_phone);
    expect(mapped.description).toBe(wire.phone_country_code);
    expect(mapped.id).toBe(wire.id);
  });

  it("AC-2 carries the phone type read-only, unchanged from the wire (row W4 / decision D-1)", () => {
    const wire = recordedRow();

    const mapped = mapPhone(wire as unknown as IPhone);

    expect(mapped.type).toBe(wire.type);
  });

  it("W1 parses the raw phone against libphonenumber-js — same input the mapper uses, computed independently here", () => {
    const wire = recordedRow();
    const expected = parsePhoneNumber(
      wire.phone as string,
      wire.phone_country_code as never
    );

    const mapped = mapPhone(wire as unknown as IPhone);

    expect(mapped.phone.number).toBe(expected?.number);
    expect(mapped.phone.nationalNumber).toBe(expected?.nationalNumber);
    expect(mapped.phone.countryCallingCode).toBe(expected?.countryCallingCode);
    expect(mapped.phone.country).toBe(
      expected?.country ?? wire.phone_country_code
    );
  });
});

describe("mapPhones — AC-2 across the collection", () => {
  it("AC-2 maps every recorded row, preserving order", () => {
    const list = getFixtureBody<WireList>("get-clients-id-phones", {
      recordingsDir
    }).data;
    const wire = [list[0], { ...list[0], id: "second-row" }];

    const mapped = mapPhones(wire as unknown as IPhone[]);

    expect(mapped).toHaveLength(2);
    expect(mapped.map(phone => phone.id)).toEqual([list[0].id, "second-row"]);
  });

  it("AC-2 maps an empty collection to an empty array", () => {
    expect(mapPhones([])).toEqual([]);
  });
});

describe("mapIPhone — the outbound add/edit body (W2, W4, D-1)", () => {
  it("W2 emits {phone, phone_code, phone_country_code} — the national number, and the code carries a leading +", () => {
    const body = mapIPhone({
      phone: {
        number: "+447911123456",
        nationalNumber: "7911123456",
        countryCallingCode: "44",
        country: "GB"
      }
    });

    expect(body).toMatchObject({
      phone: "7911123456",
      phone_code: "+44",
      phone_country_code: "GB"
    });
  });

  it("W4 / D-1 emits no `type` key — legacy's required type select is a signed drop (row L1)", () => {
    const body = mapIPhone({
      phone: {
        number: "+447911123456",
        nationalNumber: "7911123456",
        countryCallingCode: "44",
        country: "GB"
      }
    });

    expect(body).not.toHaveProperty("type");
  });
});
