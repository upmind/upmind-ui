// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company manager — sibling lookups and the country/region cascade (AC-16, AC-17)
 *
 * ## Job To Be Done
 * AC-16 prove opening the form loads the client's own addresses, emails,
 * phones, the country list, and the brand's `REQUIRE_REGION_IN_ADDRESS` rule
 * — and pre-selects each sibling collection's own default row as the base
 * model.
 * AC-17 prove choosing a different country re-offers that country's REAL
 * regions (`get-countries-id-regions-case-country-a`/`-b` — two disjoint real
 * sets) and clears a region that does not belong to the new country.
 *
 * ## What Breaks If These Fail
 * A blank/incomplete form (AC-16), or a saved address whose region belongs to
 * a DIFFERENT country than the one on the model (AC-17).
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientCompanyManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeCompanyRequests,
  recorded,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-company manager — what I already have on file (AC-16)", () => {
  it("AC-16 loads my own addresses, emails, phones and the country list, pre-selecting each sibling's own default", async () => {
    await seedClientSession();

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();

    const context = manager.useContext() as unknown as {
      addresses: { value: { id: string }[] };
      emails: { value: { id: string }[] };
      phones: { value: { id: string }[] };
      countries: { value: { id: string }[] };
      config: { value: Record<string, unknown> };
      baseModel: {
        value: { addressId?: string; emailId?: string; phoneId?: string };
      };
    };

    expect(context.addresses.value.length).toBeGreaterThan(0);
    expect(context.emails.value.length).toBeGreaterThan(0);
    expect(context.phones.value.length).toBeGreaterThan(0);
    expect(context.countries.value.length).toBeGreaterThan(0);
    expect(context.config.value).toHaveProperty(
      "invoices.common.required_region_in_address"
    );

    const defaultAddress = (
      recorded.addresses().data as { id: string; default?: boolean | number }[]
    ).find(row => Boolean(row.default));
    const defaultEmail = (
      recorded.emails().data as { id: string; default?: boolean | number }[]
    ).find(row => Boolean(row.default));
    const defaultPhone = (
      recorded.phones().data as { id: string; default?: boolean | number }[]
    ).find(row => Boolean(row.default));

    expect(context.baseModel.value.addressId).toBe(defaultAddress?.id);
    expect(context.baseModel.value.emailId).toBe(defaultEmail?.id);
    expect(context.baseModel.value.phoneId).toBe(defaultPhone?.id);
  });
});

describe("client-company manager — the country/region cascade (AC-17)", () => {
  it("AC-17 re-offers the chosen country's REAL regions, and clears a region that does not belong to the new country", async () => {
    await seedClientSession();
    const regionsA = recorded.regionsA().data as {
      id: string;
      country_id: string;
    }[];
    const regionsB = recorded.regionsB().data as {
      id: string;
      country_id: string;
    }[];
    const countryAId = regionsA[0].country_id;
    const countryBId = regionsB[0].country_id;

    server?.use(
      http.get(`*/countries/${countryAId}/regions`, () =>
        HttpResponse.json(recorded.regionsA(), { status: 200 })
      ),
      http.get(`*/countries/${countryBId}/regions`, () =>
        HttpResponse.json(recorded.regionsB(), { status: 200 })
      )
    );

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();

    manager.useActions().input({
      address: {
        address1: "1 Prover Street",
        city: "Proverville",
        postcode: "PR0 V3R",
        countryId: countryAId,
        regionId: regionsA[0].id
      }
    });

    await vi.waitFor(() => {
      const regions = (
        manager.useContext() as unknown as {
          regions: { value: { id: string }[] };
        }
      ).regions.value;
      expect(regions.map(region => region.id)).toEqual(
        regionsA.map(region => region.id)
      );
    });
    const addressAfterA = manager.useContext().model.value?.address as
      | { regionId?: string }
      | undefined;
    expect(addressAfterA?.regionId).toBe(regionsA[0].id);

    const observed = observeCompanyRequests();
    manager.useActions().input({
      address: {
        address1: "1 Prover Street",
        city: "Proverville",
        postcode: "PR0 V3R",
        countryId: countryBId,
        regionId: regionsA[0].id
      }
    });

    await vi.waitFor(() => {
      const regions = (
        manager.useContext() as unknown as {
          regions: { value: { id: string }[] };
        }
      ).regions.value;
      expect(regions.map(region => region.id)).toEqual(
        regionsB.map(region => region.id)
      );
    });
    observed.stop();

    const addressAfterB = manager.useContext().model.value?.address as
      | { regionId?: string }
      | undefined;
    expect(addressAfterB?.regionId).toBeUndefined();
  });
});
