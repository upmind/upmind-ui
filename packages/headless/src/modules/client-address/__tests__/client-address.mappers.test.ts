// -----------------------------------------------------------------------------
/**
 * @fileoverview client-address mappers — the wire ⇄ view-model boundary
 * (unit, AC-31/AC-32)
 *
 * ## Job To Be Done
 * AC-31 prove a recorded address row reads the way the legacy portal writes it:
 * `address_1, address_2, city, state, postcode, region.name, country.name`, in
 * THAT order, `", "`-joined, empties omitted — and that the dead `street`
 * lookup (never a field on `IAddress`) is gone from the composed description.
 * AC-32 prove `verified` survives BOTH ways: `meta.isVerified` keeps its
 * boolean coercion and `verifiedLevel` carries the raw datum unreduced.
 *
 * Every row here is read out of a fixture captured by
 * `pnpm fixtures:generate client-address` — no test types a wire body.
 *
 * ## The `state` recording limit, proven rather than assumed
 * This API does not return `state` at all (it returns `county`), so no recorded
 * row can exercise the `state` slot of the description order. Rather than
 * quietly asserting six components and leaving a reader to guess why,
 * {@link describe} below ASSERTS the absence — if a re-record ever brings a
 * `state` onto the wire, that assertion fails and forces the ordering
 * assertion to be widened rather than silently under-covering.
 *
 * ## What Breaks If These Fail
 * Every surface that prints an address — the billing summary, the address
 * card, the staff-only copy affordance the oracle has (parity row D8) — prints
 * it in the wrong order or with a field missing, or a consumer loses the
 * verification level the coercion used to destroy.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapAddress } from "..";
import type { IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type Envelope<T> = { data: T };
type WireRow = Record<string, unknown> & {
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  postcode?: string | null;
  verified?: number | null;
  region?: { name?: string } | null;
  country?: { name?: string } | null;
};

/** Every row of the real recorded list. */
function recordedRows(): WireRow[] {
  return getFixtureBody<Envelope<WireRow[]>>("get-clients-id-addresses", {
    recordingsDir
  }).data;
}

/** The recorded row carrying every description ingredient the wire has. */
function fullRow(): WireRow {
  const found = recordedRows().find(
    row =>
      row.address_1 &&
      row.address_2 &&
      row.city &&
      row.postcode &&
      row.region?.name &&
      row.country?.name
  );
  if (!found) {
    throw new Error(
      "No recorded row carries both address lines, a city, a postcode, a " +
        "region and a country — AC-31 has nothing real to read an order back " +
        "from. Re-record with `pnpm fixtures:generate client-address`."
    );
  }
  return found;
}

/** The row the generator CREATED at `verified: 2` — AC-32's non-zero level. */
function createdRow(): WireRow {
  return getFixtureBody<Envelope<WireRow>>("post-clients-id-addresses", {
    recordingsDir
  }).data;
}

/**
 * The description the ORACLE's order prescribes for a row, composed from that
 * row's own values. The ORDER is the contract's (UAddress.vue:88-98), not the
 * implementation's — this is the field set and sequence AC-31 claims.
 */
function oracleDescription(row: WireRow): string {
  return [
    row.address_1,
    row.address_2,
    row.city,
    row.state,
    row.postcode,
    row.region?.name,
    row.country?.name
  ]
    .filter(part => typeof part === "string" && part.length > 0)
    .join(", ");
}

// -----------------------------------------------------------------------------

describe("mapAddress — an address reads the way the portal writes it (AC-31)", () => {
  it("AC-31 composes description as address_1, address_2, city, state, postcode, region, country", () => {
    const row = fullRow();

    const mapped = mapAddress(row as unknown as IAddress);

    expect(mapped.description).toBe(oracleDescription(row));
  });

  it("AC-31 keeps every component in the oracle's order — each one after the last", () => {
    const row = fullRow();

    const { description } = mapAddress(row as unknown as IAddress);
    const positions = [
      row.address_1,
      row.address_2,
      row.city,
      row.postcode,
      row.region?.name,
      row.country?.name
    ].map(part => description.indexOf(String(part)));

    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("AC-31 omits an empty component instead of leaving a gap in the join", () => {
    const rowWithoutSecondLine = recordedRows().find(
      row => !row.address_2 && row.address_1 && row.city
    );
    expect(rowWithoutSecondLine).toBeDefined();

    const { description } = mapAddress(
      rowWithoutSecondLine as unknown as IAddress
    );

    expect(description).toBe(oracleDescription(rowWithoutSecondLine!));
    expect(description).not.toMatch(/,\s*,/);
    expect(description).not.toMatch(/(^,|,\s*$)/);
  });

  it("AC-31 carries no `street` — it was never a field on IAddress", () => {
    const mapped = mapAddress(fullRow() as unknown as IAddress);

    expect(JSON.stringify(mapped)).not.toMatch(/street/i);
    expect(mapped.description).not.toMatch(/undefined|null/);
  });

  it("AC-31 titles a row by its first address line, and falls back when there is none", () => {
    const row = fullRow();

    expect(mapAddress(row as unknown as IAddress).title).toBe(row.address_1);
    expect(
      mapAddress({ ...row, address_1: null } as unknown as IAddress).title
    ).toBe("New Address");
  });

  it("AC-31 the recording carries no `state` on any row — the one description slot with no real datum", () => {
    // Self-invalidating: a re-record that DOES bring `state` onto the wire
    // fails here and forces the ordering assertions above to cover it, rather
    // than leaving the slot silently unexercised.
    expect(recordedRows().every(row => row.state === undefined)).toBe(true);
  });
});

describe("mapAddress — how far verification went is not thrown away (AC-32)", () => {
  it("AC-32 carries a non-zero recorded level unreduced AND flags it verified", () => {
    const row = createdRow();
    expect(row.verified).toBe(2);

    const mapped = mapAddress(row as unknown as IAddress);

    expect(mapped.verifiedLevel).toBe(2);
    expect(mapped.meta.isVerified).toBe(true);
  });

  it("AC-32 keeps a recorded zero as a zero — the level is not collapsed into the boolean", () => {
    const row = recordedRows().find(entry => entry.verified === 0);
    expect(row).toBeDefined();

    const mapped = mapAddress(row as unknown as IAddress);

    expect(mapped.verifiedLevel).toBe(0);
    expect(mapped.verifiedLevel).not.toBe(false);
    expect(mapped.meta.isVerified).toBe(false);
  });

  it("AC-32 carries the rest of the recorded row faithfully", () => {
    const row = fullRow();

    const mapped = mapAddress(row as unknown as IAddress);

    expect(mapped.id).toBe(row.id);
    expect(mapped.clientId).toBe(row.client_id);
    expect(mapped.name).toBe(row.name);
    expect(mapped.type).toBe(row.type);
    expect(mapped.countryName).toBe(row.country?.name);
    expect(mapped.regionName).toBe(row.region?.name);
    expect(mapped.address.address1).toBe(row.address_1);
    expect(mapped.address.address2).toBe(row.address_2);
    expect(mapped.address.city).toBe(row.city);
    expect(mapped.address.postcode).toBe(row.postcode);
    expect(mapped.address.regionId).toBe(row.region_id);
    expect(mapped.address.countryId).toBe(row.country_id);
    expect(mapped.meta.isDefault).toBe(row.default);
    expect(mapped.meta.canDelete).toBe(row.can_delete);
  });
});
