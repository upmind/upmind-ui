// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company mappers — the wire ⇄ view-model boundary (unit)
 *
 * ## Job To Be Done
 * Prove AC-2/AC-6: a wire company row arrives as a `Company` carrying every
 * raw display/status field faithfully (`title`, `description`, `name`,
 * `regNumber`, the `tax.*` group, `meta.{isDefault,canDelete,isVerified,
 * hasTax,hasValidTax}`), and that `mapICompany` produces the create payload's
 * shape from a `CompanyModel`.
 *
 * `meta.hasTaxValidation` (the brand-config-gated flag, AC-2/parity C7) is
 * PROVEN AT INTEGRATION ALTITUDE, not here — parity.yaml assigns its proof to
 * `client-company.collection.int.test.ts`, because the read-back needs the
 * `ensureConfig` fetch OBSERVED ON THE WIRE, which a pure mapper unit test
 * cannot show. This file proves the field carries through faithfully; it does
 * not assert its brand-gated value.
 *
 * Two documented recording limits (NFR-2, never fabricated):
 *   1. no company on this staging account carries `vat_validated: true` — VAT
 *      validation is a staff/dropped capability (parity.yaml C42) this client
 *      credential can never trigger. The "validated VAT number" half of AC-2
 *      is `it.skip`ped with this note; the "one without" half is real.
 *   2. `description`'s exact join format is not specified past "the compacted
 *      address join in oracle order" (requirements.md AC-2) — asserted here as
 *      an ORDERING property over the recorded address's own ingredients
 *      (address line before city before postcode), never as a guessed literal
 *      string.
 *
 * ## What Breaks If These Fail
 * A UI reads a company's tax/verification/default state backwards, or loses
 * the address-join description the oracle's row renders.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  mapCompanies,
  mapCompany,
  mapICompany
} from "../client-company.mappers";
import type { ICompany } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type WireList = { data: Array<Record<string, unknown>> };

/** The real recorded list — every row this suite draws from. */
function recordedRows(): Record<string, unknown>[] {
  return getFixtureBody<WireList>(
    "get-clients-id-companies-with-staged-imports-1",
    {
      recordingsDir
    }
  ).data;
}

/** A recorded row that carries a non-empty address (for the description join). */
function rowWithAddress(): Record<string, unknown> {
  const found = recordedRows().find(
    row => row.address && (row.address as Record<string, unknown>).address_1
  );
  if (!found) {
    throw new Error(
      "No recorded company row carries an address — the description-join " +
        "assertion has nothing real to check against."
    );
  }
  return found;
}

// -----------------------------------------------------------------------------

describe("mapCompany — AC-2 wire fields carry through faithfully", () => {
  it("AC-2 carries name, reg_number, vat_number and default straight from the recorded row", () => {
    const wire = recordedRows()[0];

    const mapped = mapCompany(wire as unknown as ICompany);

    expect(mapped.id).toBe(wire.id);
    expect(mapped.name).toBe(wire.name);
    expect(mapped.regNumber).toBe(wire.reg_number);
    expect(mapped.default).toBe(wire.default);
    expect(mapped.addressId).toBe(wire.address_id);
    expect(mapped.emailId).toBe(wire.email_id);
    expect(mapped.phoneId).toBe(wire.phone_id);
  });

  it("AC-2 carries every tax field for a company with NO validated VAT number (the recorded, real case)", () => {
    const wire = recordedRows().find(row => !row.vat_validated) as
      | Record<string, unknown>
      | undefined;
    if (!wire)
      throw new Error("Expected at least one unvalidated recorded row.");

    const mapped = mapCompany(wire as unknown as ICompany);

    expect(mapped.tax.number).toBe(wire.vat_number);
    expect(mapped.tax.valid).toBe(wire.vat_validated);
    expect(mapped.tax.percent).toBe(wire.vat_percent);
    expect(mapped.tax.reason).toBe(wire.vat_validation_failed_reason);
    expect(mapped.tax.with).toBe(wire.vat_validated_with);
    expect(mapped.meta.hasValidTax).toBe(false);
  });

  // NFR-2 recording limit #1 (header): no real row on this staging client
  // carries a validated VAT number — VAT validation is a staff/dropped
  // capability (parity.yaml C42) unreachable with a client credential.
  it.skip(
    "AC-2 carries every tax field for a company WITH a validated VAT number " +
      "— SKIPPED: no such row exists on the staging client reachable by this " +
      "run's credentials (VAT validation is staff-only, parity.yaml C42); " +
      "never fabricated (NFR-2)",
    () => {}
  );

  it("AC-2 surfaces the server's own verified/deletable/tax-presence flags", () => {
    const wire = recordedRows()[0];

    const mapped = mapCompany(wire as unknown as ICompany);

    expect(mapped.meta.isVerified).toBe(Boolean(wire.verified));
    expect(mapped.meta.canDelete).toBe(Boolean(wire.can_delete));
    expect(mapped.meta.hasTax).toBe(Boolean(wire.vat_number));
    expect(mapped.meta.isDefault).toBe(Boolean(wire.default));
  });

  it("AC-2 titles a mapped company with its own name", () => {
    const wire = recordedRows()[0];

    const mapped = mapCompany(wire as unknown as ICompany);

    expect(mapped.title).toBe(wire.name);
  });

  it("AC-2 joins the billing address into description in oracle order (address line before city before postcode)", () => {
    const wire = rowWithAddress();
    const address = wire.address as {
      address_1: string;
      city: string;
      postcode: string;
    };

    const mapped = mapCompany(wire as unknown as ICompany);

    expect(mapped.description).toContain(address.address_1);
    expect(mapped.description).toContain(address.city);
    expect(mapped.description).toContain(address.postcode);
    expect(mapped.description.indexOf(address.address_1)).toBeLessThan(
      mapped.description.indexOf(address.city)
    );
    expect(mapped.description.indexOf(address.city)).toBeLessThan(
      mapped.description.indexOf(address.postcode)
    );
  });
});

describe("mapCompanies — AC-2/AC-6 across the collection", () => {
  it("AC-6 maps every recorded row, preserving order", () => {
    const wire = recordedRows();

    const mapped = mapCompanies(wire as unknown as ICompany[]);

    expect(mapped).toHaveLength(wire.length);
    expect(mapped.map(company => company.id)).toEqual(wire.map(row => row.id));
  });

  it("AC-6 maps an empty collection to an empty array", () => {
    expect(mapCompanies([])).toEqual([]);
  });

  it("AC-3 flags exactly one row as default when the recorded list carries one", () => {
    const wire = recordedRows();
    const mapped = mapCompanies(wire as unknown as ICompany[]);

    const defaults = mapped.filter(company => company.meta.isDefault);
    const recordedDefaults = wire.filter(row => Boolean(row.default));

    expect(defaults).toHaveLength(recordedDefaults.length);
    expect(defaults.map(company => company.id)).toEqual(
      recordedDefaults.map(row => row.id)
    );
  });
});

describe("mapICompany — the outbound create body", () => {
  it("AC-19 emits name/address_id/reg_number/vat_number for a create — the create fixture's own recorded shape", () => {
    const created = getFixtureBody<{
      data: {
        name: string;
        reg_number: string;
        vat_number: string;
        address_id: string;
      };
    }>("post-clients-id-companies", { recordingsDir }).data;

    const body = mapICompany({
      name: created.name,
      regNumber: created.reg_number,
      tax: { number: created.vat_number },
      addressId: created.address_id
    });

    expect(body).toMatchObject({
      name: created.name,
      reg_number: created.reg_number,
      vat_number: created.vat_number,
      address_id: created.address_id
    });
  });

  it("C14 never emits `default` — a form save can never set or unset the default flag", () => {
    const body = mapICompany({ name: "Acme", default: true } as never);

    expect(body).not.toHaveProperty("default");
  });
});
